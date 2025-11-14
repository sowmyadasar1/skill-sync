
// src/app/signup/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// This page is deprecated in favor of social logins, which handle both
// sign-up and login in a single flow. Redirect any direct access to the login page.
export default function SignupPage() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/login');
  }, [router]);

  return null; // Render nothing while redirecting
}
