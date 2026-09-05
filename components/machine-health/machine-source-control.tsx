'use client';

export type MachineScope = 'all' | 'big-red' | 'macbook-air';

export function MachineSourceControl({
  value,
  onChange,
  label,
  allowAll = false,
}: {
  value: MachineScope;
  onChange: (value: MachineScope) => void;
  label: string;
  allowAll?: boolean;
}) {
  const choices: [MachineScope, string][] = [
    ...(allowAll ? [['all', 'Both'] as [MachineScope, string]] : []),
    ['big-red', 'Big Red'],
    ['macbook-air', 'Air Blue'],
  ];
  return (
    <div className="flex flex-wrap gap-3" role="group" aria-label={label}>
      {choices.map(([id, name]) => (
        <button
          key={id}
          type="button"
          aria-pressed={value === id}
          onClick={() => onChange(id)}
          className={`min-h-9 border-b px-1 text-xs focus-visible:outline-2 ${value === id ? 'border-current font-semibold' : 'border-transparent opacity-55 hover:opacity-100'}`}
        >
          {name}
        </button>
      ))}
    </div>
  );
}
