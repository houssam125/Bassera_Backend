/**
 * Static metadata for the Capability resource, served at
 * `GET /api/capabilities/meta` so the dashboard form builds its selects
 * (division, icon, visibility) from the API rather than hardcoding them.
 *
 * `icons` are preset keys — the frontend maps each to a monochrome SVG that
 * inherits the division accent colour (see `CapabilityIcon` on the client).
 */
export const CAPABILITY_META = {
  divisions: ['social', 'software'],
  visibilities: ['draft', 'published'],
  icons: [
    'instagram',
    'chat',
    'megaphone',
    'chart',
    'send',
    'users',
    'calendar',
    'monitor',
    'mobile',
    'code',
    'cloud',
    'database',
    'pen',
    'layers',
    'search',
    'sparkles',
    'shield',
    'rocket',
  ],
} as const

export const CAPABILITY_ICONS = CAPABILITY_META.icons
export type CapabilityIconKey = (typeof CAPABILITY_ICONS)[number]
