import { Artifact, ArtifactContent } from "./definitions/definitions";
import { StaticImageData } from 'next/image';
const defaultPlaceholder = require('../../public/placeholder-default.png');
const textPlaceholder = require('../../public/placeholder-text.png');
const filePlaceholder = require('../../public/placeholder-file.png');

export const formatDateToLocal = (
  dateStr: string,
  locale: string = 'en-US',
) => {
  const date = new Date(dateStr);
  const options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  };
  const formatter = new Intl.DateTimeFormat(locale, options);
  return formatter.format(date);
};

export const generatePagination = (currentPage: number, totalPages: number) => {
  // If the total number of pages is 7 or less,
  // display all pages without any ellipsis.
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  // If the current page is among the first 3 pages,
  // show the first 3, an ellipsis, and the last 2 pages.
  if (currentPage <= 3) {
    return [1, 2, 3, '...', totalPages - 1, totalPages];
  }

  // If the current page is among the last 3 pages,
  // show the first 2, an ellipsis, and the last 3 pages.
  if (currentPage >= totalPages - 2) {
    return [1, 2, '...', totalPages - 2, totalPages - 1, totalPages];
  }

  // If the current page is somewhere in the middle,
  // show the first page, an ellipsis, the current page and its neighbors,
  // another ellipsis, and the last page.
  return [
    1,
    '...',
    currentPage - 1,
    currentPage,
    currentPage + 1,
    '...',
    totalPages,
  ];
};

export const shimmer = (w: number, h: number) => `
  <svg width="${w}" height="${h}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <defs>
      <linearGradient id="g">
        <stop stop-color="#f3f4f6" offset="20%" />
        <stop stop-color="#fff" offset="50%" />
        <stop stop-color="#f3f4f6" offset="70%" />
      </linearGradient>
    </defs>
    <rect width="${w}" height="${h}" fill="#f3f4f6" />
    <rect id="r" width="${w}" height="${h}" fill="url(#g)" />
    <animate xlink:href="#r" attributeName="x" from="-${w}" to="${w}" dur="1s" repeatCount="indefinite"  />
  </svg>`;

export const toBase64 = (str: string) =>
  typeof window === 'undefined'
    ? Buffer.from(str).toString('base64')
    : window.btoa(str);

export const getBlurDataUrl = (w: number, h: number) => 
  `data:image/svg+xml;base64,${toBase64(shimmer(w, h))}`;

export const getArtifactThumbnail = (block: Artifact, index: number = 0): StaticImageData => {
  if (!block || !block.contents || block.contents.length === 0) {
    return defaultPlaceholder;
  }
  const content: ArtifactContent = block.contents[index];
  if (!content) {
    return defaultPlaceholder;
  }

  switch (content.type) {
    case 'image':
      return content.content ? { src: content.content, height: 40, width: 40 } : defaultPlaceholder;
    case 'text':
      return textPlaceholder;
    case 'file':
      return filePlaceholder;
    default:
      return defaultPlaceholder;
  }
};
