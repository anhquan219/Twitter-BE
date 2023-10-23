import { S3 } from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'
import { config } from 'dotenv'
import fs from 'fs'
import { envConfig } from '~/constants/config'
config()

// Kết nối tới S3
const s3 = new S3({
  region: envConfig.awsRegion,
  credentials: {
    secretAccessKey: envConfig.awsSecretAccessKey as string,
    accessKeyId: envConfig.awsAccessKeyId as string
  }
})

export const uploadFileToS3 = ({
  filename,
  filepath,
  ContentType
}: {
  filename: string
  filepath: string
  ContentType: string
}) => {
  const parallelUploads3 = new Upload({
    client: s3,
    params: {
      Bucket: envConfig.s3BucketName, //Tên S3 muốn lưu trữ
      Key: filename, //Tên của file sau khi được lưu trên S3
      Body: fs.readFileSync(filepath), //Đường dẫn file muốn lưu gửi từ BE
      ContentType: ContentType // Truyền lên type của file để tránh việc tự động tải file về khi xem trên S3
    },

    tags: [
      /*...*/
    ], // optional tags
    queueSize: 4, // optional concurrency configuration
    partSize: 1024 * 1024 * 5, // optional size of each part, in bytes, at least 5MB
    leavePartsOnError: false // optional manually handle dropped parts
  })

  return parallelUploads3.done()
}
