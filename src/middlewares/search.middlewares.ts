import { checkSchema } from 'express-validator'
import { MediaTypeQuery, PeopleFollow } from '~/constants/enums'
import { validate } from '~/utils/validation'

export const searchValidator = validate(
  checkSchema(
    {
      content: {
        isString: {
          errorMessage: 'Content must be string'
        }
      },
      media_type: {
        optional: true,
        isIn: {
          options: [Object.values(MediaTypeQuery)],
          errorMessage: `media_type must be one of ${Object.values(MediaTypeQuery).join(', ')}`
        }
      },
      people_follow: {
        optional: true,
        isIn: {
          options: [Object.values(PeopleFollow)],
          errorMessage: `people_follow must be one of ${Object.values(PeopleFollow).join(', ')}`
        }
      }
    },
    ['query']
  )
)
