import User from '~/models/schemas/User.schema'
import databaseServce from './database.services'
import { RegisterReqBody, UpdateMeReqBody } from '~/models/requests/User.requests'
import { hashPasswork } from '~/utils/crypto'
import { signToken } from '~/utils/jwt'
import { TokenType, UserVerifyStatus } from '~/constants/enums'
import { ObjectId } from 'mongodb'
import RefreshToken from '~/models/schemas/RefreshToken.schema'
import { config } from 'dotenv'
import { USERS_MESSAGES } from '~/constants/messages'
import { log } from 'console'
import { ErorrWithStatus } from '~/models/Errors'
import HTTP_STATUS from '~/constants/httpStatus'
import Follower from '~/models/schemas/Follower.schema'
import axios from 'axios'
config()

export class UserService {
  private signAccessToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.AccessToken,
        verify
      },
      privateKey: process.env.JWT_SECRECT_ACCESS_TOKEN as string,
      options: {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN // Nếu là number thì sẽ là giây, nếu là string thì quy định đơn vị giờ phút giây (h, m, s)
      }
    })
  }

  private signRefreshTokenToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.RefreshToken,
        verify
      },
      privateKey: process.env.JWT_SECRECT_REFRESH_TOKEN as string,
      options: {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN // Nếu là number thì sẽ là giây, nếu là string thì quy định đơn vị giờ phút giây (h, m, s)
      }
    })
  }

  private signEmailVerifyToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.EmailVerifyToken,
        verify
      },
      privateKey: process.env.JWT_SECRECT_EMAIL_VERIFY_TOKEN as string,
      options: {
        expiresIn: process.env.EMAIL_VERIFY_TOKEN_EXPIRES_IN // Nếu là number thì sẽ là giây, nếu là string thì quy định đơn vị giờ phút giây (h, m, s)
      }
    })
  }

  private signForgotPasswordToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.EmailVerifyToken,
        verify
      },
      privateKey: process.env.JWT_SECRECT_FORGOT_PASSWORD_TOKEN as string,
      options: {
        expiresIn: process.env.FORGOT_PASSWORD_TOKEN_EXPIRES_IN // Nếu là number thì sẽ là giây, nếu là string thì quy định đơn vị giờ phút giây (h, m, s)
      }
    })
  }

  // Hàm tạo access_token, refresh_token
  private signAccessAndRefreshToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return Promise.all([this.signAccessToken({ user_id, verify }), this.signRefreshTokenToken({ user_id, verify })])
  }

  // Hàm xử lý register tài khoản
  async register(payload: RegisterReqBody) {
    const user_id = new ObjectId()
    const email_verify_token = await this.signEmailVerifyToken({
      user_id: user_id.toString(),
      verify: UserVerifyStatus.Unverified
    })
    // Tạo tài khoản mới trong DB (insertOne: chèn 1 tài liệu mới vào Collection có tên "users")
    await databaseServce.users.insertOne(
      // Khi sử dụng new User() thì dù có truyền dư data thì nó cũng chỉ lấy đúng các trường khai báo trong User thôi
      new User({
        ...payload,
        _id: user_id,
        username: `user${user_id.toString()}`,
        email_verify_token,
        password: hashPasswork(payload.password),
        date_of_birth: new Date(payload.date_of_bieth)
      })
    )

    // Lưu ý: DB không lưu token nào cả, chỉ trả về cho FE lưu
    // Sử dụng Promise vì các hàm tạo token đều là bất đồng bộ
    // Tạo access_token, refresh_token
    const [access_token, refresh_token] = await this.signAccessAndRefreshToken({
      user_id: user_id.toString(),
      verify: UserVerifyStatus.Unverified
    })

    // Lưu refresh_token vào DB sau khi Đăng kí tài khoản thành công
    databaseServce.refreshTokens.insertOne(
      new RefreshToken({
        user_id: new ObjectId(user_id),
        token: refresh_token
      })
    )
    console.log('email_verify_token', email_verify_token)
    return {
      access_token,
      refresh_token
    }
  }

  async checkEmailExist(email: string) {
    // Tìm kiếm email trong DB (findOne: Tìm xem trong Collection có tên "users" có tồn tại email đó không >>> trả về Obj đó nếu có)
    const user = await databaseServce.users.findOne({ email })
    return Boolean(user)
  }

  async login({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    // Tạo access_token, refresh_token
    const [access_token, refresh_token] = await this.signAccessAndRefreshToken({
      user_id: user_id.toString(),
      verify
    })

    // Lưu refresh_token vào DB sau khi Đăng nhập thành công
    await databaseServce.refreshTokens.insertOne(
      new RefreshToken({
        user_id: new ObjectId(user_id),
        token: refresh_token
      })
    )

    return {
      access_token: access_token,
      refresh_token: refresh_token
    }
  }

  async logout(refresh_token: string) {
    await databaseServce.refreshTokens.deleteOne({ token: refresh_token })
    return {
      message: USERS_MESSAGES.LOGOUT_SUCCESS
    }
  }

  async refreshToken({
    user_id,
    verify,
    refresh_token
  }: {
    user_id: string
    verify: UserVerifyStatus
    refresh_token: string
  }) {
    const [access_token, new_refresh_token] = await this.signAccessAndRefreshToken({
      user_id: user_id.toString(),
      verify: verify
    })

    // Lưu refresh_token vào DB sau khi Đăng nhập thành công
    await databaseServce.refreshTokens.insertOne(
      new RefreshToken({
        user_id: new ObjectId(user_id),
        token: new_refresh_token
      })
    )

    await databaseServce.refreshTokens.deleteOne({
      token: refresh_token
    })

    return {
      access_token: access_token,
      refresh_token: new_refresh_token
    }
  }

  async verifyEmail(user_id: string) {
    // updateOne: Update 1 cái
    const [access_token, refresh_token] = await this.signAccessAndRefreshToken({
      user_id: user_id.toString(),
      verify: UserVerifyStatus.Verified
    })
    await databaseServce.users.updateOne(
      {
        _id: new ObjectId(user_id)
      },
      {
        $set: {
          email_verify_token: '',
          // updated_at: new Date(), // Thời điểm khởi tạo giá trị khi gọi hàm
          verify: UserVerifyStatus.Verified
        },
        $currentDate: {
          updated_at: true // Thời điểm MongoDB update
        }
      }
    )

    await databaseServce.refreshTokens.insertOne(
      new RefreshToken({
        user_id: new ObjectId(user_id),
        token: refresh_token
      })
    )

    return {
      access_token,
      refresh_token
    }
  }

  async resendVerifyEmail(user_id: string) {
    const email_verify_token = await this.signEmailVerifyToken({
      user_id: user_id.toString(),
      verify: UserVerifyStatus.Unverified
    })
    console.log('Gửi resend email', email_verify_token)
    await databaseServce.users.updateOne(
      {
        _id: new ObjectId(user_id) // _id cần Update
      },
      [
        {
          $set: {
            email_verify_token,
            updated_at: '$$NOW'
          }
        }
      ]
    )
    return {
      message: USERS_MESSAGES.RESEND_VERIFY_EMAIL_SUCCESS
    }
  }

  async forgotPassword({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    const forgot_password_token = await this.signForgotPasswordToken({
      user_id: user_id.toString(),
      verify
    })
    await databaseServce.users.updateOne(
      {
        _id: new ObjectId(user_id) // _id cần Update
      },
      [
        {
          $set: {
            forgot_password_token,
            updated_at: '$$NOW'
          }
        }
      ]
    )

    // Gửi email kèm đường link đến Email (http://twitter.com/forgot-password?token=token)
    console.log('Gửi forgot password token', forgot_password_token)

    return {
      message: USERS_MESSAGES.CHECK_EMAIL_TO_RESET_PASSWORD
    }
  }

  async resetPassword(user_id: string, password: string) {
    await databaseServce.users.updateOne(
      {
        _id: new ObjectId(user_id)
      },
      [
        {
          $set: {
            forgot_password_token: '',
            password: hashPasswork(password),
            updated_at: '$$NOW'
          }
        }
      ]
    )

    return {
      message: USERS_MESSAGES.RESET_PASSWORD_SUCCESS
    }
  }

  async getMe(user_id: string) {
    const user = await databaseServce.users.findOne(
      {
        _id: new ObjectId(user_id)
      },
      {
        // Thiết lập các trường trả về hoặc không trả về
        projection: {
          password: 0,
          email_verify_token: 0,
          forgot_password_token: 0
        }
      }
    )

    return user
  }

  async updateMe(user_id: string, payload: UpdateMeReqBody) {
    const _payload = payload.date_of_birth ? { ...payload, date_of_birth: new Date(payload.date_of_birth) } : payload
    const user = await databaseServce.users.findOneAndUpdate(
      {
        _id: new ObjectId(user_id)
      },
      {
        $set: {
          ...(_payload as UpdateMeReqBody & { date_of_birth?: Date })
        },
        $currentDate: {
          updated_at: true
        }
      },
      {
        returnDocument: 'after', // return data mới sau khi update
        projection: {
          password: 0,
          email_verify_token: 0,
          forgot_password_token: 0
        }
      }
    )
    return user.value // Lấy về value khi update thành công
  }

  async getProfile(username: string) {
    const user = await databaseServce.users.findOne(
      {
        username: username
      },
      {
        // Thiết lập các trường trả về hoặc không trả về
        projection: {
          password: 0,
          email_verify_token: 0,
          forgot_password_token: 0,
          verify: 0,
          updated_at: 0,
          created_at: 0
        }
      }
    )

    if (user === null) {
      throw new ErorrWithStatus({
        message: USERS_MESSAGES.USER_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    return user
  }

  async follow(user_id: string, followed_user_id: string) {
    const follower = await databaseServce.followers.findOne({
      user_id: new ObjectId(user_id),
      followed_user_id: new ObjectId(followed_user_id)
    })

    if (follower === null) {
      await databaseServce.followers.insertOne(
        new Follower({
          user_id: new ObjectId(user_id),
          followed_user_id: new ObjectId(followed_user_id)
        })
      )

      return {
        message: USERS_MESSAGES.FOLLOW_SUCCESS
      }
    }

    return {
      message: USERS_MESSAGES.FOLLOWED
    }
  }

  async unfollow(user_id: string, followed_user_id: string) {
    const follower = await databaseServce.followers.findOne({
      user_id: new ObjectId(user_id),
      followed_user_id: new ObjectId(followed_user_id)
    })

    if (follower === null) {
      return {
        message: USERS_MESSAGES.AlREADY_UNFOLLOW
      }
    }

    await databaseServce.followers.deleteOne({
      user_id: new ObjectId(user_id),
      followed_user_id: new ObjectId(followed_user_id)
    })

    return {
      message: USERS_MESSAGES.UNFOLLOW_SUCCESS
    }
  }

  async changePassword(user_id: string, password: string) {
    await databaseServce.users.updateOne(
      {
        _id: new ObjectId(user_id)
      },
      {
        $set: {
          password: hashPasswork(password)
        },
        $currentDate: {
          updated_at: true
        }
      }
    )
    return {
      message: USERS_MESSAGES.CHANGE_PASSWORD_SUCCESS
    }
  }

  // Sử dụng axios gọi đến API của Google để lấy access_token, id_token (Mục đích để lấy Thông tin user Google đang muốn đăng nhập)
  private async getOauthGoogleToken(code: string) {
    const body = {
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI,
      grant_type: 'authorization_code'
    }

    const { data } = await axios.post('https://oauth2.googleapis.com/token', body, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })

    return data as {
      access_token: string
      id_token: string
    }
  }

  // Lấy thông tin user Google đó bằng access_token và id_token
  private async getGoogleUserInfo(access_token: string, id_token: string) {
    const { data } = await axios.get('https://www.googleapis.com/oauth2/v1/userinfo', {
      params: {
        access_token,
        alt: 'json'
      },
      headers: {
        Authorization: `Bearer ${id_token}`
      }
    })

    return data as {
      id: string
      email: string
      verified_email: boolean
      name: string
      given_name: string
      picture: string
      locale: string
    }
  }

  async oauth(code: string) {
    const { id_token, access_token } = await this.getOauthGoogleToken(code)
    const userInfo = await this.getGoogleUserInfo(access_token, id_token)

    if (!userInfo.verified_email) {
      throw new ErorrWithStatus({
        message: USERS_MESSAGES.GMAIL_NOT_VERIFY,
        status: HTTP_STATUS.UNAUTHORIZED
      })
    }

    //Kiểm tra user tồn tại trong DB hay chưa
    const user = await databaseServce.users.findOne({ email: userInfo.email })

    // Nếu đã tồn tại trong DB thì sinh access_token, refresh_token trả về Cliend (Như login bình thường)
    if (user) {
      const [access_token, refresh_token] = await this.signAccessAndRefreshToken({
        user_id: user._id.toString(),
        verify: user.verify
      })

      // LƯu refreshTokens vào DB
      await databaseServce.refreshTokens.insertOne(
        new RefreshToken({
          user_id: new ObjectId(user._id),
          token: refresh_token
        })
      )

      return {
        access_token,
        refresh_token,
        newUser: 0,
        verify: user.verify
      }
    }
    // Nếu chưa tồn tại trong DB thì tạo tài khoản mới dựa trên thông tin user Google đó với password random (Như register tài khoàn thông thường)
    else {
      // Random string password
      const password = Math.random().toString(36).substring(2, 15)
      // Không thì tạo mới với password random
      const data = await this.register({
        email: userInfo.email,
        name: userInfo.name,
        date_of_bieth: new Date(),
        password: password,
        confirm_password: password
      })

      return {
        ...data,
        newUser: 1,
        verify: UserVerifyStatus.Unverified
      }
    }
  }
}

const userService = new UserService()
export default userService
