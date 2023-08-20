import { Router } from 'express'
import {
  verifyEmailController,
  loginController,
  logoutController,
  registerController,
  resendVerifyEmailController,
  forgotPasswordController,
  verifyForgotPasswordTokenValidatorController,
  resetPasswordController,
  getMeController,
  updateMeController,
  getProfileController,
  followController
} from '~/controllers/users.controllers'
import { filterMiddlewares } from '~/middlewares/common.middlewares'
import {
  accessTokenValidator,
  emailVerifyTokenValidator,
  followValidator,
  forgotPasswordValidator,
  loginValidator,
  refreshTokenValidator,
  registerValidator,
  resetPasswordValodator,
  updateMeValidator,
  verifiedUserValidator,
  verifyForgotPasswordTokenValidator
} from '~/middlewares/users.middlewares'
import { UpdateMeReqBody } from '~/models/requests/User.requests'
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

// /**
//  * Description. Get infor me
//  * Path: /me
//  * Method: GET
//  * header: { Authorization: Bearer <access_token> }
//  */
usersRouter.get('/me', accessTokenValidator, wrapRequesHandle(getMeController))

// /**
//  * Description. Update Profile
//  * Path: /me
//  * Method: PATCH
//  * header: { Authorization: Bearer <access_token> }
//  */
usersRouter.patch(
  '/me',
  accessTokenValidator, // Check acess Token
  verifiedUserValidator, // Check user đã verify tài khoản hay chưa
  updateMeValidator, // Check các trường gửi lên đúng validator chưa
  filterMiddlewares<UpdateMeReqBody>([
    // Lọc các trường không được phép update
    'name',
    'date_of_birth',
    'bio',
    'location',
    'website',
    'username',
    'avatar',
    'location'
  ]),
  wrapRequesHandle(updateMeController)
)

// /**
//  * Description. Get user profile
//  * Path: /:username
//  * Method: GET
//  */
usersRouter.get('/:username', wrapRequesHandle(getProfileController))

// /**
//  * Description. Follow someone
//  * Path: /follower
//  * Method: POST
//  * header: { Authorization: Bearer <access_token> }
//  * Body: { followed_user_id: string}
//  */
usersRouter.post(
  '/follow',
  accessTokenValidator,
  verifiedUserValidator,
  followValidator,
  wrapRequesHandle(followController)
)

export default usersRouter
