import { Router } from 'express'
import { createTweetController } from '~/controllers/tweets.controllers'
import { accessTokenValidator, verifiedUserValidator } from '~/middlewares/users.middlewares'
import { wrapRequesHandle } from '~/utils/handlers'
const tweetsRouter = Router()

/**
 * Description. Create tweet
 * Path: /
 * Method: POST
 * Body: TweetRequstBody
 */
tweetsRouter.post('/', accessTokenValidator, verifiedUserValidator, wrapRequesHandle(createTweetController))

export default tweetsRouter
