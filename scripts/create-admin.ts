/**
 * Create or reset a full-access (owner) account — like `createsuperuser`.
 *
 *   npm run create-admin -- --email you@example.com --password "YourStrongPass123" --name "Your Name"
 *
 * - If the email is new, it's created as role=owner, status=active (skips the
 *   normal pending/approval flow).
 * - If it already exists, its password is reset and it's promoted to
 *   owner/active. Any existing login sessions for that user are revoked.
 *
 * The password is read from the CLI only, never printed or logged.
 */
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function arg(flag: string): string | undefined {
  const i = process.argv.indexOf(flag)
  return i !== -1 ? process.argv[i + 1] : undefined
}

async function main() {
  const email = (arg('--email') ?? '').trim().toLowerCase()
  const password = arg('--password') ?? ''
  const name = (arg('--name') ?? '').trim() || email.split('@')[0] || 'Owner'

  const errors: string[] = []
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('--email must be a valid email address')
  if (password.length < 10 || password.length > 128) {
    errors.push('--password must be 10–128 characters')
  }
  if (errors.length) {
    console.error('Invalid arguments:\n  - ' + errors.join('\n  - '))
    console.error(
      '\nUsage:\n  npm run create-admin -- --email you@example.com --password "YourStrongPass123" --name "Your Name"',
    )
    process.exit(1)
  }

  const cost = Number.parseInt(process.env.BCRYPT_COST ?? '12', 10)
  const passwordHash = await bcrypt.hash(password, cost)

  const existing = await prisma.user.findUnique({ where: { email } })

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      role: 'owner',
      status: 'active',
      failedLogins: 0,
      lockedUntil: null,
    },
    create: {
      email,
      name,
      passwordHash,
      role: 'owner',
      requestedRole: 'owner',
      status: 'active',
    },
  })

  if (existing) {
    const { count } = await prisma.session.deleteMany({ where: { userId: user.id } })
    console.log(`↻ reset existing account (revoked ${count} session[s])`)
  }

  console.log(
    `✔ owner account ready\n` +
      `  email:  ${user.email}\n` +
      `  name:   ${user.name}\n` +
      `  role:   ${user.role}\n` +
      `  status: ${user.status}\n\n` +
      `Log in:  POST /api/auth/login  { "email": "${user.email}", "password": "<the password you just set>" }`,
  )
}

main()
  .then(() => prisma.$disconnect())
  .catch(async err => {
    console.error(err)
    await prisma.$disconnect()
    process.exit(1)
  })
