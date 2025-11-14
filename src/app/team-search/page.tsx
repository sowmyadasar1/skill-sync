
'use client';
import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { Award, Loader2, Linkedin, Twitter, Search, Sparkles, AtSign } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import type { UserProfile } from '../profile/page';
import { recommendTeamMembers } from '@/ai/flows/recommend-team-members';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { GithubIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

export default function TeamSearchPage() {
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [displayedUsers, setDisplayedUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [projectDescription, setProjectDescription] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const { isFirebaseEnabled } = useAuth();
  const [isAiSearch, setIsAiSearch] = useState(false);

  useEffect(() => {
    if (!isFirebaseEnabled || !db) {
      setIsLoading(false);
      return;
    }
    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const usersData: UserProfile[] = [];
        querySnapshot.forEach((doc) => {
          usersData.push({ ...doc.data(), uid: doc.id } as UserProfile);
        });
        setAllUsers(usersData);
        setDisplayedUsers(usersData);
        setIsLoading(false);
      },
      () => {
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [isFirebaseEnabled]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectDescription.trim()) {
        setDisplayedUsers(allUsers);
        setIsAiSearch(false);
        return;
    }

    setIsSearching(true);
    setIsAiSearch(true);
    try {
        const { rankedUsers } = await recommendTeamMembers({
            projectDescription: projectDescription,
            users: allUsers.map(m => ({ // Pass only the required data to the AI
                uid: m.uid,
                displayName: m.displayName,
                bio: m.bio,
                skills: m.skills,
                githubUsername: m.githubUsername
            }))
        });

        const userMap = new Map(allUsers.map(m => [m.uid, m]));
        
        const sortedUsers = rankedUsers
            .map(uid => userMap.get(uid))
            .filter((m): m is UserProfile => !!m);

        setDisplayedUsers(sortedUsers);
    } catch (error) {
        console.error("Failed to get team recommendations:", error);
    } finally {
        setIsSearching(false);
    }
  };

  return (
    <div className="container mx-auto">
      <header className="mb-8">
        <h1 className="text-4xl font-bold font-headline text-primary tracking-tight">
          Team Search
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Describe your project, and let Gemini recommend the perfect team members for you.
        </p>
      </header>
      
      <form onSubmit={handleSearch} className="mb-8 flex flex-col sm:flex-row gap-4">
        <Textarea
          value={projectDescription}
          onChange={(e) => setProjectDescription(e.target.value)}
          placeholder="e.g., 'I'm building a mobile app with React Native and Firebase to help people track their water intake. I need a designer and a backend developer.'"
          className="text-base p-4 min-h-[80px]"
          disabled={isSearching}
        />
        <Button type="submit" disabled={isSearching} size="lg" className="h-auto sm:h-12">
          {isSearching ? (
            <>
              <Loader2 className="mr-2 size-5 animate-spin" />
              Searching...
            </>
          ) : (
            <>
              <Search className="mr-2 size-5" />
              Find Team
            </>
          )}
        </Button>
      </form>

      {!isFirebaseEnabled ? (
        <Alert variant="destructive">
          <Loader2 className="h-4 w-4" />
          <AlertTitle>Feature Disabled</AlertTitle>
          <AlertDescription>
            Firebase is not configured. Please add your credentials to the{' '}
            <code>.env</code> file to use this feature.
          </AlertDescription>
        </Alert>
      ) : isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <Skeleton className="h-16 w-16 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedUsers.map((user, index) => (
            <Card key={user.uid} className="flex flex-col relative">
              {isAiSearch && (
                <Badge variant="secondary" className="absolute top-4 right-4 z-10 border-accent/50 bg-accent/20">
                    <Sparkles className="mr-2 size-4 text-accent" />
                    Match #{index + 1}
                </Badge>
              )}
              <CardHeader className="flex-grow">
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16 border-2 border-primary/20">
                    <AvatarImage
                      src={user.photoURL || ''}
                      alt={user.displayName || user.githubUsername || ''}
                    />
                    <AvatarFallback className="text-2xl">
                      {(user.displayName || user.githubUsername || 'U')
                        .charAt(0)
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <CardTitle className="font-headline text-xl">
                      {user.displayName || user.githubUsername}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {user.bio}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                        <AtSign className="size-4" />
                        <a href={`mailto:${user.email}`} className="hover:underline">{user.email}</a>
                    </div>
                    <h4 className="font-semibold text-sm mb-2">Skills</h4>
                    <div className="flex flex-wrap gap-2">
                        {user.skills.length > 0 ? (
                        user.skills.slice(0, 5).map((skill) => (
                            <Badge key={skill} variant="secondary">
                            {skill}
                            </Badge>
                        ))
                        ) : (
                        <p className="text-xs text-muted-foreground">
                            No skills listed.
                        </p>
                        )}
                    </div>
                </div>
                <div className="flex items-center justify-between">
                    <Badge variant="outline" className="py-1 px-2">
                        <Award className="mr-2 size-4 text-accent" />
                        <span className="font-bold">{user.points || 0}</span>
                        <span className="ml-1">Points</span>
                    </Badge>
                    <div className="flex items-center gap-1">
                        {user.githubUsername && (
                            <Button variant="ghost" size="icon" asChild>
                                <a href={`https://github.com/${user.githubUsername}`} target="_blank" rel="noopener noreferrer">
                                    <GithubIcon className="size-4 fill-current" />
                                </a>
                            </Button>
                        )}
                        {user.linkedinUrl && (
                             <Button variant="ghost" size="icon" asChild>
                                <a href={user.linkedinUrl} target="_blank" rel="noopener noreferrer">
                                    <Linkedin className="size-4" />
                                </a>
                            </Button>
                        )}
                        {user.twitterUrl && (
                             <Button variant="ghost" size="icon" asChild>
                                <a href={user.twitterUrl} target="_blank" rel="noopener noreferrer">
                                    <Twitter className="size-4" />
                                </a>
                            </Button>
                        )}
                    </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
