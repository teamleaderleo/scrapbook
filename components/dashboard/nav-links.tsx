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
    <div className="flex flex-col items-center space-y-4 py-4">
      {links.map((link) => {
        const LinkIcon = link.icon;
        return (
          <Link
            key={link.name}
            href={link.href}
            className={cn(
              'w-12 h-12 flex items-center justify-center bg-gray-700 hover:bg-gray-600 text-white rounded-2xl transition-all hover:rounded-xl',
              pathname === link.href ? 'bg-gray-600' : ''
            )}
            title={link.name}
          >
            <LinkIcon className="h-6 w-6" />
          </Link>
        );
      })}
    </div>
  );
}