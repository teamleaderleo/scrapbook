'use client';

import { GitHubIcon } from '@/components/icons/github-icon';
import { GoogleIcon } from '@/components/icons/google-icon';
import { Button } from '@/components/ui/button';
import { createClient } from '@/utils/supabase/client';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';

type OAuthProvider = 'google' | 'github';

export function MachineHealthAccess({
  hasOwnerSignIn,
  hasRecoveryToken,
}: {
  hasOwnerSignIn: boolean;
  hasRecoveryToken: boolean;
}) {
  const [loadingProvider, setLoadingProvider] = useState<OAuthProvider | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  const signIn = async (provider: OAuthProvider) => {
    setLoadingProvider(provider);
    setError(null);
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent('/machine-health')}`,
      },
    });

    if (signInError) {
      console.error('Big Red OAuth error:', signInError);
      setError('Sign-in could not start. Try again in a moment.');
      setLoadingProvider(null);
    }
  };

  return (
    <main className="grid min-h-[100dvh] place-items-center bg-[#e9e4da] px-4 py-12 text-[#2d2a26] dark:bg-[#17191d] dark:text-[#f2eee6]">
      <section className="w-full max-w-sm rounded-2xl border border-[#b9ad9d] bg-[#fffdf8] p-6 shadow-[0_1rem_3rem_#453d3020] dark:border-[#51545a] dark:bg-[#22252a]">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#a8342e] dark:text-[#ef8c83]">
          Atlas · Big Red
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          {hasOwnerSignIn ? 'Sign in to see Big Red' : 'Open Big Red'}
        </h1>
        {hasOwnerSignIn ? (
          <p className="mt-2 text-sm leading-6 text-[#6d6459] dark:text-[#b9b4aa]">
            Use Leo&apos;s existing site account. If you&apos;re already signed
            in, Big Red opens without another prompt.
          </p>
        ) : null}

        {hasOwnerSignIn ? (
          <div className="mt-6 grid gap-3">
            <Button
              type="button"
              size="lg"
              onClick={() => signIn('google')}
              disabled={loadingProvider !== null}
              className="w-full rounded-xl bg-[#a8342e] text-white hover:bg-[#8f2c27]"
            >
              {loadingProvider === 'google' ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <GoogleIcon className="h-4 w-4" aria-hidden="true" />
              )}
              Continue with Google
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => signIn('github')}
              disabled={loadingProvider !== null}
              className="w-full rounded-xl border-[#9f9485] bg-transparent dark:border-[#6a6d73]"
            >
              {loadingProvider === 'github' ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <GitHubIcon className="h-4 w-4" aria-hidden="true" />
              )}
              Continue with GitHub
            </Button>
          </div>
        ) : null}

        {error ? (
          <p
            className="mt-4 text-sm text-[#a8342e] dark:text-[#ef8c83]"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        {hasRecoveryToken ? (
          <details
            className={`${hasOwnerSignIn ? 'mt-6 border-t pt-4' : 'mt-4'} border-[#b9ad9d]/70 text-sm dark:border-[#51545a]`}
            open={!hasOwnerSignIn}
          >
            <summary className="cursor-pointer text-[#6d6459] dark:text-[#b9b4aa]">
              Use recovery token
            </summary>
            <form
              method="post"
              action="/machine-health/access/token"
              className="mt-3"
            >
              <label htmlFor="token" className="sr-only">
                Big Red recovery token
              </label>
              <input
                id="token"
                name="token"
                type="password"
                autoComplete="current-password"
                required
                className="min-h-11 w-full rounded-xl border border-[#9f9485] bg-transparent px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-[#a8342e] dark:border-[#6a6d73]"
              />
              <Button
                type="submit"
                variant="outline"
                className="mt-3 w-full rounded-xl"
              >
                Open with recovery token
              </Button>
            </form>
          </details>
        ) : null}
      </section>
    </main>
  );
}
