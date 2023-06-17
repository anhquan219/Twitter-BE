import User from '~/models/schemas/User.schema'
import databaseServce from './database.services'

export class UserService {
  // Hàm xử lý register tài khoản
  async register(payload: { email: string; password: string }) {
    const { email, password } = payload
    // Tạo tài khoản mới trong DB (insertOne: chèn 1 tài liệu mới vào Collection)
    const result = await databaseServce.users.insertOne(
      new User({
        email: email,
        password: password
      })
    )
    return result
  }
}

const userService = new UserService()
export default userService
