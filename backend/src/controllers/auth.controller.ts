import type { Request, Response } from 'express'
import bcrypt from 'bcrypt'
import { SignupSchema, SigninSchema } from '../types/types'
import jwt from 'jsonwebtoken'
import { prismaClient } from '../config/db'

const JWT_SECRET = process.env.JWT_SECRET
if(!JWT_SECRET){
  throw Error("no JWT SECRET")
}

export const signup = async (req: Request, res:Response) => {
  const validatedInput = SignupSchema.safeParse(req.body)
  if(!validatedInput.success) {console.log(validatedInput.error);return res.status(400).json({ message: "Invalid Inputs" })}

  try {

    const hashedPass = await bcrypt.hash(validatedInput.data?.password, 10)

    const user = await prismaClient.users.create({
      data: {
        email: validatedInput.data.email,
        password: hashedPass
      }
    })

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "72h" })

    return res.status(201).cookie('jwt', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: 'strict',
    }).json({ message: "Account Created" })
  } catch (error:any) {
    if(error.code == 'P2002') return res.status(409).json({ message: "User already exists" })
    console.log(error)
    return res.status(500).json({ message: "Internal Server Error" })
  }
}

export const signin = async (req: Request, res:Response) => {
  const validatedInput = SigninSchema.safeParse(req.body)
  if(!validatedInput.success) return res.status(400).json({ message: "Invalid Inputs" })

  try {
    const user = await prismaClient.users.findFirst({
      where: { email: validatedInput.data.email }
    })
    if(!user) return res.status(404).json({ message: "Create an Account First" })

    const passMatch = await bcrypt.compare(validatedInput.data.password, user.password)
    if(!passMatch) return res.status(401).json({ message: "Incorrect Email or Password" })
    
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "72h" })

    return res.status(200).cookie('jwt', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: 'strict',
    }).json({ message: "Signed In" })
  } catch (error) {
    console.log(error)
    return res.status(500).json({ message: "Internal Server Error" })
  }
}