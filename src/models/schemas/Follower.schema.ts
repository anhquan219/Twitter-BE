import { ObjectId } from 'mongodb'

interface FollowerType {
  // Kiểu dữ liệu truyền vào constructor
  _id?: ObjectId
  followed_user_id: ObjectId
  created_at?: Date
  user_id: ObjectId
}

export default class Follower {
  // Kiểu dữ liệu gán vào các trường this (dữ liệu truyền lên DB)
  _id?: ObjectId
  followed_user_id: ObjectId
  created_at: Date
  user_id: ObjectId

  constructor({ _id, followed_user_id, created_at, user_id }: FollowerType) {
    this._id = _id
    this.followed_user_id = followed_user_id
    this.created_at = created_at || new Date()
    this.user_id = user_id
  }
}

// Nếu dữ liệu truyền vào constructor có các trường id là string thì khi gán vào this thì phải chuyển thành
// ObjectId vì DB nhận lưu ObjectId thôi
