const apiKey = () => {
  const value = import.meta.env.VITE_GEOAPIFY_API_KEY?.trim()
    || '1214154afc9748c9b2ef8efc53789676';
  if (!value) throw new Error('Thiếu VITE_GEOAPIFY_API_KEY trong file .env.');
  return value;
};

export const geoapifyUrl = (path: string, params: Record<string, string | number>) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => query.set(key, String(value)));
  query.set('apiKey', apiKey());
  return `https://api.geoapify.com${path}?${query}`;
};

export const geoapifyTileUrl = () =>
  `https://maps.geoapify.com/v1/tile/positron/{z}/{x}/{y}.png?apiKey=${encodeURIComponent(apiKey())}`;
