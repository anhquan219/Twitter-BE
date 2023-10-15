import { ObjectId } from 'mongodb'
import { Server } from 'socket.io'
import Conversation from '~/models/schemas/Conversation.schema'
import { verifyAccessToken } from '~/utils/commons'
import { UserVerifyStatus } from '~/constants/enums'
import { TokenPayload } from '~/models/requests/User.requests'
import { ErorrWithStatus } from '~/models/Errors'
import HTTP_STATUS from '~/constants/httpStatus'
import { USERS_MESSAGES } from '~/constants/messages'
import databaseServce from '~/services/database.services'
import { Server as ServerHttp } from 'http'

const initSocket = (httpServer: ServerHttp) => {
  // Khởi tạo io
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
}

export default initSocket
