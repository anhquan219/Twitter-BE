import { Router } from 'express'
const userRouter = Router()

// Cú pháp *.use() là middlewate, có thể có nhiều middlewate (Khi truy cập vào router thì luôn phải đi qua nó trước)
userRouter.use(
  (res, req, next) => {
    console.log('middlewate 1')
    next()
  },
  (res, req, next) => {
    console.log('middlewate 2')
    next()
  }
)

userRouter.get('/tweets', (req, res) => {
  res.json({
    data: [
      {
        id: 1,
        text: 'Quan 123'
      }
    ]
  })
})

export default userRouter
