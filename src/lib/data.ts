import type { Timestamp } from "firebase/firestore";

export type Project = {
  id: string;
  title: string;
  description: string;
  skills: string[];
  author: string;
  avatar: string;
  repoFullName: string;
  gh_id: number;
  createdAt: Timestamp;
};
