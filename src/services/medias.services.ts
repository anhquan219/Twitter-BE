import { Request } from 'express'
import { getNameFromFullName, handleUploadImage, handleUploadVideo } from '~/utils/file'
import sharp from 'sharp'
import { UPLOAD_IMAGE_DIR } from '~/constants/dir'
import path, { resolve } from 'path'
import fsPromise from 'fs/promises'
import { config } from 'dotenv'
import { MediaType } from '~/constants/enums'
import { Media } from '~/models/Orther'
import { uploadFileToS3 } from '~/utils/s3'
import { CompleteMultipartUploadCommandOutput } from '@aws-sdk/client-s3'
import mime from 'mime'

config()

class MediasService {
  async uploadImageController(req: Request) {
    const files = await handleUploadImage(req) // Chạy hàm này sẽ lưu file vào file "upload/temp" và trả về file
    const result: Media[] = await Promise.all(
      files.map(async (file) => {
        const newName = getNameFromFullName(file.newFilename)
        const newFullFilename = `${newName}.jpg`
        const newPath = path.resolve(UPLOAD_IMAGE_DIR, newFullFilename)
        // Nhận ảnh upload từ file "upload/temp" và chuyển đổi ảnh về dạng jpeg sau đó lưu vào file "upload"
        await sharp(file.filepath).jpeg().toFile(newPath) // Vì chỗ này dùng await nên ta sử dụng Promise.all cho files array

        // Upload lên S3 AWS
        const s3Result = await uploadFileToS3({
          filename: 'images/' + newFullFilename,
          filepath: newPath,
          ContentType: mime.getType(newFullFilename) as string
        })

        // Sau khi xử lý xong thì xóa image trong file "upload/temp"
        await Promise.all([fsPromise.unlink(file.filepath), fsPromise.unlink(newPath)])

        return {
          url: (s3Result as CompleteMultipartUploadCommandOutput).Location as string,
          type: MediaType.Image
        }
      })
    )

    return result
  }

  async uploadVideoController(req: Request) {
    const files = await handleUploadVideo(req) // Xử lý lấy thông tin file upload video với thư viện formidable
    const result: Media[] = await Promise.all(
      files.map(async (file) => {
        // Upload lên S3 AWS
        const s3Result = await uploadFileToS3({
          filename: 'videos/' + file.newFilename,
          filepath: file.filepath,
          ContentType: mime.getType(file.newFilename) as string
        })

        fsPromise.unlink(file.filepath)

        return {
          url: (s3Result as CompleteMultipartUploadCommandOutput).Location as string,
          type: MediaType.Image
        }
      })
    )
    return result
  }
}

const mediasService = new MediasService()

export default mediasService
