import type {
  Tables,
  TablesInsert,
  TablesUpdate,
  Enums,
} from './db/database.types';

// Base DTO for a Composition, directly mapping to the database 'compositions' table row.
export type CompositionDto = Tables<'compositions'>;

// --- Create Composition ---

/**
 * Base properties for creating a pizza composition, shared between manual and AI-generated types.
 * 'ingredients' is always required.
 * 'rating' and 'photo_url' are optional as per the API plan for the request body.
 */
interface CreateCompositionCommandBase {
  ingredients: TablesInsert<'compositions'>['ingredients'];
  rating?: TablesInsert<'compositions'>['rating'];
  photo_url?: TablesInsert<'compositions'>['photo_url'];
}

/**
 * Command model for creating a manual pizza composition.
 * 'generation_duration' is not applicable for manual compositions and can be omitted or explicitly null.
 */
interface CreateManualCompositionCommand extends CreateCompositionCommandBase {
  composition_type: Extract<Enums<'composition_type_enum'>, 'manual'>;
  generation_duration?: null;
}

/**
 * Command model for creating an AI-generated pizza composition.
 * 'generation_duration' (e.g., "PT2M3S") is required for AI-generated compositions.
 */
interface CreateAiCompositionCommand extends CreateCompositionCommandBase {
  composition_type: Extract<Enums<'composition_type_enum'>, 'ai-generated'>;
  generation_duration: string; // API Plan: ISO 8601 duration string
}

/**
 * Command model for POST /api/compositions.
 * This is a discriminated union based on 'composition_type'.
 * This ensures 'generation_duration' is correctly typed: required for 'ai-generated'
 * compositions and optional/null for 'manual' ones, aligning with the API plan.
 */
export type CreateCompositionCommand =
  | CreateManualCompositionCommand
  | CreateAiCompositionCommand;

// --- Get Compositions (Paginated) ---

/**
 * Structure for pagination information, used in API responses that return paginated lists.
 */
export interface PaginationInfo {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

/**
 * Response DTO for GET /api/compositions.
 * Contains a list of compositions belonging to the user and pagination details.
 */
export interface GetCompositionsResponseDto {
  data: CompositionDto[];
  pagination: PaginationInfo;
}

// --- Update Composition ---

/**
 * Command model for PATCH /api/compositions/{composition_id}.
 * Allows partial updates to a composition's 'ingredients', 'rating', or 'photo_url'.
 * Fields are derived from 'TablesUpdate' to ensure they are optional and correctly typed
 * (e.g., allowing null where the database field is nullable).
 */
export type UpdateCompositionCommand = Partial<
  Pick<TablesUpdate<'compositions'>, 'ingredients' | 'rating' | 'photo_url'>
>;

// --- AI Composition Generation ---

/**
 * Command model for POST /api/compositions/ai-generate.
 * Contains the base ingredients provided by the user for AI to generate suggestions.
 */
export interface AiGenerateCommand {
  base_ingredients: string[]; // API Plan: Array of 1 to 3 strings
}

/**
 * Response DTO for POST /api/compositions/ai-generate.
 * Contains AI-suggested ingredients and the duration of the AI generation process.
 */
export interface AiGenerateResponseDto {
  suggested_ingredients: string[]; // API Plan: Max 10 ingredients
  generation_duration_ms: number; // API Plan: Duration in milliseconds
}

// --- Generation Log ---

/**
 * DTO for an individual generation log entry, as returned by GET /api/generation-logs.
 */
export interface GenerationLogDto
  extends Pick<
    Tables<'generation_log'>,
    'generation_id' | 'user_id' | 'composition_id'
  > {
  /**
   * Duration of the AI generation process (e.g., "PT2M3.5S" or total milliseconds).
   * This reflects the API contract. Note: The underlying 'generation_duration' type in
   * 'generation_log' table from 'database.types.ts' is 'unknown'. The service layer
   * is responsible for handling the transformation between this string DTO type and the database.
   */
  generation_duration: string;
}

/**
 * Response DTO for GET /api/generation-logs.
 * Contains a list of AI composition generation logs for the user and pagination details.
 */
export interface GetGenerationLogsResponseDto {
  data: GenerationLogDto[];
  pagination: PaginationInfo;
} 