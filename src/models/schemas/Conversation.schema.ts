import { ObjectId } from 'mongodb'

interface ConversationType {
  _id?: ObjectId
  sender_id: ObjectId
  receiver_id: ObjectId
  content: string
  created_at?: Date
  update_at?: Date
}
export default class Conversation {
  _id?: ObjectId
  sender_id: ObjectId
  receiver_id: ObjectId
  content: string
  created_at?: Date
  update_at?: Date
  constructor({ _id, sender_id, receiver_id, content, created_at, update_at }: ConversationType) {
    this._id = _id
    this.sender_id = sender_id
    this.receiver_id = receiver_id
    this.content = content
    this.created_at = created_at || new Date()
    this.update_at = update_at || new Date()
  }
}
