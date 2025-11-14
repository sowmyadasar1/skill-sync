
'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { Linkedin, Twitter } from 'lucide-react';

import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AtSign, Bookmark, Edit, Users, Loader2, AlertTriangle, Award, RefreshCw } from 'lucide-react';
import { GithubIcon } from '@/components/icons';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { EditProfileForm, type ProfileFormValues } from './edit-profile-form';

export type UserProfile = {
  uid: string;
  displayName: string | null;
  email: string;
  bio: string;
  skills: string[];
  savedResources: string[];
  githubUsername?: string;
  linkedinUrl?: string;
  twitterUrl?: string;
  photoURL?: string;
  points?: number;
  joinedProjects?: Array<{ projectId: string; repoFullName: string; }>;
};

export default function ProfilePage() {
  const { user, isLoading: isAuthLoading, isFirebaseEnabled } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchProfile() {
      if (user && isFirebaseEnabled && db) {
        setIsLoading(true);
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfile(docSnap.data() as UserProfile);
        } else {
          console.log("No such document!");
        }
        setIsLoading(false);
      } else if (!user) {
         setIsLoading(false);
      }
    }
    fetchProfile();
  }, [user, isFirebaseEnabled]);

  const handleSyncContributions = async () => {
    if (!profile || !profile.githubUsername || !profile.joinedProjects || !db || !user) {
      toast({
        title: 'Sync Failed',
        description: 'Missing profile information to sync contributions.',
        variant: 'destructive',
      });
      return;
    }

    setIsSyncing(true);
    try {
      let totalMergedPRs = 0;
      for (const proj of profile.joinedProjects) {
        const res = await fetch(`https://api.github.com/search/issues?q=repo:${proj.repoFullName}+is:pr+author:${profile.githubUsername}+is:merged`);
        if (!res.ok) {
          console.warn(`Failed to fetch PRs for ${proj.repoFullName}. Status: ${res.status}`);
          continue; 
        }
        const data = await res.json();
        totalMergedPRs += data.total_count || 0;
      }

      const newPoints = totalMergedPRs * 5;
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        points: newPoints,
      });

      setProfile(prevProfile => (prevProfile ? { ...prevProfile, points: newPoints } : null));

      toast({
        title: 'Sync Complete!',
        description: `You have been awarded ${newPoints} points for ${totalMergedPRs} merged PRs.`,
      });
    } catch (error) {
      console.error('Error syncing contributions:', error);
      toast({
        title: 'Sync Error',
        description: 'Could not sync your contributions at this time.',
        variant: 'destructive',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleProfileUpdate = async (values: ProfileFormValues) => {
    if (!user || !db) return;

    const userDocRef = doc(db, 'users', user.uid);
    try {
        const updatedData = {
            bio: values.bio,
            skills: values.skills.split(',').map(s => s.trim()).filter(s => s),
            linkedinUrl: values.linkedinUrl,
            twitterUrl: values.twitterUrl,
        };

        await updateDoc(userDocRef, updatedData);

        setProfile(prev => prev ? { ...prev, ...updatedData } : null);
        toast({ title: 'Profile Updated!', description: 'Your changes have been saved.' });
        setEditDialogOpen(false);
    } catch (error) {
        console.error('Error updating profile:', error);
        toast({ title: 'Update Failed', description: 'Could not save your changes.', variant: 'destructive'});
    }
  };

  if (isAuthLoading || isLoading) {
    return (
        <div className="container mx-auto max-w-5xl flex items-center justify-center min-h-[60vh]">
            <Loader2 className="size-12 animate-spin text-primary" />
        </div>
    );
  }

  if (!isFirebaseEnabled) {
    return (
        <div className="container mx-auto max-w-5xl">
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Feature Disabled</AlertTitle>
                <AlertDescription>
                    Firebase is not configured. Please add your credentials to the <code>.env</code> file to use user profiles.
                </AlertDescription>
            </Alert>
        </div>
    )
  }

  if (!user || !profile) {
    return (
        <div className="container mx-auto max-w-5xl flex items-center justify-center min-h-[60vh]">
            <p>Could not load profile. You may need to log in.</p>
        </div>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl">
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start gap-6">
            <Avatar className="h-28 w-28 border-4 border-primary/20">
              <AvatarImage src={user.photoURL || ''} alt={profile.displayName || profile.githubUsername || ''} />
              <AvatarFallback className="text-4xl">
                {(profile.displayName || profile.githubUsername || 'U').charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex justify-between items-start">
                  <div>
                    <h1 className="text-3xl font-bold font-headline">{profile.displayName || profile.githubUsername}</h1>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-muted-foreground mt-1">
                        <div className="flex items-center gap-2">
                            <AtSign className="size-4" />
                            <a href={`mailto:${profile.email}`} className="hover:underline">{profile.email}</a>
                        </div>
                        {profile.githubUsername && (
                            <div className="flex items-center gap-2">
                                <GithubIcon className="size-4 fill-current" />
                                <a href={`https://github.com/${profile.githubUsername}`} target="_blank" rel="noopener noreferrer" className="hover:underline">{profile.githubUsername}</a>
                            </div>
                        )}
                        {profile.linkedinUrl && (
                            <div className="flex items-center gap-2">
                                <Linkedin className="size-4" />
                                <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">LinkedIn</a>
                            </div>
                        )}
                        {profile.twitterUrl && (
                            <div className="flex items-center gap-2">
                                <Twitter className="size-4" />
                                <a href={profile.twitterUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">Twitter</a>
                            </div>
                        )}
                    </div>
                  </div>
                   <Dialog open={isEditDialogOpen} onOpenChange={setEditDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline">
                                <Edit className="mr-2 size-4" /> Edit Profile
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Edit Your Profile</DialogTitle>
                            </DialogHeader>
                            <EditProfileForm profile={profile} onSubmit={handleProfileUpdate} onCancel={() => setEditDialogOpen(false)} />
                        </DialogContent>
                    </Dialog>
              </div>

              <div className="flex items-center gap-4 mt-4">
                  <Badge variant="secondary" className="text-base py-1 px-3">
                      <Award className="mr-2 size-5 text-accent" />
                      <span className="font-bold">{profile.points || 0}</span>
                      <span className="ml-1.5 text-muted-foreground">Points</span>
                  </Badge>
                  <Button onClick={handleSyncContributions} disabled={isSyncing}>
                      {isSyncing ? <Loader2 className="mr-2 size-4 animate-spin" /> : <RefreshCw className="mr-2 size-4" />}
                      Sync Contributions
                  </Button>
              </div>

              <p className="mt-4 text-foreground/80">{profile.bio}</p>

              <div className="mt-4">
                <h3 className="font-semibold mb-2">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.length > 0 ? profile.skills.map((skill) => (
                    <Badge key={skill} variant="default" className="text-sm">
                      {skill}
                    </Badge>
                  )) : <p className="text-sm text-muted-foreground">No skills added yet.</p>}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline">
              <Bookmark className="size-6 text-primary" />
              Saved Resources
            </CardTitle>
          </CardHeader>
          <CardContent>
            {profile.savedResources.length > 0 ? (
                 <ul className="space-y-4">
                    {profile.savedResources.map((resource) => (
                        <li key={resource} className="flex items-center gap-4">
                            <div className="bg-primary/10 p-2 rounded-md">
                                <Users className="size-5 text-primary" />
                            </div>
                        <div className="flex-1">
                            <h4 className="font-semibold">{resource}</h4>
                        </div>
                        <Button variant="ghost" size="sm" asChild>
                            <Link href="/resources">Find</Link>
                        </Button>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-sm text-muted-foreground">No saved resources yet. Discover some in the <Link href="/resources" className="underline">resources</Link> page.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
