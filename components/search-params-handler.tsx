'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

interface SearchParamsHandlerProps {
  onSearchChange: (query: string) => void;
  onPageChange: (page: number) => void;
}

export function SearchParamsHandler({ onSearchChange, onPageChange }: SearchParamsHandlerProps) {
  const searchParams = useSearchParams();

  useEffect(() => {
    const query = searchParams.get('query') || '';
    const page = Number(searchParams.get('page')) || 1;
    onSearchChange(query);
    onPageChange(page);
  }, [searchParams, onSearchChange, onPageChange]);

  return null;
}