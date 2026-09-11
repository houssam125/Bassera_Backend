import crypto from 'node:crypto'

import { env } from '../../../config/env'
import { ApiError } from '../../../shared/ApiError'
import type { MediaDriver, SaveInput, SaveResult } from './driver'

const UPLOAD_URL = 'https://upload.imagekit.io/api/v1/files/upload'

interface ImageKitUploadResponse {
  url?: string
  message?: string
}

/**
 * Uploads directly to ImageKit's REST API (no SDK dependency — Node's built-in
 * fetch/FormData/Blob are enough). Auth is HTTP Basic with the private key as
 * the username and an empty password, per ImageKit's server-side upload API.
 *
 * `IMAGEKIT_URL_ENDPOINT` is intentionally not required here: the upload
 * response already includes the file's live URL, which is all this driver
 * returns. Only needed later if you add client-side transformation URLs.
 */
export const imagekitDriver: MediaDriver = {
  async save({ buffer, ext, mime }: SaveInput): Promise<SaveResult> {
    if (!env.imagekitPrivateKey) {
      throw new ApiError(500, 'IMAGEKIT_PRIVATE_KEY is not set')
    }

    const fileName = `${crypto.randomUUID()}.${ext}`
    const year = String(new Date().getFullYear())

    const form = new FormData()
    form.append('file', new Blob([new Uint8Array(buffer)], { type: mime }), fileName)
    form.append('fileName', fileName)
    form.append('folder', `/bassera/${year}`)
    form.append('useUniqueFileName', 'true')

    const auth = Buffer.from(`${env.imagekitPrivateKey}:`).toString('base64')

    const res = await fetch(UPLOAD_URL, {
      method: 'POST',
      headers: { Authorization: `Basic ${auth}` },
      body: form,
    })

    const data = (await res.json().catch(() => ({}))) as ImageKitUploadResponse

    if (!res.ok || !data.url) {
      throw new ApiError(502, `ImageKit upload failed: ${data.message ?? res.statusText}`)
    }

    return { url: data.url }
  },
}
