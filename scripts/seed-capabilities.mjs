/**
 * Seeds the "Two Divisions" service cards (Capabilities) straight into the DB.
 *
 *   node scripts/seed-capabilities.mjs           # upsert by slug (safe to re-run)
 *   node scripts/seed-capabilities.mjs --reset   # delete ALL capabilities first
 *
 * Uses Prisma directly — no API / login needed. Reads DATABASE_URL from .env.
 */
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const RESET = process.argv.includes('--reset')

function slugify(s) {
  return s
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90)
}

const capabilities = [
  // Division 01 · social
  { division: 'social', name: 'Content & Creative', icon: 'instagram',
    description: 'Scroll-stopping posts, carousels, and short-form video — designed as a system, not one-offs.',
    tags: ['Reels', 'Carousels', 'Design'] },
  { division: 'social', name: 'Community Management', icon: 'chat',
    description: 'Daily replies, DMs, and moderation in your brand voice — turning followers into a community.',
    tags: ['Engagement', 'Moderation', 'Voice'] },
  { division: 'social', name: 'Paid Social', icon: 'send',
    description: 'Full-funnel ad campaigns across Meta, TikTok, and LinkedIn — built, tested, and scaled.',
    tags: ['Meta Ads', 'TikTok', 'Retargeting'] },
  { division: 'social', name: 'Analytics & Strategy', icon: 'chart',
    description: 'Monthly reporting, content calendars, and a growth plan tied to metrics that matter.',
    tags: ['Reporting', 'Calendar', 'Growth'] },
  // Division 02 · software
  { division: 'software', name: 'Web Development', icon: 'monitor',
    description: 'Fast, accessible web apps and marketing sites on modern stacks with clean, maintainable code.',
    tags: ['React', 'Next.js', 'TypeScript'] },
  { division: 'software', name: 'Mobile Apps', icon: 'mobile',
    description: 'Native-feeling iOS & Android apps from a single codebase, built for real users on every device.',
    tags: ['React Native', 'iOS', 'Android'] },
  { division: 'software', name: 'Custom Software & SaaS', icon: 'code',
    description: 'Internal tools, dashboards, and multi-tenant products — architected to grow with your business.',
    tags: ['APIs', 'Dashboards', 'Cloud'] },
  { division: 'software', name: 'UI/UX & Design Systems', icon: 'pen',
    description: 'Research-led product design and component libraries that keep teams consistent and shipping fast.',
    tags: ['Figma', 'Prototyping', 'Tokens'] },
]

async function main() {
  if (RESET) {
    const { count } = await prisma.capability.deleteMany({})
    console.log(`reset: deleted ${count} capabilities`)
  }

  let created = 0
  let updated = 0
  for (const [i, cap] of capabilities.entries()) {
    const slug = slugify(cap.name)
    const base = {
      division: cap.division,
      name: cap.name,
      description: cap.description,
      tags: cap.tags,
      icon: cap.icon,
      visibility: 'published',
      sortOrder: i % 4,
    }
    const existed = await prisma.capability.findUnique({ where: { slug }, select: { id: true } })
    await prisma.capability.upsert({
      where: { slug },
      update: base,
      create: { slug, ...base },
    })
    if (existed) updated++
    else created++
    console.log(`  ${existed ? '~' : '+'} ${cap.division.padEnd(8)} ${slug}`)
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
