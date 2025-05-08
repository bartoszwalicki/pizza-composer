# REST API Plan

## 1. Resources

-   **Compositions**: Represents a pizza composition.
    -   Corresponds to the `compositions` table in the database.
-   **Users**: Represents application users.
    -   Primarily managed by Supabase Auth. The API interacts with user-related data like counters (`composition_generated_count`, `photo_uploaded_count`) which are fields in the `users` table.
-   **GenerationLog**: Logs details of AI-generated compositions.
    -   Corresponds to the `generation_log` table. Entries are created internally when an AI-generated composition is saved.

## 2. Endpoints

All endpoints requiring authentication expect a Supabase JWT in the `Authorization: Bearer <token>` header. The `user_id` is derived from this token server-side.

### 2.1 Compositions Resource

#### 2.1.1 Create a new composition (manual or AI-generated)
-   **Method**: `POST`
-   **Path**: `/api/compositions`
-   **Description**: Creates a new pizza composition. If `composition_type` is `ai-generated`, it also logs the generation event and increments the user's AI generation counter.
-   **Request Body**:
    ```json
    {
        "ingredients": ["string"], // Array of strings, max 10 items
        "composition_type": "manual" | "ai-generated",
        "rating": null | integer, // Optional: 1-6
        "photo_url": null | "string", // Optional: URL to the photo
        "generation_duration": null | "string" // Optional: ISO 8601 duration, e.g., "PT2M3S". Required if composition_type is "ai-generated"
    }
    ```
-   **Response Body (Success)**:
    ```json
    {
        "composition_id": integer,
        "user_id": "uuid",
        "ingredients": ["string"],
        "rating": integer | null,
        "composition_type": "manual" | "ai-generated",
        "created_at": "timestampz",
        "photo_url": "string" | null
    }
    ```
-   **Success Codes**:
    -   `201 Created`: Composition created successfully.
-   **Error Codes**:
    -   `400 Bad Request`: Invalid input (e.g., more than 10 ingredients, invalid rating, missing `generation_duration` for AI type).
    -   `401 Unauthorized`: Authentication token missing or invalid.
    -   `500 Internal Server Error`: Unexpected server error.

#### 2.1.2 Get all compositions for the authenticated user
-   **Method**: `GET`
-   **Path**: `/api/compositions`
-   **Description**: Retrieves a list of compositions belonging to the authenticated user. Supports pagination, filtering, and sorting.
-   **Query Parameters**:
    -   `page` (integer, optional, default: 1): Page number for pagination.
    -   `pageSize` (integer, optional, default: 10): Number of items per page.
    -   `sortBy` (string, optional, default: `created_at`): Field to sort by (e.g., `created_at`, `rating`).
    -   `sortOrder` (string, optional, default: `desc`): `asc` or `desc`.
    -   `rating` (integer, optional): Filter by specific rating (1-6).
    -   `composition_type` (string, optional): Filter by `manual` or `ai-generated`.
-   **Response Body (Success)**:
    ```json
    {
        "data": [
            {
                "composition_id": integer,
                "user_id": "uuid",
                "ingredients": ["string"],
                "rating": integer | null,
                "composition_type": "manual" | "ai-generated",
                "created_at": "timestampz",
                "photo_url": "string" | null
            }
        ],
        "pagination": {
            "page": integer,
            "pageSize": integer,
            "totalItems": integer,
            "totalPages": integer
        }
    }
    ```
-   **Success Codes**:
    -   `200 OK`: Compositions retrieved successfully.
-   **Error Codes**:
    -   `401 Unauthorized`: Authentication token missing or invalid.
    -   `500 Internal Server Error`: Unexpected server error.

#### 2.1.3 Get a specific composition
-   **Method**: `GET`
-   **Path**: `/api/compositions/{composition_id}`
-   **Description**: Retrieves a single composition by its ID. User must own the composition (enforced by RLS).
-   **Response Body (Success)**:
    ```json
    {
        "composition_id": integer,
        "user_id": "uuid",
        "ingredients": ["string"],
        "rating": integer | null,
        "composition_type": "manual" | "ai-generated",
        "created_at": "timestampz",
        "photo_url": "string" | null
    }
    ```
-   **Success Codes**:
    -   `200 OK`: Composition retrieved successfully.
-   **Error Codes**:
    -   `401 Unauthorized`: Authentication token missing or invalid.
    -   `403 Forbidden`: User does not have access to this composition.
    -   `404 Not Found`: Composition not found.
    -   `500 Internal Server Error`: Unexpected server error.

