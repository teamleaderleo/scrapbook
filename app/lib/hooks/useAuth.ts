import { useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/client';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

export function useAuth(initialUser: User | null = null) {
  const [supabase] = useState(() => createClient());
  const [authState, setAuthState] = useState<AuthState>({
    user: initialUser,
    session: null,
    loading: initialUser === null,
  });

  useEffect(() => {
    if (initialUser === null) {
      void supabase.auth.getSession().then(({ data: { session } }) => {
        setAuthState({
          user: session?.user ?? null,
          session,
          loading: false,
        });
      });
    }

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
