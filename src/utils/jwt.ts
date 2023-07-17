import { config } from 'dotenv'
import jwt from 'jsonwebtoken'
config()

// Tạo Token
export const signToken = ({
  payload,
  privateKey = process.env.JWT_SECRECT as string,
  options = {
    algorithm: 'HS256'
  }
}: {
  payload: string | Buffer | object
  privateKey?: string
  options?: jwt.SignOptions
}) => {
  return new Promise<string>((resolve, rejects) => {
    jwt.sign(payload, privateKey, options, (err, token) => {
      if (err) {
        throw rejects(err)
      }
      resolve(token as string)
    })
  })
}
