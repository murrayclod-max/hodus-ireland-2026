export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  });
}

export function formatDateTime(isoStr: string): string {
  return new Date(isoStr).toLocaleString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit', timeZoneName: 'short',
  });
}

export function formatTime(isoStr: string): string {
  return new Date(isoStr).toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit',
  });
}

export function initials(name: string): string {
  return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
}

export function railClass(railColor: string): string {
  const map: Record<string, string> = {
    '#7A1A2B': 'rail-rcd',
    '#163A5F': 'rail-portrush',
    '#11574B': 'rail-portstewart',
    '#0F5631': 'rail-stpats',
    '#4E2F6B': 'rail-otm',
  };
  return map[railColor] ?? '';
}

export function daysBetween(from: Date, to: Date): number {
  return Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
}

export function kindIcon(kind: string): string {
  return { travel: '✈', golf: '⛳', lodging: '🏨', note: '📌' }[kind] ?? '•';
}
