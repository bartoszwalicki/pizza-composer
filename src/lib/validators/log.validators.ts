import { z } from 'zod';

/**
 * Validator for the query parameters of the GET /api/generation-logs endpoint.
 *
 * - `page`: Coerces to a positive integer, defaults to 1.
 * - `pageSize`: Coerces to a positive integer, max 100, defaults to 10.
 * - `sortBy`: Must be 'generation_id' or 'generation_duration', defaults to 'generation_id'.
 * - `sortOrder`: Must be 'asc' or 'desc', defaults to 'desc'.
 */
export const getGenerationLogsValidator = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(10),
  sortBy: z
    .enum(['generation_id', 'generation_duration'])
    .default('generation_id'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
}); 