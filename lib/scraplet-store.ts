import { client } from '@/app/lib/db/db';

function petCountFromDatabase(value: unknown) {
  const parsed = typeof value === 'number' ? value : Number(String(value ?? '0'));
  if (!Number.isSafeInteger(parsed) || parsed < 0) {
    throw new Error('Scraplet pet count is outside the supported integer range.');
  }
  return parsed;
}

export async function getScrapletPetCount() {
  const rows = await client<[{ pet_count: string }?]>`
    SELECT pet_count::text AS pet_count
    FROM public.scraplet_pet_counter
    WHERE id = true
    LIMIT 1
  `;

  return rows[0] ? petCountFromDatabase(rows[0].pet_count) : 0;
}

export async function incrementScrapletPetCount() {
  const rows = await client<[{ pet_count: string }]>`
    INSERT INTO public.scraplet_pet_counter (id, pet_count, updated_at)
    VALUES (true, 1, now())
    ON CONFLICT (id) DO UPDATE
    SET
      pet_count = public.scraplet_pet_counter.pet_count + 1,
      updated_at = now()
    RETURNING pet_count::text AS pet_count
  `;

  return petCountFromDatabase(rows[0].pet_count);
}
