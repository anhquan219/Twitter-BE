import { Request, Response, NextFunction } from 'express'
import { result } from 'lodash'
import path from 'path'

export const uploadSingleImageController = async (req: Request, res: Response, next: NextFunction) => {
  // Cách sử dụng 1 thư viện ESModule trong CommonJS
  const formidable = (await import('formidable')).default

  // Setting
  const form = formidable({
    uploadDir: path.resolve('uploads'), // Đường dẫn lưu file tạm khi upload
    maxFiles: 1,
    keepExtensions: true, // Giữ lại đuôi mở rộng khi lưu file
    maxFieldsSize: 300 * 1024 // 300KB
  })

  form.parse(req, (err, fields, files) => {
    if (err) {
      throw err
    }

    res.json({
      messsge: 'Upload image successfully',
      result: { fields, files }
    })
  })
}
