import crypto from 'node:crypto'
import { promises as fs } from 'node:fs'
import path from 'node:path'

import { env } from '../../../config/env'
import type { MediaDriver, SaveInput, SaveResult } from './driver'

/** Absolute directory the local driver writes into (also served as static). */
export const LOCAL_UPLOAD_DIR = path.resolve(process.cwd(), 'uploads')

export const localDriver: MediaDriver = {
  async save({ buffer, ext }: SaveInput): Promise<SaveResult> {
    const year = String(new Date().getFullYear())
    const name = `${crypto.randomBytes(8).toString('hex')}.${ext}`
    const dir = path.join(LOCAL_UPLOAD_DIR, year)

    await fs.mkdir(dir, { recursive: true })
    await fs.writeFile(path.join(dir, name), buffer)

    return { url: `${env.mediaPublicBaseUrl.replace(/\/+$/, '')}/${year}/${name}` }
  },
}
