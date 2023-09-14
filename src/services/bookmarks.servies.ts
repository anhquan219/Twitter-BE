import { ObjectId, WithId } from 'mongodb'
import databaseServce from './database.services'
import Bookmark from '~/models/schemas/Bookmark.schema'

class BookmarkService {
  async bookmarkTweet(user_id: string, tweet_id: string) {
    const result = await databaseServce.bookmarks.findOneAndUpdate(
      {
        user_id: new ObjectId(user_id),
        tweet_id: new ObjectId(tweet_id)
      },
      {
        $setOnInsert: new Bookmark({
          user_id: new ObjectId(user_id),
          tweet_id: new ObjectId(tweet_id)
        })
      },
      {
        upsert: true,
        returnDocument: 'after'
      }
    )
    return result.value as WithId<Bookmark>
  }

  async unbookmarkTweet(user_id: string, tweet_id: string) {
    const result = await databaseServce.bookmarks.findOneAndDelete({
      user_id: new ObjectId(user_id),
      tweet_id: new ObjectId(tweet_id)
    })
    return result
  }
}

const bookmarkService = new BookmarkService()
export default bookmarkService