import type { APIRoute } from 'astro';
import { GenerationLogService } from '@/lib/services/generation-log.service';
import { getGenerationLogsValidator } from '@/lib/validators/log.validators';
import { DEFAULT_USER_ID } from '@/db/supabase.client';

export const prerender = false;

/**
 * API endpoint to fetch a paginated list of AI generation logs for the authenticated user.
 * It supports pagination and sorting via query parameters.
 */
export const GET: APIRoute = async ({ url, locals }) => {
  const supabase = locals.supabase;
  const logService = new GenerationLogService(supabase);

  // Use hardcoded user ID for development purposes
  const userId = DEFAULT_USER_ID;

  // 1. Parse and validate query parameters
  const queryParams = Object.fromEntries(url.searchParams.entries());
  const validationResult = getGenerationLogsValidator.safeParse(queryParams);

  if (!validationResult.success) {
    return new Response(
      JSON.stringify({
        error: 'Invalid query parameters.',
        details: validationResult.error.flatten(),
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const validatedParams = validationResult.data;

  try {
    // 2. Call the service to fetch logs
    const logsResponse = await logService.getLogsForUser(
      userId,
      validatedParams,
    );

    // 3. Return success response
    return new Response(JSON.stringify(logsResponse), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    // 4. Handle generic server errors from the service layer
    console.error('Error fetching generation logs:', error);
    return new Response(
      JSON.stringify({ error: 'An internal server error occurred.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
}; 