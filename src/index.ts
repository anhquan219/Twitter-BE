import express from 'express'
import usersRouter from '~/routes/users.routes'
import databaseServce from '~/services/database.services'
import { defaultErrorHandler } from './middlewares/error.middlewares'
import mediasRouter from './routes/media.routes'
import { initFolder } from './utils/file'
import { config } from 'dotenv'
import staticRouter from './routes/static.routes'
import { UPLOAD_VIDEO_DIR } from './constants/dir'

config()
databaseServce.connect().then(() => {
  // Thực hiện tạo Index sau khi connect thành công đến DB
  databaseServce.indexUsers()
  databaseServce.indexRefreshToken()
  databaseServce.indexFollowers()
}) // Connect tới MongoDB
const app = express()
const port = process.env.POST || 4000

// Tạo folder uploads khi khởi chạy app
initFolder()

// --- App hendler ---
app.use(express.json()) // Middlewares chuyển data req JSON sang dạng Obj
// Cú pháp *.use() là middlewate, có thể có nhiều middlewate (Khi truy cập vào router thì luôn phải đi qua nó trước)
app.use('/users', usersRouter) // Liên kết app tới router vừa tạo vơi tên router là '/user/
app.use('/medias', mediasRouter)
app.use('/static', staticRouter) // Hiển thị ảnh
app.use('/static/video', express.static(UPLOAD_VIDEO_DIR)) // Test Sử dụng express để hiển thị video
// Khi App lỗi sẽ nhẩy vào đây (Middlewares xử lý lỗi)
app.use(defaultErrorHandler)

// Sử dụng app.get chỉ khi tạo router cho các trang tổng, để tạo router cho các trang nhỏ sử dụng express.Router()
// app.get('/', (req, res) => {
//   res.send('Hello')
// })

app.listen(port, () => {
  console.log(`Run on port ${port}`)
})
