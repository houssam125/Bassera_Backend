/**
 * Seeds the "Trusted by growing companies" strip (Clients) straight into the DB.
 *
 *   node scripts/seed-clients.mjs           # upsert by slug (safe to re-run)
 *   node scripts/seed-clients.mjs --reset   # delete ALL clients first
 *
 * Demo logos are inline data-URI SVG wordmarks — replace with real uploaded
 * logos from the dashboard (POST /api/admin/media).
 */
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const RESET = process.argv.includes('--reset')

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 90)
}

/** A muted wordmark as a self-contained data-URI SVG. */
function wordmark(name) {
  const w = Math.max(120, name.length * 26 + 40)
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="56" viewBox="0 0 ${w} 56">` +
    `<text x="50%" y="50%" dy="0.35em" text-anchor="middle" ` +
    `font-family="Georgia, 'Times New Roman', serif" font-size="30" font-weight="700" ` +
    `fill="#8a93a6">${name}</text></svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

const names = ['Nexara', 'Orbify', 'VaultX', 'Lumino', 'CrestAI']

async function main() {
  if (RESET) {
    const { count } = await prisma.client.deleteMany({})
    console.log(`reset: deleted ${count} clients`)
  }

  let created = 0
  let updated = 0
  for (const [i, name] of names.entries()) {
    const slug = slugify(name)
    const data = {
      name,
      logoUrl: wordmark(name),
      websiteUrl: null,
      visibility: 'published',
      sortOrder: i,
    }
    const existed = await prisma.client.findUnique({ where: { slug }, select: { id: true } })
    await prisma.client.upsert({ where: { slug }, update: data, create: { slug, ...data } })
    existed ? updated++ : created++
    console.log(`  ${existed ? '~' : '+'} ${slug}`)
  }
  console.log(`\nDone — ${created} created, ${updated} updated.`)
}

main()
  .then(() => prisma.$disconnect())
  .catch(async err => {
    console.error(err)
    await prisma.$disconnect()
    process.exit(1)
  })
