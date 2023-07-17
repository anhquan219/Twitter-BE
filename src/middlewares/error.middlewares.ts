import { Request, Response, NextFunction } from 'express'
import HTTP_STATUS from '~/constants/httpStatus'
import { omit } from 'lodash'
import { ErorrWithStatus } from '~/models/Errors'

export const defaultErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof ErorrWithStatus) {
    return res.status(err.status).json(omit(err, 'status'))
  }

  // enumerable: false không thể lặp và không trả về err đúng cấu trúc (Tuy nhiên dùng getOwnPropertyNames() thì lặp được các key)
  Object.getOwnPropertyNames(err).forEach((key) => {
    Object.defineProperty(err, key, { enumerable: true })
  })

  // Khi enumerable: true thì có thể sử dụng như bình thường vì đã trả về err đúng cấu trúc
  res.status(err.status || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    message: err.message,
    errorInfo: omit(err, 'stack')
  })
}
