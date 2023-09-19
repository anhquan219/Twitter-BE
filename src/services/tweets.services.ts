import { TweetRequestBody } from '~/models/requests/Tweet.requets'
import databaseServce from './database.services'
import Tweet from '~/models/schemas/Tweet.schema'
import { ObjectId, WithId } from 'mongodb'
import Hashtag from '~/models/schemas/Hashtags.schema'

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
          guest_views: 1
        }
      }
    )
    return result.value as WithId<{
      // WithId: là chứa cả _id
      user_views: number
      guest_views: number
    }>
  }
}

const tweetService = new TweetService()
export default tweetService
