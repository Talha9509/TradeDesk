import type { Request, Response, NextFunction } from 'express'
import jwt, { type JwtPayload } from 'jsonwebtoken'

export const JWT_SECRET = process.env.JWT_SECRET
if(!JWT_SECRET){
  throw Error("no JWT SECRET")
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies["jwt"]
  if(!token) return res.status(401).json({ message: "Unauthorized" })
  const decoded = jwt.verify(token, JWT_SECRET!)
  if(!decoded) return res.status(401).json({ message: "Unauthorized" })

  req.userId = (decoded as JwtPayload).userId
  next()
}