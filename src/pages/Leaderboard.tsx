import React, { useState } from 'react';
import { Award, Sparkles, Leaf, Recycle, Gift } from 'lucide-react';
import Table from '@/components/common/Table';
import Badge from '@/components/common/Badge';
import './Leaderboard.css';

interface DonorRank {
  rank: number;
  name: string;
  type: 'individual' | 'corporate';
  weight: number; // kg donated
  impactSavedCo2: number; // kg CO2 saved
  treesPlanted: number; // trees planted equivalent
}

const DONOR_DATA: DonorRank[] = [
  { rank: 1, name: 'Nguyễn Thị Minh Vy', type: 'individual', weight: 285, impactSavedCo2: 427, treesPlanted: 19 },
  { rank: 2, name: 'Công ty Cổ phần May Xanh', type: 'corporate', weight: 250, impactSavedCo2: 375, treesPlanted: 17 },
  { rank: 3, name: 'Trần Hoàng Long', type: 'individual', weight: 195, impactSavedCo2: 292, treesPlanted: 13 },
  { rank: 4, name: 'Đại học Quốc gia TP. HCM', type: 'corporate', weight: 160, impactSavedCo2: 240, treesPlanted: 10 },
  { rank: 5, name: 'Phạm Thành Nhân', type: 'individual', weight: 125, impactSavedCo2: 187, treesPlanted: 8 },
  { rank: 6, name: 'Lê Văn Khải', type: 'individual', weight: 110, impactSavedCo2: 165, treesPlanted: 7 },
  { rank: 7, name: 'Cộng đồng Yêu Sống Xanh', type: 'corporate', weight: 95, impactSavedCo2: 142, treesPlanted: 6 },
  { rank: 8, name: 'Nguyễn Bích Ngọc', type: 'individual', weight: 85, impactSavedCo2: 127, treesPlanted: 5 },
  { rank: 9, name: 'Vũ Minh Tuấn', type: 'individual', weight: 70, impactSavedCo2: 105, treesPlanted: 4 },
];

export const Leaderboard: React.FC = () => {
  const [filterType, setFilterType] = useState<'all' | 'individual' | 'corporate'>('all');

  const filteredData = DONOR_DATA.filter((donor) => {
    if (filterType === 'all') return true;
    return donor.type === filterType;
  });

  // Re-map ranks after filtering for visual purposes, but keep original rank numbers
  const podiumData = filteredData.slice(0, 3);
  const tableData = filteredData.slice(3);

  // Reordering podium for display structure: [2nd, 1st, 3rd]
  const displayPodium = [];
  if (podiumData[1]) displayPodium.push(podiumData[1]); // 2nd
  if (podiumData[0]) displayPodium.push(podiumData[0]); // 1st
  if (podiumData[2]) displayPodium.push(podiumData[2]); // 3rd

  const columns = [
    {
      header: 'Hạng',
      accessor: (row: DonorRank) => {
        return <strong className="table-rank-num">#{row.rank}</strong>;
      },
    },
    { header: 'Hội viên', accessor: 'name' as const },
    {
      header: 'Phân loại',
      accessor: (row: DonorRank) => (
        <Badge variant={row.type === 'corporate' ? 'info' : 'success'}>
          {row.type === 'corporate' ? 'Tập thể / DN' : 'Cá nhân'}
        </Badge>
      ),
    },
    {
      header: 'Quần áo quyên góp',
      accessor: (row: DonorRank) => <strong>{row.weight} kg</strong>,
    },
    {
      header: 'Lượng CO2 cắt giảm',
      accessor: (row: DonorRank) => (
        <span className="co2-saving-text">-{row.impactSavedCo2} kg CO2</span>
      ),
    },
    {
      header: 'Quy đổi cây xanh',
      accessor: (row: DonorRank) => (
        <span className="tree-eq-text">
          <Leaf size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
          {row.treesPlanted} cây
        </span>
      ),
    },
  ];

  return (
    <div className="leaderboard-page container">
      {/* Header */}
      <div className="leaderboard-header text-center">
        <span className="section-subtitle">Tác động cộng đồng</span>
        <h1 className="text-gradient">Bảng Vàng Vinh Danh</h1>
        <p className="leaderboard-desc">
          Tri ân những đóng góp to lớn của các cá nhân và tập thể đã chung tay quyên gửi áo ấm và dệt sợi tái chế vải cũ bảo vệ hành tinh xanh.
        </p>
      </div>

      {/* Filter tabs */}
      <div className="leaderboard-filters flex-center">
        <button
          className={`filter-tab-btn glass ${filterType === 'all' ? 'active' : ''}`}
          onClick={() => setFilterType('all')}
        >
          Tất cả đóng góp
        </button>
        <button
          className={`filter-tab-btn glass ${filterType === 'individual' ? 'active' : ''}`}
          onClick={() => setFilterType('individual')}
        >
          Cá nhân tiêu biểu
        </button>
        <button
          className={`filter-tab-btn glass ${filterType === 'corporate' ? 'active' : ''}`}
          onClick={() => setFilterType('corporate')}
        >
          Hội nhóm & Doanh nghiệp
        </button>
      </div>

      {/* Podium Top 3 */}
      {podiumData.length > 0 && (
        <div className="podium-section flex-center">
          <div className="podium-container">
            {displayPodium.map((donor) => {
              // Determine visual spot: 1st, 2nd, or 3rd
              let spotClass = 'first';
              let awardColor = '#ffd700'; // Gold
              if (donor.rank === 2) {
                spotClass = 'second';
                awardColor = '#c0c0c0'; // Silver
              } else if (donor.rank === 3) {
                spotClass = 'third';
                awardColor = '#cd7f32'; // Bronze
              }

              return (
                <div key={donor.name} className={`podium-column ${spotClass}`}>
                  <div className="podium-avatar-wrapper">
                    <div className="podium-badge" style={{ backgroundColor: awardColor }}>
                      {donor.rank === 1 ? <Sparkles size={16} /> : <Award size={16} />}
                    </div>
                    <div className="podium-avatar flex-center">
                      {donor.name.split(' ').pop()?.substring(0, 2).toUpperCase()}
                    </div>
                  </div>
                  
                  <div className="podium-card glass">
                    <span className="podium-rank">Hạng {donor.rank}</span>
                    <h4 className="podium-donor-name">{donor.name}</h4>
                    <span className="podium-weight text-gradient">{donor.weight} kg</span>
                    
                    <div className="podium-stats">
                      <div className="podium-stat-line">
                        <Recycle size={12} />
                        <span>-{donor.impactSavedCo2}kg CO2</span>
                      </div>
                      <div className="podium-stat-line">
                        <Gift size={12} />
                        <span>{donor.treesPlanted} cây xanh</span>
                      </div>
                    </div>
                  </div>
                  <div className="podium-pedestal"></div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Table for ranks 4+ */}
      {tableData.length > 0 && (
        <div className="leaderboard-table-section glass">
          <h3>Bảng xếp hạng đóng góp xanh</h3>
          <Table columns={columns} data={tableData} />
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
