import { BuySell, DeleteOrder, getOrderbyId, getBalance } from '../controllers/order.controller'
import { Router } from 'express'
import { authMiddleware } from '../middlewares/auth.middleware'

const router:Router = Router()

router.post("/buysell", BuySell)
router.get("/balance", getBalance)
router.delete("/:orderId", DeleteOrder)
router.get("/:orderId", getOrderbyId)

export default router