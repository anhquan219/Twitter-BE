import { Request, Response, NextFunction } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { TweetType } from '~/constants/enums'
import { TWEETS_MESSAGES } from '~/constants/messages'
import { PaginationQuery, TweetParam, TweetQuery, TweetRequestBody } from '~/models/requests/Tweet.requets'
import { TokenPayload } from '~/models/requests/User.requests'
import tweetService from '~/services/tweets.services'

export const createTweetController = async (req: Request<ParamsDictionary, any, TweetRequestBody>, res: Response) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const result = await tweetService.createTweet(req.body, user_id)
  return res.json({
    message: TWEETS_MESSAGES.CREATE_TWEET_SUCCESSFULLY,
    result
  })
}

export const getTweetController = async (req: Request<ParamsDictionary, any, TweetRequestBody>, res: Response) => {
  // Tăng views mỗi khi gọi API
  const result = await tweetService.increaseView(req.params.tweet_id, req.decoded_authorization?.user_id)
  const tweet = {
    // Miu tay (thay đổi 1 số giá trị trong obj) để lấy được giá trị view tăng ngay lập tức
    ...req.tweet,
    user_views: result.user_views,
    guest_views: result.guest_views,
    updated_at: result.updated_at
  }
  return res.json({
    message: TWEETS_MESSAGES.GET_TWEET_SUCCESSFULLY,
    tweet
  })
}

export const getTweetChildrenController = async (req: Request<TweetParam, any, any, TweetQuery>, res: Response) => {
  const tweet_type = Number(req.query.tweet_type) as TweetType
  const limit = Number(req.query.limit)
  const page = Number(req.query.page)
  const user_id = req.decoded_authorization?.user_id

  const { tweets, totalItem } = await tweetService.getTweetChildren({
    user_id,
    tweet_id: req.params.tweet_id,
    tweet_type,
    limit,
    page
  })

  return res.json({
    message: TWEETS_MESSAGES.GET_TWEET_COMMENTS_SUCCESSFULLY,
    result: {
      tweets: tweets,
      tweet_type,
      limit,
      page,
      total_page: Math.ceil(totalItem / limit)
    }
  })
}

export const getNewFeedsController = async (
  req: Request<ParamsDictionary, any, any, PaginationQuery>,
  res: Response
) => {
  const limit = Number(req.query.limit)
  const page = Number(req.query.page)
  const user_id = req.decoded_authorization?.user_id

  const { tweets, totalItem } = await tweetService.getNewFeeds({
    user_id,
    limit,
    page
  })

  return res.json({
    message: TWEETS_MESSAGES.GET_NEW_FEEDS_SUCCESSFULLY,
    result: {
      tweets: tweets,
      limit,
      page,
      total_page: Math.ceil(totalItem / limit)
    }
  })
}
