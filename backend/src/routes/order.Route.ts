import { BuySell, DeleteOrder } from '../controllers/order.controller'
import { Router } from 'express'
import { authMiddleware } from '../middlewares/auth.middleware'

const router:Router = Router()

router.post("/buysell", BuySell)
router.delete("/delete/:orderId", DeleteOrder)

export default router