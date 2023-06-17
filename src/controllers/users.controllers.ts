import { Request, Response } from 'express'
import userService from '~/services/user.services'

export const loginController = (req: Request, res: Response) => {
  const { email, password } = req.body
  if (email === 'quan123@gmail.com' && password === '123123') {
    return res.json({
      message: 'Login success'
    })
  }
  return res.status(400).json({
    error: 'Login failed'
  })
}

export const registerController = async (req: Request, res: Response) => {
  const { email, password } = req.body
  try {
    const result = await userService.register({ email, password })

    return res.json({
      message: 'Register Success',
      result
    })
  } catch (err) {
    return res.status(400).json({
      message: `Register failed`,
      error: err
    })
  }
}
