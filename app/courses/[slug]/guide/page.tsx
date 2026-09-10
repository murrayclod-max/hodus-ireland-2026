import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { guideFor } from '@/lib/guides';
import GuideClient from './GuideClient';

export const revalidate = 3600;

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const guide = guideFor(slug);
  if (!guide) notFound();

  return (
    <div>
      <div className="page-header">
        <div className="wrap">
          <h1 style={{ fontSize: '1.5rem' }}>{guide.name}</h1>
          <p className="sub">
            Field Guide · {guide.tees} · Par {guide.par} · {guide.yards.toLocaleString()} yds
          </p>
        </div>
      </div>
      <GuideClient guide={guide} />
    </div>
  );
}
