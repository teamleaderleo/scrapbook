import NextAuth from 'next-auth';
import GoogleProvider from "next-auth/providers/google";
import GithubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import { authConfig } from './auth.config';
import { sql } from '@vercel/postgres';
import { z } from 'zod';
import type { Account } from '@/app/lib/definitions';
import bcrypt from 'bcrypt';

async function getUser(email: string): Promise<Account | undefined> {
  try {
    const user = await sql<Account>`SELECT * FROM account WHERE email=${email}`;
    return user.rows[0];
  } catch (error) {
    console.error('Failed to fetch user:', error);
    throw new Error('Failed to fetch user.');
  }
}

export const { auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GithubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
    CredentialsProvider({
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials);

        if (parsedCredentials.success) {
          const { email, password } = parsedCredentials.data;
          const user = await getUser(email);
          if (!user) return null;
          const passwordsMatch = await bcrypt.compare(password, user.password || '');
          if (passwordsMatch) return user;
        }
        console.log('Invalid credentials');
        return null;
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google' || account?.provider === 'github') {
        const existingUser = await getUser(user.email!);
        if (existingUser) {
          // User exists, update last login
          await sql`
            UPDATE account
            SET last_login = CURRENT_TIMESTAMP, 
                provider = ${account.provider},
                provider_account_id = ${account.providerAccountId}
            WHERE email = ${user.email}
          `;
        } else {
          // New user, create account
          await sql`
            INSERT INTO account (id, name, email, provider, provider_account_id, last_login)
            VALUES (${user.id}, ${user.name}, ${user.email}, ${account.provider}, ${account.providerAccountId}, CURRENT_TIMESTAMP)
          `;
        }
      }
      return true;
    },
  },
});