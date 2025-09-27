import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith('/dashboard');
      const isOnLandingPage = nextUrl.pathname === '/';
      
      // TODO: deal with this situation
      // Blog is only public route for now
      const isPublicRoute = nextUrl.pathname.startsWith('/blog');
      const isSpaceRoute = nextUrl.pathname.startsWith('/space');
      const isGalleryRoute = nextUrl.pathname.startsWith('/gallery');

      if (isOnDashboard) {
        if (isLoggedIn) return true;
        return false; // Redirect unauthenticated users to login page
      } else if (isOnLandingPage || isPublicRoute || isGalleryRoute || isSpaceRoute ) {
        return true; // Allow access to landing page and blog
      } else if (isLoggedIn) {
        return Response.redirect(new URL('/dashboard', nextUrl));
      }
      return true;
    },
  },
  providers: [], // configured in auth.ts
  secret: process.env.AUTH_SECRET,
} satisfies NextAuthConfig;