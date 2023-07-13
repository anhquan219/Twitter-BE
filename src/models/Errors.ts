import HTTP_STATUS from '~/constants/httpStatus'
import { USERS_MESSAGES } from '~/constants/messages'

type ErrorrType = Record<
  string,
  {
    msg: string
    [key: string]: any
  }
> // Record<string, string> tương tự { [key: string]: string}

// Tạo class Error để tái sử dụng ( Các Error thông thường )
export class ErorrWithStatus {
  message: string
  status: number
  constructor({ message, status }: { message: string; status: number }) {
    this.message = message
    this.status = status
  }
}

// Tạo class EntityError để tái sử dụng ( Các Error từ validate form: 422 )
export class EntityError extends ErorrWithStatus {
  errors: ErrorrType
  constructor({ message = USERS_MESSAGES.VALIDATION_ERROR, errors }: { message?: string; errors: ErrorrType }) {
    super({ message, status: HTTP_STATUS.UNPROCESSABLE_ENTITY })
    this.errors = errors
  }
}
