import patch from 'path'
import fs from 'fs'

export const initFolder = () => {
  const uploadFolderPath = patch.resolve('uploads')

  // fs sử dụng để hendle đường dẫn trong dự án
  if (!fs.existsSync(uploadFolderPath)) {
    // Tạo thư mục
    fs.mkdirSync(uploadFolderPath, {
      recursive: true // Mục đích tạo folder nested (Cho phép tạo folder lồng nhau kiểu uploads/media)
    })
  }
}
