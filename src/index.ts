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
import cors from 'cors'
import '~/utils/s3'
import conversationsRouter from './routes/conversation.routes'
import initSocket from './utils/socket'
import swaggerUi from 'swagger-ui-express'
import swaggerJsdoc from 'swagger-jsdoc'
import { envConfig } from './constants/config'

// Khởi tạo swagger và liên kết các file swagger
const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'X clone (Twitter API)',
      version: '1.0.0'
    }
  },
  apis: ['./openapi/*.yaml'] // files containing annotations as above
}

const openapiSpecification = swaggerJsdoc(options)

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
const port = envConfig.port || 4000

// Tạo folder uploads khi khởi chạy app
initFolder()

// Tạo router đến swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapiSpecification))

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

// Khởi tạo socket.io
initSocket(httpServer)

httpServer.listen(port, () => {
  console.log(`Run on port ${port}`)
})
