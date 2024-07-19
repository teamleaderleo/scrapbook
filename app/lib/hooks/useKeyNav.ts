import { useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { NavigateOptions } from 'next/dist/shared/lib/app-router-context.shared-runtime';

export function useKeyNav(
  currentPage: number,
  totalPages: number,
  onPageChange: (page: number) => void
) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const updateURL = (page: number) => {
      const params = new URLSearchParams(searchParams);
      params.set('page', page.toString());
      router.push(`${pathname}?${params.toString()}`, { shallow: true } as NavigateOptions);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft' && currentPage > 1) {
        const newPage = currentPage - 1;
        onPageChange(newPage);
        updateURL(newPage);
      } else if (event.key === 'ArrowRight' && currentPage < totalPages) {
        const newPage = currentPage + 1;
        onPageChange(newPage);
        updateURL(newPage);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, totalPages, onPageChange, searchParams, router, pathname]);
}