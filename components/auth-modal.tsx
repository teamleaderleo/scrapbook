// import React, { useState } from 'react';
// import { X, User, Mail, Lock, LogIn, UserPlus } from 'lucide-react';
// import { useAuth } from '@/app/lib/hooks/useAuth';
// import { supabase } from '@/app/lib/db/supabase';

// interface AuthModalProps {
//   isOpen: boolean;
//   onClose: () => void;
// }

// export function AuthModal({ isOpen, onClose }: AuthModalProps) {
//   const [isSignUp, setIsSignUp] = useState(false);
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const { signIn, signUp } = useAuth();

//   if (!isOpen) return null;

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setLoading(true);
//     setError(null);

//     try {
//       const { error } = isSignUp 
//         ? await signUp(email, password)
//         : await signIn(email, password);

//       if (error) {
//         setError(error.message);
//       } else {
//         onClose();
//         setEmail('');
//         setPassword('');
//       }
//     } catch (err) {
//       setError('An unexpected error occurred');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleOAuthSignIn = async (provider: 'google' | 'github') => {
//     setLoading(true);
//     setError(null);
//     try {
//       const { error } = await supabase.auth.signInWithOAuth({
//         provider: provider,
//         options: {
//           redirectTo: `${window.location.origin}/space`, // Dynamically use current origin/Goes back to wherever we started
//         },
//       });
  
//       if (error) {
//         console.error('OAuth error:', error);
//         setError(error.message);
//       }
//     } catch (err) {
//       console.error('OAuth exception:', err);
//       setError('An unexpected error occurred during OAuth sign-in');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//       <div className="bg-white border-4 border-black p-8 max-w-md w-full mx-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
//         <div className="flex items-center justify-between mb-6">
//           <div className="flex items-center space-x-3">
//             <div className="p-3 bg-blue-500 border-3 border-black">
//               <User className="w-5 h-5 text-white" />
//             </div>
//             <div>
//               <h2 className="text-xl font-black text-black uppercase">
//                 {isSignUp ? 'Create Account' : 'Sign In'}
//               </h2>
//               <p className="text-xs font-bold text-black uppercase">
//                 {isSignUp ? 'Join Glossless' : 'Welcome back'}
//               </p>
//             </div>
//           </div>
//           <button
//             title='Close'
//             onClick={onClose}
//             className="p-2 bg-red-500 border-3 border-black text-white hover:bg-red-400 transition-all duration-100 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-0 active:translate-y-0 active:shadow-none"
//           >
//             <X className="w-4 h-4" />
//           </button>
//         </div>

//         <form onSubmit={handleSubmit} className="space-y-6">
//           <div>
//             <label className="block text-sm font-black text-black mb-2 uppercase">
//               <Mail className="w-4 h-4 inline mr-2" />
//               Email
//             </label>
//             <input
//               type="email"
//               value={email}
//               onChange={(e) => setEmail(e.target.value)}
//               className="w-full p-3 border-3 border-black text-black font-bold focus:outline-none focus:bg-yellow-100"
//               placeholder="your@email.com"
//               required
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-black text-black mb-2 uppercase">
//               <Lock className="w-4 h-4 inline mr-2" />
//               Password
//             </label>
//             <input
//               type="password"
//               value={password}
//               onChange={(e) => setPassword(e.target.value)}
//               className="w-full p-3 border-3 border-black text-black font-bold focus:outline-none focus:bg-yellow-100"
//               placeholder="••••••••"
//               required
//               minLength={6}
//             />
//           </div>

//           {error && (
//             <div className="bg-red-300 border-3 border-black p-3 text-black font-bold">
//               {error}
//             </div>
//           )}

//           <button
//             type="submit"
//             disabled={loading}
//             className="w-full p-4 bg-green-500 border-3 border-black text-white font-black uppercase tracking-wide hover:bg-green-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-100 hover:translate-x-[-3px] hover:translate-y-[-3px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-0 active:translate-y-0 active:shadow-none flex items-center justify-center space-x-2"
//           >
//             {isSignUp ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
//             <span>{loading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Sign In')}</span>
//           </button>

//           <div className="text-center">
//             <button
//               type="button"
//               onClick={() => setIsSignUp(!isSignUp)}
//               className="text-sm font-bold text-black hover:text-blue-600 uppercase"
//             >
//               {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
//             </button>
//           </div>
//         </form>

//         <div className="mt-6 space-y-3">
//           <div className="text-center text-xs font-bold text-black uppercase mb-3">
//             Or continue with
//           </div>
          
//           <button
//             onClick={() => handleOAuthSignIn('google')}
//             disabled={loading}
//             className="w-full p-3 bg-red-500 border-3 border-black text-white font-black uppercase tracking-wide hover:bg-red-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-100 hover:translate-x-[-3px] hover:translate-y-[-3px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-0 active:translate-y-0 active:shadow-none flex items-center justify-center space-x-2"
//           >
//             <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
//               <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
//               <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
//               <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
//               <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
//             </svg>
//             <span>Sign in with Google</span>
//           </button>
          
//           <button
//             onClick={() => handleOAuthSignIn('github')}
//             disabled={loading}
//             className="w-full p-3 bg-gray-800 border-3 border-black text-white font-black uppercase tracking-wide hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-100 hover:translate-x-[-3px] hover:translate-y-[-3px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-0 active:translate-y-0 active:shadow-none flex items-center justify-center space-x-2"
//           >
//             <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
//               <path fillRule="evenodd" clipRule="evenodd" d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.207 11.387.6.11.82-.26.82-.58 0-.28-.01-1.02-.01-2.002-3.337.725-4.042-1.61-4.042-1.61-.546-1.387-1.334-1.757-1.334-1.757-1.09-.745.083-.73.083-.73 1.205.085 1.838 1.238 1.838 1.238 1.07 1.833 2.809 1.304 3.49.997.108-.775.418-1.304.762-1.604-2.665-.304-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.125-.304-.535-1.52.117-3.176 0 0 1.008-.323 3.301 1.23.957-.266 1.983-.4 3.003-.404 1.02.004 2.046.138 3.003.404 2.29-1.553 3.297-1.23 3.297-1.23.652 1.656.242 2.872.117 3.176.77.84 1.235 1.91 1.235 3.22 0 4.61-2.805 5.62-5.475 5.92.43.37.82 1.1.82 2.22 0 1.604-.01 2.896-.01 3.286 0 .32.21.69.825.57C20.565 21.8 24 17.3 24 12c0-6.63-5.37-12-12-12z"/>
//             </svg>
//             <span>Sign in with GitHub</span>
//           </button>
//         </div>

//         {isSignUp && (
//           <div className="mt-6 bg-blue-100 border-3 border-black p-4">
//             <div className="text-xs font-bold text-black space-y-1">
//               <div className="font-black uppercase mb-2">Free Account Benefits:</div>
//               <div>• 50 AI pose predictions per month</div>
//               <div>• Unlimited cloud project storage</div>
//               <div>• Access to all editing tools</div>
//               <div>• Export to JSON format</div>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }