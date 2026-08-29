import { useEffect, useRef, useState } from 'react';
import { Loader2, MapPin, Search, X } from 'lucide-react';
import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { geoapifyTileUrl, geoapifyUrl } from '@/services/geoapify';
import './AddressSearchMap.css';

const CENTER: [number, number] = [10.8231, 106.6297];
type Result = { place_id: string; formatted: string; lat: number; lon: number };
type Selected = { address: string; lat: number; lon: number };
const pin = L.divIcon({ className: 'address-search-marker', html: '<span>●</span>', iconSize: [34, 34], iconAnchor: [17, 30] });

function MapClick({ onSelect }: { onSelect: (point: Selected) => void }) {
  useMapEvents({ click: async (event) => {
    try {
      const response = await fetch(geoapifyUrl('/v1/geocode/reverse', { lat: event.latlng.lat, lon: event.latlng.lng, format: 'json', lang: 'vi' }));
      const data = await response.json();
      onSelect({ address: data.results?.[0]?.formatted || `${event.latlng.lat}, ${event.latlng.lng}`, lat: event.latlng.lat, lon: event.latlng.lng });
    } catch { onSelect({ address: `${event.latlng.lat}, ${event.latlng.lng}`, lat: event.latlng.lat, lon: event.latlng.lng }); }
  } });
  return null;
}

export default function AddressSearchMap({ value, onChange, onLocationChange, location, label = 'Địa chỉ lấy hàng', mapTitle = 'Vị trí lấy hàng', required }: {
  value: string; onChange: (address: string) => void;
  onLocationChange?: (location: { lat: number; lon: number } | null) => void;
  location?: { lat: number; lon: number } | null; label?: string; mapTitle?: string; required?: boolean;
}) {
  const skip = useRef(false);
  const [results, setResults] = useState<Result[]>([]), [selected, setSelected] = useState<Selected | null>(() =>
    location ? { address: value, lat: location.lat, lon: location.lon } : null);
  const [loading, setLoading] = useState(false), [open, setOpen] = useState(false), [message, setMessage] = useState('');
  const select = (point: Selected) => { skip.current = true; setSelected(point); onChange(point.address); onLocationChange?.({ lat: point.lat, lon: point.lon }); setResults([]); setMessage(''); setOpen(false); };

  useEffect(() => {
    if (skip.current) { skip.current = false; return; }
    const text = value.trim(); if (text.length < 3 || selected?.address === value) { setResults([]); return; }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true); setMessage('');
      try {
        const response = await fetch(geoapifyUrl('/v1/geocode/autocomplete', { text, filter: 'countrycode:vn', bias: 'proximity:106.6297,10.8231', format: 'json', lang: 'vi', limit: 6 }), { signal: controller.signal });
        if (!response.ok) throw new Error(); const data = await response.json(); const next = (data.results || []) as Result[];
        setResults(next); setOpen(true); if (!next.length) setMessage('Không tìm thấy địa chỉ phù hợp. Bạn có thể bấm trực tiếp lên bản đồ.');
      } catch (error) { if ((error as Error).name !== 'AbortError') setMessage('Không thể tìm địa chỉ lúc này.'); }
      finally { if (!controller.signal.aborted) setLoading(false); }
    }, 400);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [value, selected]);

  const clear = () => { onChange(''); setSelected(null); onLocationChange?.(null); setResults([]); setMessage(''); setOpen(false); };
  return <div className="address-search-field"><label htmlFor="pickup-address-search">{label} {required && <span>*</span>}</label>
    <div className={`address-search-input${open ? ' open' : ''}`}>{loading ? <Loader2 className="address-search-spinner" size={18} /> : <Search size={18} />}
      <input id="pickup-address-search" value={value} required={required} autoComplete="off" placeholder="Tìm số nhà, tên đường, phường/xã, quận/huyện..." onFocus={() => setOpen(results.length > 0 || Boolean(message))} onChange={(event) => { onChange(event.target.value); setSelected(null); onLocationChange?.(null); setOpen(true); }} />
      {value && <button type="button" onClick={clear} aria-label="Xóa địa chỉ"><X size={17} /></button>}
    </div>
    {open && (results.length > 0 || message) && <div className="address-search-results">{results.map((result) => <button type="button" key={result.place_id} onClick={() => select({ address: result.formatted, lat: result.lat, lon: result.lon })}><MapPin size={17} /><span>{result.formatted}</span></button>)}{message && <p>{message}</p>}<small>Địa chỉ bởi Geoapify</small></div>}
    <div className={`address-search-map${selected ? ' has-location' : ''}`}><div className="address-search-map-heading"><MapPin size={16} /><div><strong>{selected ? `${mapTitle} đã chọn` : `Chọn ${mapTitle.toLocaleLowerCase('vi-VN')}`}</strong><span>{selected?.address || `Tìm địa chỉ hoặc bấm trực tiếp lên bản đồ để đặt ${mapTitle.toLocaleLowerCase('vi-VN')}.`}</span></div></div>
      <MapContainer key={selected ? `${selected.lat}-${selected.lon}` : 'geoapify-map'} center={selected ? [selected.lat, selected.lon] : CENTER} zoom={selected ? 17 : 11} scrollWheelZoom={false} style={{ height: 240, width: '100%' }}><TileLayer attribution='&copy; OpenStreetMap contributors &copy; Geoapify' url={geoapifyTileUrl()} /><MapClick onSelect={select} />{selected && <Marker position={[selected.lat, selected.lon]} icon={pin} />}</MapContainer>
    </div>
  </div>;
}
