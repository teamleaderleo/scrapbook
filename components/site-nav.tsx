import Link from 'next/link';
import { Button } from "@/components/ui/button";
import HardcodedStickyNote from '@/components/hardcoded-sticky-note';
// import { HeaderConnectionStatus } from '@/components/connection-status';
import { Book, Box, Twitter, Github, Sparkles, Brain, FileText } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { RedditIcon } from './icons/reddit-icon';
import { GitHubIcon } from './icons/github-icon';

export default function SiteNav() {
  return (
    <nav className="bg-background text-foreground border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-12 items-center">
          <div className="w-1/3">
            <Link href="/" className="text-lg font-bold">teamleaderleo</Link>
          </div>
          <div className="w-1/3 flex justify-center gap-4">
            <Link href="/resume" className="text-sm hover:text-muted-foreground flex items-center gap-1">
              <FileText size={14} />
              <span>resume</span>
            </Link>
            <Link href="/space" className="text-sm hover:text-muted-foreground flex items-center gap-1">
              <Brain size={14} />
              <span>space</span>
            </Link>
            <Link href="/blog" className="text-sm hover:text-muted-foreground flex items-center gap-1">
              <Book size={14} />
              <span>blog</span>
            </Link>
            <Link 
              href="https://glossless.app/"
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm hover:text-purple-500 transition-colors flex items-center gap-1"
            >
              <Sparkles size={14} />
              <span>glossless</span>
            </Link>
            {/* TODO: Add real gallery */}
            <Link href="/gallery" className="text-sm hover:text-muted-foreground flex items-center gap-1">
              <Box size={14} />
              <span>cube</span>
            </Link>
            
            {/* Social Links */}
            <div className="flex items-center gap-4 ml-2 pl-2 border-l">
              <Link 
                href="https://twitter.com/teamleaderleo" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm hover:text-blue-500 transition-colors flex items-center gap-1"
                title="Twitter - Art posts"
              >
                {/* twitter forever */}
                <Twitter size={16} />
                <span>twitter</span>
              </Link>
              <Link 
                href="https://www.reddit.com/user/TeamLeaderLeo/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm hover:text-orange-500 transition-colors flex items-center gap-1 relative z-10"
                title="Reddit - Thoughts and art commentary"
              >
                <RedditIcon className="w-4 h-4" />
                <span>reddit</span>
              </Link>
              <Link 
                href="https://github.com/teamleaderleo/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm hover:text-muted-foreground transition-colors flex items-center gap-1 relative z-10"
                title="GitHub - Code projects"
              >
                <GitHubIcon className="w-4 h-4" />
                <span className="pointer-events-none">github</span>
              </Link>
            </div>
          </div>
          <div className="w-1/3 flex justify-end items-center gap-3">
            {/* <HeaderConnectionStatus /> */}
            <ThemeToggle />
            {/* <Link href="/dashboard">
              <Button variant="secondary" size="sm" className="bg-black text-white hover:bg-gray-800 text-xs py-1 px-2">
                Open App
              </Button>
            </Link>
            <div className="absolute left-0 right-0 top-8">
              <div className="flex justify-end">
                <HardcodedStickyNote />
              </div>
            </div> */}
          </div>
        </div>
      </div>
    </nav>
  );
}