import { BuySell, DeleteOrder, getOrderbyId, getBalance, getDepthofAsset } from '../controllers/order.controller'
import { Router } from 'express'
import { authMiddleware } from '../middlewares/auth.middleware'

const router:Router = Router()

router.post("/buysell", BuySell)
router.get("/balance", getBalance)
router.delete("/:orderId", DeleteOrder)
router.get("/:orderId", getOrderbyId)
router.get("/depth/:asset", getDepthofAsset)

export default router