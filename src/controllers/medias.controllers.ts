import { Request, Response, NextFunction } from 'express'
import mediasService from '~/services/medias.services'
import { handleUploadSingleImage } from '~/utils/file'

export const uploadSingleImageController = async (req: Request, res: Response, next: NextFunction) => {
  // Xử lý ảnh
  const result = await mediasService.handleUploadSingleImage(req)
  return res.json({
    result: result
  })
}
