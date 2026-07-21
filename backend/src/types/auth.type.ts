import { z } from 'zod'

export const SignupSchema = z.object({
  email: z.email("Invalid Email"),
  password: z.string().min(6,"Min 6 characters")
})

export const SigninSchema = z.object({
  email: z.email("Invalid Email"),
  password: z.string().min(6,"Min 6 characters")
})