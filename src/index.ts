import express from 'express'
import usersRouter from './routes/users.routes'
const app = express()
const port = 3000

// --- App hendler ---
app.use(express.json()) // Middlewares chuyển data req JSON sang dạng Obj
// Liên kết app tới router vừa tạo vơi tên router là '/user/
app.use('/users', usersRouter)

// Sử dụng app.get chỉ khi tạo router cho các trang tổng, để tạo router cho các trang nhỏ sử dụng express.Router()
// app.get('/', (req, res) => {
//   res.send('Hello')
// })

app.listen(port, () => {
  console.log(`Run on port ${port}`)
})
