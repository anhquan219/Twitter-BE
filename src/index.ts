import express from 'express'
import usersRouter from '~/routes/users.routes'
import databaseServce from '~/services/database.services'
import { defaultErrorHandler } from './middlewares/error.middlewares'
const app = express()
const port = 3000

databaseServce.connect() // Connect tới MongoDB
// --- App hendler ---
app.use(express.json()) // Middlewares chuyển data req JSON sang dạng Obj
// Cú pháp *.use() là middlewate, có thể có nhiều middlewate (Khi truy cập vào router thì luôn phải đi qua nó trước)
app.use('/users', usersRouter) // Liên kết app tới router vừa tạo vơi tên router là '/user/
// Khi App lỗi sẽ nhẩy vào đây (Middlewares xử lý lỗi)
app.use(defaultErrorHandler)

// Sử dụng app.get chỉ khi tạo router cho các trang tổng, để tạo router cho các trang nhỏ sử dụng express.Router()
// app.get('/', (req, res) => {
//   res.send('Hello')
// })

app.listen(port, () => {
  console.log(`Run on port ${port}`)
})
