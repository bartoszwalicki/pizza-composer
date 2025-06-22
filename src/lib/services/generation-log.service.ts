import type { z } from 'zod';
import type { SupabaseClient } from '@/db/supabase.client';
import type { getGenerationLogsValidator } from '../validators/log.validators';
import type { GenerationLogDto, GetGenerationLogsResponseDto } from '@/types';

// Infer the type from the Zod schema to ensure consistency
type GetLogsOptions = z.infer<typeof getGenerationLogsValidator>;

/**
 * Service class for handling business logic related to generation logs.
 */
export class GenerationLogService {
  /**
   * @param supabase The Supabase client instance for database interactions.
   */
  constructor(private supabase: SupabaseClient) {}

  /**
   * Fetches a paginated list of generation logs for a specific user.
   *
   * @param userId The ID of the user whose logs are to be fetched.
   * @param options The pagination and sorting options.
   * @returns A promise that resolves to the paginated list of logs.
   */
  async getLogsForUser(
    userId: string,
    options: GetLogsOptions,
  ): Promise<GetGenerationLogsResponseDto> {
    const { page, pageSize, sortBy, sortOrder } = options;
    const offset = (page - 1) * pageSize;

    // Fetch logs from the database
    const { data, error, count } = await this.supabase
      .from('generation_log')
      .select('generation_id, user_id, composition_id, generation_duration', {
        count: 'exact',
      })
      .eq('user_id', userId)
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(offset, offset + pageSize - 1);

    if (error) {
      console.error('Error fetching generation logs:', error);
      // In a real application, you might use a more sophisticated logger
      throw new Error('Failed to fetch generation logs due to a database error.');
    }

    const totalItems = count ?? 0;
    const totalPages = Math.ceil(totalItems / pageSize);

    // Transform data to match the DTO, ensuring generation_duration is a string.
    // The underlying DB type is `unknown`, so we perform a safe cast.
    const transformedData: GenerationLogDto[] =
      data?.map(log => ({
        generation_id: log.generation_id,
        user_id: log.user_id,
        composition_id: log.composition_id,
        generation_duration: String(log.generation_duration),
      })) ?? [];

    return {
      data: transformedData,
      pagination: {
        page,
        pageSize,
        totalItems,
        totalPages,
      },
    };
  }
} 