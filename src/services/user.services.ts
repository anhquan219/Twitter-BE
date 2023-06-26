import User from '~/models/schemas/User.schema'
import databaseServce from './database.services'
import { log } from 'console'

export class UserService {
  // Hàm xử lý register tài khoản
  async register(payload: { email: string; password: string }) {
    const { email, password } = payload
    // Tạo tài khoản mới trong DB (insertOne: chèn 1 tài liệu mới vào Collection có tên "users")
    const result = await databaseServce.users.insertOne(
      new User({
        email: email,
        password: password
      })
    )
    return result
  }

  async checkEmailExist(email: string) {
    // Tìm kiếm email trong DB (findOne: Tìm xem trong Collection có tên "users" có tồn tại email đó không >>> trả về Obj đó nếu có)
    const user = await databaseServce.users.findOne({ email })
    return Boolean(user)
  }
}

const userService = new UserService()
export default userService
