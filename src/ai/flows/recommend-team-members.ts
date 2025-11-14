// src/ai/flows/recommend-team-members.ts
'use server';
/**
 * @fileOverview An AI agent for recommending team members for a project.
 *
 * - recommendTeamMembers - A function that ranks users to form a team.
 * - RecommendTeamMembersInput - The input type for the recommendTeamMembers function.
 * - RecommendTeamMembersOutput - The return type for the recommendTeamMembers function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Define the schema for a single user profile
const UserProfileSchema = z.object({
  uid: z.string().describe('The unique identifier for the user.'),
  displayName: z.string().nullable().describe("The user's display name."),
  bio: z.string().nullable().describe("A short biography of the user."),
  skills: z.array(z.string()).describe("A list of the user's technical skills."),
  githubUsername: z.string().optional().describe("The user's GitHub username."),
});

const RecommendTeamMembersInputSchema = z.object({
  projectDescription: z.string().describe('A description of the project.'),
  users: z.array(UserProfileSchema).describe('The list of all available users.'),
});
export type RecommendTeamMembersInput = z.infer<typeof RecommendTeamMembersInputSchema>;

const RecommendTeamMembersOutputSchema = z.object({
  rankedUsers: z.array(z.string()).describe('An array of user UIDs, ranked from best to worst match for the team.'),
});
export type RecommendTeamMembersOutput = z.infer<typeof RecommendTeamMembersOutputSchema>;

export async function recommendTeamMembers(input: RecommendTeamMembersInput): Promise<RecommendTeamMembersOutput> {
  return recommendTeamMembersFlow(input);
}

const recommendTeamMembersPrompt = ai.definePrompt({
  name: 'recommendTeamMembersPrompt',
  input: { schema: RecommendTeamMembersInputSchema },
  output: { schema: RecommendTeamMembersOutputSchema },
  prompt: `You are an expert at building software development teams. Your goal is to rank a list of available users to form a team for a given project description.

  Analyze the project description and compare it against each user's profile, skills, and bio.
  
  Return a list of the users' unique IDs (UIDs), ranked in order from the best match to the worst. Do not exclude any users; return all of them in ranked order.

  Project Description:
  ---
  {{{projectDescription}}}
  ---

  Available Users:
  ---
  {{{json users}}}
  ---
  `,
});

const recommendTeamMembersFlow = ai.defineFlow(
  {
    name: 'recommendTeamMembersFlow',
    inputSchema: RecommendTeamMembersInputSchema,
    outputSchema: RecommendTeamMembersOutputSchema,
  },
  async input => {
    const { output } = await recommendTeamMembersPrompt(input);
    return output!;
  }
);
