import { S3 } from '@aws-sdk/client-s3'
import { config } from 'dotenv'
config()

// Kết nối tới S3
const s3 = new S3({
  region: process.env.AWS_REGION,
  credentials: {
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID as string
  }
})

// Lấy danh sách s3 Buckets trong AWS
s3.listBuckets({}).then((data) => {
  console.log(data)
})
