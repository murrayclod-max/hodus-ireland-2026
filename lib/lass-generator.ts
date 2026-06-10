import { createServiceClient } from '@/lib/supabase/server';
import { LASS_QUEUE, PROMPT_TEMPLATE } from '@/lib/lass-queue';

const GEMINI_IMAGE_MODEL = 'gemini-3.1-flash-image-preview';

interface GenerateResult {
  success: boolean;
  dayNumber?: number;
  imageUrl?: string;
  error?: string;
}

// Build a feedback string from historical vote data to steer the next generation.
async function buildVoteContext(service: Awaited<ReturnType<typeof createServiceClient>>): Promise<string> {
  const { data: lasses } = await service
    .from('lass_of_the_day')
    .select('day_number, profession, county, lass_votes(vote)')
    .eq('status', 'published');

  if (!lasses?.length) return '';

  type Scored = { day: number; profession: string; county: string; score: number; count: number };

  const scored: Scored[] = lasses
    .map((l: { day_number: number; profession: string; county: string; lass_votes: { vote: number }[] }) => ({
      day: l.day_number,
      profession: l.profession,
      county: l.county,
      score: (l.lass_votes ?? []).reduce((s: number, v: { vote: number }) => s + v.vote, 0),
      count: (l.lass_votes ?? []).length,
    }))
    .filter((l: Scored) => l.count >= 2); // ignore lasses without meaningful votes

  if (!scored.length) return '';

  scored.sort((a, b) => b.score - a.score);

  const top    = scored.filter(l => l.score > 0).slice(0, 3);
  const bottom = scored.filter(l => l.score < 0).slice(-3).reverse();

  const parts: string[] = ['[VOTER FEEDBACK — use this to dial in the next image]:'];

  if (top.length) {
    parts.push(
      `The lads LOVED these (highest votes — replicate these vibes): ` +
      top.map(l => `Day ${l.day} ${l.profession} in ${l.county} (+${l.score})`).join(', ') + '.'
    );
  }
  if (bottom.length) {
    parts.push(
      `The lads were NOT feeling these (lowest votes — avoid these patterns): ` +
      bottom.map(l => `Day ${l.day} ${l.profession} in ${l.county} (${l.score})`).join(', ') + '.'
    );
  }

  parts.push('Maximise what scored highest. Learn from what flopped.');

  return '\n\n' + parts.join(' ');
}

export async function generateLassOfTheDay(
  overrideDayNumber?: number
): Promise<GenerateResult> {
  const service = await createServiceClient();

  // ── Determine which day spec to use ────────────────────────────────────────
  let spec;
  if (overrideDayNumber != null) {
    spec = LASS_QUEUE.find(s => s.day_number === overrideDayNumber);
    if (!spec) return { success: false, error: `No spec for day ${overrideDayNumber}` };
  } else {
    const { data: used } = await service.from('lass_of_the_day').select('day_number');
    const usedSet = new Set((used ?? []).map((r: { day_number: number }) => r.day_number));
    spec = LASS_QUEUE.find(s => !usedSet.has(s.day_number));
    if (!spec) return { success: false, error: 'All day specs have been used' };
  }

  // ── Build prompt with vote feedback appended ────────────────────────────────
  const voteContext = await buildVoteContext(service);
  const prompt = PROMPT_TEMPLATE(spec.profession, spec.county, spec.twist) + voteContext;

  // ── Call Gemini image generation API ───────────────────────────────────────
  let base64Image: string;
  let mimeType = 'image/png';
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY env var not set');

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_IMAGE_MODEL}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseModalities: ['IMAGE'] },
        }),
      }
    );

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Gemini image API ${res.status}: ${body}`);
    }

    const json = await res.json() as {
      candidates: Array<{
        content: { parts: Array<{ inlineData?: { mimeType: string; data: string } }> };
      }>;
    };

    const part = json.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    if (!part?.inlineData) throw new Error('No image data in Gemini response');
    base64Image = part.inlineData.data;
    mimeType = part.inlineData.mimeType ?? 'image/png';
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await service.from('lass_of_the_day').insert({
      day_number: spec.day_number,
      profession: spec.profession,
      county: spec.county,
      prompt,
      status: 'failed',
      fun_fact: spec.fun_fact,
      famous_irish: spec.famous_irish,
    });
    return { success: false, error: msg };
  }

  // ── Upload to Supabase Storage ──────────────────────────────────────────────
  const ext = mimeType.includes('jpeg') ? 'jpg' : 'png';
  const fileName = `day-${spec.day_number}.${ext}`;
  const imageBytes = Buffer.from(base64Image, 'base64');

  const { error: uploadError } = await service.storage
    .from('lass-of-the-day')
    .upload(fileName, imageBytes, { contentType: mimeType, upsert: true });

  if (uploadError) {
    await service.from('lass_of_the_day').insert({
      day_number: spec.day_number,
      profession: spec.profession,
      county: spec.county,
      prompt,
      status: 'failed',
    });
    return { success: false, error: uploadError.message };
  }

  const { data: { publicUrl } } = service.storage
    .from('lass-of-the-day')
    .getPublicUrl(fileName);

  // ── Upsert DB row ───────────────────────────────────────────────────────────
  const { error: dbError } = await service
    .from('lass_of_the_day')
    .upsert(
      {
        day_number: spec.day_number,
        profession: spec.profession,
        county: spec.county,
        prompt,
        image_url: publicUrl,
        status: 'published',
        fun_fact: spec.fun_fact,
        famous_irish: spec.famous_irish,
        created_at: new Date().toISOString(),
      },
      { onConflict: 'day_number' }
    );

  if (dbError) return { success: false, error: dbError.message };

  return { success: true, dayNumber: spec.day_number, imageUrl: publicUrl };
}
