'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function RootPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.replace('/dashboard');
      } else {
        router.replace('/login');
      }
    }
  }, [user, loading, router]);

  return (
    <div className="flex items-center justify-center min-h-screen background: var(--bg-main)">
      <div className="flex flex-col items-center gap-4">
        <i className="fa-solid fa-graduation-cap fa-spin text-4xl text-[var(--primary)]"></i>
        <p className="text-sm font-semibold text-[var(--text-muted)]">Cargando Sistema...</p>
      </div>
    </div>
  );
}
