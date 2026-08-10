import { useEffect, useRef, useState } from 'react';
import { Loader2, MapPin, Search, X } from 'lucide-react';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './AddressSearchMap.css';

const DEFAULT_CENTER: [number, number] = [10.8231, 106.6297];

type AddressResult = {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
};

type SelectedAddress = {
  address: string;
  lat: number;
  lon: number;
};

const selectedMarker = L.divIcon({
  className: 'address-search-marker',
  html: '<span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22s7-5.8 7-13a7 7 0 1 0-14 0c0 7.2 7 13 7 13Z"/><circle cx="12" cy="9" r="2.5"/></svg></span>',
  iconSize: [38, 46],
  iconAnchor: [19, 44],
  popupAnchor: [0, -42],
});

export default function AddressSearchMap({
  value,
  onChange,
  required,
}: {
  value: string;
  onChange: (address: string) => void;
  required?: boolean;
}) {
  const [results, setResults] = useState<AddressResult[]>([]);
  const [selected, setSelected] = useState<SelectedAddress | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const skipNextSearch = useRef(false);

  useEffect(() => {
    if (skipNextSearch.current) {
      skipNextSearch.current = false;
      return;
    }
    const query = value.trim();
    if (query.length < 3 || selected?.address === value) {
      setResults([]);
      setMessage('');
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setMessage('');
      try {
        const params = new URLSearchParams({
          format: 'jsonv2',
          q: query,
          countrycodes: 'vn',
          addressdetails: '1',
          limit: '6',
          dedupe: '1',
        });
        const response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
          signal: controller.signal,
          headers: { 'Accept-Language': 'vi' },
        });
        if (!response.ok) throw new Error();
        const data = (await response.json()) as AddressResult[];
        setResults(data);
        setOpen(true);
        if (!data.length)
          setMessage('Không tìm thấy địa chỉ. Hãy nhập thêm phường, quận hoặc thành phố.');
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          setResults([]);
          setMessage('Không thể tìm địa chỉ lúc này. Vui lòng thử lại.');
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 650);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [value, selected]);

  const chooseAddress = (result: AddressResult) => {
    const point = {
      address: result.display_name,
      lat: Number(result.lat),
      lon: Number(result.lon),
    };
    skipNextSearch.current = true;
    setSelected(point);
    onChange(point.address);
    setResults([]);
    setMessage('');
    setOpen(false);
  };

  const clear = () => {
    onChange('');
    setSelected(null);
    setResults([]);
    setMessage('');
    setOpen(false);
  };

  return (
    <div className="address-search-field">
      <label htmlFor="pickup-address-search">Địa chỉ lấy hàng {required && <span>*</span>}</label>
      <div className={`address-search-input${open ? ' open' : ''}`}>
        {loading ? <Loader2 className="address-search-spinner" size={18} /> : <Search size={18} />}
        <input
          id="pickup-address-search"
          value={value}
          required={required}
          autoComplete="off"
          placeholder="Tìm số nhà, tên đường, phường/xã, quận/huyện..."
          onFocus={() => setOpen(results.length > 0 || Boolean(message))}
          onChange={(event) => {
            onChange(event.target.value);
            setSelected(null);
            setOpen(true);
          }}
        />
        {value && (
          <button type="button" onClick={clear} aria-label="Xóa địa chỉ">
            <X size={17} />
          </button>
        )}
      </div>

      {open && (results.length > 0 || message) && (
        <div className="address-search-results">
          {results.map((result) => (
            <button type="button" key={result.place_id} onClick={() => chooseAddress(result)}>
              <MapPin size={17} />
              <span>{result.display_name}</span>
            </button>
          ))}
          {message && <p>{message}</p>}
          <small>Dữ liệu địa chỉ © OpenStreetMap</small>
        </div>
      )}

      <div className={`address-search-map${selected ? ' has-location' : ''}`}>
        <div className="address-search-map-heading">
          <MapPin size={16} />
          <div>
            <strong>{selected ? 'Vị trí lấy hàng đã chọn' : 'Chọn vị trí lấy hàng'}</strong>
            <span>
              {selected?.address ||
                'Tìm kiếm và chọn một địa chỉ để đặt điểm lấy hàng trên bản đồ.'}
            </span>
          </div>
        </div>
        <MapContainer
          key={selected ? `${selected.lat}-${selected.lon}` : 'default-pickup-map'}
          center={selected ? [selected.lat, selected.lon] : DEFAULT_CENTER}
          zoom={selected ? 16 : 11}
          scrollWheelZoom={false}
          style={{ height: 240, width: '100%' }}
        >
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {selected && (
            <Marker position={[selected.lat, selected.lon]} icon={selectedMarker}>
              <Popup>
                <strong>Địa chỉ lấy hàng</strong>
                <br />
                {selected.address}
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </div>
    </div>
  );
}
