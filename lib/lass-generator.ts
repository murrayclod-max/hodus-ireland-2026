import { createServiceClient } from '@/lib/supabase/server';
import { LASS_QUEUE, PROMPT_TEMPLATE } from '@/lib/lass-queue';

// ── Verify this model string at https://ai.google.dev/gemini-api/docs/imagen
// Imagen 4 Fast — announced Google I/O 2025. Confirm exact ID in the docs.
const IMAGEN_MODEL = 'imagen-4.0-fast-generate-001';

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

  // ── Call Google Imagen API ─────────────────────────────────────────────────
  let base64Image: string;
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY env var not set');

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${IMAGEN_MODEL}:predict?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instances: [{ prompt }],
          parameters: { sampleCount: 1, aspectRatio: '9:16' },
        }),
      }
    );

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Imagen API ${res.status}: ${body}`);
    }

    const json = await res.json() as {
      predictions: Array<{ bytesBase64Encoded: string; mimeType: string }>;
    };

    base64Image = json.predictions?.[0]?.bytesBase64Encoded;
    if (!base64Image) throw new Error('No image bytes in Imagen response');
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
  const fileName = `day-${spec.day_number}.png`;
  const imageBytes = Buffer.from(base64Image, 'base64');

  const { error: uploadError } = await service.storage
    .from('lass-of-the-day')
    .upload(fileName, imageBytes, {
      contentType: 'image/png',
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
