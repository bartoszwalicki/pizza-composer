# REST API Plan

## 1. Resources

-   **Users**: Represents application users. Primarily managed by Supabase Auth, but API provides an endpoint for user details including counters.
    -   Corresponds to `users` table (partially, as Supabase Auth manages core user data).
-   **Compositions**: Represents pizza compositions created by users, either manually or AI-generated.
    -   Corresponds to `compositions` table.
-   **AI Suggestions**: A non-persistent resource representing AI-generated pizza composition suggestions.
    -   Does not directly map to a persistent DB table but triggers logic involving external AI and potential creation of `generation_log` upon composition saving.

## 2. Endpoints

### 2.1 Users

#### `GET /users/me`

-   **Description**: Retrieves the profile information of the currently authenticated user, including their ID, email, registration date, and counters for generated compositions and uploaded photos.
-   **HTTP Method**: `GET`
-   **URL Path**: `/api/users/me`
-   **Query Parameters**: None
-   **Request Payload**: None
-   **Response Payload (JSON)**:
    ```json
    {
      "id": "uuid",
      "email": "user@example.com",
      "registration_date": "YYYY-MM-DDTHH:mm:ss.sssZ",
      "composition_generated_count": 0,
      "photo_uploaded_count": 0
    }
    ```
-   **Success Codes**:
    -   `200 OK`: User profile retrieved successfully.
-   **Error Codes**:
    -   `401 Unauthorized`: If the user is not authenticated.
    -   `404 Not Found`: If the authenticated user's profile cannot be found (should not generally occur if authenticated).
    -   `500 Internal Server Error`: Server-side error.

### 2.2 Compositions

#### `POST /compositions`

-   **Description**: Creates a new pizza composition. This can be a manually entered composition or an AI-generated one that the user has accepted. If it's an AI-generated composition, related AI generation metadata is used to create a `generation_log` entry, and the user's `composition_generated_count` is incremented.
-   **HTTP Method**: `POST`
-   **URL Path**: `/api/compositions`
-   **Query Parameters**: None
-   **Request Payload (JSON)**:
    ```json
    {
      "ingredients": ["ingredient1", "ingredient2"], // Max 10 ingredients
      "composition_type": "ai-generated", // ai-generated for AI-generated, manual for manual
      "rating": null, // Optional: 1-6 or null
      "photo_url": null, // Optional: URL string or null
      "ai_generation_metadata": { // Optional: only if composition_type is ai-generated
        "duration_ms": 5000 // Duration of the AI generation process in milliseconds
      }
    }
    ```
-   **Response Payload (JSON)**:
    ```json
    {
      "composition_id": 1,
      "user_id": "uuid",
      "ingredients": ["ingredient1", "ingredient2"],
      "rating": null,
      "composition_type": "ai-generated",
      "created_at": "YYYY-MM-DDTHH:mm:ss.sssZ",
      "photo_url": null
      // If composition_type was "ai-generated", a generation_log entry is also created.
    }
    ```
-   **Success Codes**:
    -   `201 Created`: Composition created successfully.
-   **Error Codes**:
    -   `400 Bad Request`: Invalid input (e.g., too many ingredients, invalid rating).
    -   `401 Unauthorized`: User not authenticated.
    -   `500 Internal Server Error`: Server-side error.

#### `GET /compositions`

-   **Description**: Retrieves a list of pizza compositions for the authenticated user. Supports pagination and sorting.
-   **HTTP Method**: `GET`
-   **URL Path**: `/api/compositions`
-   **Query Parameters**:
    -   `page` (integer, optional, default: 1): Page number for pagination.
    -   `limit` (integer, optional, default: 10): Number of items per page.
    -   `sortBy` (string, optional, default: 'created_at'): Field to sort by (e.g., `created_at`, `rating`).
    -   `sortOrder` (string, optional, default: 'desc'): Sort order ('asc' or 'desc').
-   **Request Payload**: None
-   **Response Payload (JSON)**:
    ```json
    {
      "data": [
        {
          "composition_id": 1,
          "user_id": "uuid",
          "ingredients": ["ingredient1", "ingredient2"],
          "rating": 5,
          "composition_type": "ai-generated",
          "created_at": "YYYY-MM-DDTHH:mm:ss.sssZ",
          "photo_url": "http://example.com/photo.jpg"
        }
        // ... more compositions
      ],
      "pagination": {
        "currentPage": 1,
        "totalPages": 5,
        "totalItems": 50,
        "limit": 10
      }
    }
    ```
