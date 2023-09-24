import { PaginationQuery } from './Tweet.requets'

export interface SearchQuery extends PaginationQuery {
  content: string
}
