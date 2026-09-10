export const PROJECT_META = {
  kinds: ['social', 'software'],
  socialPlatforms: ['instagram', 'tiktok', 'linkedin', 'youtube', 'x', 'facebook'],
  deliveryStatuses: ['shipped', 'in_progress', 'private_beta'],
  visibilities: ['draft', 'published'],
  metricTrends: ['up', 'down', 'flat'],
} as const

export const SOCIAL_PLATFORMS = PROJECT_META.socialPlatforms
export const DELIVERY_STATUSES = PROJECT_META.deliveryStatuses
export const METRIC_TRENDS = PROJECT_META.metricTrends
