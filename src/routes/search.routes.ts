import { Router } from 'express'
import { searchController } from '~/controllers/search.controllers'
import { wrapRequesHandle } from '~/utils/handlers'

const searchRouter = Router()

searchRouter.get('/', searchController)

export default searchRouter
