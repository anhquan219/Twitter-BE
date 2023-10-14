import { Router } from 'express'
import { conversationController } from '~/controllers/conversations.controllers'
import { accessTokenValidator, getConversationsValidator, verifiedUserValidator } from '~/middlewares/users.middlewares'
import { wrapRequesHandle } from '~/utils/handlers'

const conversationsRouter = Router()

conversationsRouter.get(
  '/receivers/:receiver_id',
  accessTokenValidator,
  verifiedUserValidator,
  getConversationsValidator,
  wrapRequesHandle(conversationController)
)

export default conversationsRouter
