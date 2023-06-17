import { MongoClient, ServerApiVersion } from 'mongodb'
import { config } from 'dotenv'
config()

const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@twiiter.lto2cut.mongodb.net/?retryWrites=true&w=majority`

// Khởi tạo Class kết nối tới MongoDB
class DatabaseServce {
  private client: MongoClient
  constructor() {
    // Create a MongoClient
    this.client = new MongoClient(uri)
  }

  async connect() {
    try {
      // Send a ping to confirm a successful connection
      await this.client.db('admin').command({ ping: 1 })
      console.log('Pinged your deployment. You successfully connected to MongoDB!')
    } finally {
      // Ensures that the client will close when you finish/error
      await this.client.close()
    }
  }
}

// Tạo Obj từ class DatabaseServce
const databaseServce = new DatabaseServce()
export default databaseServce
