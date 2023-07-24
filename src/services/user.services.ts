import User from '~/models/schemas/User.schema'
import databaseServce from './database.services'
import { RegisterReqBody } from '~/models/requests/User.requests'
import { hashPasswork } from '~/utils/crypto'
import { signToken } from '~/utils/jwt'
import { TokenType } from '~/constants/enums'
import { ObjectId } from 'mongodb'
import RefreshToken from '~/models/schemas/RefreshToken.schema'
import { config } from 'dotenv'
import { USERS_MESSAGES } from '~/constants/messages'
config()

export class UserService {
  private signAccessToken(user_id: string) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.AccessToken
      },
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
      options: {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN // Nếu là number thì sẽ là giây, nếu là string thì quy định đơn vị giờ phút giây (h, m, s)
      }
    })
  }

  // Hàm tạo access_token, refresh_token
  private signAccessAndRefreshToken(user_id: string) {
    return Promise.all([this.signAccessToken(user_id), this.signRefreshTokenToken(user_id)])
  }

  // Hàm xử lý register tài khoản
  async register(payload: RegisterReqBody) {
    // Tạo tài khoản mới trong DB (insertOne: chèn 1 tài liệu mới vào Collection có tên "users")
    const result = await databaseServce.users.insertOne(
      // Khi sử dụng new User() thì dù có truyền dư data thì nó cũng chỉ lấy đúng các trường khai báo trong User thôi
      new User({
        ...payload,
        password: hashPasswork(payload.password),
        date_of_birth: new Date(payload.date_of_bieth)
      })
    )
    const user_id = result.insertedId.toString()

    // Lưu ý: DB không lưu token nào cả, chỉ trả về cho FE lưu
    // Sử dụng Promise vì các hàm tạo token đều là bất đồng bộ
    // Tạo access_token, refresh_token
    const [access_token, refresh_token] = await this.signAccessAndRefreshToken(user_id)

    // Lưu refresh_token vào DB sau khi Đăng kí tài khoản thành công
    databaseServce.refreshTokens.insertOne(
      new RefreshToken({
        user_id: new ObjectId(user_id),
        token: refresh_token
      })
    )
    return {
      ...result,
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
      access_token,
      refresh_token
    }
  }

  async logout(refresh_token: string) {
    await databaseServce.refreshTokens.deleteOne({ token: refresh_token })
    return {
      message: USERS_MESSAGES.LOGOUT_SUCCESS
    }
  }
}

const userService = new UserService()
export default userService
