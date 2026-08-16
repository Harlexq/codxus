/**
 * Istek govdesinden rate limit anahtari olarak kullanilacak e-postayi cikarir.
 *
 * DIKKAT: guard'lar Nest'te pipe'lardan ONCE calisir, yani buradaki govde
 * dogrulanmamis ham JSON'dur — DTO degil. Bu yuzden normalizasyonu (trim +
 * lowercase) burada tekrar yapiyoruz; aksi halde "A@x.com" ve "a@x.com"
 * ayri sayaclara duser ve limit kolayca asilir.
 */
export const extractEmailTracker = (req: unknown): string | null => {
  if (typeof req !== 'object' || req === null || !('body' in req)) {
    return null;
  }

  const { body } = req;

  if (typeof body !== 'object' || body === null || !('email' in body)) {
    return null;
  }

  const { email } = body;

  if (typeof email !== 'string') {
    return null;
  }

  const normalized = email.trim().toLowerCase();

  return normalized.length > 0 ? normalized : null;
};
