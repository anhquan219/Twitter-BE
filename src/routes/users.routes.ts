import { Router } from 'express'
import {
  verifyEmailController,
  loginController,
  logoutController,
  registerController,
  resendVerifyEmailController
} from '~/controllers/users.controllers'
import {
  accessTokenValidator,
  emailVerifyTokenValidator,
  loginValidator,
  refreshTokenValidator,
  registerValidator
} from '~/middlewares/users.middlewares'
import { wrapRequesHandle } from '~/utils/handlers'
const usersRouter = Router()

/**
 * Description. Login a user
 * Path: /login
 * Method: POST
 * Body: { email: string, password: string }
 */
// (Patch, middlewares, controllers)
usersRouter.post('/login', loginValidator, wrapRequesHandle(loginController))

/**
 * Description. Register a new user
 * Path: /register
 * Method: POST
 * Body: { name: string, email: string, password: string, confirm_password: string, date_of_birth: ISO8601}
 */
usersRouter.post('/register', registerValidator, wrapRequesHandle(registerController))

/**
 * Description. Logout a user
 * Path: /logout
 * Method: POST
 * header: { Authorization: Bearer <access_token> }
 * Body: { refresh_token: string }
 */
usersRouter.post('/logout', accessTokenValidator, refreshTokenValidator, wrapRequesHandle(logoutController))

/**
 * Description. Verify email when click on link in email
 * Path: /verify-email
 * Method: POST
 * Body: { email_verify_token: string }
 */
usersRouter.post('/verify-email', emailVerifyTokenValidator, wrapRequesHandle(verifyEmailController))

/**
 * Description. Resend Verify email when click on link in email
 * Path: /resend-verify-email
 * Method: POST
 * header: { Authorization: Bearer <access_token> }
 * Body: {}
 */
usersRouter.post('/resend-verify-email', accessTokenValidator, wrapRequesHandle(resendVerifyEmailController))

export default usersRouter
