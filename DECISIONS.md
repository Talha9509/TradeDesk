# Architecture Decision Records (ADR)

## 1. Single Centralized Stream Consumer Loop vs. Per-Endpoint Loops

### Why to use this?

In an event-driven architecture where the REST API communicates with the matching engine via Redis Streams, the API must wait for the engine's execution response before returning an HTTP response to the client. Creating an isolated polling/blocking loop (`XREAD`) inside every concurrent API request handler quickly exhausts thread resources and creates socket contention on Redis. A single consumer loop multiplexes all incoming responses across a centralized correlation map.

### Other alternatives:

- **Per-Endpoint Polling Loops:** Each API handler spins up its own `XREAD` loop waiting for its specific response ID.
- **Synchronous HTTP/gRPC:** Direct synchronous RPC calls from API gateway to matching engine (tight coupling, blocks engine event loop).

### Trade-offs:

- Requires maintaining an in-memory `Record<correlationId, { resolve, reject }>` in the API gateway to route engine responses back to the correct waiting HTTP request.
- If the API gateway crashes, pending HTTP promises are dropped, though trades may have already executed in the engine.

### Issues:

- Multiple independent `XREAD` loops in Bun lead to event-loop congestion, connection pool exhaustion, and uncoordinated Redis reads.

### Impacts:

1. **What change created this impact?**
   - Implemented a single background worker loop running `XREAD BLOCK` on the engine response stream. When an incoming order is sent to the engine, the API registers a unique `correlationId` or `Identifier` returning a deferred Promise. The central consumer loop resolves or rejects the specific Promise when the corresponding `correlationId` returns.
2. **What went wrong and what did you learn?**
   - *Initial Pitfall:* Initially created a separate read loop inside each API endpoint. With multiple concurrent endpoints, loops competed for stream reads and drastically spiked CPU usage.
   - *Resolution:* Consolidated into a single correlation-dispatch pattern, keeping the API gateway non-blocking and memory-efficient.

## 2. Redis Streams vs. Redis Queues (Lists) for Message Ingestion

### Why to use this?

Matching engines require deterministic, crash-resilient message delivery. Redis Queues (`LPUSH`/`RPOP`) are destructive—messages are permanently removed upon read. If the engine process crashes midway through matching, the popped order is lost permanently. Redis Streams (`XADD`/`XREADGROUP`) act as an immutable, append-only commit log with consumer group acknowledgments (`XACK`) and replay capabilities.

### Other alternatives:

