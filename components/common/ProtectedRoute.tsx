import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedUserType?: 'client' | 'shopper';
}

export default function ProtectedRoute({ children, allowedUserType }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (allowedUserType && profile?.user_type !== allowedUserType) {
        router.push('/');
      }
    }
  }, [user, profile, loading, router, allowedUserType]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (allowedUserType && profile?.user_type !== allowedUserType) {
    return null;
  }

  return <>{children}</>;
}