import { Request } from 'express'
import { getNameFromFullName, handleUploadSingleImage } from '~/utils/file'
import sharp from 'sharp'
import { UPLOAD_DIR } from '~/constants/dir'
import path from 'path'
import fs from 'fs'
import { isProduction } from '~/constants/config'
import { config } from 'dotenv'
config()

class MediasService {
  async handleUploadSingleImage(req: Request) {
    const file = await handleUploadSingleImage(req) // Chạy hàm này sẽ lưu file vào file "upload/temp" và trả về file
    const newName = getNameFromFullName(file.newFilename)
    const newPath = path.resolve(UPLOAD_DIR, `${newName}.jpg`)
    // Nhận ảnh upload từ file "upload/temp" và chuyển đổi ảnh về dạng jpeg sau đó lưu vào file "upload"
    await sharp(file.filepath).jpeg().toFile(newPath)

    // Sau khi xử lý xong thì xóa image trong file "upload/temp"
    fs.unlinkSync(file.filepath)
    return isProduction
      ? `${process.env.HOST}/medias/${newName}.jpg`
      : `http://localhost:${process.env.POST}/medias/${newName}.jpg`
  }
}

const mediasService = new MediasService()

export default mediasService
