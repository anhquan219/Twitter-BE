import { TweetRequestBody } from '~/models/requests/Tweet.requets'
import databaseServce from './database.services'
import Tweet from '~/models/schemas/Tweet.schema'
import { ObjectId, WithId } from 'mongodb'
import Hashtag from '~/models/schemas/Hashtags.schema'
import { TweetType } from '~/constants/enums'

class TweetService {
  async checkAndCreateHashtag(hashtags: string[]) {
    const hashtagDocuments = await Promise.all(
      hashtags.map((hashtag) => {
        // Tìm hashtag trong DB, nếu có thì lấy ra. Không có thì tạo mới
        return databaseServce.hashtags.findOneAndUpdate(
          // findOneAndUpdate bắt buộc truyền id khi tạo
          {
            name: hashtag
          },
          {
            $setOnInsert: new Hashtag({ name: hashtag })
          },
          {
            upsert: true, // Sẽ tạo Hashtag mới nếu nó không tồn tại trong DB
            returnDocument: 'after' // Trả về data sau khi đã lưu vào DB
          }
        )
      })
    )
    return hashtagDocuments.map((hastag) => (hastag.value as WithId<Hashtag>)._id)
  }

  async createTweet(body: TweetRequestBody, user_id: string) {
    const hashtags = await this.checkAndCreateHashtag(body.hashtags)
    const result = await databaseServce.tweets.insertOne(
      new Tweet({
        audience: body.audience,
        content: body.content,
        hashtags,
        mentions: body.mentions,
        medias: body.medias,
        parent_id: body.parent_id,
        type: body.type,
        user_id: new ObjectId(user_id)
      })
    )

    const tweet = await databaseServce.tweets.findOne({ _id: result.insertedId })
    return tweet
  }

  async increaseView(tweet_id: string, user_id?: string) {
    const inc = user_id ? { user_views: 1 } : { guest_views: 1 }
    const result = await databaseServce.tweets.findOneAndUpdate(
      {
        _id: new ObjectId(tweet_id)
      },
      {
        $inc: inc, // $inc: là tăng
        $currentDate: {
          updated_at: true
        }
      },
      {
        returnDocument: 'after',
        projection: {
          // Các trường muốn trả về
          user_views: 1,
          guest_views: 1,
          updated_at: 1
        }
      }
    )
    return result.value as WithId<{
      // WithId: là chứa cả _id
      user_views: number
      guest_views: number
      updated_at: Date
    }>
  }

  async getTweetChildren({
    user_id,
    tweet_id,
    tweet_type,
    limit,
    page
  }: {
    user_id?: string
    tweet_id: string
    tweet_type: TweetType
    limit: number
    page: number
  }) {
    const tweets = await databaseServce.tweets
      .aggregate<Tweet>([
        {
          $match: {
            parent_id_id: new ObjectId(tweet_id),
            type: tweet_type
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
        },
        {
          $skip: limit * (page - 1) // Công thức phân trang
        },
        {
          $limit: limit
        }
      ])
      .toArray()

    const ids = tweets.map((tweet) => {
      return tweet._id as ObjectId
    })

    const inc = user_id ? { user_views: 1 } : { guest_views: 1 }
    const date = new Date()

    // updateMany không trả về data sau khi update, vì thế cần tự ghi đè data mới vào data cũ và trả về cliend
    const [, totalItem] = await Promise.all([
      databaseServce.tweets.updateMany(
        {
          _id: {
            $in: ids // Tìm các tweet có id nằm trong ids
          }
        },
        {
          $inc: inc,
          $set: {
            updated_at: date
          }
        }
      ),
      databaseServce.tweets.countDocuments({
        parent_id: new ObjectId(tweet_id),
        type: tweet_type
      })
    ])
    tweets.forEach((tweet) => {
      tweet.updated_at = date
      if (user_id) {
        tweet.user_views += 1
      } else {
        tweet.guest_views += 1
      }
    })
    return {
      tweets,
      totalItem
    }
  }
}

const tweetService = new TweetService()
export default tweetService
