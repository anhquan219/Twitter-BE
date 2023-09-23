import { NextFunction, Request, Response } from 'express'
import { checkSchema } from 'express-validator'
import { isEmpty } from 'lodash'
import { ObjectId } from 'mongodb'
import { MediaType, TweetAudience, TweetType, UserVerifyStatus } from '~/constants/enums'
import HTTP_STATUS from '~/constants/httpStatus'
import { TWEETS_MESSAGES, USERS_MESSAGES } from '~/constants/messages'
import { ErorrWithStatus } from '~/models/Errors'
import Tweet from '~/models/schemas/Tweet.schema'
import databaseServce from '~/services/database.services'
import { numberEnumtoArray } from '~/utils/commons'
import { wrapRequesHandle } from '~/utils/handlers'
import { validate } from '~/utils/validation'

const tweetTypes = numberEnumtoArray(TweetType)
const tweetAudience = numberEnumtoArray(TweetAudience)
const mediaTypes = numberEnumtoArray(MediaType)

export const createTweetValidator = validate(
  checkSchema({
    type: {
      isIn: {
        options: [tweetTypes], // Kiểm tra giá trị có nằm trong type này không
        errorMessage: TWEETS_MESSAGES.INVALID_TYPE
      }
    },
    audience: {
      isIn: {
        options: [tweetAudience], // Kiểm tra giá trị có nằm trong type này không
        errorMessage: TWEETS_MESSAGES.INVALID_AUDUENCE
      }
    },
    parent_id: {
      custom: {
        options: (value, { req }) => {
          const type = req.body.type as TweetType
          // Nếu `type` là retweet, comment, quotetweet thì `parent_id` phải là `tweet_id` của tweet cha (ObjectId)
          if ([TweetType.Retweet, TweetType.Comment, TweetType.QuoteTweet].includes(type) && !ObjectId.isValid(value)) {
            throw new Error(TWEETS_MESSAGES.PARENT_ID_MUST_BE_A_VALID_TWEET_ID)
          }

          // nếu `type` là tweet thì `parent_id` phải là `null`
          if (type === TweetType.Tweet && value !== null) {
            throw new Error(TWEETS_MESSAGES.PARENT_ID_MUST_BE_NULL)
          }
          return true
        }
      }
    },
    content: {
      isString: true,
      custom: {
        options: (value, { req }) => {
          const type = req.body.type as TweetType
          const hashtags = req.body.hashtags as string[]
          const mentions = req.body.mentions as string[]
          // Nếu `type` là comment, quotetweet, tweet và không có `mentions` và `hashtags` thì `content` phải là string và không được rỗng
          if (
            [TweetType.Comment, TweetType.QuoteTweet, TweetType.Tweet].includes(type) &&
            isEmpty(hashtags) &&
            isEmpty(mentions) &&
            value === ''
          ) {
            throw new Error(TWEETS_MESSAGES.CONTENT_MUST_BE_A_NON_EMPTY_STRING)
          }
          // Nếu `type` là retweet thì `content` phải là `''`.
          if (type === TweetType.Retweet && value !== '') {
            throw new Error(TWEETS_MESSAGES.CONTENT_MUST_BE_EMPTY_STRING)
          }
          return true
        }
      }
    },
    hashtags: {
      isArray: true,
      custom: {
        options: (value, { req }) => {
          // Yêu cầu mỗi phần từ trong array là string
          if (value.some((item: any) => typeof item !== 'string')) {
            throw new Error(TWEETS_MESSAGES.HASHTAGS_MUST_BE_AN_ARRAY_OF_STRING)
          }
          return true
        }
      }
    },
    mentions: {
      isArray: true,
      custom: {
        options: (value, { req }) => {
          // Yêu cầu mỗi phần từ trong array là user_id
          if (value.some((item: any) => !ObjectId.isValid(item))) {
            throw new Error(TWEETS_MESSAGES.MENTIONS_MUST_BE_AN_ARRAY_OF_USER_ID)
          }
          return true
        }
      }
    },
    medias: {
      isArray: true,
      custom: {
        options: (value, { req }) => {
          // Yêu cầu mỗi phần từ trong array là Media Object
          if (
            value.some((item: any) => {
              return typeof item.url !== 'string' || !mediaTypes.includes(item.type)
            })
          ) {
            throw new Error(TWEETS_MESSAGES.MEDIAS_MUST_BE_AN_ARRAY_OF_MEDIA_OBJECT)
          }
          return true
        }
      }
    }
  })
)

