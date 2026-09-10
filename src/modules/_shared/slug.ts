import { prisma } from '../../db/prisma'

/** Lower-case kebab: "Nomad Collective!" -> "nomad-collective". */
export function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '') // strip combining diacritics
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

/**
 * Returns `base` if free, otherwise `base-2`, `base-3`, … until a gap is found.
 * `ignoreId` lets an existing project keep its own slug on update.
 */
export async function uniqueProjectSlug(base: string, ignoreId?: string): Promise<string> {
  const root = slugify(base) || 'project'
  let candidate = root
  let n = 1

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const clash = await prisma.project.findFirst({
      where: { slug: candidate, ...(ignoreId ? { NOT: { id: ignoreId } } : {}) },
      select: { id: true },
    })
    if (!clash) return candidate
    n += 1
    candidate = `${root}-${n}`
  }
}
