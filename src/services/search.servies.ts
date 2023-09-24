import { SearchQuery } from '~/models/requests/Search.requets'
import databaseServce from './database.services'
import { TweetType } from '~/constants/enums'
import { ObjectId } from 'mongodb'

class SearchSearvice {
  async search({ limit, page, content, user_id }: { limit: number; page: number; content: string; user_id: string }) {
    const [tweets, tweetsCount] = await Promise.all([
      databaseServce.tweets
        .aggregate([
          {
            $match: {
              $text: {
                $search: content
              }
            }
          },
          {
            $lookup: {
              from: 'user',
              localField: 'user_id',
              foreignField: '_id',
              as: 'user'
            }
          },
          {
            $unwind: {
              path: '$user'
            }
          },
          {
            $match: {
              $or: [
                {
                  audience: 0
                },
                {
                  $and: [
                    {
                      audience: 1
                    },
                    {
                      'user.tweet_circle': {
                        $in: [new ObjectId(user_id)]
                      }
                    }
                  ]
                }
              ]
            }
          },
          {
            $skip: limit * (page - 1)
          },
          {
            $limit: limit
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
              },
              views: {
                $add: ['$user_views', '$guest_views']
              }
            }
          },
          {
            $project: {
              tweet_children: 0,
              user: {
                password: 0,
                email_verify_token: 0,
                forgot_password_token: 0,
                tweet_circle: 0,
                date_of_birth: 0
              }
            }
          }
        ])
        .toArray(),
      databaseServce.tweets
        .aggregate([
          {
            $match: {
              $text: {
                $search: content
              }
            }
          },
          {
            $lookup: {
              from: 'user',
              localField: 'user_id',
              foreignField: '_id',
              as: 'user'
            }
          },
          {
            $unwind: {
              path: '$user'
            }
          },
          {
            $match: {
              $or: [
                {
                  audience: 0
                },
                {
                  $and: [
                    {
                      audience: 1
                    },
                    {
                      'user.tweet_circle': {
                        $in: [new ObjectId(user_id)]
                      }
                    }
                  ]
                }
              ]
            }
          },
          // Đặt $count sau khi đã $match được hết item
          // (Sau khi đã dùng $count sẽ không xẻ lý được bất cứ gì phía sau. Vì thế phải tách ra 1 aggregate riêng để lấy tổng)
          {
            $count: 'total'
          }
        ])
        .toArray()
    ])

    // Update các trường view và trường update_at
    const tweetIds = tweets.map((tweet) => {
      return tweet._id as ObjectId
    })

    const date = new Date()

    // updateMany không trả về data sau khi update, vì thế cần tự ghi đè data mới vào data cũ và trả về cliend
    await databaseServce.tweets.updateMany(
      {
        _id: {
          $in: tweetIds // Tìm các tweet có id nằm trong ids
        }
      },
      {
        $inc: { user_views: 1 },
        $set: {
          updated_at: date
        }
      }
    )
    tweets.forEach((tweet) => {
      tweet.updated_at = date
      tweet.user_views += 1
    })
    return { tweets, totalItem: tweetsCount[0].total }
  }
}

const searchSearvice = new SearchSearvice()
export default searchSearvice
