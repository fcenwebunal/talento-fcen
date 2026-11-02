import type { SupabaseClient } from "@supabase/supabase-js";

// Signed URLs of the students' profile photos (documentos/<id>/foto). Pass only students whose contact is visible
// to the viewer: storage policies refuse the rest anyway, and those simply come back without a photo.
export async function studentPhotoUrls(supabase: SupabaseClient, ids: string[]) {
  const urls = new Map<string, string>();
  const paths = (
    await Promise.all(
      ids.map(async (id) => {
        const { data } = await supabase.storage.from("documentos").list(`${id}/foto`, { limit: 1, sortBy: { column: "created_at", order: "desc" } });
        return data?.[0] ? ([id, `${id}/foto/${data[0].name}`] as const) : null;
      })
    )
  ).filter((x) => x !== null);
  if (!paths.length) return urls;

  const { data: signed } = await supabase.storage.from("documentos").createSignedUrls(paths.map(([, path]) => path), 3600);
  const byPath = new Map((signed ?? []).map((s) => [s.path, s.signedUrl]));
  for (const [id, path] of paths) {
    const url = byPath.get(path);
    if (url) urls.set(id, url);
  }
  return urls;
}
