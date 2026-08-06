import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Calendar,
  Clock3,
  ClipboardList,
  MapPin,
  Phone,
  RotateCcw,
  Truck,
  Users,
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { receivingService } from '@/services/receivingService';
import type { ReceivingBatch } from '@/services/receivingService';
import '@/styles/ops-shared.css';
import './Dashboard.css';

const getLocalDateValue = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const Team: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [batches, setBatches] = useState<ReceivingBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [teamDate, setTeamDate] = useState(getLocalDateValue);

  useEffect(() => {
    receivingService
      .getMyBatches()
      .then(setBatches)
      .catch(() => toast.error('Không thể tải thông tin team được phân công.'))
      .finally(() => setLoading(false));
  }, []);

  const teams = useMemo(
    () =>
      Array.from(
        new Map(
          batches.map((batch) => {
            const key = `${batch.shiftId}-${batch.teamName}`;
            return [
              key,
              {
                key,
                teamName: batch.teamName,
                shiftName: batch.shiftName,
                shiftDate: batch.date,
                shiftStatus: batch.shiftStatus,
                startTime: batch.startTime,
                endTime: batch.endTime,
                warehouseAddress: batch.warehouseAddress,
                members: batch.teamMembers,
                batches: batches.filter(
                  (candidate) =>
                    candidate.shiftId === batch.shiftId &&
                    candidate.teamName === batch.teamName
                ),
              },
            ];
          })
        ).values()
      ),
    [batches]
  );

  const shiftStatusLabel = (status: string) => {
    if (status === 'InProgress') return 'Đang trong ca';
    if (status === 'Completed') return 'Đã kết thúc';
    return 'Chưa bắt đầu';
  };

  const filteredTeams = useMemo(
    () =>
      teamDate
        ? teams.filter((team) => team.shiftDate?.slice(0, 10) === teamDate)
        : teams,
    [teamDate, teams]
  );

  return (
    <div className="ops-page">
      <header className="ops-pagehead">
        <div className="ops-pagehead-main">
          <span className="ops-pagehead-kicker">Nhân sự tiếp nhận</span>
          <h1>Team của tôi</h1>
          <p>
            Xem thành viên đồng hành, thông tin liên hệ, ca làm việc, kho xuất phát
            và các lô thu gom mà team đang phụ trách.
          </p>
        </div>
      </header>

      <div className="rcv-team-filter">
        <div className="rcv-team-filter-field">
          <Calendar size={17} />
          <label htmlFor="team-date-filter">Ngày làm việc</label>
          <input
            id="team-date-filter"
            type="date"
            value={teamDate}
            onChange={(event) => setTeamDate(event.target.value)}
          />
        </div>
        <span className="rcv-team-filter-result">
          {filteredTeams.length}/{teams.length} team
        </span>
        {teamDate && (
          <button type="button" className="ops-btn ops-btn-secondary" onClick={() => setTeamDate('')}>
            <RotateCcw size={15} /> Xóa lọc
          </button>
        )}
      </div>

      {loading ? (
        <div className="ops-empty">
          <span className="ops-spinner" />
          <h4>Đang tải thông tin team...</h4>
        </div>
      ) : teams.length === 0 ? (
        <div className="ops-empty">
          <Users size={38} strokeWidth={1.5} />
          <h4>Bạn chưa được phân vào team</h4>
          <p>Manager cần tạo team, thêm đúng 2 thành viên và phân công lô tiếp nhận.</p>
        </div>
      ) : filteredTeams.length === 0 ? (
        <div className="ops-empty">
          <Calendar size={38} strokeWidth={1.5} />
          <h4>Không có team trong ngày đã chọn</h4>
          <p>Hãy chọn ngày khác hoặc xóa bộ lọc để xem toàn bộ team của bạn.</p>
          <button type="button" className="ops-btn ops-btn-secondary" onClick={() => setTeamDate('')}>
            <RotateCcw size={15} /> Xem tất cả team
          </button>
        </div>
      ) : (
        <div className="rcv-team-page-list">
          {filteredTeams.map((team) => (
            <section className="rcv-team-detail-card" key={team.key}>
              <div className="rcv-team-detail-head">
                <span className="rcv-team-icon"><Users size={24} /></span>
                <div>
                  <span>Receiving team</span>
                  <h2>{team.teamName || 'Chưa đặt tên team'}</h2>
                </div>
                <span className={`ops-badge ${team.shiftStatus === 'InProgress' ? 'stored' : 'pending'}`}>
                  {shiftStatusLabel(team.shiftStatus)}
                </span>
              </div>

              <div className="rcv-team-detail-meta">
                <div>
                  <Calendar size={17} />
                  <span>Ca làm việc</span>
                  <strong>{team.shiftName} · {team.shiftDate}</strong>
                </div>
                <div>
                  <Clock3 size={17} />
                  <span>Khung giờ</span>
                  <strong>
                    {team.startTime?.slice(0, 5) || '--:--'}–{team.endTime?.slice(0, 5) || '--:--'}
                  </strong>
                </div>
                <div>
                  <MapPin size={17} />
                  <span>Kho xuất phát</span>
                  <strong>{team.warehouseAddress || 'Chưa có địa chỉ kho'}</strong>
                </div>
              </div>

              <div className="rcv-team-detail-columns">
                <div>
                  <h3><Users size={17} /> Thành viên ({team.members.length})</h3>
                  <div className="rcv-team-members">
                    {team.members.map((member, index) => (
                      <div className="rcv-team-member" key={member.id}>
                        <span className="rcv-member-avatar">
                          {member.fullName
                            .split(/\s+/)
                            .filter(Boolean)
                            .slice(-2)
                            .map((part) => part[0])
                            .join('')
                            .toUpperCase()}
                        </span>
                        <div>
                          <strong>{member.fullName}</strong>
                          <a href={`tel:${member.phoneNumber}`}>
                            <Phone size={13} /> {member.phoneNumber || 'Chưa có số điện thoại'}
                          </a>
                        </div>
                        <span className="rcv-member-role">Thành viên {index + 1}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3><ClipboardList size={17} /> Lô được giao ({team.batches.length})</h3>
                  <div className="rcv-team-batches">
                    {team.batches.map((batch) => (
                      <button
                        type="button"
                        key={batch.id}
                        onClick={() => navigate(`/receiving/batch/${batch.id}`)}
                      >
                        <span className="rcv-team-batch-icon"><Truck size={17} /></span>
                        <span>
                          <strong>{batch.code}</strong>
                          <small>{batch.route} · {batch.requests.length} đơn</small>
                        </span>
                        <ArrowRight size={16} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
};

export default Team;
