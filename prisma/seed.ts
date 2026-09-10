/**
 * Seed sample portfolio projects so the frontend has content to render.
 *
 *   npm run db:seed             # upserts the rows below (safe to re-run)
 *   npm run db:seed -- --reset  # deletes ALL projects first, then seeds
 *
 * Rows are keyed by `slug`; editing a project here and re-seeding updates it.
 * These are placeholder Bassera-style projects — swap covers, copy and links for
 * real work via the admin dashboard, or delete any of them.
 *
 * Covers use picsum.photos (deterministic per slug) so nothing 404s; replace
 * with real images through POST /api/admin/media + the project form.
 */
import { PrismaClient, type Prisma } from '@prisma/client'

const prisma = new PrismaClient()

type Seed = Prisma.ProjectCreateInput

const cover = (slug: string) => `https://picsum.photos/seed/bassera-${slug}/1200/800`

// ─────────────────────────────────────────────────────────────────────────────
// Division 01 — Social Media
// ─────────────────────────────────────────────────────────────────────────────
const social: Seed[] = [
  {
    kind: 'social', slug: 'nomad-collective', title: 'Nomad Collective', client: 'Nomad Collective',
    summary: 'A cohesive feed system that tripled saves per post in one quarter.',
    coverImageUrl: cover('nomad-collective'), year: 2025, tags: ['Instagram', 'Content Design'],
    featured: true, visibility: 'published', sortOrder: 0,
    platform: 'instagram', handle: '@nomad.collective', campaignType: 'Grid & Content Design',
    metrics: [
      { label: 'Reach / mo', value: '2.4M', trend: 'up' },
      { label: 'Engagement', value: '7.8%', trend: 'up' },
      { label: 'Followers', value: '+38K', trend: 'up' },
    ],
    campaignUrl: 'https://instagram.com/nomad.collective',
  },
  {
    kind: 'social', slug: 'aurora-skincare', title: 'Aurora Skincare Launch', client: 'Aurora',
    summary: 'TikTok-first launch campaign that sold out the first drop in 36 hours.',
    coverImageUrl: cover('aurora-skincare'), year: 2025, tags: ['TikTok', 'Launch', 'UGC'],
    featured: true, visibility: 'published', sortOrder: 1,
    platform: 'tiktok', handle: '@aurora.skin', campaignType: 'Creator & Paid Launch',
    metrics: [
      { label: 'Views', value: '11.2M', trend: 'up' },
      { label: 'CTR', value: '3.1%', trend: 'up' },
      { label: 'ROAS', value: '4.6x', trend: 'up' },
    ],
    campaignUrl: 'https://www.tiktok.com/@aurora.skin',
  },
  {
    kind: 'social', slug: 'meridian-capital-linkedin', title: 'Meridian Capital — Thought Leadership',
    client: 'Meridian Capital',
    summary: 'Executive LinkedIn program that grew inbound deal flow by 22%.',
    coverImageUrl: cover('meridian-capital-linkedin'), year: 2024, tags: ['LinkedIn', 'B2B', 'Personal Brand'],
    featured: false, visibility: 'published', sortOrder: 2,
    platform: 'linkedin', handle: 'meridian-capital', campaignType: 'Executive Thought Leadership',
    metrics: [
      { label: 'Impressions', value: '1.8M', trend: 'up' },
      { label: 'Inbound', value: '+22%', trend: 'up' },
    ],
    campaignUrl: null,
  },
  {
    kind: 'social', slug: 'verde-kitchen', title: 'Verde Kitchen — Reels System', client: 'Verde Kitchen',
    summary: 'A repeatable short-form recipe format that turned a single location into a waitlist.',
    coverImageUrl: cover('verde-kitchen'), year: 2025, tags: ['Instagram', 'Reels', 'F&B'],
    featured: true, visibility: 'published', sortOrder: 3,
    platform: 'instagram', handle: '@verde.kitchen', campaignType: 'Short-Form Content',
    metrics: [
      { label: 'Reel views', value: '5.9M', trend: 'up' },
      { label: 'Saves', value: '+140K', trend: 'up' },
      { label: 'Covers / wk', value: '+31%', trend: 'up' },
    ],
    campaignUrl: null,
  },
  {
    kind: 'social', slug: 'pulse-fitness-challenge', title: 'Pulse Fitness — 30-Day Challenge',
    client: 'Pulse Fitness',
    summary: 'A creator-led challenge that filled three new class times in two weeks.',
    coverImageUrl: cover('pulse-fitness-challenge'), year: 2024, tags: ['TikTok', 'Community', 'Fitness'],
    featured: false, visibility: 'published', sortOrder: 4,
    platform: 'tiktok', handle: '@pulse.fitness', campaignType: 'Community Challenge',
    metrics: [
      { label: 'UGC posts', value: '2,300', trend: 'up' },
      { label: 'Sign-ups', value: '+780', trend: 'up' },
    ],
    campaignUrl: null,
  },
  {
    kind: 'social', slug: 'atlas-travel-grid', title: 'Atlas Travel Co — Feed Redesign',
    client: 'Atlas Travel Co',
    summary: 'A destination-led grid system that lifted profile-to-site clicks by half.',
    coverImageUrl: cover('atlas-travel-grid'), year: 2024, tags: ['Instagram', 'Travel', 'Art Direction'],
    featured: false, visibility: 'published', sortOrder: 5,
    platform: 'instagram', handle: '@atlas.travel.co', campaignType: 'Art Direction & Grid',
    metrics: [
      { label: 'Profile visits', value: '+63%', trend: 'up' },
      { label: 'Link clicks', value: '+51%', trend: 'up' },
      { label: 'Story reach', value: '820K', trend: 'up' },
    ],
    campaignUrl: null,
  },
  {
    kind: 'social', slug: 'lumen-audio-reviews', title: 'Lumen Audio — Long-Form Reviews',
    client: 'Lumen Audio',
    summary: 'A YouTube review cadence that became the brand’s top assisted-conversion channel.',
    coverImageUrl: cover('lumen-audio-reviews'), year: 2025, tags: ['YouTube', 'Long-Form', 'Product'],
    featured: false, visibility: 'published', sortOrder: 6,
    platform: 'youtube', handle: '@lumenaudio', campaignType: 'Long-Form Video',
    metrics: [
      { label: 'Watch time', value: '410K hrs', trend: 'up' },
      { label: 'Subs', value: '+54K', trend: 'up' },
      { label: 'Assisted rev', value: '$390K', trend: 'up' },
    ],
    campaignUrl: null,
  },
  {
    kind: 'social', slug: 'cobalt-fintech-x', title: 'Cobalt — Market Commentary on X',
    client: 'Cobalt',
    summary: 'A daily commentary voice that made a young fintech feel like an authority.',
    coverImageUrl: cover('cobalt-fintech-x'), year: 2024, tags: ['X', 'FinTech', 'Copywriting'],
    featured: false, visibility: 'published', sortOrder: 7,
    platform: 'x', handle: '@cobalt', campaignType: 'Daily Commentary',
    metrics: [
      { label: 'Impressions', value: '9.4M', trend: 'up' },
      { label: 'Followers', value: '+27K', trend: 'up' },
    ],
    campaignUrl: null,
  },
  {
    kind: 'social', slug: 'bloom-florals', title: 'Bloom Florals — Local Growth', client: 'Bloom Florals',
    summary: 'Neighbourhood-focused content that doubled weekend walk-ins for a single-shop florist.',
    coverImageUrl: cover('bloom-florals'), year: 2023, tags: ['Instagram', 'Local', 'Small Business'],
    featured: false, visibility: 'published', sortOrder: 8,
    platform: 'instagram', handle: '@bloom.florals', campaignType: 'Local Content',
    metrics: [
      { label: 'Local reach', value: '210K', trend: 'up' },
      { label: 'Walk-ins', value: '+2x', trend: 'up' },
    ],
    campaignUrl: null,
  },
  {
    kind: 'social', slug: 'northgate-realty', title: 'Northgate Realty — Listing Engine',
    client: 'Northgate Realty',
    summary: 'A Facebook listing format that cut cost-per-lead by 40% across agents.',
    coverImageUrl: cover('northgate-realty'), year: 2024, tags: ['Facebook', 'Real Estate', 'Paid Social'],
    featured: false, visibility: 'published', sortOrder: 9,
    platform: 'facebook', handle: 'NorthgateRealty', campaignType: 'Paid Social & Listings',
    metrics: [
      { label: 'Leads / mo', value: '+430', trend: 'up' },
      { label: 'CPL', value: '-40%', trend: 'down' },
      { label: 'Tours booked', value: '+180', trend: 'up' },
    ],
    campaignUrl: null,
  },
  {
    kind: 'social', slug: 'sundara-wellness', title: 'Sundara Wellness — Studio Brand',
    client: 'Sundara Wellness',
    summary: 'A calm, consistent content voice that kept memberships full through a slow season.',
    coverImageUrl: cover('sundara-wellness'), year: 2025, tags: ['Instagram', 'Wellness', 'Retention'],
    featured: false, visibility: 'published', sortOrder: 10,
    platform: 'instagram', handle: '@sundara.wellness', campaignType: 'Brand & Retention',
    metrics: [
      { label: 'Retention', value: '92%', trend: 'up' },
      { label: 'Referrals', value: '+140', trend: 'up' },
    ],
    campaignUrl: null,
  },
  {
    kind: 'social', slug: 'drift-eyewear-drop', title: 'Drift Eyewear — DTC Drop', client: 'Drift Eyewear',
    summary: 'A hype-cycle content plan for a limited eyewear run that cleared inventory in a weekend.',
    coverImageUrl: cover('drift-eyewear-drop'), year: 2025, tags: ['TikTok', 'DTC', 'Launch'],
    featured: false, visibility: 'published', sortOrder: 11,
    platform: 'tiktok', handle: '@drift.eyewear', campaignType: 'Product Drop',
    metrics: [
      { label: 'Views', value: '6.7M', trend: 'up' },
      { label: 'Sell-through', value: '100%', trend: 'up' },
      { label: 'AOV', value: '+18%', trend: 'up' },
    ],
    campaignUrl: null,
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// Division 02 — Software
// ─────────────────────────────────────────────────────────────────────────────
const software: Seed[] = [
  {
    kind: 'software', slug: 'luxe-realty-platform', title: 'Luxe Realty Platform', client: 'Luxe Realty',
    summary: 'Full-stack property marketplace with 3D tours and an agent CRM.',
    coverImageUrl: cover('luxe-realty-platform'), year: 2025, tags: ['Web', 'Marketplace'],
    featured: true, visibility: 'published', sortOrder: 0,
    projectType: 'Real Estate Marketplace',
    description: 'Immersive 3D tours, map-based search, saved-search alerts, and an agent CRM with lead routing and analytics.',
    stack: ['React', 'Node', 'PostgreSQL', 'Three.js'],
    deliveryStatus: 'shipped', liveUrl: 'https://luxerealty.example.com',
    caseStudyUrl: 'https://bassera.agency/work/luxe-realty', repoUrl: null,
  },
  {
    kind: 'software', slug: 'paytrail-fintech-app', title: 'PayTrail', client: 'PayTrail',
    summary: 'Cross-border payments app with instant settlement and spend analytics.',
    coverImageUrl: cover('paytrail-fintech-app'), year: 2025, tags: ['Mobile', 'FinTech'],
    featured: false, visibility: 'published', sortOrder: 1,
    projectType: 'FinTech · Mobile',
    description: 'React Native app with biometric auth, multi-currency wallets, and a real-time ledger backed by an event-sourced core.',
    stack: ['React Native', 'TypeScript', 'NestJS', 'PostgreSQL', 'Redis'],
    deliveryStatus: 'private_beta', liveUrl: null, caseStudyUrl: null, repoUrl: null,
  },
  {
    kind: 'software', slug: 'atlas-analytics-dashboard', title: 'Atlas Analytics', client: 'Atlas',
    summary: 'Self-serve analytics dashboard for logistics fleets, updated in real time.',
    coverImageUrl: cover('atlas-analytics-dashboard'), year: 2024, tags: ['Web', 'Data', 'Dashboard'],
    featured: false, visibility: 'published', sortOrder: 2,
    projectType: 'Analytics Dashboard',
    description: 'Streaming telemetry from 4k+ vehicles into a columnar store, with a drag-and-drop report builder and shareable views.',
    stack: ['Next.js', 'Go', 'ClickHouse', 'Kafka'],
    deliveryStatus: 'in_progress', liveUrl: null,
    caseStudyUrl: 'https://bassera.agency/work/atlas-analytics', repoUrl: null,
  },
  {
    kind: 'software', slug: 'verdant-storefront', title: 'Verdant Storefront', client: 'Verdant',
    summary: 'Headless commerce storefront with sub-second navigation and a bespoke CMS.',
    coverImageUrl: cover('verdant-storefront'), year: 2025, tags: ['Web', 'E-commerce', 'Headless'],
    featured: true, visibility: 'published', sortOrder: 3,
    projectType: 'Headless E-commerce',
    description: 'Astro + edge rendering over a headless commerce API, with a custom merchandising CMS and A/B-tested checkout.',
    stack: ['Astro', 'TypeScript', 'GraphQL', 'Stripe', 'Cloudflare'],
    deliveryStatus: 'shipped', liveUrl: 'https://verdant.example.com',
    caseStudyUrl: null, repoUrl: null,
  },
  {
    kind: 'software', slug: 'cliniq-booking', title: 'CliniQ Booking', client: 'CliniQ',
    summary: 'Multi-clinic appointment platform with reminders, intake forms and billing.',
    coverImageUrl: cover('cliniq-booking'), year: 2024, tags: ['Web', 'Healthcare', 'Scheduling'],
    featured: false, visibility: 'published', sortOrder: 4,
    projectType: 'Healthcare Scheduling',
    description: 'Role-based scheduling across locations, SMS/email reminders, digital intake, and insurance-aware billing exports.',
    stack: ['React', 'Node', 'PostgreSQL', 'Twilio'],
    deliveryStatus: 'shipped', liveUrl: 'https://cliniq.example.com',
    caseStudyUrl: 'https://bassera.agency/work/cliniq', repoUrl: null,
  },
  {
    kind: 'software', slug: 'fleetwise-logistics', title: 'FleetWise', client: 'FleetWise',
    summary: 'Dispatch and maintenance platform for mid-size delivery fleets.',
    coverImageUrl: cover('fleetwise-logistics'), year: 2025, tags: ['Web', 'Logistics', 'Operations'],
    featured: false, visibility: 'published', sortOrder: 5,
    projectType: 'Fleet Operations',
    description: 'Live dispatch board, route optimisation, driver mobile app, and predictive maintenance alerts from vehicle telemetry.',
    stack: ['Vue', 'Python', 'FastAPI', 'PostgreSQL', 'Mapbox'],
    deliveryStatus: 'in_progress', liveUrl: null, caseStudyUrl: null, repoUrl: null,
  },
  {
    kind: 'software', slug: 'scholarly-lms', title: 'Scholarly LMS', client: 'Scholarly',
    summary: 'A learning platform for vocational academies with cohorts, grading and certificates.',
    coverImageUrl: cover('scholarly-lms'), year: 2024, tags: ['Web', 'EdTech', 'Platform'],
    featured: false, visibility: 'published', sortOrder: 6,
    projectType: 'Learning Platform',
    description: 'Cohort-based courses, assignment grading, discussion threads, and verifiable PDF certificates with an instructor analytics view.',
    stack: ['Next.js', 'tRPC', 'Prisma', 'PostgreSQL'],
    deliveryStatus: 'shipped', liveUrl: 'https://scholarly.example.com',
    caseStudyUrl: null, repoUrl: null,
  },
  {
    kind: 'software', slug: 'tablio-reservations', title: 'Tablio', client: 'Tablio',
    summary: 'Reservation and floor-management app for independent restaurant groups.',
    coverImageUrl: cover('tablio-reservations'), year: 2023, tags: ['Web', 'Mobile', 'Hospitality'],
    featured: false, visibility: 'published', sortOrder: 7,
    projectType: 'Reservations & Floor Management',
    description: 'Drag-to-seat floor plans, waitlist SMS, deposit handling, and a nightly service report emailed to owners.',
    stack: ['React', 'Node', 'PostgreSQL', 'Stripe'],
    deliveryStatus: 'shipped', liveUrl: 'https://tablio.example.com',
    caseStudyUrl: 'https://bassera.agency/work/tablio', repoUrl: null,
  },
  {
    kind: 'software', slug: 'hearth-smart-home', title: 'Hearth', client: 'Hearth',
    summary: 'A unified control dashboard for multi-vendor smart-home devices.',
    coverImageUrl: cover('hearth-smart-home'), year: 2025, tags: ['Web', 'IoT', 'Dashboard'],
    featured: false, visibility: 'published', sortOrder: 8,
    projectType: 'IoT · Web',
    description: 'Normalises device APIs into one control surface with scenes, automations, and an energy-usage timeline.',
    stack: ['SvelteKit', 'Rust', 'MQTT', 'TimescaleDB'],
    deliveryStatus: 'private_beta', liveUrl: null, caseStudyUrl: null, repoUrl: null,
  },
  {
    kind: 'software', slug: 'quanta-crm', title: 'Quanta CRM', client: 'Quanta',
    summary: 'A lightweight sales CRM for agencies — pipelines, proposals and retainers in one place.',
    coverImageUrl: cover('quanta-crm'), year: 2025, tags: ['Web', 'SaaS', 'CRM'],
    featured: false, visibility: 'published', sortOrder: 9,
    projectType: 'SaaS · CRM',
    description: 'Kanban pipelines, proposal builder with e-sign, recurring retainer invoicing, and a client portal.',
    stack: ['React', 'NestJS', 'PostgreSQL', 'Redis'],
    deliveryStatus: 'in_progress', liveUrl: null, caseStudyUrl: null, repoUrl: null,
  },
  {
    kind: 'software', slug: 'voyage-booking-engine', title: 'Voyage Booking Engine', client: 'Voyage',
    summary: 'A white-label booking engine powering several boutique travel brands.',
    coverImageUrl: cover('voyage-booking-engine'), year: 2024, tags: ['Web', 'Travel', 'Platform'],
    featured: false, visibility: 'published', sortOrder: 10,
    projectType: 'Booking Platform',
    description: 'Inventory sync across suppliers, multi-currency pricing rules, and a themeable checkout embeddable on any site.',
    stack: ['Next.js', 'Node', 'PostgreSQL', 'Elasticsearch'],
    deliveryStatus: 'shipped', liveUrl: 'https://voyage.example.com',
    caseStudyUrl: null, repoUrl: null,
  },
  {
    kind: 'software', slug: 'artery-design-system', title: 'Artery Design System', client: 'Artery',
    summary: 'A themeable React component library and token pipeline for a product suite.',
    coverImageUrl: cover('artery-design-system'), year: 2024, tags: ['Frontend', 'Design System', 'Tooling'],
    featured: false, visibility: 'published', sortOrder: 11,
    projectType: 'Design System',
    description: '60+ accessible components, design tokens synced from Figma, visual regression tests, and versioned docs.',
    stack: ['React', 'TypeScript', 'Storybook', 'Style Dictionary'],
    deliveryStatus: 'shipped', liveUrl: null,
    caseStudyUrl: null, repoUrl: 'https://github.com/example/artery',
  },
]

const projects: Seed[] = [...social, ...software]

// ─────────────────────────────────────────────────────────────────────────────
// Homepage content — testimonials + "How We Work" steps.
// These seed ONLY when their table is empty, so re-running never clobbers edits.
// ─────────────────────────────────────────────────────────────────────────────
const TESTIMONIALS: Prisma.TestimonialCreateManyInput[] = [
  {
    quote: 'Bassera completely transformed our digital presence. The attention to detail in every pixel is remarkable.',
    authorName: 'Amira Chikh', authorTitle: 'CEO', company: 'Nexara',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&h=120&q=80&fit=crop&crop=face',
    visibility: 'published', sortOrder: 0,
  },
  {
    quote: 'Working with the Bassera team felt seamless. They understood our vision faster than we could articulate it.',
    authorName: 'Mehdi Larbi', authorTitle: 'Founder', company: 'Orbify',
    avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&h=120&q=80&fit=crop&crop=face',
    visibility: 'published', sortOrder: 1,
  },
  {
    quote: 'The brand identity they created has become our strongest asset. Clients mention it in every first meeting.',
    authorName: 'Lina Bourkia', authorTitle: 'CMO', company: 'VaultX',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&h=120&q=80&fit=crop&crop=face',
    visibility: 'published', sortOrder: 2,
  },
  {
    quote: 'Bassera exceeded our expectations in every way. The website design is sleek, fast, and brings us constant leads.',
    authorName: 'Sofia Rahmani', authorTitle: 'Marketing Director', company: 'CrestAI',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&q=80&fit=crop&crop=face',
    visibility: 'published', sortOrder: 3,
  },
  {
    quote: 'Their team has a rare combination of artistic vision and robust development skills. Strongly recommended.',
    authorName: 'Yacine Belkacem', authorTitle: 'CTO', company: 'Lumino',
    avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&h=120&q=80&fit=crop&crop=face',
    visibility: 'published', sortOrder: 4,
  },
]

const PROCESS_STEPS: Prisma.ProcessStepCreateManyInput[] = [
  { step: '01', title: 'Discover', icon: 'search',
    description: 'Deep dive into your brand, goals, audience, and competitive landscape.',
    visibility: 'published', sortOrder: 0 },
  { step: '02', title: 'Strategy', icon: 'strategy',
    description: 'Define scope, KPIs, information architecture, and creative direction.',
    visibility: 'published', sortOrder: 1 },
  { step: '03', title: 'Design', icon: 'design',
    description: 'High-fidelity mockups and interactive prototypes, refined through feedback loops.',
    visibility: 'published', sortOrder: 2 },
  { step: '04', title: 'Build', icon: 'build',
    description: 'Clean, performant code with rigorous QA across devices and browsers.',
    visibility: 'published', sortOrder: 3 },
  { step: '05', title: 'Launch', icon: 'launch',
    description: 'Staged deployment, analytics setup, and post-launch performance monitoring.',
    visibility: 'published', sortOrder: 4 },
]

async function main() {
  if (process.argv.includes('--reset')) {
    const { count } = await prisma.project.deleteMany({})
    await prisma.testimonial.deleteMany({})
    await prisma.processStep.deleteMany({})
    console.log(`[seed] --reset: cleared ${count} projects + testimonials + process steps`)
  }

  for (const p of projects) {
    await prisma.project.upsert({ where: { slug: p.slug }, update: p, create: p })
    console.log(`[seed] upserted ${p.kind.padEnd(8)} ${p.slug}`)
  }

  // Site content singleton — ensure the row exists (schema defaults fill it).
  const site = await prisma.siteContent.upsert({
    where: { id: 'singleton' },
    update: {},
    create: { id: 'singleton' },
  })
  if (!site.facebookUrl && !site.instagramUrl) {
    await prisma.siteContent.update({
      where: { id: 'singleton' },
      data: {
        facebookUrl: 'https://web.facebook.com/profile.php?id=61590574076844',
        instagramUrl: 'https://www.instagram.com/baseera.agency/',
      },
    })
    console.log('[seed] site content row + social links set')
  } else {
    console.log('[seed] site content row ensured')
  }

  if ((await prisma.testimonial.count()) === 0) {
    await prisma.testimonial.createMany({ data: TESTIMONIALS })
    console.log(`[seed] inserted ${TESTIMONIALS.length} testimonials`)
  } else {
    console.log('[seed] testimonials already present — left untouched')
  }

  if ((await prisma.processStep.count()) === 0) {
    await prisma.processStep.createMany({ data: PROCESS_STEPS })
    console.log(`[seed] inserted ${PROCESS_STEPS.length} process steps`)
  } else {
    console.log('[seed] process steps already present — left untouched')
  }

  const [total, pub, soc, sof] = await Promise.all([
    prisma.project.count(),
    prisma.project.count({ where: { visibility: 'published' } }),
    prisma.project.count({ where: { kind: 'social' } }),
    prisma.project.count({ where: { kind: 'software' } }),
  ])
  console.log(`[seed] done — ${total} projects (${pub} published · ${soc} social · ${sof} software)`)
}

main()
  .then(() => prisma.$disconnect())
  .catch(async err => {
    console.error(err)
    await prisma.$disconnect()
    process.exit(1)
  })
