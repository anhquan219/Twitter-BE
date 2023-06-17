import express from 'express'
import usersRouter from '~/routes/users.routes'
import databaseServce from '~/services/database.services'
const app = express()
const port = 3000

// --- App hendler ---
app.use(express.json()) // Middlewares chuyển data req JSON sang dạng Obj
app.use('/users', usersRouter) // Liên kết app tới router vừa tạo vơi tên router là '/user/
databaseServce.connect() // Connect tới MongoDB

// Sử dụng app.get chỉ khi tạo router cho các trang tổng, để tạo router cho các trang nhỏ sử dụng express.Router()
// app.get('/', (req, res) => {
//   res.send('Hello')
// })

app.listen(port, () => {
  console.log(`Run on port ${port}`)
})
