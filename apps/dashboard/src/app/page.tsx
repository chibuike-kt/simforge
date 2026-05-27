'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DocsPage from './docs/page';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    if (localStorage.getItem('sf_token')) {
      router.replace('/dashboard');
    }
  }, [router]);

  return <DocsPage />;
}
