import { createServiceClient } from '@/lib/supabase/server';
import { LASS_QUEUE, PROMPT_TEMPLATE } from '@/lib/lass-queue';

// Gemini image generation model — confirmed from local MCP server config
const GEMINI_IMAGE_MODEL = 'gemini-3.1-flash-image-preview';

interface GenerateResult {
  success: boolean;
  dayNumber?: number;
  imageUrl?: string;
  error?: string;
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
    // Find all day_numbers already in the table (any status)
    const { data: used } = await service
      .from('lass_of_the_day')
      .select('day_number');
    const usedSet = new Set((used ?? []).map((r: { day_number: number }) => r.day_number));
    spec = LASS_QUEUE.find(s => !usedSet.has(s.day_number));
    if (!spec) return { success: false, error: 'All day specs have been used' };
  }

  const prompt = PROMPT_TEMPLATE(spec.profession, spec.county);

  // ── Call Gemini image generation API ─────────────────────────────────────
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
    });
    return { success: false, error: msg };
  }

  // ── Upload to Supabase Storage ─────────────────────────────────────────────
  const ext = mimeType.includes('jpeg') ? 'jpg' : 'png';
  const fileName = `day-${spec.day_number}.${ext}`;
  const imageBytes = Buffer.from(base64Image, 'base64');

  const { error: uploadError } = await service.storage
    .from('lass-of-the-day')
    .upload(fileName, imageBytes, {
      contentType: mimeType,
      upsert: true,
    });

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



  // ── Insert DB row (upsert on day_number to support regenerate) ─────────────
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
        created_at: new Date().toISOString(),
      },
      { onConflict: 'day_number' }
    );

  if (dbError) return { success: false, error: dbError.message };

  return { success: true, dayNumber: spec.day_number, imageUrl: publicUrl };
}
