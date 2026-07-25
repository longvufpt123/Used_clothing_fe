export async function uploadImages(files: File[], folder: string): Promise<string[]> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const bucket = import.meta.env.VITE_SUPABASE_BUCKET || 'donation-images';

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Thiếu cấu hình Supabase để tải hình ảnh.');
  }

  return Promise.all(files.map(async file => {
    const extension = file.name.split('.').pop() || 'jpg';
    const path = `${folder}/${Date.now()}-${crypto.randomUUID()}.${extension}`;
    const response = await fetch(`${supabaseUrl}/storage/v1/object/${bucket}/${path}`, {
      method: 'POST',
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
        'Content-Type': file.type,
        'x-upsert': 'false',
      },
      body: file,
    });
    if (!response.ok) throw new Error(`Không tải được hình ${file.name}.`);
    return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
  }));
}
