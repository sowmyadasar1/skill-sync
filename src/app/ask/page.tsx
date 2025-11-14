'use client';

import { useState } from 'react';
import { Lightbulb, Send, Loader2 } from 'lucide-react';

import { suggestProjects, type SuggestProjectsOutput } from '@/ai/flows/ask-gemini';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';


export default function AskPage() {
  const [skills, setSkills] = useState('');
  const [result, setResult] = useState<SuggestProjectsOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!skills.trim()) return;

    setIsLoading(true);
    setResult(null);
    setError(null);

    try {
      const res = await suggestProjects({ skills });
      setResult(res);
    } catch (err) {
      setError('Sorry, something went wrong. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-4xl">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-bold font-headline text-primary tracking-tight">
          Project Recommender
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Enter your skills and let Gemini suggest the perfect project for you.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="flex gap-4">
        <Input
          value={skills}
          onChange={(e) => setSkills(e.target.value)}
          placeholder="e.g., React, TypeScript, Tailwind CSS"
          className="text-base p-4 h-12"
          disabled={isLoading}
        />
        <Button type="submit" disabled={isLoading || !skills.trim()} size="lg" className="h-12">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 size-5 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Send className="mr-2 size-5" />
              Get Projects
            </>
          )}
        </Button>
      </form>

      {error && <p className="text-destructive mt-4 text-center">{error}</p>}

      {result && (
        <div className="mt-8 animate-fade-in space-y-6">
            {result.projects.map((project, index) => (
                <Card key={index}>
                    <CardHeader>
                        <CardTitle className="font-headline text-xl text-primary">{project.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="mb-4 text-muted-foreground">{project.description}</p>
                        <Accordion type="single" collapsible>
                            <AccordionItem value="item-1">
                                <AccordionTrigger>View Roadmap</AccordionTrigger>
                                <AccordionContent>
                                    <ol className="list-decimal list-inside space-y-2 pl-2">
                                        {project.roadmap.map((step, i) => (
                                            <li key={i}>{step}</li>
                                        ))}
                                    </ol>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </CardContent>
                </Card>
            ))}
        </div>
      )}
      
      {!result && !isLoading && (
        <Card className="mt-8 border-dashed">
            <CardContent className="p-10 text-center text-muted-foreground">
                <Lightbulb className="mx-auto size-12 mb-4 text-primary/50" />
                <p>Your recommended projects will appear here.</p>
            </CardContent>
        </Card>
      )}
    </div>
  );
}
