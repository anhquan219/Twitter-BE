import { MediaTypeQuery, PeopleFollow } from '~/constants/enums'
import { PaginationQuery } from './Tweet.requets'
import { Query } from 'express-serve-static-core'

export interface SearchQuery extends PaginationQuery, Query {
  content: string
  media_type?: MediaTypeQuery
  people_follow?: PeopleFollow
}
