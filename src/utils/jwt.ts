import { config } from 'dotenv'
import jwt from 'jsonwebtoken'
import { TokenPayload } from '~/models/requests/User.requests'
config()

// Tạo Token
export const signToken = ({
  payload,
  privateKey,
  options = {
    algorithm: 'HS256'
  }
}: {
  payload: string | Buffer | object
  privateKey: string
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

// Lấy thông tin trong token
export const verifyToken = ({ token, secretOrPublickey }: { token: string; secretOrPublickey: string }) => {
  return new Promise<TokenPayload>((resolve, reject) => {
    jwt.verify(token, secretOrPublickey, (error, decoded) => {
      if (error) {
        throw reject(error)
      }
      /**
       * decoded = {
            user_id: '64b33e65d220090d0cc8458a',
            token_type: 0,
            iat: 1689771031,
            exp: 1689771931
          }
       */
      resolve(decoded as TokenPayload)
    })
  })
}
