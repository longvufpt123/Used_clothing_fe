import React, { useState } from 'react';
import { MapPin, Clock, Info, Search, Leaf } from 'lucide-react';
import { Input } from '@/components/common/Input';
import './Map.css';

interface DropOffLocation {
  id: number;
  name: string;
  address: string;
  hours: string;
  fillLevel: number; // percentage (0 - 100)
  status: 'available' | 'full';
  coordinates: { x: number; y: number }; // Simulated coordinate positions for SVG map
}

const LOCATIONS: DropOffLocation[] = [
  {
    id: 1,
    name: 'Điểm Thu Gom Thông Minh Quận 1',
    address: 'Công viên Tao Đàn, Đường Nguyễn Thị Minh Khai, Quận 1, TP. HCM',
    hours: '24/7 (Cả tuần)',
    fillLevel: 45,
    status: 'available',
    coordinates: { x: 120, y: 150 },
  },
  {
    id: 2,
    name: 'Điểm Thu Nhận Bưu Cục Quận 3',
    address: '258 CMT8, Phường 10, Quận 3, TP. HCM',
    hours: '08:00 - 20:00 (Thứ 2 - Thứ 7)',
    fillLevel: 90,
    status: 'full',
    coordinates: { x: 180, y: 120 },
  },
  {
    id: 3,
    name: 'Thùng Thu Đồ Tiện Ích Bình Thạnh',
    address: 'Dưới chân Tòa nhà Landmark 81, Vinhomes Central Park, Bình Thạnh, TP. HCM',
    hours: '24/7 (Cả tuần)',
    fillLevel: 20,
    status: 'available',
    coordinates: { x: 320, y: 80 },
  },
  {
    id: 4,
    name: 'Trung Tâm Phân Loại Chính Thủ Đức',
    address: '15 Đường Số 4, Linh Trung, TP. Thủ Đức, TP. HCM',
    hours: '07:30 - 17:30 (Thứ 2 - Thứ 6)',
    fillLevel: 65,
    status: 'available',
    coordinates: { x: 420, y: 160 },
  },
];

export const Map: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLoc, setSelectedLoc] = useState<DropOffLocation>(LOCATIONS[0]);

  const filteredLocations = LOCATIONS.filter((loc) =>
    loc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    loc.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="map-page container">
      <div className="map-header text-center">
        <span className="section-subtitle">Đóng góp trực tiếp</span>
        <h1 className="text-gradient">Điểm Tiếp Nhận Quần Áo</h1>
        <p className="map-desc">
          Tìm kiếm các thùng thu gom thông minh ReThreads gần bạn nhất để quyên gửi quần áo cũ trực tiếp.
        </p>
      </div>

      <div className="map-container-grid">
        {/* Left Side: Search & Locations List */}
        <div className="locations-sidebar glass">
          <div className="search-box-wrapper">
            <Input
              placeholder="Tìm kiếm khu vực (Quận 1, Thủ Đức...)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<Search size={18} />}
            />
          </div>

          <div className="locations-list">
            {filteredLocations.map((loc) => (
              <div
                key={loc.id}
                className={`location-item ${selectedLoc.id === loc.id ? 'active' : ''}`}
                onClick={() => setSelectedLoc(loc)}
              >
                <div className="location-item-header">
                  <h4>{loc.name}</h4>
                  <span className={`fill-indicator ${loc.status === 'full' ? 'full' : ''}`}>
                    {loc.status === 'full' ? 'Đã đầy' : `Chỗ trống: ${100 - loc.fillLevel}%`}
                  </span>
                </div>
                <p className="location-item-address">
                  <MapPin size={14} style={{ marginRight: '4px', flexShrink: 0 }} />
                  {loc.address}
                </p>
              </div>
            ))}
            {filteredLocations.length === 0 && (
              <div className="empty-locations-search text-center">
                Không tìm thấy điểm thu nhận phù hợp.
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Map Canvas & Spot Detail */}
        <div className="map-display-wrapper">
          <div className="map-canvas glass">
            {/* Custom Interactive SVG Map Vector representation of TP. HCM */}
            <svg viewBox="0 0 500 300" className="map-svg-vector">
              <defs>
                <radialGradient id="glow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="rgba(16, 185, 129, 0.4)" />
                  <stop offset="100%" stopColor="rgba(16, 185, 129, 0)" />
                </radialGradient>
              </defs>
              
              {/* Simulated outline of TP. HCM River / districts */}
              <path
                d="M 50,220 C 120,240 220,180 250,150 C 280,120 380,150 450,90 C 470,70 420,30 380,50 C 340,70 300,40 200,60 C 100,80 30,120 50,220 Z"
                fill="rgba(16, 185, 129, 0.03)"
                stroke="var(--color-border)"
                strokeWidth="2"
                strokeDasharray="4 4"
              />
              <path
                d="M 10,180 Q 150,190 280,130 T 490,110"
                fill="none"
                stroke="rgba(59, 130, 246, 0.15)"
                strokeWidth="6"
              />
              
              {/* Markers */}
              {filteredLocations.map((loc) => (
                <g key={loc.id} className="map-marker-group" onClick={() => setSelectedLoc(loc)}>
                  {selectedLoc.id === loc.id && (
                    <circle cx={loc.coordinates.x} cy={loc.coordinates.y} r="25" fill="url(#glow)" />
                  )}
                  <circle
                    cx={loc.coordinates.x}
                    cy={loc.coordinates.y}
                    r={selectedLoc.id === loc.id ? '10' : '7'}
                    fill={loc.status === 'full' ? 'var(--color-danger)' : 'var(--color-primary)'}
                    className="pulse-circle"
                  />
                  <text
                    x={loc.coordinates.x}
                    y={loc.coordinates.y - 15}
                    textAnchor="middle"
                    fill="var(--color-text-primary)"
                    fontSize="10"
                    fontWeight="700"
                    className="marker-label"
                  >
                    Q.{loc.id}
                  </text>
                </g>
              ))}
            </svg>
            
            <div className="map-overlay-tip">
              <Info size={14} style={{ marginRight: '4px' }} />
              Chọn điểm ghim trên bản đồ để xem chi tiết thùng đồ tiếp nhận.
            </div>
          </div>

          {/* Spot Details Card */}
          <div className="location-detail-card glass card-hover">
            <div className="detail-card-header">
              <Leaf className="logo-icon text-gradient" size={24} />
              <div>
                <h3>{selectedLoc.name}</h3>
                <span className={`status-badge-inline ${selectedLoc.status === 'full' ? 'full' : 'available'}`}>
                  {selectedLoc.status === 'full' ? 'Thùng đã đầy' : 'Đang hoạt động'}
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
                  <span>Dung lượng đã chứa:</span>
                  <strong>{selectedLoc.fillLevel}%</strong>
                </div>
                <div className="progress-bar-bg">
                  <div
                    className={`progress-bar-fill ${selectedLoc.fillLevel >= 85 ? 'danger' : ''}`}
                    style={{ width: `${selectedLoc.fillLevel}%` }}
                  />
                </div>
                <span className="fill-desc">
                  {selectedLoc.status === 'full' 
                    ? 'Thùng chứa đã đầy. Nhân viên đang di chuyển để thu gom làm rỗng.'
                    : `Thùng còn chứa được thêm khoảng ${100 - selectedLoc.fillLevel}% lượng vải vụn quyên góp.`}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Map;
