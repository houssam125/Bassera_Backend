import type { Request, RequestHandler, Response } from 'express'
import multer, { MulterError } from 'multer'
import { z } from 'zod'

import { env } from '../../config/env'
import { ApiError } from '../../shared/ApiError'
import { recordAudit } from '../_shared/audit'
import { parse } from '../_shared/validate'
import { ALLOWED_MIME, storeImage } from './media.service'

const altSchema = z.object({ alt: z.string().trim().max(160).optional() })

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.mediaMaxBytes, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME.includes(file.mimetype)) return cb(null, true)
    cb(new ApiError(415, `Unsupported media type: ${file.mimetype}`))
  },
})

/** Runs multer for a single `file` field and normalises its errors. */
export const uploadSingleFile: RequestHandler = (req, res, next) => {
  upload.single('file')(req, res, (err: unknown) => {
    if (!err) return next()
    if (err instanceof MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(new ApiError(413, `File exceeds the ${env.mediaMaxBytes}-byte limit`))
      }
      return next(ApiError.badRequest(err.message))
    }
    return next(err)
  })
}

export async function uploadMedia(req: Request, res: Response): Promise<void> {
  if (!req.file) throw ApiError.badRequest('Expected a file in the "file" field')
  parse(altSchema, req.body ?? {})

  const result = await storeImage(req.file)

  await recordAudit({
    actorId: req.user?.id,
    action: 'media.upload',
    targetType: 'media',
    meta: { url: result.url, bytes: result.bytes, mime: result.mime },
  })

  res.status(201).json(result)
}
