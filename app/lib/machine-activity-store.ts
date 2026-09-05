import { client } from './db/db';
import {
  activitySnapshotSchema,
  publicActivitySnapshot,
  type ActivitySnapshot,
  type ActivityMonitorData,
} from './machine-activity';

export async function saveMachineActivity(snapshot: ActivitySnapshot) {
  const publicSnapshot = publicActivitySnapshot(snapshot);
  const minute = new Date(
    Math.floor(Date.parse(snapshot.checked_at) / 60000) * 60000
  ).toISOString();
  await client.begin(async sql => {
    await sql`
      INSERT INTO machine_activity_status (host, checked_at, payload)
      VALUES (${snapshot.host}, ${snapshot.checked_at}, ${sql.json(snapshot)}::jsonb)
      ON CONFLICT (host) DO UPDATE SET checked_at = EXCLUDED.checked_at, payload = EXCLUDED.payload
      WHERE machine_activity_status.checked_at <= EXCLUDED.checked_at
    `;
    await sql`
      INSERT INTO machine_activity_samples (host, minute, checked_at, payload)
      VALUES (${snapshot.host}, ${minute}, ${snapshot.checked_at}, ${sql.json(publicSnapshot)}::jsonb)
      ON CONFLICT (host, minute) DO UPDATE SET checked_at = EXCLUDED.checked_at, payload = EXCLUDED.payload
      WHERE machine_activity_samples.checked_at <= EXCLUDED.checked_at
    `;
    await sql`DELETE FROM machine_activity_samples WHERE minute < now() - interval '2 hours'`;
    // Remove old process names whenever either machine reports; reads also enforce expiry.
    await sql`UPDATE machine_activity_status SET payload = payload - 'processes' WHERE checked_at < now() - interval '15 minutes' AND payload ? 'processes'`;
  });
}

export async function readMachineActivity(
  privateAccess: boolean
): Promise<ActivityMonitorData> {
  const [latest, history] = await Promise.all([
    client<
      { payload: unknown }[]
    >`SELECT payload FROM machine_activity_status ORDER BY host`,
    client<
      { payload: unknown }[]
    >`SELECT payload FROM machine_activity_samples WHERE minute >= now() - interval '61 minutes' ORDER BY minute, host LIMIT 124`,
  ]);
  const now = Date.now();
  const parse = (payload: unknown) =>
    activitySnapshotSchema.parse({
      ...(payload as object),
      processes: (payload as ActivitySnapshot).processes ?? null,
    });
  return {
    observedAt: new Date(now).toISOString(),
    privateAccess,
    latest: latest.map(row => {
      const value = parse(row.payload);
      return privateAccess && now - Date.parse(value.checked_at) < 15 * 60000
        ? value
        : publicActivitySnapshot(value);
    }),
    history: history.map(row => publicActivitySnapshot(parse(row.payload))),
  };
}
