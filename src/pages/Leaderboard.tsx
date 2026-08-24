import React, { useEffect, useMemo, useState } from 'react';
import { Award, PackageCheck, Sparkles } from 'lucide-react';
import Table from '@/components/common/Table';
import { voucherService, type DonorLeaderboardEntry } from '@/services/voucherService';
import './Leaderboard.css';

const formatWeight = (weight: number) =>
  weight.toLocaleString('vi-VN', { maximumFractionDigits: 2 });

const initialsOf = (name: string) =>
  name.trim().split(/\s+/).slice(-2).map((part) => part[0]).join('').toUpperCase();

export const Leaderboard: React.FC = () => {
  const [donors, setDonors] = useState<DonorLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    voucherService
      .donorLeaderboard()
      .then(setDonors)
      .catch(() => setError('Không thể tải bảng xếp hạng. Vui lòng thử lại sau.'))
      .finally(() => setLoading(false));
  }, []);

  const podiumData = donors.slice(0, 3);
  const tableData = donors.slice(3);
  const displayPodium = [podiumData[1], podiumData[0], podiumData[2]].filter(
    (donor): donor is DonorLeaderboardEntry => Boolean(donor),
  );

  const columns = useMemo(
    () => [
      {
        header: 'Hạng',
        accessor: (row: DonorLeaderboardEntry) => (
          <strong className="table-rank-num">#{row.rank}</strong>
        ),
      },
      {
        header: 'Cá nhân tiêu biểu',
        accessor: (row: DonorLeaderboardEntry) => (
          <div className="leaderboard-member-cell">
            <span className="leaderboard-mini-avatar">{initialsOf(row.fullName)}</span>
            <div><strong>{row.fullName}</strong><small>@{row.userName}</small></div>
          </div>
        ),
      },
      {
        header: 'Khối lượng quyên góp',
        accessor: (row: DonorLeaderboardEntry) => (
          <strong>{formatWeight(row.totalWeightKg)} kg</strong>
        ),
      },
      {
        header: 'Số lần quyên góp',
        accessor: (row: DonorLeaderboardEntry) => (
          <span className="donation-count-cell">
            <PackageCheck size={15} /> {row.donationCount} lần
          </span>
        ),
      },
    ],
    [],
  );

  return (
    <div className="leaderboard-page container">
      <div className="leaderboard-header text-center">
        <span className="section-subtitle">Tác động cộng đồng</span>
        <h1 className="text-gradient">Bảng vàng đóng góp</h1>
        <p className="leaderboard-desc">
          Vinh danh những cá nhân có tổng khối lượng quần áo quyên góp đã được xác nhận cao nhất.
        </p>
      </div>

      <div className="leaderboard-filters flex-center">
        <button type="button" className="filter-tab-btn glass active">Cá nhân tiêu biểu</button>
      </div>

      {loading && <div className="leaderboard-state glass">Đang tải bảng xếp hạng...</div>}
      {!loading && error && <div className="leaderboard-state error">{error}</div>}
      {!loading && !error && donors.length === 0 && (
        <div className="leaderboard-state glass">
          Chưa có lượt quyên góp nào được xác nhận để xếp hạng.
        </div>
      )}

      {!loading && !error && podiumData.length > 0 && (
        <div className="podium-section flex-center">
          <div className="podium-container">
            {displayPodium.map((donor) => {
              const spotClass = donor.rank === 1 ? 'first' : donor.rank === 2 ? 'second' : 'third';
              const awardColor = donor.rank === 1 ? '#ffd700' : donor.rank === 2 ? '#c0c0c0' : '#cd7f32';
              return (
                <div key={donor.userId} className={`podium-column ${spotClass}`}>
                  <div className="podium-avatar-wrapper">
                    <div className="podium-badge" style={{ backgroundColor: awardColor }}>
                      {donor.rank === 1 ? <Sparkles size={16} /> : <Award size={16} />}
                    </div>
                    <div className="podium-avatar flex-center">
                      {donor.avatarUrl ? <img src={donor.avatarUrl} alt="" /> : initialsOf(donor.fullName)}
                    </div>
                  </div>
                  <div className="podium-card glass">
                    <span className="podium-rank">Hạng {donor.rank}</span>
                    <h4 className="podium-donor-name">{donor.fullName}</h4>
                    <span className="podium-weight text-gradient">
                      {formatWeight(donor.totalWeightKg)} kg
                    </span>
                    <div className="podium-stats">
                      <div className="podium-stat-line">
                        <PackageCheck size={13} /><span>{donor.donationCount} lần quyên góp</span>
                      </div>
                    </div>
                  </div>
                  <div className="podium-pedestal" />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!loading && !error && tableData.length > 0 && (
        <div className="leaderboard-table-section glass">
          <h3>Bảng xếp hạng cá nhân tiêu biểu</h3>
          <Table columns={columns} data={tableData} />
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