-   **Success Codes**:
    -   `200 OK`: Compositions retrieved successfully.
-   **Error Codes**:
    -   `401 Unauthorized`: User not authenticated.
    -   `500 Internal Server Error`: Server-side error.

#### `GET /compositions/{compositionId}`

-   **Description**: Retrieves a specific pizza composition by its ID. User must be the owner.
-   **HTTP Method**: `GET`
-   **URL Path**: `/api/compositions/{compositionId}`
-   **Query Parameters**: None
-   **Request Payload**: None
-   **Response Payload (JSON)**:
    ```json
    {
      "composition_id": 1,
      "user_id": "uuid",
      "ingredients": ["ingredient1", "ingredient2"],
      "rating": 5,
      "composition_type": "ai-generated",
      "created_at": "YYYY-MM-DDTHH:mm:ss.sssZ",
      "photo_url": "http://example.com/photo.jpg"
    }
    ```
-   **Success Codes**:
    -   `200 OK`: Composition retrieved successfully.
-   **Error Codes**:
    -   `401 Unauthorized`: User not authenticated.
    -   `403 Forbidden`: User is not the owner of the composition.
    -   `404 Not Found`: Composition not found.
    -   `500 Internal Server Error`: Server-side error.

#### `PATCH /compositions/{compositionId}`

-   **Description**: Updates parts of a specific pizza composition (e.g., rating, photo URL). If `photo_url` is updated, the user's `photo_uploaded_count` is incremented.
-   **HTTP Method**: `PATCH`
-   **URL Path**: `/api/compositions/{compositionId}`
-   **Query Parameters**: None
-   **Request Payload (JSON)**:
    ```json
    {
      "rating": 4, // Optional: 1-6
      "photo_url": "http://example.com/new_photo.jpg", // Optional
      "ingredients": ["new_ingredient1"] // Optional, max 10
    }
    ```
-   **Response Payload (JSON)**:
    ```json
    {
      "composition_id": 1,
      "user_id": "uuid",
      "ingredients": ["new_ingredient1"],
      "rating": 4,
      "composition_type": "ai-generated",
      "created_at": "YYYY-MM-DDTHH:mm:ss.sssZ",
      "photo_url": "http://example.com/new_photo.jpg"
    }
    ```
-   **Success Codes**:
    -   `200 OK`: Composition updated successfully.
-   **Error Codes**:
    -   `400 Bad Request`: Invalid input (e.g., invalid rating, too many ingredients).
    -   `401 Unauthorized`: User not authenticated.
    -   `403 Forbidden`: User is not the owner of the composition.
    -   `404 Not Found`: Composition not found.
    -   `500 Internal Server Error`: Server-side error.

#### `DELETE /compositions/{compositionId}`

-   **Description**: Deletes a specific pizza composition. Associated `generation_log` (if any) will be deleted due to DB cascade.
-   **HTTP Method**: `DELETE`
-   **URL Path**: `/api/compositions/{compositionId}`
-   **Query Parameters**: None
-   **Request Payload**: None
-   **Response Payload**: None
-   **Success Codes**:
    -   `204 No Content`: Composition deleted successfully.
-   **Error Codes**:
    -   `401 Unauthorized`: User not authenticated.
    -   `403 Forbidden`: User is not the owner of the composition.
    -   `404 Not Found`: Composition not found.
    -   `500 Internal Server Error`: Server-side error.

### 2.3 AI Suggestions

#### `POST /ai/suggestions/pizza`

-   **Description**: Generates a pizza composition suggestion using an external AI service based on 1-3 base ingredients provided by the user. This endpoint does not save the composition.
-   **HTTP Method**: `POST`
-   **URL Path**: `/api/ai/suggestions/pizza`
-   **Query Parameters**: None
-   **Request Payload (JSON)**:
    ```json
    {
      "base_ingredients": ["tomato sauce", "mozzarella"] // 1-3 ingredients
    }
    ```
-   **Response Payload (JSON)**:
    ```json
    {
      "suggested_ingredients": ["tomato sauce", "mozzarella", "basil", "oregano"], // Max 10, in order
      "ai_generation_metadata": {
        "duration_ms": 5320 // Duration of the AI call and processing in milliseconds
        // Potentially other metadata from AI if useful, e.g., model used
      }
    }
    ```
-   **Success Codes**:
    -   `200 OK`: Suggestion generated successfully.
