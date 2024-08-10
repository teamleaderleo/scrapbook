// import { useEffect } from 'react';
// import { useRouter, usePathname, useSearchParams } from 'next/navigation';
// import { NavigateOptions } from 'next/dist/shared/lib/app-router-context.shared-runtime';

// export function useKeyNav(
//   currentPage: number,
//   totalPages: number,
//   onPageChange: (page: number) => void,
//   loopPages: boolean = false
// ) {
//   const router = useRouter();
//   const pathname = usePathname();
//   const searchParams = useSearchParams();

//   useEffect(() => {
//     if (typeof window === 'undefined') return; // Skip on server-side
    
//     const updateURL = (page: number) => {
//       const params = new URLSearchParams(searchParams);
//       params.set('page', page.toString());
//       router.push(`${pathname}?${params.toString()}`, { shallow: true } as NavigateOptions);
//     };

//     const handleKeyDown = (event: KeyboardEvent) => {
//       let newPage = currentPage;

//       if (event.key === 'ArrowLeft') {
//         newPage = loopPages && currentPage === 1 ? totalPages : Math.max(1, currentPage - 1);
//       } else if (event.key === 'ArrowRight') {
//         newPage = loopPages && currentPage === totalPages ? 1 : Math.min(totalPages, currentPage + 1);
//       }

//       if (newPage !== currentPage) {
//         onPageChange(newPage);
//         updateURL(newPage);
//       }
//     };

//     window.addEventListener('keydown', handleKeyDown);
//     return () => window.removeEventListener('keydown', handleKeyDown);
//   }, [currentPage, totalPages, onPageChange, searchParams, router, pathname, loopPages]);
// }