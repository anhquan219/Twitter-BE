import { Router } from 'express'
import { uploadImageController, uploadVideoController } from '~/controllers/medias.controllers'
import { accessTokenValidator, verifiedUserValidator } from '~/middlewares/users.middlewares'
import { wrapRequesHandle } from '~/utils/handlers'

const mediasRouter = Router()

mediasRouter.post('/upload-image', accessTokenValidator, verifiedUserValidator, wrapRequesHandle(uploadImageController))
mediasRouter.post('/upload-video', accessTokenValidator, verifiedUserValidator, wrapRequesHandle(uploadVideoController))

export default mediasRouter
