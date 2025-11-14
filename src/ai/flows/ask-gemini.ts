// src/ai/flows/ask-gemini.ts
'use server';

/**
 * @fileOverview A flow for recommending projects based on user skills.
 *
 * - suggestProjects - A function that handles the project suggestion process.
 * - SuggestProjectsInput - The input type for the suggestProjects function.
 * - SuggestProjectsOutput - The return type for the suggestProjects function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestProjectsInputSchema = z.object({
  skills: z.string().describe('The skills the user has, comma-separated.'),
});
export type SuggestProjectsInput = z.infer<typeof SuggestProjectsInputSchema>;

const ProjectSchema = z.object({
    title: z.string().describe('A catchy and descriptive title for the project.'),
    description: z.string().describe('A one or two-paragraph summary of what the project is, its purpose, and its key features.'),
    roadmap: z.array(z.string()).describe('An array of clear, actionable steps or milestones to build the project from start to finish.'),
});

const SuggestProjectsOutputSchema = z.object({
  projects: z.array(ProjectSchema).describe('An array of 3-5 recommended project ideas.'),
});
export type SuggestProjectsOutput = z.infer<typeof SuggestProjectsOutputSchema>;

export async function suggestProjects(input: SuggestProjectsInput): Promise<SuggestProjectsOutput> {
  return suggestProjectsFlow(input);
}

const suggestProjectsPrompt = ai.definePrompt({
  name: 'suggestProjectsPrompt',
  input: {schema: SuggestProjectsInputSchema},
  output: {schema: SuggestProjectsOutputSchema},
  prompt: `You are an expert career advisor for software developers. Your goal is to recommend inspiring and practical portfolio projects.

  Based on the user's skills, generate a list of 3 to 5 project ideas.
  
  For each project, provide:
  1. A catchy title.
  2. A detailed description (1-2 paragraphs) of the project and its features.
  3. A step-by-step roadmap of milestones to complete the project.

  User's skills: {{{skills}}}
  `, 
});

const suggestProjectsFlow = ai.defineFlow(
  {
    name: 'suggestProjectsFlow',
    inputSchema: SuggestProjectsInputSchema,
    outputSchema: SuggestProjectsOutputSchema,
  },
  async input => {
    const {output} = await suggestProjectsPrompt(input);
    return output!;
  }
);
