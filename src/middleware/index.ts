import type { APIContext, MiddlewareNext } from 'astro';
import { defineMiddleware } from 'astro:middleware';

import { supabaseClient } from '../db/supabase.client';

export const onRequest = defineMiddleware((context: APIContext, next: MiddlewareNext) => {
  context.locals.supabase = supabaseClient;
  return next();
}); 