import express from 'express'
import usersRouter from '~/routes/users.routes'
import databaseServce from '~/services/database.services'
import { defaultErrorHandler } from './middlewares/error.middlewares'
import mediasRouter from './routes/media.routes'
import { initFolder } from './utils/file'
import { config } from 'dotenv'
import staticRouter from './routes/static.routes'
import { UPLOAD_VIDEO_DIR } from './constants/dir'
import tweetsRouter from './routes/tweets.routes'
import bookmarksRouter from './routes/bookmarks.routes'
import searchRouter from './routes/search.routes'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import '~/utils/s3'
import Conversation from './models/schemas/Conversation.schema'
import conversationsRouter from './routes/conversation.routes'
import { ObjectId } from 'mongodb'

config()
databaseServce.connect().then(() => {
  // Thực hiện tạo Index sau khi connect thành công đến DB
  databaseServce.indexUsers()
  databaseServce.indexRefreshToken()
  databaseServce.indexFollowers()
  databaseServce.indexTweets()
}) // Connect tới MongoDB
const app = express()
const httpServer = createServer(app)
const port = process.env.POST || 4000

// Tạo folder uploads khi khởi chạy app
initFolder()

// --- App hendler ---
app.use(cors())
app.use(express.json()) // Middlewares chuyển data req JSON sang dạng Obj
// Cú pháp *.use() là middlewate, có thể có nhiều middlewate (Khi truy cập vào router thì luôn phải đi qua nó trước)
app.use('/users', usersRouter) // Liên kết app tới router vừa tạo vơi tên router là '/user/
app.use('/medias', mediasRouter)
app.use('/tweets', tweetsRouter)
app.use('/bookmarks', bookmarksRouter)
app.use('/search', searchRouter)
app.use('/conversations', conversationsRouter)
app.use('/static', staticRouter) // Hiển thị ảnh
app.use('/static/video', express.static(UPLOAD_VIDEO_DIR)) // Test Sử dụng express để hiển thị video
// Khi App lỗi sẽ nhẩy vào đây (Middlewares xử lý lỗi)
app.use(defaultErrorHandler)

// Sử dụng app.get chỉ khi tạo router cho các trang tổng, để tạo router cho các trang nhỏ sử dụng express.Router()
// app.get('/', (req, res) => {
//   res.send('Hello')
// })

const io = new Server(httpServer, {
  cors: {
    origin: 'http://localhost:3000'
  }
  /* options */
})

const users: {
  [key: string]: {
    socket_id: string
  }
} = {}

// Mỗi người connected khác nhau thì hàm này sẽ chạy riêng biệt cho người dùng đó
// Bên trong hàm chỉ là 1 người dùng đang connected
io.on('connection', (socket) => {
  console.log(`user ${socket.id} connected`) // Mỗi người connect sẽ có 1 socket id riêng để tương tác với nhau
  console.log(socket.handshake.auth)

  // Lưu Id của các cliend đang connected
  const user_id = socket.handshake.auth._id
  users[user_id] = {
    socket_id: socket.id
  }

  socket.on('send_message', async (data) => {
    const { content, sender_id, receiver_id } = data.payload
    const receiver_socket_id = users[receiver_id]?.socket_id
    if (!receiver_socket_id) return

    const conversation = new Conversation({
      sender_id: new ObjectId(sender_id),
      receiver_id: new ObjectId(receiver_id),
      content: content
    })

    // Khi nhận được tin nhắn sẽ lưu vào DB
    const result = await databaseServce.conversations.insertOne(conversation)
    conversation._id = result.insertedId //Gán id trong DB vào

    // socket.to(): gửi sự kiện đến 1 người nào đó nhất định dựa vào socket.id cửa người đó
    socket.to(receiver_socket_id).emit('receiver_message', {
      payload: conversation
    })
  })

  // socket ở đây đại diện cho đối tượng đang connected (có nhiều đối tượng khi nhiều người connect)
  socket.on('disconnect', () => {
    delete users[user_id]
    console.log(`user ${socket.id} disconnect`)
  })
})

httpServer.listen(port, () => {
  console.log(`Run on port ${port}`)
})
