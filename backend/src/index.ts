import express from 'express'
import cookieParser from 'cookie-parser'
import authRoutes from './routes/auth.Route'
import orderRoutes from './routes/order.Route'

declare global {
  namespace Express {
    export interface Request {
      userId?: number;
    }
  }
}

const app = express()

const PORT = 3001
app.use(express.json())
app.use(cookieParser())

app.use("/auth/v1", authRoutes)
app.use("/api/v1/order", orderRoutes)

app.listen( PORT, () => {
  console.log(`App running in port ${PORT}`)
})