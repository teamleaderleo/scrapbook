function quote(value) {
  return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

function field(name, value, indent = '    ') {
  return `${indent}${name}: ${quote(value)},`;
}

export function formatVisit(proposal) {
  const lines = [
    '  {',
    field('id', proposal.entryId),
    field('name', proposal.name),
    field('mark', proposal.mark),
    field('note', proposal.note),
    field('date', proposal.date),
    field('mode', proposal.mode),
    field('repository', proposal.repository),
  ];
  if (proposal.model) lines.push(field('model', proposal.model));
  lines.push(
    '    source: {',
    field('label', proposal.sourceLabel, '      '),
    field('href', proposal.sourceHref, '      '),
    '    },',
  );
  if (proposal.conversationHref) {
    lines.push(
      '    conversation: {',
      field('label', proposal.conversationLabel, '      '),
      field('href', proposal.conversationHref, '      '),
      '    },',
    );
  }
  if (proposal.artwork === 'card') {
    lines.push(
      '    image: {',
      field('src', `/gallery/agents/${proposal.entryId}.webp`, '      '),
      field('alt', proposal.imageAlt, '      '),
      '    },',
    );
  }
  lines.push('  },');
  return lines.join('\n');
}

export function containsEntry(content, entryId) {
  const escaped = entryId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\bid:\\s*['\"]${escaped}['\"]`).test(content);
}

export function insertVisit(content, proposal) {
  const marker = 'const visits = [\n';
  const markerIndex = content.indexOf(marker);
  if (markerIndex === -1) throw new Error('Guestbook array marker is missing.');
  const block = formatVisit(proposal);
  if (containsEntry(content, proposal.entryId)) {
    if (content.includes(block)) return { content, changed: false, status: 'already-saved' };
    throw new Error(`Guestbook entry ${proposal.entryId} already exists with different content.`);
  }
  const insertionPoint = markerIndex + marker.length;
  return {
    content: `${content.slice(0, insertionPoint)}${block}\n${content.slice(insertionPoint)}`,
    changed: true,
    status: 'saved',
  };
}
