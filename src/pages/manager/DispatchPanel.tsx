import { useEffect, useMemo, useState } from 'react';
import { MapPin, PackageCheck, Truck, Users } from 'lucide-react';
import { receivingService } from '@/services/receivingService';
import type { DispatchBoard } from '@/services/receivingService';
import { useToast } from '@/context/ToastContext';
import './DispatchPanel.css';

export default function DispatchPanel() {
  const toast = useToast();
  const [board, setBoard] = useState<DispatchBoard>({ requests: [], teams: [] });
  const [selectedTeams, setSelectedTeams] = useState<Record<string, string>>({});
  const [loadingId, setLoadingId] = useState<string>();
  const load = () => receivingService.getDispatchBoard().then(setBoard)
    .catch(() => toast.error('Không thể tải dữ liệu điều phối.'));
  useEffect(() => { void load(); }, []);

  const teamMap = useMemo(() => new Map(board.teams.map(t => [t.id, t])), [board.teams]);
  const assign = async (requestId: string) => {
    const teamId = selectedTeams[requestId];
    if (!teamId) return toast.warning('Vui lòng chọn receiving team.');
    setLoadingId(requestId);
    try {
      await receivingService.assignRequest(requestId, teamId);
      toast.success('Đã phân công đơn cho receiving team.');
      await load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Không thể phân công đơn.');
    } finally { setLoadingId(undefined); }
  };

  return (
    <section className="dispatch-panel">
      <div className="dispatch-head">
        <div><span>Điều phối thực tế</span><h2>Đơn quyên góp chờ phân công</h2></div>
        <strong>{board.requests.length} đơn</strong>
      </div>
      {board.requests.length === 0 ? <div className="dispatch-empty"><PackageCheck /> Tất cả đơn đã được phân công.</div> :
        <div className="dispatch-grid">{board.requests.map(request => {
          const teams = board.teams.filter(t => t.warehouseId === request.warehouseId);
          const selected = teamMap.get(selectedTeams[request.id]);
          return <article className="dispatch-card" key={request.id}>
            <div className="dispatch-card-top">
              <b>{request.code}</b>
              <span className={request.deliveryMethod === 'DonorDropOff' ? 'dropoff' : 'pickup'}>
                {request.deliveryMethod === 'DonorDropOff' ? 'Nhận tại kho' : 'Đến lấy tận nơi'}
              </span>
            </div>
            <h3>{request.contactName} · {request.phoneNumber}</h3>
            <p><MapPin size={14}/>{request.address}</p>
            <select value={selectedTeams[request.id] || ''} onChange={e => setSelectedTeams(v => ({...v,[request.id]:e.target.value}))}>
              <option value="">Chọn receiving team cùng kho</option>
              {teams.map(team => <option value={team.id} key={team.id}>
                {team.teamName} · {team.shiftName} · {new Date(team.shiftDate).toLocaleDateString('vi-VN')}
              </option>)}
            </select>
            {selected && <small><Users size={13}/> {selected.members.map(x => x.fullName).join(' & ')} · {selected.shiftTime}</small>}
            <button onClick={() => assign(request.id)} disabled={loadingId === request.id || teams.length === 0}>
              <Truck size={15}/>{loadingId === request.id ? 'Đang phân công...' : 'Phân công đơn'}
            </button>
          </article>;
        })}</div>}
    </section>
  );
}
