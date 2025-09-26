'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Folder, 
  Image, 
  Tag, 
  Settings,
  Brain
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';

const links = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Projects', href: '/dashboard/projects', icon: Folder },
  { name: 'Space', href: '/dashboard/space', icon: Brain },
  // { name: 'Blocks', href: '/dashboard/blocks', icon: Image },
  // { name: 'Tags', href: '/dashboard/tags', icon: Tag },
  // { name: 'Portfolio', href: '/dashboard/portfolio', icon: Image },
  // { name: 'Discord', href: '/dashboard/discord', icon: Image },
  // { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export default function NavLinks() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <TooltipProvider>
      <div className="flex flex-col items-center space-y-2 pt-2">
        {links.map((link) => {
          const LinkIcon = link.icon;
          const active = isActive(link.href);
          return (
            <Tooltip key={link.name}>
              <TooltipTrigger asChild>
                <Link
                  href={link.href}
                  className={cn(
                    'flex h-12 w-12 items-center justify-center rounded-3xl hover:rounded-2xl transition-all duration-300 ease-linear',
                    active 
                      ? 'bg-[#5865F2] text-white' 
                      : 'text-[#B5BAC1] hover:bg-[#36393f] hover:text-white'
                  )}
                >
                  <LinkIcon className="h-5 w-5" />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{link.name}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}