#### 2.1.4 Update a specific composition (e.g., ingredients, rating, photo URL)
-   **Method**: `PATCH`
-   **Path**: `/api/compositions/{composition_id}`
-   **Description**: Partially updates a composition (e.g., its rating or photo URL). User must own the composition. If `photo_url` is updated, increments user's photo upload counter.
-   **Request Body**:
    ```json
    {
        "ingredients": ["string"], // Optional: Array of strings, max 10 items
        "rating": integer, // Optional: 1-6
        "photo_url": "string" // Optional: URL to the photo
    }
    ```
-   **Response Body (Success)**:
    ```json
    {
        "composition_id": integer,
        "user_id": "uuid",
        "ingredients": ["string"],
        "rating": integer | null,
        "composition_type": "manual" | "ai-generated", // Not updatable via this endpoint directly
        "created_at": "timestampz",
        "photo_url": "string" | null
    }
    ```
-   **Success Codes**:
    -   `200 OK`: Composition updated successfully.
-   **Error Codes**:
    -   `400 Bad Request`: Invalid input (e.g., more than 10 ingredients, invalid rating).
    -   `401 Unauthorized`: Authentication token missing or invalid.
    -   `403 Forbidden`: User does not have access to this composition.
    -   `404 Not Found`: Composition not found.
    -   `500 Internal Server Error`: Unexpected server error.

#### 2.1.5 Delete a specific composition
-   **Method**: `DELETE`
-   **Path**: `/api/compositions/{composition_id}`
-   **Description**: Deletes a composition by its ID. User must own the composition.
-   **Response Body (Success)**: None (Empty body)
-   **Success Codes**:
    -   `204 No Content`: Composition deleted successfully.
-   **Error Codes**:
    -   `401 Unauthorized`: Authentication token missing or invalid.
    -   `403 Forbidden`: User does not have access to this composition.
    -   `404 Not Found`: Composition not found.
    -   `500 Internal Server Error`: Unexpected server error.

### 2.2 AI Composition Generation

#### 2.2.1 Generate pizza composition suggestions using AI
-   **Method**: `POST`
-   **Path**: `/api/compositions/ai-generate`
-   **Description**: Takes 1-3 base ingredients and returns AI-generated pizza ingredient suggestions. This endpoint itself does not save the composition or log generation; that occurs when the user accepts and saves via `POST /api/compositions`.
-   **Request Body**:
    ```json
    {
        "base_ingredients": ["string"] // Array of 1 to 3 strings
    }
    ```
-   **Response Body (Success)**:
    ```json
    {
        "suggested_ingredients": ["string"], // Max 10 ingredients, ordered
        "generation_duration_ms": integer // Duration of the AI call in milliseconds, for client to pass to POST /compositions
    }
    ```
-   **Success Codes**:
    -   `200 OK`: Suggestions generated successfully.
-   **Error Codes**:
    -   `400 Bad Request`: Invalid input (e.g., incorrect number of base ingredients).
    -   `401 Unauthorized`: Authentication token missing or invalid.
    -   `500 Internal Server Error`: AI service error or other unexpected server error.
    -   `503 Service Unavailable`: AI service is temporarily unavailable.

### 2.3 GenerationLog Resource

#### 2.3.1 Get all generation logs for the authenticated user
-   **Method**: `GET`
-   **Path**: `/api/generation-logs`
-   **Description**: Retrieves a paginated list of AI composition generation logs belonging to the authenticated user.
-   **Query Parameters**:
    -   `page` (integer, optional, default: 1): Page number for pagination.
    -   `pageSize` (integer, optional, default: 10): Number of items per page.
    -   `sortBy` (string, optional, default: `generation_id`): Field to sort by (e.g., `generation_id`, `generation_duration`).
    -   `sortOrder` (string, optional, default: `desc`): `asc` or `desc`.
-   **Response Body (Success)**:
    ```json
    {
        "data": [
            {
                "generation_id": integer,
                "user_id": "uuid", // Matches authenticated user
                "composition_id": integer,
                "generation_duration": "string" // e.g., "PT2M3.5S" or total milliseconds
            }
        ],
        "pagination": {
            "page": integer,
            "pageSize": integer,
            "totalItems": integer,
            "totalPages": integer
        }
    }
    ```
-   **Success Codes**:
    -   `200 OK`: Generation logs retrieved successfully.
-   **Error Codes**:
    -   `401 Unauthorized`: Authentication token missing or invalid.
    -   `500 Internal Server Error`: Unexpected server error.

## 3. Authentication and Authorization

