import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'

let s3Instance: S3Client | null = null

export function getStorageClient(): S3Client {
  if (s3Instance) return s3Instance

  const endpoint = process.env.MINIO_ENDPOINT
  const accessKeyId = process.env.MINIO_ACCESS_KEY
  const secretAccessKey = process.env.MINIO_SECRET_KEY

  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error('Missing MinIO configuration. Set MINIO_ENDPOINT, MINIO_ACCESS_KEY, MINIO_SECRET_KEY.')
  }

  s3Instance = new S3Client({
    endpoint,
    region: 'us-east-1',
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: true,
  })

  return s3Instance
}

export const STORAGE_BUCKET = process.env.MINIO_BUCKET ?? 'cityecho-photos'

export function getPublicUrl(key: string): string {
  const base = (process.env.MINIO_PUBLIC_BASE_URL ?? '').replace(/\/$/, '')
  return `${base}/${STORAGE_BUCKET}/${key}`
}

export function getKeyFromUrl(url: string): string {
  const base = (process.env.MINIO_PUBLIC_BASE_URL ?? '').replace(/\/$/, '')
  const prefix = `${base}/${STORAGE_BUCKET}/`
  return url.startsWith(prefix) ? url.slice(prefix.length) : url
}

export async function uploadFile(key: string, buffer: Buffer, contentType: string): Promise<string> {
  const client = getStorageClient()
  await client.send(new PutObjectCommand({
    Bucket: STORAGE_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  }))
  return getPublicUrl(key)
}

export async function deleteFile(key: string): Promise<void> {
  const client = getStorageClient()
  await client.send(new DeleteObjectCommand({
    Bucket: STORAGE_BUCKET,
    Key: key,
  }))
}
