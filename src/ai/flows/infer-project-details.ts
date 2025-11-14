'use server';
/**
 * @fileOverview An AI agent for inferring project details from repository data.
 *
 * - inferProjectDetails - A function that infers skills and a summary from project data.
 * - InferProjectDetailsInput - The input type for the inferProjectDetails function.
 * - InferProjectDetailsOutput - The return type for the inferProjectDetails function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const InferProjectDetailsInputSchema = z.object({
  readmeContent: z.string().describe("The full content of the project's README.md file."),
  topics: z.array(z.string()).describe('A list of topics or tags associated with the repository.'),
  language: z.string().nullable().describe('The primary programming language of the repository.'),
});
export type InferProjectDetailsInput = z.infer<typeof InferProjectDetailsInputSchema>;

const InferProjectDetailsOutputSchema = z.object({
  skills: z.array(z.string()).describe('An array of inferred skills required for the project.'),
  description: z.string().describe('A concise, one or two-sentence summary of the project based on the README.'),
});
export type InferProjectDetailsOutput = z.infer<typeof InferProjectDetailsOutputSchema>;

export async function inferProjectDetails(input: InferProjectDetailsInput): Promise<InferProjectDetailsOutput> {
  return inferProjectDetailsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'inferProjectDetailsPrompt',
  input: {schema: InferProjectDetailsInputSchema},
  output: {schema: InferProjectDetailsOutputSchema},
  prompt: `You are an expert at analyzing software projects to understand their purpose and technical requirements.
  
  Based on the following information from a GitHub repository, please perform two tasks:
  1. Generate a concise, one or two-sentence summary of the project's purpose. This will be displayed on a project card.
  2. Infer a list of key technical skills (like programming languages, frameworks, libraries, and tools) required to contribute to this project.

  Repository Information:
  - Primary Language: {{{language}}}
  - Topics: {{#each topics}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
  
  README Content:
  ---
  {{{readmeContent}}}
  ---
  `,
});

const inferProjectDetailsFlow = ai.defineFlow(
  {
    name: 'inferProjectDetailsFlow',
    inputSchema: InferProjectDetailsInputSchema,
    outputSchema: InferProjectDetailsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
