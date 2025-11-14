
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Users, Code, Plus, Loader2, AlertTriangle } from 'lucide-react';
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  addDoc,
  serverTimestamp,
  Timestamp,
  doc,
  getDoc,
  setDoc,
  arrayUnion,
} from 'firebase/firestore';

import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import type { Project } from '@/lib/data';
import { inferProjectDetails } from '@/ai/flows/infer-project-details';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { GithubIcon } from '@/components/icons';

const GithubRepoSchema = z.object({
  id: z.number(),
  name: z.string(),
  full_name: z.string(),
  owner: z.object({
    login: z.string(),
    avatar_url: z.string(),
  }),
  description: z.string().nullable(),
  topics: z.array(z.string()),
  language: z.string().nullable(),
  private: z.boolean(),
});

const ReadmeSchema = z.object({
  content: z.string(),
});

type UserProfile = {
  githubUsername?: string;
  joinedProjects?: Array<{ projectId: string; repoFullName: string }>;
};

export default function CollaboratePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [githubUrl, setGithubUrl] = useState('');
  const [isFetching, setIsFetching] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, isLoading: isAuthLoading, isFirebaseEnabled } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const { toast } = useToast();
  const [joinedProjectIds, setJoinedProjectIds] = useState<Set<string>>(new Set());
  const [joiningProjectId, setJoiningProjectId] = useState<string | null>(null);

  useEffect(() => {
    if (!isFirebaseEnabled || !db) {
      setIsFetching(false);
      return;
    }
    const q = query(collection(db, 'projects'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const projectsData: Project[] = [];
      querySnapshot.forEach((doc) => {
        projectsData.push({ id: doc.id, ...doc.data() } as Project);
      });
      setProjects(projectsData);
      setIsFetching(false);
    }, () => {
      setIsFetching(false);
    });

    return () => unsubscribe();
  }, [isFirebaseEnabled]);

  useEffect(() => {
    async function fetchProfile() {
      if (user && isFirebaseEnabled && db) {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const profileData = docSnap.data() as UserProfile;
          setUserProfile(profileData);
          if (profileData.joinedProjects) {
            setJoinedProjectIds(new Set(profileData.joinedProjects.map(p => p.projectId)));
          }
        }
      }
    }
    if (user) {
      fetchProfile();
    }
  }, [user, isFirebaseEnabled]);

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!githubUrl.trim() || !user || !db) return;

    setIsSubmitting(true);
    setError(null);

    const urlRegex = /github\.com\/([^\/]+)\/([^\/]+)(?:\.git)?\/?$/;
    const match = githubUrl.match(urlRegex);

    if (!match) {
      setError('Invalid GitHub repository URL.');
      setIsSubmitting(false);
      return;
    }

    const [, owner, repo] = match;

    try {
      if (!userProfile?.githubUsername) {
        setError('Your GitHub username is not linked. Please try logging out and back in to sync your account.');
        setIsSubmitting(false);
        return;
      }
      
      const repoResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
      if (!repoResponse.ok) throw new Error('Failed to fetch repository data. The repository might be private or does not exist.');
      const repoData = await repoResponse.json();
      const parsedRepo = GithubRepoSchema.parse(repoData);

      if (parsedRepo.private) {
        setError('Only public repositories can be added.');
        setIsSubmitting(false);
        return;
      }

      if (parsedRepo.owner.login.toLowerCase() !== userProfile.githubUsername.toLowerCase()) {
        setError(`You can only add your own public repositories. This repository is owned by "${parsedRepo.owner.login}".`);
        setIsSubmitting(false);
        return;
      }


      let readmeContent = parsedRepo.description || '';
      const readmeResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/readme`);
      if (readmeResponse.ok) {
        const readmeData = await readmeResponse.json();
        const parsedReadme = ReadmeSchema.parse(readmeData);
        readmeContent = Buffer.from(parsedReadme.content, 'base64').toString('utf-8');
      }

      const aiDetails = await inferProjectDetails({
        readmeContent,
        topics: parsedRepo.topics,
        language: parsedRepo.language,
      });

      const newProject = {
        title: parsedRepo.name,
        repoFullName: parsedRepo.full_name,
        description: aiDetails.description,
        skills: aiDetails.skills.length > 0 ? aiDetails.skills : ['no-skills-inferred'],
        author: parsedRepo.owner.login,
        avatar: parsedRepo.owner.avatar_url,
        gh_id: parsedRepo.id,
        createdAt: serverTimestamp() as Timestamp,
      };

      await addDoc(collection(db, 'projects'), newProject);
      
      setGithubUrl('');
      setDialogOpen(false);
      setIsSubmitting(false);

      toast({
        title: 'Project Added!',
        description: `"${newProject.title}" has been added to the board.`,
      });
    } catch (err: any) {
      console.error(err);
      const errorMessage = err.message || 'Please try again.';
      setError('Failed to add project. ' + errorMessage);
      toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
      setIsSubmitting(false);
    }
  };

  const handleJoinProject = async (project: Project) => {
    if (!user || !db || !project.repoFullName) return;
    setJoiningProjectId(project.id);
    const userDocRef = doc(db, 'users', user.uid);
    try {
      // Use setDoc with { merge: true } for a more robust update.
      // This will create the `joinedProjects` field if it's missing,
      // preventing errors for users with older profile structures.
      await setDoc(userDocRef, {
        joinedProjects: arrayUnion({
          projectId: project.id,
          repoFullName: project.repoFullName
        })
      }, { merge: true });
      
      setJoinedProjectIds(prev => new Set(prev).add(project.id));
      toast({
        title: 'Project Joined!',
        description: `You've joined "${project.title}". Your contributions will now be tracked.`
      });
    } catch (error) {
      console.error("Error joining project:", error);
      toast({
        title: "Error",
        description: "Could not join the project.",
        variant: "destructive"
      });
    } finally {
      setJoiningProjectId(null);
    }
  };
  
  const isLoading = isAuthLoading || isFetching;

  return (
    <div className="container mx-auto">
      <header className="mb-8 flex flex-wrap gap-4 justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold font-headline text-primary tracking-tight">
            Collaboration Board
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Find your next project or the perfect teammate.
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={!user || !isFirebaseEnabled}>
              <Plus className="mr-2 size-4" />
              Add Project
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add Your Project from GitHub</DialogTitle>
              <DialogDescription>
                Enter a public repository URL that you own. We'll fetch the details.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddProject}>
              <div className="grid gap-4 py-4">
                <Input
                  id="github-url"
                  placeholder="https://github.com/owner/repo"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  disabled={isSubmitting}
                />
                {error && <p className="text-sm text-destructive">{error}</p>}
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isSubmitting || !githubUrl.trim()}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    'Add Project'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </header>
      {!isFirebaseEnabled ? (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Feature Disabled</AlertTitle>
            <AlertDescription>
                Firebase is not configured. Please add your credentials to the <code>.env</code> file to use the collaboration board.
            </AlertDescription>
         </Alert>
      ) : isLoading ? (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}><CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader><CardContent><Skeleton className="h-20 w-full" /></CardContent><CardFooter><Skeleton className="h-10 w-full" /></CardFooter></Card>
            ))}
         </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => {
            const isProjectAuthor = userProfile?.githubUsername?.toLowerCase() === project.author.toLowerCase();
            const hasJoined = joinedProjectIds.has(project.id);
            const isJoining = joiningProjectId === project.id;
            return(
            <Card key={project.id} className="flex flex-col">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="font-headline text-xl">{project.title}</CardTitle>
                  <Button variant="ghost" size="icon" asChild>
                    <Link href={`https://github.com/${project.repoFullName}`} target="_blank" rel="noopener noreferrer">
                      <GithubIcon className="size-5 fill-current text-foreground" />
                    </Link>
                  </Button>
                </div>
                <CardDescription>{project.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <h4 className="font-semibold mb-2 text-sm flex items-center gap-2">
                  <Code className="size-4 text-primary" />
                  Required Skills
                </h4>
                <div className="flex flex-wrap gap-2">
                  {project.skills.map((skill) => (
                    <Badge key={skill} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={project.avatar} alt={project.author} />
                    <AvatarFallback>{project.author.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">{project.author}</span>
                </div>
                <Button 
                    onClick={() => handleJoinProject(project)}
                    disabled={!user || hasJoined || isProjectAuthor || isJoining}
                >
                    {isJoining ? (
                        <Loader2 className="mr-2 size-4 animate-spin" />
                    ) : isProjectAuthor ? (
                        <Code className="mr-2 size-4" />
                    ) : (
                        <Users className="mr-2 size-4" />
                    )}
                    {isProjectAuthor ? 'Your Project' : hasJoined ? 'Joined' : 'Join Project'}
                </Button>
              </CardFooter>
            </Card>
          )})}
        </div>
      )}
    </div>
  );
}
