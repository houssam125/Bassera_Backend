import { prisma } from '../../db/prisma'

export async function buildOverview(): Promise<Record<string, unknown>> {
  const [
    total,
    published,
    draft,
    social,
    software,
    featured,
    usersByStatus,
    usersTotal,
    recent,
    capTotal,
    capPublished,
    clientsTotal,
    clientsPublished,
    inquiriesTotal,
    inquiriesNew,
    testimonialsTotal,
    testimonialsPublished,
    processTotal,
    processPublished,
  ] = await Promise.all([
    prisma.project.count(),
    prisma.project.count({ where: { visibility: 'published' } }),
    prisma.project.count({ where: { visibility: 'draft' } }),
    prisma.project.count({ where: { kind: 'social' } }),
    prisma.project.count({ where: { kind: 'software' } }),
    prisma.project.count({ where: { featured: true } }),
    prisma.user.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.user.count(),
    prisma.project.findMany({
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
      take: 5,
      select: { id: true, title: true, kind: true, visibility: true, updatedAt: true },
    }),
    prisma.capability.count(),
    prisma.capability.count({ where: { visibility: 'published' } }),
    prisma.client.count(),
    prisma.client.count({ where: { visibility: 'published' } }),
    prisma.inquiry.count(),
    prisma.inquiry.count({ where: { status: 'new' } }),
    prisma.testimonial.count(),
    prisma.testimonial.count({ where: { visibility: 'published' } }),
    prisma.processStep.count(),
    prisma.processStep.count({ where: { visibility: 'published' } }),
  ])

  const userCount = (status: string): number =>
    usersByStatus.find(row => row.status === status)?._count._all ?? 0

  return {
    projects: { total, published, draft, social, software, featured },
    capabilities: { total: capTotal, published: capPublished },
    clients: { total: clientsTotal, published: clientsPublished },
    testimonials: { total: testimonialsTotal, published: testimonialsPublished },
    process: { total: processTotal, published: processPublished },
    inquiries: { total: inquiriesTotal, new: inquiriesNew },
    users: {
      total: usersTotal,
      pending: userCount('pending'),
      active: userCount('active'),
      suspended: userCount('suspended'),
      rejected: userCount('rejected'),
    },
    recent,
    generatedAt: new Date().toISOString(),
  }
}
