import imageSize from 'image-size'

import { ApiError } from '../../shared/ApiError'
import { getMediaDriver } from './drivers'

const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

export const ALLOWED_MIME = Object.keys(EXT_BY_MIME)

export interface UploadResult {
  url: string
  width: number
  height: number
  bytes: number
  mime: string
}

export async function storeImage(file: Express.Multer.File): Promise<UploadResult> {
  const mime = file.mimetype
  const ext = EXT_BY_MIME[mime]
  if (!ext) throw new ApiError(415, `Unsupported media type: ${mime}`)

  let dimensions: { width?: number; height?: number }
  try {
    dimensions = imageSize(file.buffer)
  } catch {
    throw ApiError.badRequest('File is not a readable image')
  }
  if (!dimensions.width || !dimensions.height) {
    throw ApiError.badRequest('Could not read image dimensions')
  }

  const { url } = await getMediaDriver().save({ buffer: file.buffer, ext, mime })

  return {
    url,
    width: dimensions.width,
    height: dimensions.height,
    bytes: file.size,
    mime,
  }
}
