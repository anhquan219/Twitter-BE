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
import { verifyAccessToken } from './utils/commons'
import { UserVerifyStatus } from './constants/enums'
import { TokenPayload } from './models/requests/User.requests'
import { ErorrWithStatus } from './models/Errors'
import HTTP_STATUS from './constants/httpStatus'
import { USERS_MESSAGES } from './constants/messages'

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

// Middlewares io instance (Chỉ chạy 1 lần)
io.use(async (socket, next) => {
  const { Authorization } = socket.handshake.auth // Cliend gửi Authorization lên
  const access_token = Authorization?.split(' ')[1]

  // Bắt lỗi Cliend không gửi Authorization
  try {
    const decoded_authorization = await verifyAccessToken(access_token)
    const { verify } = decoded_authorization as TokenPayload
    if (verify !== UserVerifyStatus.Verified) {
      // Khi throw error ở đẩy sẽ nhảy đến catch bên dưới
      throw new ErorrWithStatus({
        message: USERS_MESSAGES.USER_NOT_VERIFIED,
        status: HTTP_STATUS.FORBIDDEN
      })
    }
    // Truyền decoded_authorization vào socket handshake để sử dụng ở các Middlewares khác
    socket.handshake.auth.decoded_authorization = decoded_authorization
    socket.handshake.auth.access_token = access_token
    next()
  } catch (error) {
    next({
      // Cấu trúc obj bắt buộc của error socket
      message: 'Unauthorized',
      name: 'UnauthorizedError',
      data: error
    })
  }
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

  // Lưu Id của các cliend đang connected
  const { user_id } = socket.handshake.auth.decoded_authorization as TokenPayload
  users[user_id] = {
    socket_id: socket.id
  }

  // Middlewares socket instance (Chạy mỗi khi gửi tin nhắn)
  socket.use(async (packet, next) => {
    const { access_token } = socket.handshake.auth
    try {
      await verifyAccessToken(access_token)
      next()
    } catch (err) {
      next(new Error('Unauthorized'))
    }
  })

  // Bắt sự kiện 'error' từ Middlewares socket instance
  socket.on('error', (error) => {
    if (error.message === 'Unauthorized') {
      socket.disconnect()
    }
  })

  socket.on('send_message', async (data) => {
    const { content, sender_id, receiver_id } = data.payload
    const receiver_socket_id = users[receiver_id]?.socket_id

    // Nếu người nhận không online thì vẫn gửi tin nhắn và lưu vào DB
    const conversation = new Conversation({
      sender_id: new ObjectId(sender_id),
      receiver_id: new ObjectId(receiver_id),
      content: content
    })

    // Khi nhận được tin nhắn sẽ lưu vào DB
    const result = await databaseServce.conversations.insertOne(conversation)
    conversation._id = result.insertedId //Gán id trong DB vào

    // Nếu người nhận online thì mới bắn socket tới
    if (receiver_socket_id) {
      // socket.to(): gửi sự kiện đến 1 người nào đó nhất định dựa vào socket.id cửa người đó
      socket.to(receiver_socket_id).emit('receiver_message', {
        payload: conversation
      })
    }
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
