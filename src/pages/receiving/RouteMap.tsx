import { useEffect, useRef, useState } from 'react';
import { MapContainer, Marker, Popup, Polyline, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { geoapifyTileUrl, geoapifyUrl } from '@/services/geoapify';
import './RouteMap.css';

type RouteRequest = { id: string; code: string; donorName: string; phoneNumber: string; pickupAddress: string; deliveryMethod: string; weight?: string; category?: string; status?: string };
export type RouteMapData = { warehouseAddress: string; requests: RouteRequest[] };
type Point = { lat: number; lon: number; address: string; label: string; requests?: RouteRequest[] };
export type RouteStopPoint = Point;
const requestStatusLabels: Record<string, string> = { Pending: 'Chờ xử lý', Received: 'Đã tiếp nhận', Rescheduled: 'Đã hẹn lại', Canceled: 'Đã hủy' };
const addressKey = (address: string) => address.normalize('NFC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('vi');

async function pickupPoints(requests: RouteRequest[], warehouse: Point) {
  const byAddress = new Map<string, RouteRequest[]>();
  for (const request of requests.filter((item) => item.deliveryMethod === 'StaffPickup')) {
    const key = addressKey(request.pickupAddress);
    byAddress.set(key, [...(byAddress.get(key) || []), request]);
  }
  const pickup: Point[] = [], skipped: string[] = [];
  for (const group of byAddress.values()) {
    try {
      const point = await geocode(group[0].pickupAddress);
      // Merge identical coordinates too, so overlapping markers never hide orders.
      const existing = [warehouse, ...pickup].find((item) => item.lat === point.lat && item.lon === point.lon);
      if (existing) existing.requests = [...(existing.requests || []), ...group];
      else pickup.push({ ...point, label: 'Điểm lấy hàng', requests: group });
    } catch { skipped.push(group[0].pickupAddress); }
  }
  return { pickup, skipped };
}

export function StopDetails({ point, index }: { point: Point; index: number }) {
  return <div className="route-stop-details">
    <strong>{index === 0 ? 'Kho xuất phát' : index < 0 ? 'Chưa xếp thứ tự' : `Điểm lấy hàng ${index}`}{point.requests?.length ? ` · ${point.requests.length} đơn` : ''}</strong>
    {index === 0 && <p>{point.address}</p>}
    {point.requests?.map((request) => <article key={request.id} className="route-stop-order">
      <strong>{request.code}</strong>
      <dl>
        <dt>Người quyên góp</dt><dd>{request.donorName || 'Chưa có tên liên hệ'}</dd>
        <dt>Số điện thoại</dt><dd>{request.phoneNumber ? <a href={`tel:${request.phoneNumber.replace(/[^\d+]/g, '')}`}>{request.phoneNumber}</a> : 'Chưa có số điện thoại'}</dd>
        <dt>Địa chỉ lấy hàng</dt><dd>{request.pickupAddress}</dd>
        {request.weight && <><dt>Khối lượng dự kiến</dt><dd>{request.weight}</dd></>}
        {request.category && <><dt>Thông tin quyên góp</dt><dd>{request.category}</dd></>}
        {request.status && <><dt>Trạng thái</dt><dd>{requestStatusLabels[request.status] || request.status}</dd></>}
      </dl>
    </article>)}
  </div>;
}
const marker = (text: string, color: string) => L.divIcon({ className: 'route-number-icon', html: `<span style="background:${color}">${text}</span>`, iconSize: [30, 30], iconAnchor: [15, 15] });
const distance = (a: Point, b: Point) => { const rad = Math.PI / 180, dLat = (b.lat - a.lat) * rad, dLon = (b.lon - a.lon) * rad, value = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2; return 6371 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value)); };
const orderNearest = (start: Point, values: Point[]) => { const pending = [...values], result: Point[] = []; let current = start; while (pending.length) { let best = 0; for (let i = 1; i < pending.length; i++) if (distance(current, pending[i]) < distance(current, pending[best])) best = i; current = pending.splice(best, 1)[0]; result.push(current); } return result; };
async function geocode(address: string, fallback?: { lat: number; lon: number }): Promise<Point> { const key = `geoapify:${address.toLowerCase()}`, cached = localStorage.getItem(key); if (cached) return { ...JSON.parse(cached), address, label: address }; try { const response = await fetch(geoapifyUrl('/v1/geocode/search', { text: address, filter: 'countrycode:vn', format: 'json', lang: 'vi', limit: 1 })); const data = await response.json(), result = data.results?.[0]; if (!result) throw new Error(); const point = { lat: result.lat, lon: result.lon, address, label: address }; localStorage.setItem(key, JSON.stringify({ lat: point.lat, lon: point.lon })); return point; } catch { if (fallback) return { ...fallback, address, label: address }; throw new Error(`Không tìm thấy tọa độ: ${address}`); } }

