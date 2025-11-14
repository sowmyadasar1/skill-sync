import { config } from 'dotenv';
config();

import '@/ai/flows/suggest-resources.ts';
import '@/ai/flows/ask-gemini.ts';
import '@/ai/flows/infer-project-details.ts';
import '@/ai/flows/recommend-mentors.ts';
import '@/ai/flows/recommend-team-members.ts';