-   **Error Codes**:
    -   `400 Bad Request`: Invalid input (e.g., no base ingredients, too many base ingredients).
    -   `401 Unauthorized`: User not authenticated.
    -   `500 Internal Server Error`: Server-side error (e.g., external AI service failure).
    -   `503 Service Unavailable`: External AI service is unavailable or rate limit hit.

## 3. Authentication and Authorization

-   **Authentication Mechanism**: JWT (JSON Web Tokens) provided by Supabase Auth.
    -   Clients obtain a JWT upon successful login or registration via Supabase Auth endpoints.
    -   This JWT must be included in the `Authorization` header of API requests as a Bearer token (e.g., `Authorization: Bearer <your_supabase_jwt>`).
-   **Authorization**:
    -   Most endpoints require authentication.
    -   Authorization is enforced using Supabase's Row Level Security (RLS) policies on the database tables (e.g., `compositions` table has an RLS policy `USING (user_id = auth.uid())`).
    -   API logic will further ensure that users can only access or modify their own resources. For example, when fetching or modifying a composition, the API verifies that `composition.user_id` matches the authenticated user's ID.

## 4. Validation and Business Logic

### 4.1 Validation

-   **`POST /compositions` & `PATCH /compositions/{compositionId}` (for ingredients)**:
    -   `ingredients`: Must be an array.
    -   `ingredients` array length: Must be between 1 and 10 (inclusive), as per DB schema `CHECK (array_length(ingredients, 1) <= 10)`. PRD also mentions "maksymalnie do 10 pozycji".
-   **`POST /compositions` & `PATCH /compositions/{compositionId}` (for rating)**:
    -   `rating`: If provided, must be an integer between 1 and 6 (inclusive), as per DB schema `CHECK (rating BETWEEN 1 AND 6)`.
-   **`POST /ai/suggestions/pizza`**:
    -   `base_ingredients`: Must be an array with 1 to 3 string elements, as per PRD "Użytkownik wprowadza 1-3 składniki bazowe".
-   **Photo Upload Constraints (Handled by Client & Supabase Storage)**:
    -   PRD: "Zdjęcie musi spełniać ograniczenia rozdzielczości (max 2000x2000px) oraz rozmiaru (2.5MB)."
    -   These validations are primarily handled client-side before uploading to Supabase Storage. The API only receives the `photo_url`.

### 4.2 Business Logic Implementation

-   **AI Composition Generation & Logging**:
    1.  `POST /ai/suggestions/pizza`:
        -   Receives 1-3 base ingredients.
        -   Constructs a prompt and calls the external AI service (e.g., Openrouter.ai).
        -   Measures the duration of the AI call.
        -   Returns the suggested ingredients list (max 10) and the duration.
    2.  `POST /compositions` (when `composition_type` is ` ai-generated`):
        -   Receives the accepted ingredients and `ai_generation_metadata` (including duration).
        -   Saves the composition with `composition_type = ai-generated`.
        -   Creates an entry in the `generation_log` table, linking `user_id`, the new `composition_id`, and the `generation_duration` from the metadata.
        -   Increments the `composition_generated_count` for the user in the `users` table.
-   **Manual Composition Creation**:
    -   `POST /compositions` (when `composition_type` is `manual`):
        -   Saves the composition with `composition_type = manual`. No `generation_log` entry is created.
-   **Photo Linking & Counting**:
    -   `PATCH /compositions/{compositionId}`:
        -   If `photo_url` is provided and is different from the existing one (or if the existing one was null):
            -   Updates the `compositions.photo_url` field.
            -   Increments the `photo_uploaded_count` for the user in the `users` table. (This should only happen if a *new* photo URL is being set, not if it's removed or unchanged).
-   **User-Specific Data Access**:
    -   All operations on `compositions` (GET list, GET single, PATCH, DELETE) are filtered by the authenticated `user_id`, enforced by both API logic and RLS in Supabase.
-   **Counters Update**:
    -   `composition_generated_count`: Incremented via `POST /compositions` when an AI composition is saved.
    -   `photo_uploaded_count`: Incremented via `PATCH /compositions/{compositionId}` when a `photo_url` is newly set or updated.
-   **Pagination and Sorting**:
    -   Implemented in `GET /compositions` to handle potentially large lists of compositions efficiently.
-   **Cascade Deletes**:
    -   The database schema defines `ON DELETE CASCADE` for `generation_log` when a `composition` is deleted, and for `compositions` and `generation_log` when a `user` is deleted (though user deletion is managed by Supabase Auth, which also handles cascading deletes of related data in Auth schema). This ensures data integrity. 