- **Redis Lists / Queues (****`LPUSH`** **/** **`BRPOP`****):** Simple FIFO queue.
- **External Message Brokers (Kafka / RabbitMQ):** Full-scale distributed log brokers (higher operational complexity for local/single-node development).

### Trade-offs:

- **Memory Footprint:** Redis Streams retain messages in RAM until explicitly trimmed (`XTRIM` / `MAXLEN`), requiring higher memory overhead compared to transient queues.
- **Offset Tracking:** The consumer must manage stream cursors (`lastId`) and handle pending entries lists (PEL).

### Issues:

- Queues provide no historical audit trail and cannot support event sourcing or deterministic state recovery without external Write-Ahead Logging (WAL).

### Impacts:

1. **What change created this impact?**
   - Migrated ingestion pipelines to Redis Streams. This enabled point-in-time replay and guaranteed at-least-once delivery using consumer groups and stream IDs.
2. **What went wrong and what did you learn?**
   - *Initial Pitfall:* In the engine consumer loop, `XREAD` was initialized with `id: "0"`, causing the engine to re-read every historical message from the beginning on every loop iteration.
   - *Resolution:* Corrected the initial stream pointer to `$` (latest) or the last recovered snapshot bookmark, subsequently updating `lastId` to the latest processed message ID on each successful execution.

## 3. Disaster Recovery via Periodic RDB Snapshots & Stream Replay (Event Sourcing)

### Why to use this?

Because the matching engine keeps all orderbooks, user balances, and active orders strictly in-memory (RAM) for sub-millisecond execution, any power failure or unexpected crash resets state to zero. To ensure zero data loss without slowing down the hot matching path with synchronous database writes, the system combines periodic point-in-time snapshots (`BGSAVE` / RDB) with event stream replay.

### Other alternatives:

- **Synchronous Relational DB Writes (PostgreSQL):** Writing every orderbook change directly to a relational database before confirming execution (introduces prohibitive disk I/O latency).
- **Pure AOF (Append-Only File) Replay from Inception:** Replaying millions of historical orders from time zero on every engine reboot (prolongs disaster recovery time significantly).

### Trade-offs:

- State recovery is a multi-step process: restore the base snapshot first, then replay only the delta stream messages that occurred after the snapshot timestamp.
- Local RDB dumps must be decoupled from the server disk and backed up to remote object storage (AWS S3) to survive host destruction.

### Issues:

- Orderbooks are volatile, fast-mutating tree/map structures that cannot be normalized and indexed in traditional relational databases without severe performance bottlenecks.

### Impacts:

1. **What change created this impact?**
   - Implemented a checkpointing strategy: every $N$ state mutations, the engine serializes its state (`engine:balances`, `engine:orderbooks`, `engine:orders`) to Redis and triggers a non-blocking `BGSAVE`. On reboot, the engine hydrates state from the snapshot and replays stream events after `lastProcessedStreamId`.
2. **What went wrong and what did you learn?**
   - Learned the mechanics of Redis persistence in Docker environments: `BGSAVE` executes via Copy-on-Write (CoW) child processes, and container volumes must be explicitly bind-mounted (`-v $(pwd)/redis-data:/data`) to preserve `dump.rdb` on host disk.

## 4. Offloading Non-Critical Path I/O via Asynchronous Event Dispatch

### Why to use this?

The core matching engine has one primary responsibility: execute incoming orders and update in-memory orderbooks/balances with deterministic, sub-millisecond latency. Side effects such as pushing updates to database workers (`engToDb`), broadcasting delta depth to WebSocket gateways (`engToWs`), and scheduling periodic snapshots must not block the synchronous execution cycle.

### Other alternatives:

- **Synchronous Sequential Awaiting:** Awaiting Redis Pub/Sub publishes, database inserts, and snapshot evaluations directly within the `createOrder` execution path.
- **Internal Lock-Free Ring Buffers:** Pushing side-effect events into an in-memory buffer consumed by dedicated background worker threads.

### Trade-offs:

- **Fire-and-Forget Risks:** Un-awaited asynchronous calls can fail silently if network sockets drop unless wrapped with strict error handlers (`.catch()`).
- **Sequence Integrity:** Network latency variations can cause concurrent async tasks to complete out of order unless sequence numbers (`updateId`) are stamped synchronously before dispatch.

### Issues:

- Synchronously awaiting I/O operations inside `createOrder` and `cancelOrder` degraded throughput and added up to 20% latency overhead to the engine response cycle.

### Impacts:

1. **What change created this impact?**
   - Decoupled side-effect dispatch from the matching loop. The engine synchronously stamps updates with an incremental `updateId`, updates internal memory, and delegates secondary broadcasts asynchronously without blocking the immediate matching return.
2. **What went wrong and what did you learn?**
   - *Initial Pitfall:* Raw fire-and-forget calls risked uncaught rejections during Redis connection dips.
   - *Resolution:* Attached explicit error listeners to all detached async tasks and introduced sequential IDs (`lastUpdateId`) to ensure WebSocket subscribers can reconcile orderbook diffs regardless of network delivery fluctuations.

## 5. Pure In-Memory State Machine for Hot-Path Execution

### Why to use this?

Financial exchanges require microsecond-level order placement and matching. Traditional ACID database transactions on every tick introduce locking overhead, network latency, and disk contention. Treating the matching engine as a pure, deterministic in-memory state machine using native JavaScript `Map` and `Array` structures provides optimal execution velocity.

### Other alternatives:

- **PostgreSQL / SQL Transactions on Hot Path:** Direct `BEGIN...COMMIT` blocks managing balances and order matching.
- **Redis In-Memory Operations (****`HSET`****,** **`ZADD`****) for Book State:** Storing live bids/asks directly in Redis native Sorted Sets rather than engine RAM.

### Trade-offs:

- The matching engine is stateful, meaning standard horizontal scaling requires partitioning assets (e.g., SOL engine vs. BTC engine) rather than running multiple identical engine replicas on the same symbol.
- Relational database tables are updated asynchronously via downstream workers, creating eventual consistency between the engine RAM and the user-facing database.

### Issues:

- Disk-bound transactional databases cannot sustain burst trading volumes without queuing delays and high transaction rollback rates.

### Impacts:

1. **What change created this impact?**
   - Engine maintains isolated in-memory maps for `BALANCES`, `ORDERS`, and `ORDERBOOKS`. All matching, balance locking, and fill calculations happen in single-threaded RAM before publishing completed records to downstream persistence layers.
2. **What went wrong and what did you learn?**
   - *Lesson Learned:* Because state lives in RAM, self-trade prevention (STP) and precision math must be strictly guarded in code. An infinite loop or floating-point rounding error in memory affects the live integrity of the entire book.
