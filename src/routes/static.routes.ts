import { Router } from 'express'
import { serveImageController, serveVideoStreamController } from '~/controllers/medias.controllers'

const staticRouter = Router()

staticRouter.get('/image/:name', serveImageController) // Xử lý hiển thị image
staticRouter.get('/video-stream/:name', serveVideoStreamController) // Xử lý hiển thị video

export default staticRouter
