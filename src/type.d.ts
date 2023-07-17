import { Response } from 'express'
import User from '~/models/schemas/User.schema'

// Add type cho trường user trong Request trả về (req.user có type)
declare module 'express' {
  interface Request {
    user?: User
  }
}
