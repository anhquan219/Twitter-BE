import { Router } from 'express'
import { uploadSingleImageController } from '~/controllers/medias.controllers'
import { wrapRequesHandle } from '~/utils/handlers'

const mediasRouter = Router()

mediasRouter.post('/upload-image', uploadSingleImageController)

export default mediasRouter