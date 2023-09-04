import { Request } from 'express'
import { getNameFromFullName, handleUploadImage, handleUploadVideo } from '~/utils/file'
import sharp from 'sharp'
import { UPLOAD_IMAGE_DIR } from '~/constants/dir'
import path, { resolve } from 'path'
import fs from 'fs'
import { isProduction } from '~/constants/config'
import { config } from 'dotenv'
import { MediaType } from '~/constants/enums'
import { Media } from '~/models/Orther'
config()

class MediasService {
  async uploadImageController(req: Request) {
    const files = await handleUploadImage(req) // Chạy hàm này sẽ lưu file vào file "upload/temp" và trả về file
    const result: Media[] = await Promise.all(
      files.map(async (file) => {
        const newName = getNameFromFullName(file.newFilename)
        const newPath = path.resolve(UPLOAD_IMAGE_DIR, `${newName}.jpg`)
        // Nhận ảnh upload từ file "upload/temp" và chuyển đổi ảnh về dạng jpeg sau đó lưu vào file "upload"
        await sharp(file.filepath).jpeg().toFile(newPath) // Vì chỗ này dùng await nên ta sử dụng Promise.all cho files array

        // Sau khi xử lý xong thì xóa image trong file "upload/temp"
        fs.unlinkSync(file.filepath)
        return {
          url: isProduction
            ? `${process.env.HOST}/static/image/${newName}.jpg`
            : `http://localhost:${process.env.POST}/static/image/${newName}.jpg`,
          type: MediaType.Image
        }
      })
    )

    return result
  }

  async uploadVideoController(req: Request) {
    const files = await handleUploadVideo(req) // Xử lý lấy thông tin file upload video với thư viện formidable
    const result: Media[] = files.map((file) => {
      return {
        url: isProduction
          ? `${process.env.HOST}/static/video/${file.newFilename}`
          : `http://localhost:${process.env.POST}/static/video/${file.newFilename}`,
        type: MediaType.Image
      }
    })

    return result
  }
}

const mediasService = new MediasService()

export default mediasService
