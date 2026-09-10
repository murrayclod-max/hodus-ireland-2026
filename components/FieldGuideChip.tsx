import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import { guideSlugForText } from '@/lib/guides';

// Sits beside a course name wherever one appears. Renders nothing for the
// courses that have no guide, so it can be dropped in unconditionally.
export default function FieldGuideChip({
  slug, courseName, size = 'sm', onDark = false,
}: {
  slug?: string | null;
  courseName?: string | null;
  size?: 'sm' | 'md';
  onDark?: boolean;
}) {
  const target = slug && ['rcd', 'portrush'].includes(slug) ? slug : guideSlugForText(courseName);
  if (!target) return null;

  return (
    <Link
      href={`/courses/${target}/guide`}
      onClick={e => e.stopPropagation()}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        fontSize: size === 'md' ? '0.72rem' : '0.62rem',
        fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase',
        padding: size === 'md' ? '4px 9px' : '2px 7px',
        borderRadius: 'var(--r-pill)', textDecoration: 'none', whiteSpace: 'nowrap',
        background: onDark ? 'rgba(255,255,255,0.16)' : 'rgba(201,162,75,0.16)',
        color: onDark ? '#fff' : '#7a5a1a',
        border: `1px solid ${onDark ? 'rgba(255,255,255,0.28)' : 'rgba(201,162,75,0.5)'}`,
      }}
    >
      <BookOpen size={size === 'md' ? 13 : 11} strokeWidth={2.4} />
      Field Guide
    </Link>
  );
}
