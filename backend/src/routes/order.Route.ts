import { BuySell } from '../controllers/order.controller'
import { Router } from 'express'
import { authMiddleware } from '../middlewares/auth.middleware'

const router:Router = Router()

router.post("/buysell", BuySell)

export default router