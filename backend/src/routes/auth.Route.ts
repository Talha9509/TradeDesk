import { signup, signin } from '../controllers/auth.controller'
import { Router } from 'express'

const router: Router = Router()

router.post("/signup", signup)
router.post("/signin", signin)

export default router;