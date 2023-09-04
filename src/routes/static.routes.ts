import { Router } from 'express'
import { serveImageController, serveVideoController } from '~/controllers/medias.controllers'

const staticRouter = Router()

staticRouter.get('/image/:name', serveImageController) // Xử lý hiển thị image
staticRouter.get('/video/:name', serveVideoController) // Xử lý hiển thị video

export default staticRouter
