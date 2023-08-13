import User from '~/models/schemas/User.schema'
import databaseServce from './database.services'
import { RegisterReqBody } from '~/models/requests/User.requests'
import { hashPasswork } from '~/utils/crypto'
import { signToken } from '~/utils/jwt'
import { TokenType, UserVerifyStatus } from '~/constants/enums'
import { ObjectId } from 'mongodb'
import RefreshToken from '~/models/schemas/RefreshToken.schema'
import { config } from 'dotenv'
import { USERS_MESSAGES } from '~/constants/messages'
import { log } from 'console'
config()

export class UserService {
  private signAccessToken(user_id: string) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.AccessToken
      },
      privateKey: process.env.JWT_SECRECT_ACCESS_TOKEN as string,
      options: {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN // Nếu là number thì sẽ là giây, nếu là string thì quy định đơn vị giờ phút giây (h, m, s)
      }
    })
  }

  private signRefreshTokenToken(user_id: string) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.RefreshToken
      },
      privateKey: process.env.JWT_SECRECT_REFRESH_TOKEN as string,
      options: {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN // Nếu là number thì sẽ là giây, nếu là string thì quy định đơn vị giờ phút giây (h, m, s)
      }
    })
  }

  private signEmailVerifyToken(user_id: string) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.EmailVerifyToken
      },
      privateKey: process.env.JWT_SECRECT_EMAIL_VERIFY_TOKEN as string,
      options: {
        expiresIn: process.env.EMAIL_VERIFY_TOKEN_EXPIRES_IN // Nếu là number thì sẽ là giây, nếu là string thì quy định đơn vị giờ phút giây (h, m, s)
      }
    })
  }

  private signForgotPasswordToken(user_id: string) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.EmailVerifyToken
      },
      privateKey: process.env.JWT_SECRECT_FORGOT_PASSWORD_TOKEN as string,
      options: {
        expiresIn: process.env.FORGOT_PASSWORD_TOKEN_EXPIRES_IN // Nếu là number thì sẽ là giây, nếu là string thì quy định đơn vị giờ phút giây (h, m, s)
      }
    })
  }

  // Hàm tạo access_token, refresh_token
  private signAccessAndRefreshToken(user_id: string) {
    return Promise.all([this.signAccessToken(user_id), this.signRefreshTokenToken(user_id)])
  }

  // Hàm xử lý register tài khoản
  async register(payload: RegisterReqBody) {
    const user_id = new ObjectId()
    const email_verify_token = await this.signEmailVerifyToken(user_id.toString())
    // Tạo tài khoản mới trong DB (insertOne: chèn 1 tài liệu mới vào Collection có tên "users")
    await databaseServce.users.insertOne(
      // Khi sử dụng new User() thì dù có truyền dư data thì nó cũng chỉ lấy đúng các trường khai báo trong User thôi
      new User({
        ...payload,
        _id: user_id,
        email_verify_token,
        password: hashPasswork(payload.password),
        date_of_birth: new Date(payload.date_of_bieth)
      })
    )

    // Lưu ý: DB không lưu token nào cả, chỉ trả về cho FE lưu
    // Sử dụng Promise vì các hàm tạo token đều là bất đồng bộ
    // Tạo access_token, refresh_token
    const [access_token, refresh_token] = await this.signAccessAndRefreshToken(user_id.toString())

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

  async login(user_id: string) {
    // Tạo access_token, refresh_token
    const [access_token, refresh_token] = await this.signAccessAndRefreshToken(user_id)

    // Lưu refresh_token vào DB sau khi Đăng nhập thành công
    databaseServce.refreshTokens.insertOne(
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

  async verifyEmail(user_id: string) {
    // updateOne: Update 1 cái
    const [access_token, refresh_token] = await this.signAccessAndRefreshToken(user_id)
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

    return {
      access_token,
      refresh_token
    }
  }

  async resendVerifyEmail(user_id: string) {
    const email_verify_token = await this.signEmailVerifyToken(user_id.toString())
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

  async forgotPassword(user_id: string) {
    const forgot_password_token = await this.signForgotPasswordToken(user_id.toString())
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
}

const userService = new UserService()
export default userService
