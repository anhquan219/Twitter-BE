import { MongoClient, Db, Collection } from 'mongodb'
import { config } from 'dotenv'
import User from '~/models/schemas/User.schema'
import RefreshToken from '~/models/schemas/RefreshToken.schema'
import Follower from '~/models/schemas/Follower.schema'
import { TweetRequestBody } from '~/models/requests/Tweet.requets'
import Tweet from '~/models/schemas/Tweet.schema'
import Hashtag from '~/models/schemas/Hashtags.schema'
import Bookmark from '~/models/schemas/Bookmark.schema'
import Conversation from '~/models/schemas/Conversation.schema'
import { envConfig } from '~/constants/config'
config() // Cần gọi để sử dụng đươc envConfig

const uri = `mongodb+srv://${envConfig.dbUsername}:${envConfig.dbPassword}@twiiter.lto2cut.mongodb.net/?retryWrites=true&w=majority`

// Khởi tạo Class kết nối tới MongoDB
class DatabaseServce {
  // Khởi tạo các biến
  private client: MongoClient
  private db: Db
  constructor() {
    // Gán giá trị khởi tạo cho các biên
    this.client = new MongoClient(uri)
    // Truy cập tới DB có tên DB_NAME
    this.db = this.client.db(envConfig.dbName)
  }

  async connect() {
    // eslint-disable-next-line no-useless-catch
    try {
      // Send a ping to confirm a successful connection
      await this.db.command({ ping: 1 })
      console.log('Pinged your deployment. You successfully connected to MongoDB!')
    } catch (error) {
      throw error
    }
  }

  // Viết Index cho DB
  async indexUsers() {
    const exists = await this.users.indexExists(['email_1_password_1', 'email_1', 'username_1'])
    if (!exists) {
      this.users.createIndex({ email: 1, password: 1 })
      this.users.createIndex({ email: 1 }, { unique: true }) // unique: true ->> email luôn là duy nhất k trùng nhau
      this.users.createIndex({ username: 1 }, { unique: true })
    }
  }
  async indexRefreshToken() {
    const exists = await this.refreshTokens.indexExists(['token_1', 'exp_1'])
    if (!exists) {
      this.refreshTokens.createIndex({ token: 1 })
      this.refreshTokens.createIndex({ exp: 1 }, { expireAfterSeconds: 0 }) // Tự xóa token hết hạn sau khoảng thời gian exp
    }
  }
  async indexFollowers() {
    const exists = await this.refreshTokens.indexExists(['user_id_1_followed_user_id_1'])
    if (!exists) {
      this.followers.createIndex({ user_id: 1, followed_user_id: 1 })
    }
  }

  async indexTweets() {
    const exists = await this.refreshTokens.indexExists(['content_text'])
    if (!exists) {
      this.followers.createIndex({ content: 'text' }, { default_language: 'none' }) //  default_language: 'none' : Không bỏ qua bất kì từ nào khi search
    }
  }

  // Truy cập vào Collection có tên DB_USER_COLLECTION trong DB
  get users(): Collection<User> {
    return this.db.collection(envConfig.dbUsersCollection as string)
  }
  get refreshTokens(): Collection<RefreshToken> {
    return this.db.collection(envConfig.dbRefreshTokensCollection as string)
  }
  get followers(): Collection<Follower> {
    return this.db.collection(envConfig.dbFollowersCollection as string)
  }
  get tweets(): Collection<Tweet> {
    return this.db.collection(envConfig.dbTweetsCollection as string)
  }
  get hashtags(): Collection<Hashtag> {
    return this.db.collection(envConfig.dbHashtagsCollection as string)
  }
  get bookmarks(): Collection<Bookmark> {
    return this.db.collection(envConfig.dbBookmarksCollection as string)
  }
  get conversations(): Collection<Conversation> {
    return this.db.collection(envConfig.dbConversationCollection as string)
  }
}

// Tạo Obj từ class DatabaseServce
const databaseServce = new DatabaseServce()
export default databaseServce
