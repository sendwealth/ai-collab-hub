'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');

      if (!token) {
        // No token found, redirect to login
        router.push('/login');
        return;
      }

      try {
        // Validate token with backend
        const response = await fetch('http://localhost:3000/api/v1/auth/me', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          setAuthenticated(true);
        } else {
          // Token invalid, clear and redirect
          localStorage.removeItem('token');
          sessionStorage.removeItem('token');
          router.push('/login');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        // On error, still allow access (fail open)
        setAuthenticated(true);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-gray-600">验证身份中...</p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return null;
  }

  return <>{children}</>;
}
