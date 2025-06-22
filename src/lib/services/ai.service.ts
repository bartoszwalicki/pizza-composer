import type { AiGenerateResponseDto } from '../../types';

export class AiGenerationService {
  private apiKey: string;

  constructor() {
    // if (!import.meta.env.OPENROUTER_API_KEY) {
    //   throw new Error('OPENROUTER_API_KEY is not set in environment variables.');
    // }
    // this.apiKey = import.meta.env.OPENROUTER_API_KEY;
  }

  async generateIngredients(
    baseIngredients: string[]
  ): Promise<AiGenerateResponseDto> {
    console.log(
      `Generating ingredients with base: ${baseIngredients.join(', ')}`
    );

    // TODO: Implement actual API call to Openrouter.ai
    // For now, return a mock response for development purposes.
    const mockApiResponse = {
      suggested_ingredients: [...baseIngredients, 'Sugerowany Składnik 1', 'Sugerowany Składnik 2'],
      generation_duration_ms: 1500,
    };
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    console.log(
      `Mock response received: ${mockApiResponse.suggested_ingredients.join(
        ', '
      )}`
    );

    return mockApiResponse;
  }
} 