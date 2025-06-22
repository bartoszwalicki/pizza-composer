import type {
  CreateCompositionCommand,
  CompositionDto,
  GetCompositionsResponseDto,
  UpdateCompositionCommand,
} from '@/types';
import type { SupabaseClient } from '@/db/supabase.client';
import { AiGenerationService } from './ai.service';
import type { GetCompositionsQuery } from '../validators/composition.validators';
import { ForbiddenError, NotFoundError } from '../errors';

// This is the actual shape of the command coming from the API endpoint
type ApiCreateAiCompositionCommand = Omit<
  Extract<CreateCompositionCommand, { composition_type: 'ai-generated' }>,
  'generation_duration'
>;
type CreateManualCompositionCommand = Extract<
  CreateCompositionCommand,
  { composition_type: 'manual' }
>;

export class CompositionService {
  private supabase: SupabaseClient;
  private aiGenerationService: AiGenerationService;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
    this.aiGenerationService = new AiGenerationService();
  }

  public async updateComposition(
    compositionId: number,
    userId: string,
    command: UpdateCompositionCommand,
  ): Promise<CompositionDto> {
    // 1. First, verify the composition exists and belongs to the user.
    const { data: existingComposition, error: fetchError } = await this.supabase
      .from('compositions')
      .select('user_id')
      .eq('composition_id', compositionId)
      .single();

    if (fetchError || !existingComposition) {
      throw new NotFoundError(
        `Composition with ID ${compositionId} not found.`,
      );
    }

    if (existingComposition.user_id !== userId) {
      throw new ForbiddenError(
        'You are not authorized to update this composition.',
      );
    }

    // 2. If verification passes, perform the update.
    const { data: updatedComposition, error: updateError } =
      await this.supabase
        .from('compositions')
        .update(command)
        .eq('composition_id', compositionId)
        .select()
        .single();

    if (updateError) {
      // TODO: Add more specific error handling based on DB constraints
      console.error('Database error updating composition:', updateError);
      throw new Error(`Database error: ${updateError.message}`);
    }

    return updatedComposition;
  }

  public async deleteComposition(
    compositionId: number,
    userId: string,
  ): Promise<void> {
    const { data: existingComposition, error: fetchError } = await this.supabase
      .from('compositions')
      .select('user_id')
      .eq('composition_id', compositionId)
      .single();

    if (fetchError || !existingComposition) {
      throw new NotFoundError(
        `Composition with ID ${compositionId} not found.`,
      );
    }

    if (existingComposition.user_id !== userId) {
      throw new ForbiddenError(
        'You are not authorized to delete this composition.',
      );
    }

    const { error: deleteError } = await this.supabase
      .from('compositions')
      .delete()
      .eq('composition_id', compositionId);

    if (deleteError) {
      console.error('Database error deleting composition:', deleteError);
      throw new Error(`Database error: ${deleteError.message}`);
    }
  }

  public async createComposition(
    command: CreateManualCompositionCommand | ApiCreateAiCompositionCommand,
    userId: string,
  ): Promise<CompositionDto> {
    if (command.composition_type === 'manual') {
      return this.createManualComposition(command, userId);
    } else {
      return this.createAiGeneratedComposition(command, userId);
    }
  }

  private async createManualComposition(
    command: CreateManualCompositionCommand,
    userId: string,
  ): Promise<CompositionDto> {
    const { error, data } = await this.supabase
      .from('compositions')
      .insert({
        ...command,
        user_id: userId,
      })
      .select()
      .single();

    if (error) {
      // TODO: Add more specific error handling if needed (e.g., for specific DB constraints)
      throw new Error(`Database error: ${error.message}`);
    }

    return data;
  }

  private async createAiGeneratedComposition(
    command: ApiCreateAiCompositionCommand,
    userId: string,
  ): Promise<CompositionDto> {
    try {
      const { suggested_ingredients, generation_duration_ms } =
        await this.aiGenerationService.generateIngredients(command.ingredients);

      // Step 1: Insert the new composition
      const { data: newComposition, error: compositionError } =
        await this.supabase
          .from('compositions')
          .insert({
            user_id: userId,
            ingredients: suggested_ingredients,
            rating: command.rating,
            photo_url: command.photo_url,
            composition_type: 'ai-generated',
          })
          .select()
          .single();

      if (compositionError) {
        throw new Error(
          `Database error on composition insert: ${compositionError.message}`,
        );
      }

      // Step 2: Insert the generation log
      const { error: logError } = await this.supabase
        .from('generation_log')
        .insert({
          user_id: userId,
          composition_id: newComposition.composition_id,
          generation_duration: `${generation_duration_ms}ms`, // Storing as interval or string as per DB schema
        });

      if (logError) {
        // As requested, not handling transactions yet.
        // In a real scenario, we might try to delete the created composition here.
        console.error(
          'Failed to write generation log, but composition was created.',
          {
            compositionId: newComposition.composition_id,
            error: logError.message,
          },
        );
        // We will still return the composition, as it was successfully created.
        // The endpoint will not know about this partial failure.
      }

      return newComposition;
    } catch (err) {
      if (err instanceof Error) {
        // Re-throw service-level errors to be handled by the API endpoint
        throw err;
      }
      throw new Error(
        'An unexpected error occurred during AI composition creation.',
      );
    }
  }

  public async getCompositionById(
    compositionId: number,
  ): Promise<CompositionDto | null> {
    const { data, error } = await this.supabase
      .from('compositions')
      .select()
      .eq('composition_id', compositionId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // This error code signifies that no single row was found.
        // This can occur if the ID doesn't exist or if RLS policy denies access.
        // In either scenario, returning null is appropriate for the service layer,
        // allowing the caller (API handler) to return a 404 response.
        return null;
      }
      // For other database-related errors, we should log them and propagate the exception.
      console.error('Database error fetching composition by ID:', error);
      throw new Error(error.message);
    }

    return data;
  }

  public async getUserCompositions(
    userId: string,
    params: GetCompositionsQuery,
  ): Promise<GetCompositionsResponseDto> {
    const { page, pageSize, sortBy, sortOrder, rating, composition_type } =
      params;

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = this.supabase
      .from('compositions')
      .select<'*', CompositionDto>('*', { count: 'exact' })
      .eq('user_id', userId);

    if (rating) {
      query = query.eq('rating', rating);
    }

    if (composition_type) {
      query = query.eq('composition_type', composition_type);
    }

    query = query
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(from, to);

    const { data, error, count } = await query;

    if (error) {
      // In a real app, you'd want to log this error to a monitoring service
      console.error('Error fetching compositions:', error);
      throw new Error('Could not fetch compositions. Please try again later.');
    }

    const totalItems = count ?? 0;
    const totalPages = Math.ceil(totalItems / pageSize);

    return {
      data: data || [],
      pagination: {
        page,
        pageSize,
        totalItems,
        totalPages,
      },
    };
  }
} 