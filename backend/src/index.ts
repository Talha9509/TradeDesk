import express from 'express'
import authRoutes from './routes/auth.Route'

const app = express()

const PORT = 3001
app.use(express.json())

app.use("/auth/v1", authRoutes)

app.listen( PORT, () => {
  console.log(`App running in port ${PORT}`)
})