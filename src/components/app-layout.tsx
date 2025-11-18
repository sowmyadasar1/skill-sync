'use client';
import type { ReactNode } from 'react';
import { useEffect } from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home,
  Users,
  Lightbulb,
  Code,
  User,
  PanelLeft,
  LogOut,
  LogIn,
  Loader2,
  Users2,
  Search,
} from 'lucide-react';
import Link from 'next/link';
// ❌ Removed SkillyncLogo import
// import { SkillyncLogo } from './icons';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { useAuth } from '@/hooks/use-auth';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Skeleton } from './ui/skeleton';
import { useToast } from '@/hooks/use-toast';

const navItems = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/mentors', label: 'Mentors', icon: Users2 },
  { href: '/team-search', label: 'Team Search', icon: Search },
  { href: '/collaborate', label: 'Collaborate', icon: Users },
  { href: '/ask', label: 'Project Recommender', icon: Lightbulb },
  { href: '/resources', label: 'Resources', icon: Code },
];

const protectedRoutes = ['/dashboard', '/mentors', '/collaborate', '/ask', '/resources', '/profile', '/team-search'];

export function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, isLoading, isFirebaseEnabled } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleLogout = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      toast({ title: 'Logged Out', description: 'You have been successfully logged out.' });
      router.push('/');
    } catch (error) {
      toast({ title: 'Logout Failed', description: 'Something went wrong.', variant: 'destructive' });
    }
  };

  const isAuthPage = pathname === '/login' || pathname === '/signup';
  const isProtectedRoute = protectedRoutes.includes(pathname);
  const isLandingPage = pathname === '/';

  useEffect(() => {
    if (isFirebaseEnabled && !isLoading && !user && isProtectedRoute) {
      router.push('/login');
    }
    if (isFirebaseEnabled && !isLoading && user && isLandingPage) {
      router.push('/dashboard');
    }
  }, [isFirebaseEnabled, isLoading, user, isProtectedRoute, isLandingPage, router]);

  if (isAuthPage || (isLandingPage && !user)) {
    return (
      <main className="flex-1 overflow-y-auto">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            {/* SkillyncLogo removed */}
            <h2 className="text-xl font-bold font-headline">
              Skillync
            </h2>
          </Link>
          <div className="flex items-center gap-4 ml-auto">
            {!user && isFirebaseEnabled && (
              <Button asChild>
                <Link href="/login"><LogIn className="mr-2" /> Login</Link>
              </Button>
            )}
          </div>
        </header>
        {!isFirebaseEnabled && (
          <div className="w-full bg-destructive text-destructive-foreground p-3 text-center text-sm">
            Firebase is not configured. Please add your credentials to the <code>.env</code> file to enable authentication.
          </div>
        )}
        <div className="p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </main>
    );
  }

  if (isFirebaseEnabled && isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="size-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className='p-4'>
          <Link href="/dashboard" className="flex items-center gap-2">
            {/* SkillyncLogo removed */}
            <h2 className="text-xl font-bold font-headline group-data-[collapsible=icon]:hidden">
              Skillync
            </h2>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href}
                  tooltip={item.label}
                >
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            {user && isFirebaseEnabled && (
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === '/profile'}
                  tooltip="Profile"
                >
                  <Link href="/profile">
                    <User />
                    <span>Profile</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
          <SidebarTrigger className="md:hidden">
            <PanelLeft />
          </SidebarTrigger>
          <div className="flex items-center gap-4 ml-auto">
            {isLoading ? (
              <Skeleton className="h-10 w-10 rounded-full" />
            ) : user && isFirebaseEnabled ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar>
                      <AvatarImage src={user.photoURL || ''} alt={user.displayName || 'User'} />
                      <AvatarFallback>{user.displayName ? user.displayName.charAt(0) : user.email?.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>{user.displayName || user.email}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile"><User className="mr-2" />Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2" /> Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              isFirebaseEnabled && <Button asChild>
                <Link href="/login"><LogIn className="mr-2" /> Login</Link>
              </Button>
            )}
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {!isFirebaseEnabled && (
            <div className="bg-destructive text-destructive-foreground p-3 text-center text-sm mb-4 rounded-md">
              Firebase is not configured. Please add your credentials to the <code>.env</code> file. Authentication and database features are disabled.
            </div>
          )}
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
