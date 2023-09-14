import { Router } from 'express'
import { createTweetController, getTweetController } from '~/controllers/tweets.controllers'
import { audienceValidator, createTweetValidator, tweetIdValidator } from '~/middlewares/tweets.middlewares'
import { accessTokenValidator, isUserLoggedInValidator, verifiedUserValidator } from '~/middlewares/users.middlewares'
import { wrapRequesHandle } from '~/utils/handlers'
const tweetsRouter = Router()

/**
 * Description. Create tweet
 * Path: /
 * Method: POST
 * Body: TweetRequestBody
 * Header: { Authorization: Bearer <access_token> }
 */
tweetsRouter.post(
  '/',
  accessTokenValidator,
  verifiedUserValidator,
  createTweetValidator,
  wrapRequesHandle(createTweetController)
)

/**
 * Description. Get tweet detail (Khi chưa đăng nhập vẫn có quyền get)
 * Path: /
 * Method: POST
 * Body: TweetRequestBody
 * Header: { Authorization?: Bearer <access_token> }
 */
tweetsRouter.get(
  '/:tweet_id',
  tweetIdValidator,
  isUserLoggedInValidator(accessTokenValidator),
  isUserLoggedInValidator(verifiedUserValidator),
  audienceValidator,
  wrapRequesHandle(getTweetController)
)

export default tweetsRouter
