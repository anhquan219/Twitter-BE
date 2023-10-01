import { Request, Response, NextFunction } from 'express'
import HTTP_STATUS from '~/constants/httpStatus'
import { omit } from 'lodash'
import { ErorrWithStatus } from '~/models/Errors'

export const defaultErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  try {
    if (err instanceof ErorrWithStatus) {
      return res.status(err.status).json(omit(err, 'status'))
    }

    const finalError: any = {}

    // enumerable: false không thể lặp và không trả về err đúng cấu trúc (Tuy nhiên dùng getOwnPropertyNames() thì lặp được các key)
    Object.getOwnPropertyNames(err).forEach((key) => {
      // Nếu trường đó không cho phép configurable hoặc writable thì k thêm vào finalError
      if (
        !Object.getOwnPropertyDescriptor(err, key)?.configurable ||
        !Object.getOwnPropertyDescriptor(err, key)?.writable
      ) {
        return
      }
      finalError[key] = err[key]
    })

    // Khi enumerable: true thì có thể sử dụng như bình thường vì đã trả về err đúng cấu trúc
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: finalError.message,
      errorInfo: omit(finalError, ['stack'])
    })
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Internak server error',
      errorInfo: omit(error as any, ['stack'])
    })
  }
}
