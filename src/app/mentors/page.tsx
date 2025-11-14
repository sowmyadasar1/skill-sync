
'use client';
import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { Award, Loader2, Linkedin, Twitter, Search, Sparkles, AtSign } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import type { UserProfile } from '../profile/page';
import { recommendMentors } from '@/ai/flows/recommend-mentors';
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
import { Input } from '@/components/ui/input';

export default function MentorsPage() {
  const [allMentors, setAllMentors] = useState<UserProfile[]>([]);
  const [displayedMentors, setDisplayedMentors] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
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
        const mentorsData: UserProfile[] = [];
        querySnapshot.forEach((doc) => {
          mentorsData.push({ id: doc.id, ...doc.data() } as UserProfile);
        });
        setAllMentors(mentorsData);
        setDisplayedMentors(mentorsData);
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
    if (!searchQuery.trim()) {
        setDisplayedMentors(allMentors);
        setIsAiSearch(false);
        return;
    }

    setIsSearching(true);
    setIsAiSearch(true);
    try {
        const { rankedMentors } = await recommendMentors({
            query: searchQuery,
            mentors: allMentors.map(m => ({ // Pass only the required data to the AI
                uid: m.uid,
                displayName: m.displayName,
                bio: m.bio,
                skills: m.skills,
                githubUsername: m.githubUsername
            }))
        });

        const mentorMap = new Map(allMentors.map(m => [m.uid, m]));
        
        const sortedMentors = rankedMentors
            .map(uid => mentorMap.get(uid))
            .filter((m): m is UserProfile => !!m);

        setDisplayedMentors(sortedMentors);
    } catch (error) {
        console.error("Failed to get mentor recommendations:", error);
    } finally {
        setIsSearching(false);
    }
  };

  return (
    <div className="container mx-auto">
      <header className="mb-8">
        <h1 className="text-4xl font-bold font-headline text-primary tracking-tight">
          Find a Mentor
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Connect with experienced developers. Use the search to find a mentor with the skills you're looking for.
        </p>
      </header>
      
      <form onSubmit={handleSearch} className="mb-8 flex gap-4">
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="e.g., 'A friendly mentor skilled in Python and Firebase'"
          className="text-base p-4 h-12"
          disabled={isSearching}
        />
        <Button type="submit" disabled={isSearching} size="lg" className="h-12">
          {isSearching ? (
            <>
              <Loader2 className="mr-2 size-5 animate-spin" />
              Searching...
            </>
          ) : (
            <>
              <Search className="mr-2 size-5" />
              Search
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
            <code>.env</code> file to see the list of mentors.
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
          {displayedMentors.map((mentor, index) => (
            <Card key={mentor.uid} className="flex flex-col relative">
              {isAiSearch && index < 3 && (
                <Badge variant="secondary" className="absolute top-4 right-4 z-10 border-accent/50 bg-accent/20">
                    <Sparkles className="mr-2 size-4 text-accent" />
                    Top Match
                </Badge>
              )}
              <CardHeader className="flex-grow">
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16 border-2 border-primary/20">
                    <AvatarImage
                      src={mentor.photoURL || ''}
                      alt={mentor.displayName || mentor.githubUsername || ''}
                    />
                    <AvatarFallback className="text-2xl">
                      {(mentor.displayName || mentor.githubUsername || 'U')
                        .charAt(0)
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <CardTitle className="font-headline text-xl">
                      {mentor.displayName || mentor.githubUsername}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {mentor.bio}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                        <AtSign className="size-4" />
                        <a href={`mailto:${mentor.email}`} className="hover:underline">{mentor.email}</a>
                    </div>
                    <h4 className="font-semibold text-sm mb-2">Skills</h4>
                    <div className="flex flex-wrap gap-2">
                        {mentor.skills.length > 0 ? (
                        mentor.skills.slice(0, 5).map((skill) => (
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
                        <span className="font-bold">{mentor.points || 0}</span>
                        <span className="ml-1">Points</span>
                    </Badge>
                    <div className="flex items-center gap-1">
                        {mentor.githubUsername && (
                            <Button variant="ghost" size="icon" asChild>
                                <a href={`https://github.com/${mentor.githubUsername}`} target="_blank" rel="noopener noreferrer">
                                    <GithubIcon className="size-4 fill-current" />
                                </a>
                            </Button>
                        )}
                        {mentor.linkedinUrl && (
                             <Button variant="ghost" size="icon" asChild>
                                <a href={mentor.linkedinUrl} target="_blank" rel="noopener noreferrer">
                                    <Linkedin className="size-4" />
                                </a>
                            </Button>
                        )}
                        {mentor.twitterUrl && (
                             <Button variant="ghost" size="icon" asChild>
                                <a href={mentor.twitterUrl} target="_blank" rel="noopener noreferrer">
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
