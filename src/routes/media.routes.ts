import { Router } from 'express'
import { uploadImageController } from '~/controllers/medias.controllers'
import { wrapRequesHandle } from '~/utils/handlers'

const mediasRouter = Router()

mediasRouter.post('/upload-image', wrapRequesHandle(uploadImageController))

export default mediasRouter
