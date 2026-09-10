/**
 * Seeds the Bassera portfolio via the public API.
 *
 *   node scripts/seed-projects.mjs
 *
 * Env:
 *   API_URL         default http://localhost:4000/api
 *   SEED_EMAIL      owner/admin/editor email (default: BOOTSTRAP_ADMIN_EMAIL from .env)
 *   SEED_PASSWORD   that account's password (required)
 *
 * Idempotent-ish: on a slug conflict (409) the item is skipped.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))

function envFromDotenv() {
  try {
    const txt = readFileSync(join(here, '..', '.env'), 'utf8')
    const out = {}
    for (const line of txt.split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
      if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, '')
    }
    return out
  } catch {
    return {}
  }
}

const dot = envFromDotenv()
const API = (process.env.API_URL || 'http://localhost:4000/api').replace(/\/$/, '')
const EMAIL = process.env.SEED_EMAIL || dot.BOOTSTRAP_ADMIN_EMAIL
const PASSWORD = process.env.SEED_PASSWORD

if (!EMAIL || !PASSWORD) {
  console.error('Set SEED_EMAIL and SEED_PASSWORD (or BOOTSTRAP_ADMIN_EMAIL in .env + SEED_PASSWORD).')
  process.exit(1)
}

const social = [
  { client: 'Nomad Collective', handle: '@nomad.collective', platform: 'instagram', campaignType: 'Grid & Content Design',
    summary: 'A cohesive feed system that tripled saves per post in one quarter.',
    coverImageUrl: 'https://images.unsplash.com/photo-1611262588024-d12430b98920?w=700&q=80&fit=crop', year: 2025,
    metrics: [{ label: 'Reach / mo', value: '2.4M' }, { label: 'Engagement', value: '7.8%' }, { label: 'Followers', value: '+38K' }] },
  { client: 'AeroFit', handle: '@aerofit.app', platform: 'tiktok', campaignType: 'Short-Form Video',
    summary: 'Hook-first workout clips engineered for the For You page.',
    coverImageUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=700&q=80&fit=crop', year: 2025,
    metrics: [{ label: 'Views / mo', value: '5.1M' }, { label: 'Engagement', value: '12.3%' }, { label: 'Followers', value: '+64K' }] },
  { client: 'CrestAI', handle: 'CrestAI', platform: 'linkedin', campaignType: 'B2B Thought Leadership',
    summary: 'Founder-led narrative that turned a quiet page into a pipeline source.',
    coverImageUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=700&q=80&fit=crop', year: 2025,
    metrics: [{ label: 'Impressions', value: '890K' }, { label: 'Engagement', value: '5.4%' }, { label: 'Connections', value: '+11K' }] },
  { client: 'Luxe Realty', handle: '@luxe.realty', platform: 'instagram', campaignType: 'Property Reels',
    summary: 'Cinematic listing tours that made inventory move before open houses.',
    coverImageUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=700&q=80&fit=crop', year: 2024,
    metrics: [{ label: 'Reach / mo', value: '1.7M' }, { label: 'Engagement', value: '9.1%' }, { label: 'Leads / mo', value: '+220' }] },
  { client: 'Lumino', handle: 'Lumino', platform: 'youtube', campaignType: 'Channel Growth',
    summary: 'A publishing rhythm and thumbnail system built for watch time.',
    coverImageUrl: 'https://images.unsplash.com/photo-1601506521937-0121a7fc2a6b?w=700&q=80&fit=crop', year: 2024,
    metrics: [{ label: 'Watch hrs', value: '340K' }, { label: 'Avg. view', value: '8.6%' }, { label: 'Subscribers', value: '+19K' }] },
  { client: 'Orbify', handle: '@orbify', platform: 'x', campaignType: 'Product Launch',
    summary: 'A three-week launch thread cadence that carried the release.',
    coverImageUrl: 'https://images.unsplash.com/photo-1522542550221-31fd19575a2d?w=700&q=80&fit=crop', year: 2024,
    metrics: [{ label: 'Impressions', value: '3.2M' }, { label: 'Engagement', value: '4.9%' }, { label: 'Followers', value: '+27K' }] },
]

const software = [
  { title: 'Luxe Realty Platform', client: 'Luxe Realty', projectType: 'Real Estate Marketplace',
    summary: 'Full-stack property marketplace with 3D tours and an agent CRM.',
    description: 'Full-stack property marketplace with immersive 3D tours, map search, and an agent CRM.',
    stack: ['React', 'Node', 'PostgreSQL', 'Three.js'],
    coverImageUrl: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&q=80&fit=crop',
    year: 2025, deliveryStatus: 'shipped', liveUrl: 'https://example.com/luxe-realty' },
  { title: 'Finova Banking App', client: 'Finova', projectType: 'FinTech · Mobile',
    summary: 'Zero-to-launch neobank app with analytics and instant transfers.',
    description: 'Zero-to-launch neobank app: biometric auth, spending analytics, and instant transfers.',
    stack: ['React Native', 'TypeScript', 'Plaid', 'Fastify'],
    coverImageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80&fit=crop',
    year: 2025, deliveryStatus: 'shipped', liveUrl: 'https://example.com/finova' },
  { title: 'Pulse Health Dashboard', client: 'Pulse Health', projectType: 'Healthcare · SaaS',
    summary: 'Enterprise monitoring platform with real-time vitals and alerting.',
    description: 'Enterprise monitoring platform with real-time vitals, alerting, and a HIPAA-ready audit trail.',
    stack: ['Next.js', 'tRPC', 'Postgres', 'Redis'],
    coverImageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80&fit=crop',
    year: 2024, deliveryStatus: 'shipped', liveUrl: 'https://example.com/pulse' },
  { title: 'Orbify Logistics Cloud', client: 'Orbify', projectType: 'Fleet Operations · SaaS',
    summary: 'Real-time dispatch, route optimization, and a driver app.',
    description: 'Real-time dispatch, route optimization, and a driver app backed by an event-streamed core.',
    stack: ['React', 'Go', 'Kafka', 'gRPC'],
    coverImageUrl: 'https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=800&q=80&fit=crop',
    year: 2026, deliveryStatus: 'in_progress', liveUrl: null },
  { title: 'VaultX Payments API', client: 'VaultX', projectType: 'Payments · Infrastructure',
    summary: 'PCI-scoped payment API with idempotent transfers and webhooks.',
    description: 'PCI-scoped payment API with idempotent transfers, webhooks, and a self-serve dashboard.',
    stack: ['Node', 'PostgreSQL', 'Redis', 'Docker'],
    coverImageUrl: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&q=80&fit=crop',
    year: 2024, deliveryStatus: 'shipped', liveUrl: 'https://example.com/vaultx' },
  { title: 'CrestAI Console', client: 'CrestAI', projectType: 'LLM Ops · Platform',
    summary: 'Prompt versioning, eval runs, and cost telemetry for AI teams.',
    description: 'Prompt versioning, eval runs, and cost telemetry for teams shipping AI features.',
    stack: ['Next.js', 'Python', 'FastAPI', 'ClickHouse'],
    coverImageUrl: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&q=80&fit=crop',
    year: 2025, deliveryStatus: 'shipped', liveUrl: 'https://example.com/crestai' },
]

async function api(path, { method = 'GET', body, token } = {}) {
  const res = await fetch(API + path, {
    method,
    headers: {
      ...(body ? { 'content-type': 'application/json' } : {}),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  const data = text ? JSON.parse(text) : null
  return { status: res.status, data }
}

async function main() {
  const login = await api('/auth/login', { method: 'POST', body: { email: EMAIL, password: PASSWORD } })
  if (login.status !== 200) {
    console.error('Login failed:', login.status, login.data)
    process.exit(1)
  }
  const token = login.data.accessToken
  console.log(`Authenticated as ${EMAIL}`)

  let created = 0, skipped = 0
  const items = [
    ...social.map(s => ({ kind: 'social', visibility: 'published', tags: [], featured: false, title: s.client, ...s })),
    ...software.map((s, i) => ({ kind: 'software', visibility: 'published', tags: [], featured: i < 2, ...s })),
  ]

  for (const [i, item] of items.entries()) {
    const r = await api('/admin/projects', { method: 'POST', token, body: { sortOrder: i, ...item } })
    if (r.status === 201) {
      created++
      console.log(`  + ${item.kind.padEnd(8)} ${r.data.slug}`)
    } else if (r.status === 409) {
      skipped++
      console.log(`  = skipped (exists): ${item.title || item.client}`)
    } else {
      console.error(`  ! ${r.status}`, JSON.stringify(r.data))
    }
  }

  console.log(`\nDone — ${created} created, ${skipped} skipped.`)
}

main().catch(e => { console.error(e); process.exit(1) })