-   **Authentication**:
    -   Handled by Supabase Auth. Clients must obtain a JWT by signing up/logging in using Supabase client SDKs.
    -   All protected API endpoints (all listed endpoints unless specified otherwise) require this JWT to be passed in the `Authorization: Bearer <TOKEN>` header.
-   **Authorization**:
    -   Row-Level Security (RLS) is enabled on the `compositions` table in PostgreSQL, as defined in `db-plan.md`.
    -   The policy `user_isolation ON compositions USING (user_id = current_setting('app.current_user'))` ensures that users can only access and modify their own compositions.
    -   Similarly, RLS should be enabled on the `generation_log` table to ensure users can only view their own logs. A suitable policy would be:
        ```sql
        CREATE POLICY user_can_view_own_generation_logs ON generation_log
            FOR SELECT
            USING (user_id = current_setting('app.current_user'));
        ALTER TABLE generation_log ENABLE ROW LEVEL SECURITY;
        ```
    -   The API backend (Astro API routes) will use the Supabase Admin SDK or pass the user's JWT to Supabase to correctly set the `app.current_user` session variable for RLS to take effect for both `compositions` and `generation_log` tables.

## 4. Validation and Business Logic

### 4.1 Validation Rules
-   **Compositions**:
    -   `ingredients`: Must be an array of strings. Maximum of 10 ingredients. (Validated at `POST /api/compositions`, `PATCH /api/compositions/{id}`)
    -   `rating`: Must be an integer between 1 and 6 (inclusive), if provided. (Validated at `POST /api/compositions`, `PATCH /api/compositions/{id}`)
    -   `composition_type`: Must be either `manual` or `ai-generated`. (Validated at `POST /api/compositions`)
    -   `generation_duration`: Required if `composition_type` is `ai-generated`. Must be a valid ISO 8601 duration string or an integer representing milliseconds. (Validated at `POST /api/compositions`)
-   **AI Generation**:
    -   `base_ingredients`: Must be an array of 1 to 3 strings. (Validated at `POST /api/compositions/ai-generate`)

### 4.2 Business Logic Implementation
-   **AI Composition Generation & Logging**:
    1.  Client calls `POST /api/compositions/ai-generate` with 1-3 base ingredients.
    2.  API contacts the external AI service (e.g., Openrouter.ai).
    3.  API returns suggested ingredients (max 10) and the duration of the AI call.
    4.  User reviews suggestions. If accepted, client calls `POST /api/compositions` with:
        -   `ingredients`: The suggested (or modified) list.
        -   `composition_type`: `ai-generated`.
        -   `generation_duration`: The duration returned by the AI generation endpoint.
    5.  The `POST /api/compositions` endpoint then:
        -   Saves the composition to the `compositions` table.
        -   Creates an entry in the `generation_log` table (linking `user_id`, new `composition_id`, and `generation_duration`).
        -   Increments the `composition_generated_count` in the `users` table for the authenticated user.
-   **Manual Composition Creation**:
    1.  Client calls `POST /api/compositions` with `ingredients` and `composition_type: 'manual'`.
    2.  API saves the composition.
-   **Photo Upload**:
    1.  PRD: "Zdjęcia są przechowywane w Supabase Storage". Client uploads photo directly to Supabase Storage using Supabase client SDK.
    2.  Client obtains the public URL or storage path of the uploaded photo.
    3.  Client calls `PATCH /api/compositions/{composition_id}` with the `photo_url`.
    4.  The API updates the `compositions` table with the `photo_url`.
    5.  The API increments the `photo_uploaded_count` in the `users` table for the authenticated user.
    6.  Photo size (2.5MB) and resolution (2000x2000px) constraints:
        -   Size can be enforced by Supabase Storage bucket policies.
        -   Resolution should ideally be checked client-side before upload, or server-side if files were proxied (not the current design).
-   **User Counters**:
    -   `composition_generated_count`: Incremented automatically by the API when a composition with `type: 'ai-generated'` is successfully saved via `POST /api/compositions`.
    -   `photo_uploaded_count`: Incremented automatically by the API when a `photo_url` is successfully added/updated for a composition via `PATCH /api/compositions/{composition_id}`.
-   **Rate Limiting**:
    -   Consider implementing rate limiting on API endpoints (especially `/api/compositions/ai-generate` and authentication endpoints) to prevent abuse. This can be done using Astro middleware or a reverse proxy / API gateway. (Not detailed in PRD but a standard best practice).
-   **Pagination and Filtering**:
    -   The `GET /api/compositions` endpoint supports pagination, sorting, and filtering to allow efficient data retrieval. 