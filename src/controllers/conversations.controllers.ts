import { Request, Response, NextFunction } from 'express'
import { GetConversationParams } from '~/models/requests/Conversation.requets'
import conversationService from '~/services/conversations.servies'

export const conversationController = async (req: Request<GetConversationParams>, res: Response) => {
  const { receiver_id } = req.params
  const limit = Number(req.query.limit)
  const page = Number(req.query.page)
  const sender_id = req.decoded_authorization?.user_id as string
  const result = await conversationService.getConversations(sender_id, receiver_id, limit, page)

  return res.json({
    message: 'Get conversation successfully',
    result: {
      limit,
      page,
      total_page: Math.ceil(result.total / limit),
      conversations: result.conversations
    }
  })
}
