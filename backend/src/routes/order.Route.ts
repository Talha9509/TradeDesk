import { BuySell, DeleteOrder, getOrderbyId } from '../controllers/order.controller'
import { Router } from 'express'
import { authMiddleware } from '../middlewares/auth.middleware'

const router:Router = Router()

router.post("/buysell", BuySell)
router.delete("/:orderId", DeleteOrder)
router.get("/:orderId", getOrderbyId)

export default router