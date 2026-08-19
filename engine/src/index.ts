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

export let lastId = '$'
while (1) {
  const response = await subscriberClient.xRead({ key: 'backend_to_engine', id: lastId }, { COUNT: 5, BLOCK: 100 })
  const stream = response?.[0]
  if (!response || response.length == 0 || response == undefined || !stream) continue
  
  console.log(response)
    for (const message of stream.messages) {
      console.log(message);
      const stringifiedMessage = message.message.ToEngineStringified

      lastId = message.id;
      const res: EngineRequest = JSON.parse(stringifiedMessage)
      console.log(res.payload, res.Identifier)
    
      try {
        const result = await handleEngine(res)
        const ToBackend: EngineResponse = {
          ok: true,
          Identifier: res.Identifier,
          data: result,
        }
        const ToBackendStringified = JSON.stringify(ToBackend)
        const response = await publisherClient.xAdd('engine_to_backend', '*', { ToBackendStringified })
        console.log(response)
      } catch (error) {
        console.log(error)
        const ToBackend: EngineResponse = {
          ok: false,
          Identifier: res.Identifier,
          error: error instanceof Error ? error.message : 'engine_error',
        }
        const ToBackendStringified = JSON.stringify(ToBackend)
        const response = await publisherClient.xAdd('engine_to_backend', '*', { ToBackendStringified })
        console.log(response)
      }
    }
}