export const shortcuts = [
  { label: 'Recently updated', href: '/space?tags=order:recent' },
  { label: 'Due (optional)', href: '/space?tags=is:due+order:fsrs' },
  {
    label: 'Implement / extend',
    href: '/space?lane=interview&tags=mode:implement',
  },
  {
    label: 'Review patches',
    href: '/space?lane=interview&tags=mode:review',
  },
  {
    label: 'Debug failures',
    href: '/space?lane=interview&tags=mode:debug',
  },
  {
    label: 'Design / stress',
    href: '/space?lane=interview&tags=mode:design',
  },
  {
    label: 'Project deep dives',
    href: '/space?lane=interview&tags=mode:deep-dive',
  },
  {
    label: 'Typing scales',
    href: '/space?tags=mode:typing+order:recent',
  },
];
