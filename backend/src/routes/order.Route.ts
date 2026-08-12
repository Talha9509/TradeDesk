import { BuySell } from '../controllers/order.controller'
import { Router } from 'express'
import { authMiddleware } from '../middlewares/auth.middleware'

const router:Router = Router()

router.post("/buy", BuySell)

export default router