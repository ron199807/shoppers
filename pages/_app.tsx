import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import Navbar from '../components/common/Navbar';
import { Toaster } from 'react-hot-toast';

export default function App({ Component, pageProps }: AppProps) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const { error } = await supabase.auth.getUser();
          if (error) {
            console.error('Session validation failed:', error);
            await supabase.auth.signOut();
          }
        }
      } catch (err) {
        console.error('Auth init error:', err);
      } finally {
        setIsReady(true);
      }
    };

    initAuth();
  }, []);

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-right" />
      <Navbar />
      <Component {...pageProps} />
    </>
  );
}