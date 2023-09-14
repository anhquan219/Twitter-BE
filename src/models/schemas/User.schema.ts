import { ObjectId } from 'mongodb'
import { UserVerifyStatus } from '~/constants/enums'

interface UserType {
  _id?: ObjectId
  name: string
  email: string
  date_of_birth: Date
  password: string
  created_at?: Date
  updated_at?: Date
  email_verify_token?: string
  forgot_password_token?: string
  verify?: UserVerifyStatus
  tweet_circle?: ObjectId[] // Danh sách ID những người mà user này add vào circle
  bio?: string
  location?: string
  website?: string
  username?: string
  avatar?: string
  cover_photo?: string
}

export default class User {
  // Khu vực khởi tạo biến
  _id: ObjectId
  name: string
  email: string
  date_of_birth: Date
  password: string
  created_at: Date
  updated_at: Date
  email_verify_token: string
  forgot_password_token: string
  verify: UserVerifyStatus
  tweet_circle?: ObjectId[]
  bio: string
  location: string
  website: string
  username: string
  avatar: string
  cover_photo: string

  // Khu khởi tạo giá trị ban đầu cho các biến (Khi 1 Obj được tạo mới từ class sẽ chạy constructor để khởi tạo giá trị)
  // Khi 1 nơi sử dụng new User() thì dù có truyền dư data thì nó cũng chỉ lấy đúng các trường khai báo trong User thôi
  constructor(user: UserType) {
    const date = new Date()
    this._id = user._id || new ObjectId()
    this.name = user.name || ''
    this.email = user.email
    this.date_of_birth = user.date_of_birth || new Date()
    this.password = user.password
    this.created_at = user.created_at || date
    this.updated_at = user.updated_at || date
    this.email_verify_token = user.email_verify_token || ''
    this.forgot_password_token = user.forgot_password_token || ''
    this.tweet_circle = []
    this.verify = user.verify || UserVerifyStatus.Unverified
    this.bio = user.bio || ''
    this.location = user.location || ''
    this.website = user.website || ''
    this.username = user.username || ''
    this.avatar = user.avatar || ''
    this.cover_photo = user.cover_photo || ''
  }
}
