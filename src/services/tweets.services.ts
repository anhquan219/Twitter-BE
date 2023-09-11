import { TweetRequestBody } from '~/models/requests/Tweet.requets'
import databaseServce from './database.services'
import Tweet from '~/models/schemas/Tweet.schema'
import { ObjectId } from 'mongodb'

class TweetService {
  async createTweet(body: TweetRequestBody, user_id: string) {
    const result = await databaseServce.tweets.insertOne(
      new Tweet({
        audience: body.audience,
        content: body.content,
        hashtags: [], // Chỗ này làm sau
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
}

const tweetService = new TweetService()
export default tweetService
