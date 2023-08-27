import { Request, Response, NextFunction } from 'express'
import path from 'path'
import fs from 'fs'

export const initFolder = () => {
  const uploadFolderPath = path.resolve('uploads')

  // fs sử dụng để hendle đường dẫn trong dự án
  if (!fs.existsSync(uploadFolderPath)) {
    // Tạo thư mục
    fs.mkdirSync(uploadFolderPath, {
      recursive: true // Mục đích tạo folder nested (Cho phép tạo folder lồng nhau kiểu uploads/media)
    })
  }
}

export const handleUploadSingleImage = async (req: Request) => {
  // Cách sử dụng 1 thư viện ESModule trong CommonJS
  const formidable = (await import('formidable')).default

  // Setting
  const form = formidable({
    uploadDir: path.resolve('uploads'), // Đường dẫn lưu file tạm khi upload
    maxFiles: 1,
    keepExtensions: true, // Giữ lại đuôi mở rộng khi lưu file
    maxFieldsSize: 300 * 1024, // 300KB
    filter: function ({ name, originalFilename, mimetype }) {
      const valid = name === 'image' && Boolean(mimetype?.includes('image/')) // Chỉ cho phép gửi lên trường có tên "image" và kiểu file là image

      if (!valid) {
        // Emit lỗi ra
        form.emit('error' as any, new Error('File type is not valid') as any)
      }
      return valid
    }
  })

  // Chuyển callBack sang Promise để bắn lỗi ra ngoài xử lý
  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        // Nơi nhận form.emit() ở trên
        return reject(err) // Sử dụng reject() để hàm wrapRequesHandle() bắt được lỗi và xử lý
      }

      // eslint-disable-next-line no-extra-boolean-cast
      if (!Boolean(files.image)) {
        return reject(new Error('File is emptry'))
      }

      resolve(files)
    })
  })
}
