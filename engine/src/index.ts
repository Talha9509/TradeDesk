import handleEngine from './Engine/handleEngine'
import type { EngineRequest, EngineResponse } from './Types/EngineTypes'
import { subscriberClient, publisherClient } from './config/redis'
import seedEngine from './utils/seed'
import { getDashboardState } from './utils/dashboardState'

const html = await Bun.file(new URL('../index.html', import.meta.url)).text()

async function getFreePort(startPort: number) {
  for (let port = startPort; port < startPort + 20; port++) {
    try {
      const testServer = Bun.serve({
        port,
        fetch: () => new Response('test'),
      })
      testServer.stop(true)
      return port
    } catch {
      console.log("port is busy")
    }
  }

  return startPort
}

const dashboardPort = Number(process.env.PORT ?? 3002)
const port = await getFreePort(dashboardPort)

Bun.serve({
  port,
  fetch(req) {
    const url = new URL(req.url)

    if (url.pathname === '/' || url.pathname === '/index.html') {
      return new Response(html, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      })
    }

    if (url.pathname === '/dashboard') {
      return Response.json(getDashboardState())
    }

    return new Response('Not Found', { status: 404 })
  },
})

console.log(`Engine dashboard running on http://localhost:${port}`)

seedEngine()

while (1) {
  const response = await subscriberClient.brPop('incoming-queue', 5)
  if (!response) continue

  const res: EngineRequest = JSON.parse(response.element)
  console.log(res.payload, res.queueIdentifier)

  try {
    const result = await handleEngine(res)
    const ToBackend: EngineResponse = {
      ok: true,
      queueIdentifier: res.queueIdentifier,
      QUEUE_ID: res.QUEUE_ID,
      data: result,
    }
    await publisherClient.lPush(`response-queue-${res.QUEUE_ID}`, JSON.stringify(ToBackend))
  } catch (error) {
    console.log(error)
    const ToBackend: EngineResponse = {
      ok: false,
      queueIdentifier: res.queueIdentifier,
      QUEUE_ID: res.QUEUE_ID,
      error: error instanceof Error ? error.message : 'engine_error',
    }
    await publisherClient.lPush(`response-queue-${res.QUEUE_ID}`, JSON.stringify(ToBackend))
  }
}