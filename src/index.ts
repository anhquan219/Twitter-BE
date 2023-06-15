import express from 'express'
import userRouter from './user.routes'
const app = express()
const port = 3000

// Sử dụng app.get chỉ khi tạo router cho các trang tổng, để tạo router cho các trang nhỏ sử dụng express.Router()
app.get('/', (req, res) => {
  res.send('Hello')
})

// Liên kết app tới router vừa tạo vơi tên router là '/user/
app.use('/user', userRouter)

app.listen(port, () => {
  console.log(`Run on port ${port}`)
})
