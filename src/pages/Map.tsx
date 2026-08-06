import React, { useEffect, useState } from 'react';
import { MapPin, Clock, Info, Search, Leaf, Loader2 } from 'lucide-react';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Input } from '@/components/common/Input';
import apiClient from '@/services/api';
import './Map.css';

const DEFAULT_CENTER: [number, number] = [10.8231, 106.6297];

interface WarehouseOption {
  id: string;
  address: string;
  totalCapacityKg: number;
  currentWeight: number;
}

interface DropOffLocation {
  id: string;
  address: string;
  hours: string;
  lat: number;
  lon: number;
  totalCapacityKg: number;
  currentWeight: number;
  fillPercent: number;
  isFull: boolean;
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const asciiAddress = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[đĐ]/g, (m) => (m === 'đ' ? 'd' : 'D'))
    .replace(/\b(Phuong|TP\.?|Thanh pho)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

const geocodeQueries = (address: string) => {
  const ascii = asciiAddress(address);
  const street = ascii.split(',')[0].replace(/^\d+\s+/, '').trim();
  return [...new Set([address, ascii, `${street}, Ho Chi Minh City`])];
};

async function geocode(address: string): Promise<{ lat: number; lon: number } | null> {
  const key = `osm:${address.toLowerCase()}`;
  const cached = localStorage.getItem(key);
  if (cached) return JSON.parse(cached);

  const queries = geocodeQueries(address);
  for (let i = 0; i < queries.length; i++) {
    if (i > 0) await wait(1100);
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=vn&q=${encodeURIComponent(queries[i])}`;
      const response = await fetch(url, { headers: { 'Accept-Language': 'vi' } });
      const data = await response.json();
      if (data[0]) {
        const point = { lat: Number(data[0].lat), lon: Number(data[0].lon) };
        localStorage.setItem(key, JSON.stringify(point));
        return point;
      }
    } catch {
      // try next query variant
    }
  }
  return null;
}

const pinIcon = L.divIcon({
  className: 'drop-off-marker-icon',
  html: '<span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22s7-5.8 7-13a7 7 0 1 0-14 0c0 7.2 7 13 7 13Z"/><circle cx="12" cy="9" r="2.5"/></svg></span>',
  iconSize: [34, 42],
  iconAnchor: [17, 40],
  popupAnchor: [0, -38],
});

export const Map: React.FC = () => {
  const [locations, setLocations] = useState<DropOffLocation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLoc, setSelectedLoc] = useState<DropOffLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const warehouses = await apiClient.get<unknown, WarehouseOption[]>('/warehouses');
        if (!isMounted) return;
        if (!warehouses || warehouses.length === 0) {
          setLocations([]);
          return;
        }

        const results: DropOffLocation[] = [];
        for (let i = 0; i < warehouses.length; i++) {
          if (i > 0) await wait(1100);
          const warehouse = warehouses[i];
          const point = await geocode(warehouse.address);
          if (point && isMounted) {
            const totalCapacityKg = warehouse.totalCapacityKg ?? 0;
            const currentWeight = warehouse.currentWeight ?? 0;
            const fillPercent = totalCapacityKg > 0
              ? Math.min(100, Math.round((currentWeight / totalCapacityKg) * 100))
              : 0;
            results.push({
              id: warehouse.id,
              address: warehouse.address,
              hours: '08:00 - 20:00 (Thứ 2 - Thứ 7, nghỉ Chủ nhật)',
              lat: point.lat,
              lon: point.lon,
              totalCapacityKg,
              currentWeight,
              fillPercent,
              isFull: fillPercent >= 100,
            });
          }
        }

        if (!isMounted) return;
        setLocations(results);
        if (results.length === 0) {
          setError('Không thể xác định vị trí bản đồ cho các kho tiếp nhận.');
        }
      } catch {
        if (isMounted) setError('Không thể tải danh sách điểm tiếp nhận. Vui lòng thử lại sau.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    void load();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (locations.length > 0 && !selectedLoc) {
      setSelectedLoc(locations[0]);
    }
  }, [locations, selectedLoc]);

  const filteredLocations = locations.filter((loc) =>
    loc.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="map-page container">
      <div className="map-header text-center">
        <span className="section-subtitle">Đóng góp trực tiếp</span>
        <h1 className="text-gradient">Điểm Tiếp Nhận Quần Áo</h1>
        <p className="map-desc">
          Tìm kiếm các kho tiếp nhận ReThreads gần bạn nhất để quyên gửi quần áo cũ trực tiếp.
        </p>
      </div>

      <div className="map-container-grid">
        {/* Left Side: Search & Locations List */}
        <div className="locations-sidebar glass">
          <div className="search-box-wrapper">
            <Input
              placeholder="Tìm kiếm theo địa chỉ (Quận 1, Thủ Đức...)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<Search size={18} />}
            />
          </div>

          <div className="locations-list">
            {loading && (
              <div className="empty-locations-search text-center">
                <Loader2 className="map-loading-spinner" size={18} />
                <span>Đang tải điểm tiếp nhận...</span>
              </div>
            )}
            {!loading && filteredLocations.map((loc) => (
              <div
                key={loc.id}
                className={`location-item ${selectedLoc?.id === loc.id ? 'active' : ''}`}
                onClick={() => setSelectedLoc(loc)}
              >
                <div className="location-item-header">
                  <h4>Kho tiếp nhận</h4>
                  <span className={`fill-indicator ${loc.isFull ? 'full' : ''}`}>
                    {loc.isFull ? 'Đã đầy' : `${loc.fillPercent}%`}
                  </span>
                </div>
                <p className="location-item-address">
                  <MapPin size={14} style={{ marginRight: '4px', flexShrink: 0 }} />
                  {loc.address}
                </p>
              </div>
            ))}
            {!loading && filteredLocations.length === 0 && (
              <div className="empty-locations-search text-center">
                {error || 'Không tìm thấy điểm thu nhận phù hợp.'}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Map Canvas & Spot Detail */}
        <div className="map-display-wrapper">
          <div className="map-canvas glass">
            <MapContainer
              key={selectedLoc ? `${selectedLoc.lat}-${selectedLoc.lon}` : 'default-map'}
              center={selectedLoc ? [selectedLoc.lat, selectedLoc.lon] : DEFAULT_CENTER}
              zoom={selectedLoc ? 15 : 11}
              scrollWheelZoom={false}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {filteredLocations.map((loc) => (
                <Marker
                  key={loc.id}
                  position={[loc.lat, loc.lon]}
                  icon={pinIcon}
                  eventHandlers={{ click: () => setSelectedLoc(loc) }}
                >
                  <Popup><strong>Kho tiếp nhận</strong><br />{loc.address}</Popup>
                </Marker>
              ))}
            </MapContainer>

            <div className="map-overlay-tip">
              <Info size={14} style={{ marginRight: '4px' }} />
              Chọn điểm ghim trên bản đồ để xem chi tiết kho tiếp nhận.
            </div>
          </div>

          {/* Spot Details Card */}
          {selectedLoc && (
            <div className="location-detail-card glass card-hover">
              <div className="detail-card-header">
                <Leaf className="logo-icon text-gradient" size={24} />
                <div>
                  <h3>Kho tiếp nhận</h3>
                  <span className={`status-badge-inline ${selectedLoc.isFull ? 'full' : 'available'}`}>
                    {selectedLoc.isFull ? 'Đã đầy - Tạm ngừng nhận' : 'Đang hoạt động'}
                  </span>
                </div>
              </div>

              <div className="detail-card-body">
                <p className="detail-info">
                  <strong>Địa chỉ:</strong> {selectedLoc.address}
                </p>
                <p className="detail-info">
                  <Clock size={16} style={{ marginRight: '6px', color: 'var(--color-primary)' }} />
                  <strong>Thời gian tiếp nhận:</strong> {selectedLoc.hours}
                </p>

                <div className="fill-level-progress-wrapper">
                  <div className="fill-level-header">
                    <span>Sức chứa hiện tại</span>
                    <span>{selectedLoc.fillPercent}%</span>
                  </div>
                  <div className="progress-bar-bg">
                    <div
                      className={`progress-bar-fill ${selectedLoc.isFull ? 'danger' : ''}`}
                      style={{ width: `${Math.min(100, selectedLoc.fillPercent)}%` }}
                    />
                  </div>
                  <p className="fill-desc">
                    {selectedLoc.currentWeight.toLocaleString('vi-VN')} kg / {selectedLoc.totalCapacityKg.toLocaleString('vi-VN')} kg
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Map;
