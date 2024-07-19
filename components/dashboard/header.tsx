'use client';

import React from 'react';
import { inter } from '@/components/ui/fonts';
import { usePathname } from 'next/navigation';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

const Header: React.FC = () => {
  const pathname = usePathname();
  const pathSegments = pathname.split('/').filter(segment => segment);

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  const title = pathSegments.length > 0 
    ? capitalize(pathSegments[pathSegments.length - 1])
    : 'Dashboard';

  return (
    <header className="bg-white border-b border-gray-200 p-4">
      <div className="flex justify-between items-center">
        <Breadcrumb className="text-base">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">Home</BreadcrumbLink>
            </BreadcrumbItem>
            {pathSegments.map((segment, index) => (
              <React.Fragment key={index}>
                {segment !== 'dashboard' && (
                  <>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      {index === pathSegments.length - 1 ? (
                        <BreadcrumbPage>{capitalize(segment)}</BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink href={`/${pathSegments.slice(0, index + 1).join('/')}`}>
                          {capitalize(segment)}
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                  </>
                )}
              </React.Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
        <h1 className={`${inter.className} text-2xl font-semibold header-title`}>
          {title}
        </h1>
      </div>
    </header>
  );
};

export default Header;