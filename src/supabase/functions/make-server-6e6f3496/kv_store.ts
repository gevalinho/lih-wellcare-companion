// === Simple Supabase Edge KV helpers ===
export async function set(key: string, value: any) {
  await KV_NAMESPACE.put(key, JSON.stringify(value));
}

export async function get(key: string) {
  const v = await KV_NAMESPACE.get(key);
  return v ? JSON.parse(v as string) : null;
}

export async function del(key: string) {
  await KV_NAMESPACE.delete(key);
}

export async function getByPrefix(prefix: string) {
  const vals: any[] = [];
  for await (const pair of KV_NAMESPACE.list({ prefix })) {
    try {
      vals.push(JSON.parse(pair.value as string));
    } catch {
      // skip unparseable
    }
  }
  return vals;
}
