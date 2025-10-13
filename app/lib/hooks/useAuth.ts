import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/client';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

export function useAuth(initialUser: User | null = null) {
  const supabase = createClient();
  
  const [authState, setAuthState] = useState<AuthState>({
    user: initialUser, // Start with server-provided user
    session: null,
    loading: initialUser === null, // Only loading if no initial user
  });

  useEffect(() => {
    // Only fetch if we don't have initial user
    if (initialUser === null) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setAuthState({
          user: session?.user ?? null,
          session,
          loading: false,
        });
      });
    }

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthState({
        user: session?.user ?? null,
        session,
        loading: false,
      });
    });

    return () => subscription.unsubscribe();
  }, [initialUser, supabase]);

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  return {
    ...authState,
    signOut,
  };
}