export const tweetIdValidator = validate(
  checkSchema(
    {
      tweet_id: {
        custom: {
          options: async (value, { req }) => {
            if (!ObjectId.isValid(value)) {
              throw new ErorrWithStatus({
                message: TWEETS_MESSAGES.INVALID_TWEET_ID,
                status: HTTP_STATUS.BAD_REQUEST
              })
            }

            const [tweet] = await databaseServce.tweets
              .aggregate<Tweet>([
                {
                  $match: {
                    _id: new ObjectId(value)
                  }
                },
                {
                  $lookup: {
                    from: 'hashtags',
                    localField: 'hashtags',
                    foreignField: '_id',
                    as: 'hashtags'
                  }
                },
                {
                  $lookup: {
                    from: 'user',
                    localField: 'mentions',
                    foreignField: '_id',
                    as: 'mentions'
                  }
                },
                {
                  $addFields: {
                    mentions: {
                      $map: {
                        input: '$mentions',
                        as: 'mention',
                        in: {
                          _id: '$$mention._id',
                          name: '$$mention.name',
                          username: '$$mention.username',
                          email: '$$mention.email'
                        }
                      }
                    }
                  }
                },
                {
                  $lookup: {
                    from: 'bookmarks',
                    localField: '_id',
                    foreignField: 'tweet_id',
                    as: 'bookmarks'
                  }
                },
                {
                  $lookup: {
                    from: 'tweets',
                    localField: '_id',
                    foreignField: 'parent_id',
                    as: 'tweet_children'
                  }
                },
                {
                  $addFields: {
                    bookmark_count: {
                      $size: '$bookmarks'
                    },
                    retweet_count: {
                      $size: {
                        $filter: {
                          input: '$tweet_children',
                          as: 'item',
                          cond: {
                            $eq: ['$$item.type', TweetType.Retweet]
                          }
                        }
                      }
                    },
                    comment_count: {
                      $size: {
                        $filter: {
                          input: '$tweet_children',
                          as: 'item',
                          cond: {
                            $eq: ['$$item.type', TweetType.Comment]
                          }
                        }
                      }
                    },
                    quote_count: {
                      $size: {
                        $filter: {
                          input: '$tweet_children',
                          as: 'item',
                          cond: {
                            $eq: ['$$item.type', TweetType.QuoteTweet]
                          }
                        }
                      }
                    }
                  }
                }
              ])
              .toArray()

            if (!tweet) {
              throw new ErorrWithStatus({
                message: TWEETS_MESSAGES.TWEET_NOT_FOUND,
                status: HTTP_STATUS.NOT_FOUND
              })
            }
            ;(req as Request).tweet = tweet
          }
        }
      }
    },
    ['params', 'body']
  )
)

// Muốn sử dụng async await trong handler express thì phải có try catch
// Nếu không dùng try catch thì phải dùng wrapRequestHandler
export const audienceValidator = wrapRequesHandle(async (req: Request, res: Response, next: NextFunction) => {
  const tweet = req.tweet as Tweet
  // Tweet có 2 trạng thái là "Ai cũng có thể xem" và "Chỉ những người được gắn mới có thể xem"
  // Nếu bài viết Tweet đó thuộc loại chỉ nhưng người được chọn (Audience: khán giả) mới có thể xem
  if (tweet.audience === TweetAudience.TwitterCircle) {
    // Nếu người xem Tweet này chưa đăng nhập
    if (!req.decoded_authorization) {
      throw new ErorrWithStatus({
        status: HTTP_STATUS.UNAUTHORIZED,
        message: USERS_MESSAGES.ACCESS_TOKEN_IS_REQUIRED
      })
    }

    const author = await databaseServce.users.findOne({
      _id: new ObjectId(tweet.user_id) // user_id là tác giả tạo tweet
    })

    // Kiểm tra tài khoản tác giả có ổn (bị khóa hay bị xóa không) không
    if (!author || author.verify === UserVerifyStatus.Banned) {
      throw new ErorrWithStatus({
        status: HTTP_STATUS.NOT_FOUND,
        message: USERS_MESSAGES.USER_NOT_FOUND
      })
    }

    // Kiểm tra người xem tweet này có trong Twitter Circle của tác giả hay không
    // Twitter Circle là danh sách những người được xem Tweet mà tác giả chọn từ trước khi Tweet ở trạng thái TwitterCircle
    const { user_id } = req.decoded_authorization // user_id là người xem gọi đến Tweet đó
    const isInTwitterCircle = author.tweet_circle?.some((user_circle_id) => user_circle_id.equals(user_id))
    // Nếu bạn không phải là tác giả và không nằm trong twitter circle thì quăng lỗi
    if (!author._id.equals(user_id) && !isInTwitterCircle) {
      throw new ErorrWithStatus({
        status: HTTP_STATUS.FORBIDDEN,
        message: TWEETS_MESSAGES.TWEET_IS_NOT_PUBLIC
      })
    }
  }
  next()
})

export const getTweetChildrenValidator = validate(
  checkSchema(
    {
      tweet_type: {
        isIn: {
          options: [tweetTypes],
          errorMessage: TWEETS_MESSAGES.INVALID_TYPE
        }
      },
      limit: {
        isNumeric: true,
        custom: {
          options: async (value, { req }) => {
            const num = Number(value)
            if (num > 100 || num < 1) {
              throw new Error('1 <= limit <= 100')
            }
            return true
          }
        }
      },
      page: {
        isNumeric: true,
        custom: {
          options: async (value, { req }) => {
            const num = Number(value)
            if (num < 1) {
              throw new Error('page >= 1')
            }
            return true
          }
        }
      }
    },
    ['query']
  )
)
