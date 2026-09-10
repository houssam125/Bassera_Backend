import { env } from '../../../config/env'
import { ApiError } from '../../../shared/ApiError'
import type { MediaDriver } from './driver'
import { localDriver } from './local.driver'

let cached: MediaDriver | undefined

export function getMediaDriver(): MediaDriver {
  if (cached) return cached

  switch (env.mediaDriver) {
    case 'local':
      cached = localDriver
      break
    case 's3':
    case 'cloudinary':
      throw new ApiError(
        500,
        `MEDIA_DRIVER="${env.mediaDriver}" is not implemented yet — add a driver under src/modules/media/drivers/`,
      )
    default:
      throw new ApiError(500, `Unknown MEDIA_DRIVER "${env.mediaDriver}"`)
  }

  return cached
}

export type { MediaDriver } from './driver'
