import { Request } from 'express'
import User from '~/models/schemas/User.schema'
import { TokenPayload } from './models/requests/User.requests'

// Mục đích add type cho các trường chả về trong Response
// Add type cho trường user trong Request trả về (req.user có type)
declare module 'express' {
  interface Request {
    user?: User
    decoded_authorization?: TokenPayload
    decoded_refresh_token?: TokenPayload
  }
}
