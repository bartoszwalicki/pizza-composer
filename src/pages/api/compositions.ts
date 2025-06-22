import type { APIRoute } from 'astro';
import { z, ZodError } from 'zod';
import { CompositionService } from '@/lib/services/composition.service';
import { DEFAULT_USER_ID } from '@/db/supabase.client';
import { getCompositionsQueryValidator } from '@/lib/validators/composition.validators';

export const prerender = false;

export const GET: APIRoute = async ({ locals, url }) => {
  const { supabase } = locals;
  // Use hardcoded user ID for development
  const userId = DEFAULT_USER_ID;

  try {
    const queryParams = Object.fromEntries(url.searchParams.entries());
    const validatedParams = getCompositionsQueryValidator.parse(queryParams);

    const compositionService = new CompositionService(supabase);
    const result = await compositionService.getUserCompositions(
      userId,
      validatedParams,
    );

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return new Response(
        JSON.stringify({
          message: 'Bad Request: Invalid query parameters.',
          errors: error.flatten().fieldErrors,
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    console.error('Error in GET /api/compositions:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'An unexpected error occurred.';

    return new Response(
      JSON.stringify({
        message: 'Internal Server Error',
        error: errorMessage,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
};

const manualCompositionSchema = z.object({
  composition_type: z.literal('manual'),
  ingredients: z.array(z.string()).min(1).max(10),
  rating: z.number().int().min(1).max(6).nullable().optional(),
  photo_url: z.string().url().nullable().optional(),
});

const aiGeneratedCompositionSchema = z.object({
  composition_type: z.literal('ai-generated'),
  ingredients: z.array(z.string()).min(1).max(3),
  rating: z.number().int().min(1).max(6).nullable().optional(),
  photo_url: z.string().url().nullable().optional(),
});

const createCompositionSchema = z.discriminatedUnion('composition_type', [
  manualCompositionSchema,
  aiGeneratedCompositionSchema,
]);

export const POST: APIRoute = async ({ request, locals }) => {
  // Use hardcoded user ID for development
  const userId = DEFAULT_USER_ID;

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const validation = createCompositionSchema.safeParse(body);

  if (!validation.success) {
    return new Response(
      JSON.stringify({
        error: 'Invalid request body',
        details: validation.error.flatten(),
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    const compositionService = new CompositionService(locals.supabase);
    const newComposition = await compositionService.createComposition(
      validation.data,
      userId
    );

    return new Response(JSON.stringify(newComposition), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error creating composition:', error);
    // Basic error handling, can be expanded based on specific error types from the service
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred';

    // As per the plan, 503 for AI service issues
    if (errorMessage.includes('AI service')) { // Simple check
      return new Response(JSON.stringify({ error: 'Service Unavailable', details: errorMessage }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({ error: 'Internal Server Error', details: errorMessage }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}; 