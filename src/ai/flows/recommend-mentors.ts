
// src/ai/flows/recommend-mentors.ts
'use server';
/**
 * @fileOverview An AI agent for recommending mentors based on a query.
 *
 * - recommendMentors - A function that ranks mentors based on a query.
 * - RecommendMentorsInput - The input type for the recommendMentors function.
 * - RecommendMentorsOutput - The return type for the recommendMentors function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Define the schema for a single mentor profile
const MentorProfileSchema = z.object({
  uid: z.string().describe('The unique identifier for the mentor.'),
  displayName: z.string().nullable().describe('The mentor\'s display name.'),
  bio: z.string().nullable().describe('A short biography of the mentor.'),
  skills: z.array(z.string()).describe('A list of the mentor\'s technical skills.'),
  githubUsername: z.string().optional().describe('The mentor\'s GitHub username.'),
});

const RecommendMentorsInputSchema = z.object({
  query: z.string().describe('The user\'s request for a mentor.'),
  mentors: z.array(MentorProfileSchema).describe('The list of all available mentors.'),
});
export type RecommendMentorsInput = z.infer<typeof RecommendMentorsInputSchema>;

const RecommendMentorsOutputSchema = z.object({
  rankedMentors: z.array(z.string()).describe('An array of mentor UIDs, ranked from best to worst match.'),
});
export type RecommendMentorsOutput = z.infer<typeof RecommendMentorsOutputSchema>;

export async function recommendMentors(input: RecommendMentorsInput): Promise<RecommendMentorsOutput> {
  return recommendMentorsFlow(input);
}

const recommendMentorsPrompt = ai.definePrompt({
  name: 'recommendMentorsPrompt',
  input: { schema: RecommendMentorsInputSchema },
  output: { schema: RecommendMentorsOutputSchema },
  prompt: `You are an expert at matching students with technical mentors. Your goal is to rank a list of available mentors based on a user's query.

  Analyze the user's query and compare it against each mentor's profile, skills, and bio.
  
  Return a list of the mentors' unique IDs (UIDs), ranked in order from the best match to the worst. Do not exclude any mentors; return all of them in ranked order.

  User Query:
  ---
  {{{query}}}
  ---

  Available Mentors:
  ---
  {{{json mentors}}}
  ---
  `,
});

const recommendMentorsFlow = ai.defineFlow(
  {
    name: 'recommendMentorsFlow',
    inputSchema: RecommendMentorsInputSchema,
    outputSchema: RecommendMentorsOutputSchema,
  },
  async input => {
    const { output } = await recommendMentorsPrompt(input);
    return output!;
  }
);
