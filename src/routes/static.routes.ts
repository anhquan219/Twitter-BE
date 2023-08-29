import { Router } from 'express'
import { serveImageController, uploadSingleImageController } from '~/controllers/medias.controllers'
import { wrapRequesHandle } from '~/utils/handlers'

const staticRouter = Router()

staticRouter.get('/image/:name', serveImageController)

export default staticRouter
