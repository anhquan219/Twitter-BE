import { Request, Response, NextFunction, RequestHandler } from 'express'

export const wrapRequesHandle = <P>(func: RequestHandler<P, any, any, any>) => {
  return async (req: Request<P>, res: Response, next: NextFunction) => {
    try {
      await func(req, res, next)
    } catch (error) {
      next(error)
    }
  }
}

// TH: getProfileController
// Mong muốn: Request<{ username: string }>
// Thực nhận: Request<{ [key: string]: string }
