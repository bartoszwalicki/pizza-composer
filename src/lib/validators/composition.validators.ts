import { z } from 'zod';

export const getCompositionsQueryValidator = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(10),
    sortBy: z
      .enum(['created_at', 'rating'])
      .default('created_at'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
    rating: z.coerce.number().int().min(1).max(6).optional(),
    composition_type: z.enum(['manual', 'ai-generated']).optional(),
  })
  .strict();

export type GetCompositionsQuery = z.infer<typeof getCompositionsQueryValidator>;

export const compositionIdValidator = z.coerce.number().int().positive();

export const updateCompositionValidator = z
  .object({
    ingredients: z.string().array().max(10, {message: "A maximum of 10 ingredients is allowed."}).optional(),
    rating: z.number().int().min(1).max(6).optional(),
    photo_url: z.string().url({ message: 'Invalid URL format.' }).optional(),
  })
  .partial()
  .refine(
    (data) => Object.keys(data).length > 0,
    { message: 'Request body must not be empty.' }
  ); 