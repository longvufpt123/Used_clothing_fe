import { useEffect, useRef, useState } from 'react';
import { MapContainer, Marker, Polyline, Popup, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './RouteMap.css';

export type RouteMapData = {
  warehouseAddress: string;
  requests: { id: string; donorName: string; pickupAddress: string; deliveryMethod: string }[];
};
type Point = { lat: number; lon: number; address: string; label: string; requestId?: string };
const marker = (text: string, color: string) =>
  L.divIcon({
    className: 'route-number-icon',
    html: `<span style="background:${color}">${text}</span>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const distance = (a: Point, b: Point) => {
  const rad = Math.PI / 180,
    dLat = (b.lat - a.lat) * rad,
    dLon = (b.lon - a.lon) * rad;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
};
const orderNearest = (start: Point, points: Point[]) => {
  const pending = [...points],
    result: Point[] = [];
  let current = start;
  while (pending.length) {
    let best = 0;
    for (let i = 1; i < pending.length; i++)
      if (distance(current, pending[i]) < distance(current, pending[best])) best = i;
    current = pending.splice(best, 1)[0];
    result.push(current);
  }
  return result;
};
const asciiAddress = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, (m) => (m === 'đ' ? 'd' : 'D'))
    .replace(/\b(Phuong|TP\.?|Thanh pho)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
const geocodeQueries = (address: string) => {
  const ascii = asciiAddress(address);
  const street = ascii
    .split(',')[0]
    .replace(/^\d+\s+/, '')
    .trim();
  return [...new Set([address, ascii, `${street}, Thu Duc, Ho Chi Minh City`])];
};
async function geocode(address: string, fallback?: { lat: number; lon: number }): Promise<Point> {
  const key = `osm:${address.toLowerCase()}`,
    cached = localStorage.getItem(key);
  if (cached) return JSON.parse(cached);
  const queries = geocodeQueries(address);
  for (let i = 0; i < queries.length; i++) {
    if (i > 0) await wait(1100);
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=vn&q=${encodeURIComponent(queries[i])}`;
    const response = await fetch(url, { headers: { 'Accept-Language': 'vi' } });
    const data = await response.json();
    if (data[0]) {
      const point = { lat: Number(data[0].lat), lon: Number(data[0].lon), address, label: address };
      localStorage.setItem(key, JSON.stringify(point));
      return point;
    }
  }
  if (fallback) {
    const point = { ...fallback, address, label: address };
    localStorage.setItem(key, JSON.stringify(point));
    return point;
  }
  throw new Error(`Không tìm thấy tọa độ: ${address}`);
}

export default function RouteMap({
  batch,
  autoBuild = false,
}: {
  batch: RouteMapData;
  autoBuild?: boolean;
}) {
  const [points, setPoints] = useState<Point[]>([]),
    [route, setRoute] = useState<[number, number][]>([]);
  const [loading, setLoading] = useState(false),
    [error, setError] = useState('');
  const autoStarted = useRef(false);
  const build = async () => {
    setLoading(true);
    setError('');
    try {
      const warehouse = {
        ...(await geocode(batch.warehouseAddress, { lat: 10.8514649, lon: 106.7711441 })),
        label: 'Kho xuất phát',
      };
      const addresses = [
        ...new Map(
          batch.requests
            .filter((r) => r.deliveryMethod === 'StaffPickup')
            .map((r) => [r.pickupAddress, r]),
        ).entries(),
      ];
      const pickupPoints: Point[] = [];
      const skipped: string[] = [];
      for (const [address, request] of addresses) {
        await wait(1100);
        try {
          pickupPoints.push({
            ...(await geocode(address)),
            label: request.donorName,
            requestId: request.id,
          });
        } catch {
          skipped.push(address);
        }
      }
      const ordered = orderNearest(warehouse, pickupPoints),
        all = [warehouse, ...ordered];
      setPoints(all);
      if (all.length > 1) {
        const coords = all.map((p) => `${p.lon},${p.lat}`).join(';');
        const res = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`,
        );
        const json = await res.json();
        setRoute(
          (json.routes?.[0]?.geometry?.coordinates || []).map((x: [number, number]) => [
            x[1],
            x[0],
          ]),
        );
      } else setRoute([[warehouse.lat, warehouse.lon]]);
      if (skipped.length) setError(`Bỏ qua ${skipped.length} địa chỉ chưa xác định được tọa độ.`);
    } catch (e: any) {
      setError(e.message || 'Không thể tạo tuyến bản đồ.');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (autoBuild && !autoStarted.current) {
      autoStarted.current = true;
      void build();
    }
  }, [autoBuild]);
  if (!points.length)
    return (
      <div className="route-map-launch">
        {autoBuild ? (
          <>
            {loading && <span>Đang tìm tọa độ và tối ưu tuyến đường...</span>}
            {error && (
              <>
                <p>{error}</p>
                <button onClick={build}>Thử lại</button>
              </>
            )}
          </>
        ) : (
          <>
            <button onClick={build} disabled={loading}>
              {loading ? 'Đang tìm tọa độ...' : 'Mở bản đồ & xếp tuyến gần nhất'}
            </button>
            {error && <p>{error}</p>}
          </>
        )}
      </div>
    );
  const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lon]));
  return (
    <div className="route-map-wrap">
      <div className="route-order">
        <b>Thứ tự đề xuất:</b>{' '}
        {points.map((p, i) => (
          <span key={`${p.address}-${i}`}>
            {i}. {p.label}
          </span>
        ))}
      </div>
      <MapContainer bounds={bounds} scrollWheelZoom style={{ height: 420, width: '100%' }}>
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {route.length > 1 && (
          <Polyline positions={route} pathOptions={{ color: '#059669', weight: 5 }} />
        )}
        {points.map((p, i) => (
          <Marker
            key={`${p.address}-${i}`}
            position={[p.lat, p.lon]}
            zIndexOffset={i === 0 ? 1000 : 0}
            icon={marker(String(i), i === 0 ? '#0f172a' : '#059669')}
          >
            <Popup>
              <b>{i === 0 ? 'Kho xuất phát' : `Điểm ${i}: ${p.label}`}</b>
              <br />
              {p.address}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      <small>
        Dữ liệu bản đồ © OpenStreetMap · Tuyến đường OSRM · Thứ tự là gợi ý, staff có thể điều
        chỉnh theo thực tế.
      </small>
    </div>
  );
}
