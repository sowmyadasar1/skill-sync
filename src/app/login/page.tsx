// src/app/login/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signInWithPopup, type AuthProvider as FirebaseAuthProvider, getAdditionalUserInfo } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, githubProvider, isFirebaseEnabled } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { DevConnectLogo, GithubIcon } from '@/components/icons';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { user, isLoading: isAuthLoading } = useAuth();

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleSocialLogin = async (provider: FirebaseAuthProvider | null) => {
    if (!isFirebaseEnabled || !auth || !db || !provider) {
      toast({ title: 'Login Failed', description: 'Firebase is not configured correctly.', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const additionalUserInfo = getAdditionalUserInfo(result);
      const githubUsername = (additionalUserInfo?.profile as any)?.login;


      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        // New user: create the full profile
        await setDoc(userDocRef, {
          uid: user.uid,
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          githubUsername: githubUsername || null,
          bio: `Hi, I'm ${user.displayName || 'a new user'}. I'm new here!`,
          skills: [],
          savedResources: [],
          points: 0,
          joinedProjects: [],
        });
      } else {
        // Existing user: update their profile to ensure githubUsername is synced.
        await setDoc(userDocRef, {
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          githubUsername: githubUsername || null,
        }, { merge: true });
      }

      toast({ title: 'Login Successful', description: 'Welcome back!' });
      router.push('/dashboard');
    } catch (error: any) {
      console.error(error);
      toast({
        title: 'Login Failed',
        description: error.code === 'auth/popup-closed-by-user' 
            ? 'Login was cancelled.' 
            : 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isAuthLoading || user) {
    return (
        <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="size-12 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-full">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link href="/" className="mx-auto mb-4">
            <DevConnectLogo className="size-12 text-primary" />
          </Link>
          <CardTitle className="text-2xl font-headline">Welcome to DevConnect</CardTitle>
          <CardDescription>
            Sign in with your GitHub account to continue.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => handleSocialLogin(githubProvider)}
            disabled={!isFirebaseEnabled || isLoading}
          >
            {isLoading ? (
              <Loader2 className="animate-spin" />
            ) : (
                <>
                    <GithubIcon className="mr-2 size-4 fill-current" />
                    Sign in with GitHub
                </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
