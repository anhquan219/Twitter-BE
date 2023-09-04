import { Request, Response, NextFunction } from 'express'
import fs from 'fs'
import { File } from 'formidable'
import { UPLOAD_IMAGE_TEMP_DIR, UPLOAD_VIDEO_DIR } from '~/constants/dir'

export const initFolder = () => {
  // fs sử dụng để hendle đường dẫn trong dự án
  ;[UPLOAD_IMAGE_TEMP_DIR, UPLOAD_VIDEO_DIR].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      // Tạo thư mục
      fs.mkdirSync(dir, {
        recursive: true // Mục đích tạo folder nested (Cho phép tạo folder lồng nhau kiểu uploads/media)
      })
    }
  })
}

export const handleUploadImage = async (req: Request) => {
  // Cách sử dụng 1 thư viện ESModule trong CommonJS
  const formidable = (await import('formidable')).default

  // Setting
  const form = formidable({
    uploadDir: UPLOAD_IMAGE_TEMP_DIR, // Đường dẫn lưu file tạm khi upload
    maxFiles: 4,
    keepExtensions: true, // Giữ lại đuôi mở rộng khi lưu file
    maxFieldsSize: 300 * 1024, // 300KB
    maxTotalFileSize: 8 * 300 * 1024,
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
  return new Promise<File[]>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        // Nơi nhận form.emit() ở trên
        return reject(err) // Sử dụng reject() để hàm wrapRequesHandle() bắt được lỗi và xử lý
      }

      // eslint-disable-next-line no-extra-boolean-cast
      if (!Boolean(files.image)) {
        return reject(new Error('File is emptry'))
      }

      resolve(files.image as File[])
    })
  })
}

export const handleUploadVideo = async (req: Request) => {
  // Cách sử dụng 1 thư viện ESModule trong CommonJS
  const formidable = (await import('formidable')).default

  // Setting file upload
  const form = formidable({
    uploadDir: UPLOAD_VIDEO_DIR, // Đường dẫn lưu file
    maxFiles: 1,
    maxFieldsSize: 50 * 1024 * 1024, // 50MB
    filter: function ({ name, originalFilename, mimetype }) {
      const valid = name === 'video' && Boolean(mimetype?.includes('video/')) // Chỉ cho phép gửi lên trường có tên "video" và kiểu file là video

      if (!valid) {
        // Emit lỗi ra
        form.emit('error' as any, new Error('File type is not valid') as any)
      }
      return valid
    }
  })

  // Chuyển callBack sang Promise để bắn lỗi ra ngoài xử lý wrapRequesHandle()
  return new Promise<File[]>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        // Nơi nhận form.emit() ở trên
        return reject(err) // Sử dụng reject() để hàm wrapRequesHandle() bắt được lỗi và xử lý
      }

      // eslint-disable-next-line no-extra-boolean-cast
      if (!Boolean(files.video)) {
        return reject(new Error('File is emptry'))
      }

      const videos = files.video as File[]

      videos.forEach((video) => {
        const ext = getExtensiton(video.originalFilename as string) // Lấy đuôi mở rộng
        fs.renameSync(video.filepath, video.filepath + '.' + ext)
        video.newFilename = video.newFilename + '.' + ext
      })

      resolve(files.video as File[])
    })
  })
}

export const getNameFromFullName = (fullname: string) => {
  const nameArr = fullname.split('.')
  nameArr.pop() // Loại bỏ item cuối cùng trong mảng
  return nameArr.join('') // Ghép các item lại thành 1 chuỗi
}

export const getExtensiton = (fullname: string) => {
  const nameArr = fullname.split('.')
  return nameArr[nameArr.length - 1]
}
