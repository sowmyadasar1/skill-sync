import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  CodeCollaborationIcon,
  MentorsIcon,
  ProjectRecommenderIcon,
  ResourceFinderIcon,
  TeamSearchIcon,
} from '@/components/icons';
import PlexusBackground from '@/components/plexus-background';

const features = [
  {
    title: 'Mentors',
    description: 'Connect with skilled developers on the platform.',
    icon: <MentorsIcon className="size-12 text-primary" />,
  },
  {
    title: 'Collaboration Board',
    description: 'Find teammates and join exciting new projects.',
    icon: <CodeCollaborationIcon className="size-12 text-primary" />,
  },
  {
    title: 'Project Recommender',
    description: 'Get project ideas and roadmaps based on your skills.',
    icon: <ProjectRecommenderIcon className="size-12 text-primary" />,
  },
  {
    title: 'Resource Navigation',
    description: 'AI-powered resource suggestions tailored to your interests.',
    icon: <ResourceFinderIcon className="size-12 text-primary" />,
  },
  {
    title: 'Team Search',
    description: 'Get AI-powered recommendations for project team members.',
    icon: <TeamSearchIcon className="size-12 text-primary" />,
  }
];

export default function Home() {
  return (
    <div className="relative isolate min-h-full overflow-hidden bg-background">
      <PlexusBackground />
      <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]">
        <div className="absolute left-[50%] top-0 -z-10 h-32 w-full -translate-x-1/2 rounded-full bg-primary/20 blur-3xl sm:left-0 sm:h-full sm:w-1/4 sm:translate-x-0"></div>
        <div className="absolute right-0 top-0 -z-10 h-32 w-full translate-x-1/2 rounded-full bg-accent/20 blur-3xl sm:right-[5%] sm:h-full sm:w-1/4"></div>
      </div>

      <div className="flex flex-col items-center justify-center p-4 md:p-8 animate-fade-in">
        <div className="text-center max-w-4xl mx-auto pt-16 md:pt-24">
          <h1 className="text-5xl md:text-7xl font-bold font-headline tracking-tighter animate-shimmer bg-[linear-gradient(110deg,#000103,45%,#1e2631,55%,#000103)] bg-[length:200%_100%] bg-clip-text text-transparent dark:bg-[linear-gradient(110deg,#fff,45%,#d8d8d8,55%,#fff)]">
            Welcome to SkillSync
          </h1>
          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto animate-fade-in [animation-delay:400ms]">
            Your central platform to connect with tech-interested students,
            discover events, collaborate on projects, and grow your skills.
          </p>
          <div className="mt-10 flex justify-center gap-4 animate-fade-in [animation-delay:600ms]">
            <Button asChild size="lg" className="text-lg py-7 px-8">
              <Link href="/login">
                Get Started <ArrowRight className="ml-2 size-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-lg py-7 px-8">
              <Link href="/collaborate">Find Projects</Link>
            </Button>
          </div>
        </div>

        <div className="mt-24 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-6xl">
          {features.map((feature, i) => (
            <Card
              key={feature.title}
              className="transform transition-all duration-300 ease-in-out hover:-translate-y-2 hover:shadow-2xl hover:shadow-primary/20 animate-fade-in bg-card/60 backdrop-blur-sm border-white/10"
              style={{ animationDelay: `${800 + i * 150}ms` }}
            >
              <CardHeader className="flex flex-col items-center text-center gap-4">
                <div className="bg-primary/10 p-4 rounded-xl">
                  {feature.icon}
                </div>
                <div>
                  <CardTitle className="font-headline text-2xl">
                    {feature.title}
                  </CardTitle>
                  <CardDescription className="mt-2 text-base">
                    {feature.description}
                  </CardDescription>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