export default function RouteMap({ batch, autoBuild = false, onStopsChange, onStopSelect }: { batch: RouteMapData; autoBuild?: boolean; onStopsChange?: (points: RouteStopPoint[]) => void; onStopSelect?: (index: number) => void }) {
  const autoStarted = useRef(false); const [points, setPoints] = useState<Point[]>([]), [route, setRoute] = useState<[number, number][]>([]), [loading, setLoading] = useState(false), [error, setError] = useState('');
  const build = async () => { setLoading(true); setError(''); try { const warehouse = { ...(await geocode(batch.warehouseAddress, { lat: 10.8514649, lon: 106.7711441 })), label: 'Kho xuất phát' }; const { pickup, skipped } = await pickupPoints(batch.requests, warehouse); const all = [warehouse, ...orderNearest(warehouse, pickup)]; setPoints(all); onStopsChange?.(all); if (all.length > 1) { const waypoints = all.map((point) => `${point.lat},${point.lon}`).join('|'); const response = await fetch(geoapifyUrl('/v1/routing', { waypoints, mode: 'drive', format: 'geojson' })); const data = await response.json(); const geometry = data.features?.[0]?.geometry; const coordinates = geometry?.type === 'MultiLineString' ? geometry.coordinates.flat() : geometry?.coordinates || []; setRoute(coordinates.map((item: [number, number]) => [item[1], item[0]])); } else setRoute([[warehouse.lat, warehouse.lon]]); if (skipped.length) setError(`Bỏ qua ${skipped.length} địa chỉ chưa xác định được.`); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Không thể tạo tuyến đường.'); } finally { setLoading(false); } };
  useEffect(() => { if (autoBuild && !autoStarted.current) { autoStarted.current = true; void build(); } }, [autoBuild]);
  if (!points.length) return <div className="route-map-launch">{autoBuild ? <>{loading && <span>Đang tìm tọa độ và tuyến đường...</span>}{error && <><p>{error}</p><button onClick={build}>Thử lại</button></>}</> : <><button onClick={build} disabled={loading}>{loading ? 'Đang tìm tọa độ...' : 'Mở bản đồ & xếp tuyến gần nhất'}</button>{error && <p>{error}</p>}</>}</div>;
  const bounds = L.latLngBounds(points.map((point) => [point.lat, point.lon]));
  return <div className="route-map-wrap"><div className="route-order"><b>Thứ tự đề xuất:</b>{points.map((point, index) => <span key={`${point.address}-${index}`}>{index}. {point.label}{(point.requests?.length || 0) > 0 ? ` (${point.requests!.length} đơn)` : ''}</span>)}</div><MapContainer bounds={bounds} scrollWheelZoom style={{ height: 420, width: '100%' }}><TileLayer attribution='&copy; OpenStreetMap contributors &copy; Geoapify' url={geoapifyTileUrl()} />{route.length > 1 && <Polyline positions={route} pathOptions={{ color: '#059669', weight: 5 }} />}{points.map((point, index) => <Marker key={`${point.address}-${index}`} position={[point.lat, point.lon]} eventHandlers={{ click: () => onStopSelect?.(index) }} title={`${index}. ${point.label}`} icon={marker(String(index), index === 0 ? '#0f172a' : '#059669')}><Popup minWidth={220} maxWidth={320} maxHeight={260}><StopDetails point={point} index={index} /></Popup></Marker>)}</MapContainer>{error && <small>{error}</small>}<small>Bản đồ, geocoding và tuyến đường bởi Geoapify. Thứ tự là gợi ý.</small></div>;
}
