import type { APIRoute } from 'astro';
import { CompositionService } from '@/lib/services/composition.service';
import {
  compositionIdValidator,
  updateCompositionValidator,
} from '@/lib/validators/composition.validators';
import { ForbiddenError, NotFoundError } from '@/lib/errors';
import { DEFAULT_USER_ID } from '@/db/supabase.client';

export const prerender = false;

export const PATCH: APIRoute = async ({ params, request, locals }) => {
  const supabase = locals.supabase;
  const compositionService = new CompositionService(supabase);
  
  // Use hardcoded user ID for development
  const userId = DEFAULT_USER_ID;

  // 1. Validate composition_id from URL
  const idValidationResult = compositionIdValidator.safeParse(
    params.composition_id,
  );
  if (!idValidationResult.success) {
    return new Response(
      JSON.stringify({
        error: 'Invalid composition ID format. Must be a positive integer.',
        details: idValidationResult.error.flatten(),
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }
  const compositionId = idValidationResult.data;

  // 2. Validate request body
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Invalid JSON body.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const bodyValidationResult = updateCompositionValidator.safeParse(body);
  if (!bodyValidationResult.success) {
    return new Response(
      JSON.stringify({
        error: 'Invalid request body.',
        details: bodyValidationResult.error.flatten(),
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }
  const updateData = bodyValidationResult.data;

  try {
    // 3. Call the service to update the composition
    const updatedComposition = await compositionService.updateComposition(
      compositionId,
      userId,
      updateData,
    );

    // 4. Return success response
    return new Response(JSON.stringify(updatedComposition), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    // 5. Handle specific errors from the service layer
    if (error instanceof NotFoundError) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (error instanceof ForbiddenError) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 6. Handle generic server errors
    console.error('Error updating composition:', error);
    return new Response(
      JSON.stringify({ error: 'An internal server error occurred.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
};

export const GET: APIRoute = async ({ params, locals }) => {
  const supabase = locals.supabase;
  const compositionService = new CompositionService(supabase);

  // 1. Validate composition_id from URL
  const validationResult = compositionIdValidator.safeParse(
    params.composition_id,
  );
  if (!validationResult.success) {
    return new Response(
      JSON.stringify({
        error: 'Invalid composition ID format. Must be a positive integer.',
        details: validationResult.error.flatten(),
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const compositionId = validationResult.data;

  try {
    // 2. Fetch the composition using the service
    const composition =
      await compositionService.getCompositionById(compositionId);

    // 3. Handle 'not found' case
    if (!composition) {
      return new Response(
        JSON.stringify({
          error: `Composition with ID ${compositionId} not found.`,
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // 4. Return success response
    return new Response(JSON.stringify(composition), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    // 5. Handle unexpected server errors
    console.error('Error fetching composition:', error);
    return new Response(
      JSON.stringify({ error: 'An internal server error occurred.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
};

export const DELETE: APIRoute = async ({ params, locals }) => {
  const supabase = locals.supabase;
  const compositionService = new CompositionService(supabase);

  // Use hardcoded user ID for development
  const userId = DEFAULT_USER_ID;

  // 1. Validate composition_id from URL
  const idValidationResult = compositionIdValidator.safeParse(
    params.composition_id,
  );
  if (!idValidationResult.success) {
    return new Response(
      JSON.stringify({
        error: 'Invalid composition ID format. Must be a positive integer.',
        details: idValidationResult.error.flatten(),
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }
  const compositionId = idValidationResult.data;

  try {
    // 2. Call the service to delete the composition
    await compositionService.deleteComposition(compositionId, userId);

    // 3. Return success response (204 No Content)
    return new Response(null, { status: 204 });
  } catch (error) {
    // 4. Handle specific errors from the service layer
    if (error instanceof NotFoundError) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (error instanceof ForbiddenError) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 5. Handle generic server errors
    console.error('Error deleting composition:', error);
    return new Response(
      JSON.stringify({ error: 'An internal server error occurred.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
}; 