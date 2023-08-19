import { Request, Response, NextFunction } from 'express'
import { pick } from 'lodash'

type FilterKeys<T> = Array<keyof T> // Trả về type là 1 mảng chứa các keys trong T truyền vào

export const filterMiddlewares =
  <T>(filterKeys: FilterKeys<T>) =>
  (req: Request, res: Response, next: NextFunction) => {
    req.body = pick(req.body, filterKeys)
    next()
  }
