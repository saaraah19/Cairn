import { z } from 'zod'

// targetType is NOT part of this schema — it's determined by which route
// was hit (activity vs. comment), matching the two separate endpoints
// described in docs/08_COMMUNITY_PROPOSAL.md §7, not a single generic
// endpoint that trusts a client-supplied targetType.
export const createReportSchema = z.object({
  reason: z.enum(['spam', 'harassment', 'inappropriate_content', 'other']),
  details: z.string().trim().max(500, 'Details are limited to 500 characters.').optional(),
})
