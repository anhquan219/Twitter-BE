import { Request, Response, NextFunction } from 'express'
import path from 'path'
import { UPLOAD_DIR } from '~/constants/dir'
import mediasService from '~/services/medias.services'
import { handleUploadSingleImage } from '~/utils/file'

export const uploadSingleImageController = async (req: Request, res: Response, next: NextFunction) => {
  // Xử lý ảnh
  const result = await mediasService.handleUploadSingleImage(req)
  return res.json({
    result: result
  })
}

export const serveImageController = async (req: Request, res: Response, next: NextFunction) => {
  const { name } = req.params
  //  res.sendFile(): Để in thông tin file đó lên cliend (Ví dụ như Text, hình ảnh)
  return res.sendFile(path.resolve(UPLOAD_DIR, name), (err) => {
    if (err) {
      res.status((err as any).status).send('Not found') // In ra text lên Cliend
    }
  })
}
