import { ObjectId, WithId } from 'mongodb'
import databaseServce from './database.services'
import Bookmark from '~/models/schemas/Bookmark.schema'

class ConversationService {
  async getConversations(sender_id: string, receiver_id: string, limit: number, page: number) {
    const match = {
      $or: [
        {
          sender_id: new ObjectId(sender_id),
          receiver_id: new ObjectId(receiver_id)
        },
        {
          sender_id: new ObjectId(receiver_id),
          receiver_id: new ObjectId(sender_id)
        }
      ]
    }

    const conversations = await databaseServce.conversations
      .find(match)
      .sort({ created_at: -1 })
      .skip(limit * (page - 1))
      .limit(limit)
      .toArray()

    const total = await databaseServce.conversations.countDocuments(match)
    return {
      conversations,
      total
    }
  }
}

const conversationService = new ConversationService()
export default conversationService
