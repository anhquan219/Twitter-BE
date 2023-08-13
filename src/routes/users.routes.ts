import { Router } from 'express'
import {
  verifyEmailController,
  loginController,
  logoutController,
  registerController,
  resendVerifyEmailController,
  forgotPasswordController,
  verifyForgotPasswordTokenValidatorController,
  resetPasswordController
} from '~/controllers/users.controllers'
import {
  accessTokenValidator,
  emailVerifyTokenValidator,
  forgotPasswordValidator,
  loginValidator,
  refreshTokenValidator,
  registerValidator,
  resetPasswordValodator,
  verifyForgotPasswordTokenValidator
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

/**
 * Description. Submit email to reset password, send email to user
 * Path: /forgot-password
 * Method: POST
 * Body: { email: string }
 */
usersRouter.post('/forgot-password', forgotPasswordValidator, wrapRequesHandle(forgotPasswordController))

// /**
//  * Description. Verify link in email to reset password
//  * Path: verify-forgot-password
//  * Method: POST
//  * Body: { email: string}
//  */
usersRouter.post(
  '/verify-forgot-password',
  verifyForgotPasswordTokenValidator,
  wrapRequesHandle(verifyForgotPasswordTokenValidatorController)
)

// /**
//  * Description. Update new password
//  * Path: /reset-password
//  * Method: POST
//  * Body: { forgot_password_token: string, password: string, confirm_password: string}
//  */
usersRouter.post('/reset-password', resetPasswordValodator, wrapRequesHandle(resetPasswordController))

export default usersRouter
