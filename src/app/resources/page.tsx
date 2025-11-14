
'use client';
import { useState, useEffect } from 'react';
import { Search, Loader2, Bookmark, ExternalLink } from 'lucide-react';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';

import {
  suggestResources,
  type SuggestResourcesOutput,
} from '@/ai/flows/suggest-resources';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function ResourcesPage() {
  const [interests, setInterests] = useState('');
  const [result, setResult] = useState<SuggestResourcesOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedResources, setSavedResources] = useState<Set<string>>(new Set());
  const { user, isFirebaseEnabled } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    async function fetchSavedResources() {
      if (user && isFirebaseEnabled && db) {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists() && userDoc.data().savedResources) {
          setSavedResources(new Set(userDoc.data().savedResources));
        }
      }
    }
    fetchSavedResources();
  }, [user, isFirebaseEnabled]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!interests.trim()) return;

    setIsLoading(true);
    setResult(null);
    setError(null);

    try {
      const res = await suggestResources({ interests });
      setResult(res);
    } catch (err) {
      setError('Sorry, something went wrong. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSave = async (resourceName: string) => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to save resources.',
        variant: 'destructive',
      });
      return;
    }

    if (!isFirebaseEnabled || !db) {
        toast({ title: 'Error', description: 'Database not configured.', variant: 'destructive' });
        return;
    }

    const userDocRef = doc(db, 'users', user.uid);
    const isSaved = savedResources.has(resourceName);
    
    try {
        if (isSaved) {
            await updateDoc(userDocRef, { savedResources: arrayRemove(resourceName) });
            setSavedResources((prev) => {
                const newSet = new Set(prev);
                newSet.delete(resourceName);
                return newSet;
            });
            toast({
                title: 'Resource Unsaved',
                description: `"${resourceName}" removed from your saved list.`,
            });
        } else {
            await updateDoc(userDocRef, { savedResources: arrayUnion(resourceName) });
            setSavedResources((prev) => new Set(prev).add(resourceName));
            toast({
                title: 'Resource Saved!',
                description: `"${resourceName}" added to your saved list.`,
            });
        }
    } catch (error) {
        console.error("Error updating saved resources: ", error);
        toast({ title: 'Error', description: 'Could not update your saved resources.', variant: 'destructive' });
    }
  };

  return (
    <div className="container mx-auto max-w-4xl">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-bold font-headline text-primary tracking-tight">
          Resource Navigation
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Enter your interests and let Gemini find the best learning resources for you.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="flex gap-4">
        <Input
          value={interests}
          onChange={(e) => setInterests(e.target.value)}
          placeholder="e.g., Machine Learning, Web Development, Flutter"
          className="text-base p-4 h-12"
          disabled={isLoading}
        />
        <Button type="submit" disabled={isLoading || !interests.trim()} size="lg" className="h-12">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 size-5 animate-spin" />
              Searching...
            </>
          ) : (
            <>
              <Search className="mr-2 size-5" />
              Suggest Resources
            </>
          )}
        </Button>
      </form>

      {error && <p className="text-destructive mt-4 text-center">{error}</p>}

      {result && (
        <div className="mt-8 animate-fade-in">
          <h2 className="text-2xl font-bold font-headline mb-4">Suggested for you:</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {result.resources.map((resource) => (
              <Card key={resource}>
                <CardHeader className="flex-row items-center justify-between p-4">
                  <CardTitle className="text-base font-medium">{resource}</CardTitle>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      asChild
                      aria-label="Find on Google"
                    >
                      <Link href={`https://www.google.com/search?q=${encodeURIComponent(resource)}`} target="_blank">
                        <ExternalLink className="size-4 text-muted-foreground" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleSave(resource)}
                      aria-label={savedResources.has(resource) ? 'Unsave resource' : 'Save resource'}
                      disabled={!user || !isFirebaseEnabled}
                    >
                      <Bookmark
                        className={cn(
                          'size-4 transition-colors',
                          user && isFirebaseEnabled && savedResources.has(resource)
                            ? 'fill-accent text-accent'
                            : 'text-muted-foreground'
                        )}
                      />
                    </Button>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
