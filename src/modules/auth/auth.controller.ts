import type { CookieOptions, Request, Response } from 'express'

import { env, isProduction } from '../../config/env'
import { ApiError } from '../../shared/ApiError'
import { parse } from '../_shared/validate'
import { loginSchema, registerSchema, updateMeSchema } from './auth.schemas'
import {
  getMe,
  loginUser,
  logout,
  refreshSession,
  registerUser,
  updateMyProfile,
  type RequestContext,
} from './auth.service'

function ctxOf(req: Request): RequestContext {
  return { ip: req.ip, userAgent: req.get('user-agent') ?? undefined }
}

function refreshCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/api/auth',
    maxAge: env.refreshTokenTtl * 1000,
  }
}

function setRefreshCookie(res: Response, token: string): void {
  res.cookie(env.refreshCookieName, token, refreshCookieOptions())
}

function clearRefreshCookie(res: Response): void {
  res.clearCookie(env.refreshCookieName, { ...refreshCookieOptions(), maxAge: undefined })
}

export async function register(req: Request, res: Response): Promise<void> {
  const input = parse(registerSchema, req.body)
  const result = await registerUser(input)
  res.status(201).json(result)
}

export async function login(req: Request, res: Response): Promise<void> {
  const input = parse(loginSchema, req.body)
  const { user, accessToken, accessTokenExpiresIn, refreshToken } = await loginUser(
    input,
    ctxOf(req),
  )
  setRefreshCookie(res, refreshToken)
  res.status(200).json({ user, accessToken, accessTokenExpiresIn })
}

export async function refresh(req: Request, res: Response): Promise<void> {
  const raw = req.cookies?.[env.refreshCookieName] as string | undefined
  const { accessToken, accessTokenExpiresIn, refreshToken } = await refreshSession(
    raw,
    ctxOf(req),
  )
  setRefreshCookie(res, refreshToken)
  res.status(200).json({ accessToken, accessTokenExpiresIn })
}

export async function logoutController(req: Request, res: Response): Promise<void> {
  const raw = req.cookies?.[env.refreshCookieName] as string | undefined
  await logout(raw)
  clearRefreshCookie(res)
  res.status(204).send()
}

export async function me(req: Request, res: Response): Promise<void> {
  if (!req.user) throw ApiError.unauthorized()
  const user = await getMe(req.user.id)
  res.status(200).json(user)
}

export async function patchMe(req: Request, res: Response): Promise<void> {
  if (!req.user) throw ApiError.unauthorized()
  const patch = parse(updateMeSchema, req.body)
  const user = await updateMyProfile(req.user.id, patch)
  res.status(200).json(user)
}
