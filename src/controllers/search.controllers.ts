import { Request, Response, NextFunction, query } from 'express'
import { SearchQuery } from '~/models/requests/Search.requets'
import { ParamsDictionary } from 'express-serve-static-core'
import searchSearvice from '~/services/search.servies'

export const searchController = async (req: Request<ParamsDictionary, any, any, SearchQuery>, res: Response) => {
  const limit = Number(req.query.limit)
  const page = Number(req.query.page)
  const { tweets, totalItem } = await searchSearvice.search({
    limit,
    page,
    content: req.query.content,
    media_type: req.query.media_type,
    people_follow: req.query.people_follow,
    user_id: req.decoded_authorization?.user_id as string
  })
  return res.json({
    message: 'Search Successfully',
    result: {
      tweets: tweets,
      limit,
      page,
      total_page: Math.ceil(totalItem / limit)
    }
  })
}
