import Link from "next/link";
import { ArrowRight, Users, Lightbulb, Code, Users2, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const features = [
  {
    title: "Mentors",
    description: "Connect with skilled developers on the platform.",
    href: "/mentors",
    icon: <Users2 className="size-8 text-primary" />,
    cta: "Find a Mentor",
  },
  {
    title: "Collaboration Board",
    description: "Find teammates and join exciting new projects.",
    href: "/collaborate",
    icon: <Users className="size-8 text-primary" />,
    cta: "Find Collaborators",
  },
  {
    title: "Project Recommender",
    description: "Get project ideas and roadmaps based on your skills.",
    href: "/ask",
    icon: <Lightbulb className="size-8 text-primary" />,
    cta: "Get Recommendations",
  },
  {
    title: "Team Search",
    description: "Get AI-powered recommendations for project team members.",
    href: "/team-search",
    icon: <Search className="size-8 text-primary" />,
    cta: "Find Team Members",
  },
  {
    title: "Resource Navigation",
    description: "AI-powered resource suggestions tailored to your interests.",
    href: "/resources",
    icon: <Code className="size-8 text-primary" />,
    cta: "Discover Resources",
  },
];

export default function DashboardPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-full p-4 md:p-8">
      <div className="text-center max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-6xl font-bold font-headline text-primary tracking-tighter">
          Welcome to your Dashboard
        </h1>
        <p className="mt-4 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
          From here you can access all the features of DevConnect.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Button asChild size="lg">
            <Link href="/mentors">
              Find a Mentor <ArrowRight className="ml-2 size-5" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/collaborate">Find Projects</Link>
          </Button>
        </div>
      </div>

      <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-6xl">
        {features.map((feature) => (
          <Card
            key={feature.title}
            className="group transform transition-all duration-300 ease-in-out hover:-translate-y-2 hover:shadow-xl"
          >
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="bg-primary/10 p-3 rounded-lg">{feature.icon}</div>
              <div>
                <CardTitle className="font-headline text-2xl">
                  {feature.title}
                </CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link href={feature.href}>
                  {feature.cta}
                  <ArrowRight className="ml-2 size-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
