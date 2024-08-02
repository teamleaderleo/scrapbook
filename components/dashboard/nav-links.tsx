'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Folder, 
  Image, 
  Tag, 
  Settings 
} from 'lucide-react';

const links = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Projects', href: '/dashboard/projects', icon: Folder },
  { name: 'Blocks', href: '/dashboard/blocks', icon: Image },
  { name: 'Tags', href: '/dashboard/tags', icon: Tag },
  { name: 'Portfolio', href: '/dashboard/portfolio', icon: Image },
  { name: 'Discord', href: '/dashboard/discord', icon: Image },
  // { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export default function NavLinks() {
  const pathname = usePathname();

  return (
    <>
      {links.map((link) => {
        const LinkIcon = link.icon;
        return (
          <Link
            key={link.name}
            href={link.href}
            className={cn(
              'flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-gray-700 hover:text-white',
              pathname === link.href ? 'bg-gray-800 text-white' : 'text-white-800'
            )}
          >
            <LinkIcon className="h-5 w-5" />
            <span>{link.name}</span>
          </Link>
        );
      })}
    </>
  );
}