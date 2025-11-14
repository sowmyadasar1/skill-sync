// src/ai/flows/suggest-resources.ts
'use server';
/**
 * @fileOverview A learning resource suggestion AI agent.
 *
 * - suggestResources - A function that handles the resource suggestion process.
 * - SuggestResourcesInput - The input type for the suggestResources function.
 * - SuggestResourcesOutput - The return type for the suggestResources function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestResourcesInputSchema = z.object({
  interests: z
    .string()
    .describe('The interests of the student, comma separated.'),
});
export type SuggestResourcesInput = z.infer<typeof SuggestResourcesInputSchema>;

const SuggestResourcesOutputSchema = z.object({
  resources: z
    .array(z.string())
    .describe('An array of suggested learning resources.'),
});
export type SuggestResourcesOutput = z.infer<typeof SuggestResourcesOutputSchema>;

export async function suggestResources(input: SuggestResourcesInput): Promise<SuggestResourcesOutput> {
  return suggestResourcesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestResourcesPrompt',
  input: {schema: SuggestResourcesInputSchema},
  output: {schema: SuggestResourcesOutputSchema},
  prompt: `You are an expert in recommending learning resources for students.

You will use the student's interests to suggest relevant learning resources.

Interests: {{{interests}}}

Suggest a list of learning resources that would be helpful for the student, listing only the name of the suggested resource.`,
});

const suggestResourcesFlow = ai.defineFlow(
  {
    name: 'suggestResourcesFlow',
    inputSchema: SuggestResourcesInputSchema,
    outputSchema: SuggestResourcesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
