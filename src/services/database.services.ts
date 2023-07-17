import { MongoClient, Db, Collection } from 'mongodb'
import { config } from 'dotenv'
import User from '~/models/schemas/User.schema'
import RefreshToken from '~/models/schemas/RefreshToken.schema'
config() // Cần gọi để sử dụng đươc process.env

const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@twiiter.lto2cut.mongodb.net/?retryWrites=true&w=majority`

// Khởi tạo Class kết nối tới MongoDB
class DatabaseServce {
  // Khởi tạo các biến
  private client: MongoClient
  private db: Db
  constructor() {
    // Gán giá trị khởi tạo cho các biên
    this.client = new MongoClient(uri)
    // Truy cập tới DB có tên DB_NAME
    this.db = this.client.db(process.env.DB_NAME)
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

  // Truy cập vào Collection có tên DB_USER_COLLECTION trong DB
  get users(): Collection<User> {
    return this.db.collection(process.env.DB_USER_COLLECTION as string)
  }

  get refreshtokens(): Collection<RefreshToken> {
    return this.db.collection(process.env.DB_REFRESH_TOKEN_COLLECTION as string)
  }
}

// Tạo Obj từ class DatabaseServce
const databaseServce = new DatabaseServce()
export default databaseServce
