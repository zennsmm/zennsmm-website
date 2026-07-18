'use server';
/**
 * @fileOverview This file implements a Genkit flow for the Social Boost Planner Tool.
 * It takes user's social media growth goals and budget, and a catalog of available SMM services
 * to recommend the most suitable packages and services.
 *
 * - socialBoostPlannerRecommendation - A function that handles the recommendation process.
 * - SocialBoostPlannerRecommendationInput - The input type for the socialBoostPlannerRecommendation function.
 * - SocialBoostPlannerRecommendationOutput - The return type for the socialBoostPlannerRecommendation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SocialBoostPlannerRecommendationInputSchema = z.object({
  goals: z
    .string()
    .describe(
      'The user\'s social media growth goals (e.g., "gain 1000 Instagram followers, increase YouTube views by 5000").'
    ),
  budget: z.number().positive().describe('The user\'s budget in USD.'),
  servicesCatalog: z
    .string()
    .describe(
      'A JSON string representation of the available SMM services, including name, description, price, and category.'
    ),
});
export type SocialBoostPlannerRecommendationInput = z.infer<
  typeof SocialBoostPlannerRecommendationInputSchema
>;

const RecommendedServiceSchema = z.object({
  serviceName: z.string().describe('The name of the recommended service.'),
  category: z.string().describe('The category of the service.'),
  price: z.number().positive().describe('The price of the service in USD.'),
  justification: z
    .string()
    .describe(
      'A brief explanation of why this service is recommended for the user\'s goals and budget.'
    ),
  estimatedImpact: z
    .string()
    .describe(
      'An estimate of how this service will contribute to the user\'s goals (e.g., "This service can help you gain approximately 500 followers").'
    ),
});

const SocialBoostPlannerRecommendationOutputSchema = z.object({
  recommendations: z
    .array(RecommendedServiceSchema)
    .describe(
      'A list of recommended SMM services, including their name, category, price, justification, and estimated impact.'
    ),
  summary: z
    .string()
    .describe(
      'A concise summary of the recommendations and overall strategy based on the goals and budget.'
    ),
});
export type SocialBoostPlannerRecommendationOutput = z.infer<
  typeof SocialBoostPlannerRecommendationOutputSchema
>;

export async function socialBoostPlannerRecommendation(
  input: SocialBoostPlannerRecommendationInput
): Promise<SocialBoostPlannerRecommendationOutput> {
  return socialBoostPlannerRecommendationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'socialBoostPlannerPrompt',
  input: {schema: SocialBoostPlannerRecommendationInputSchema},
  output: {schema: SocialBoostPlannerRecommendationOutputSchema},
  prompt: ({goals, budget, servicesCatalog}) => `You are an expert Social Media Marketing (SMM) consultant for zennsmm, a professional SMM panel.
Your goal is to recommend the most suitable SMM packages and services from the provided catalog to a user based on their social media growth goals and budget.

User's Social Media Growth Goals: ${goals}
User's Budget: $${budget}

Available SMM Services Catalog (JSON format):
\`\`\`json
${servicesCatalog}
\`\`\`

Analyze the user's goals and budget in conjunction with the available services.
Prioritize services that directly contribute to the stated goals and are within or close to the user's budget.
If specific quantities are implied by the goals (e.g., "1000 followers"), try to estimate which services or combinations could achieve this.

Provide a list of recommendations, including the service name, category, price, a clear justification for why it's recommended, and an estimated impact on the user's goals.
Conclude with a brief summary of the overall recommendation strategy.
If no suitable services are found within the budget or for the goals, state that clearly and suggest adjusting the budget or goals.
`,
});

const socialBoostPlannerRecommendationFlow = ai.defineFlow(
  {
    name: 'socialBoostPlannerRecommendationFlow',
    inputSchema: SocialBoostPlannerRecommendationInputSchema,
    outputSchema: SocialBoostPlannerRecommendationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
