import HTTP_STATUS from '~/constants/httpStatus'
import { USERS_MESSAGES } from '~/constants/messages'
import { ErorrWithStatus } from '~/models/Errors'
import { verifyToken } from './jwt'
import { capitalize } from 'lodash'
import { JsonWebTokenError } from 'jsonwebtoken'
import { Request } from 'express'
import { envConfig } from '~/constants/config'

// Hàm chuyển enum thành Array number
export const numberEnumtoArray = (numberEnum: { [key: string]: string | number }) => {
  return Object.values(numberEnum).filter((value) => typeof value === 'number') as number[]
}

// Object.values trả về 1 mảng chứa các value của Object đó

export const verifyAccessToken = async (access_token: string, req?: Request) => {
  // Kiểm tra xem có access_token không
  if (!access_token) {
    throw new ErorrWithStatus({
      message: USERS_MESSAGES.ACCESS_TOKEN_IS_REQUIRED,
      status: HTTP_STATUS.UNAUTHORIZED
    })
  }
  //Xác thực access_token có đúng hay không và gán vào req
  try {
    const decoded_authorization = await verifyToken({
      token: access_token,
      secretOrPublickey: envConfig.jwtSecretAccessToken as string
    })
    if (req) {
      ;(req as Request).decoded_authorization = decoded_authorization
      return true
    }
    return decoded_authorization
  } catch (error) {
    throw new ErorrWithStatus({
      message: capitalize((error as JsonWebTokenError).message),
      status: HTTP_STATUS.UNAUTHORIZED
    })
  }
}
