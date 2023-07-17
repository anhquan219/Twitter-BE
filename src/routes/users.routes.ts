import { Router } from 'express'
import { loginController, registerController } from '~/controllers/users.controllers'
import { loginValidator, registerValidator } from '~/middlewares/users.middlewares'
import { wrapRequesHandle } from '~/utils/handlers'
const usersRouter = Router()

// (Patch, middlewares, controllers)
usersRouter.post('/login', loginValidator, wrapRequesHandle(loginController))

/**
 * Description. Register a new user
 * Path: /register
 * Method: POST
 * Body: { name: string, email: string, password: string, confirm_password: string, date_of_birth: ISO8601}
 */
usersRouter.post('/register', registerValidator, wrapRequesHandle(registerController))

export default usersRouter
