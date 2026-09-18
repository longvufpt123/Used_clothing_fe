import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { receivingCapacity, projectedLoads } from '@/services/receivingCapacity';
import type { CapacityBoard, PlanPreview, ReceivingLimits, TeamLoad } from '@/services/receivingCapacity';
import './ReceivingCapacityPanel.css';

const message = (error: any) => error?.response?.data?.message || error?.message || 'Không thể thực hiện. Vui lòng thử lại.';
const full = (t: TeamLoad) => t.assignedRequests > t.maxRequests || t.estimatedWeightKg > t.maxWeightKg + 0.00001;
const fmt = (n: number) => n.toLocaleString('vi-VN', { maximumFractionDigits: 2 });
export function ReceivingLoad({ team }: { team: TeamLoad }) {
  const near = team.assignedRequests / team.maxRequests >= 0.8 || team.estimatedWeightKg / team.maxWeightKg >= 0.8;
  return <div className={`receiving-load ${full(team) ? 'over' : near ? 'near' : ''}`}>
    <label>Đơn <b>{team.assignedRequests}/{team.maxRequests}</b><progress aria-label="Tải số đơn" max={team.maxRequests} value={team.assignedRequests} /></label>
    <label>Kg dự kiến <b>{fmt(team.estimatedWeightKg)}/{fmt(team.maxWeightKg)} kg</b><progress aria-label="Tải khối lượng" max={team.maxWeightKg} value={team.estimatedWeightKg} /></label>
    <small>Còn nhận: {Math.max(0, team.maxRequests - team.assignedRequests)} đơn · {fmt(Math.max(0, team.maxWeightKg - team.estimatedWeightKg))} kg</small>
    {full(team) ? <strong role="alert">Vượt giới hạn — cần điều chỉnh phân công.</strong> : near && <strong>{team.assignedRequests >= team.maxRequests || team.estimatedWeightKg >= team.maxWeightKg ? 'Team đã đạt giới hạn tiếp nhận.' : 'Team gần đầy tải.'}</strong>}
    {team.actualWeightKg > team.maxWeightKg && <strong role="alert">Thực nhận {fmt(team.actualWeightKg)} kg vượt mức {fmt(team.maxWeightKg)} kg. Manager cần kiểm tra phương tiện và bố trí hỗ trợ.</strong>}
  </div>;
}

export function ReceivingPlanDialog({ initial, onClose, onApplied }: { initial: PlanPreview; onClose: () => void; onApplied: () => void | Promise<void> }) {
  const [plan, setPlan] = useState(initial), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const lock = useRef(false);
  const loads = projectedLoads(plan), invalid = loads.some(full);
  useEffect(() => { const handler = (e: KeyboardEvent) => { if (e.key === 'Escape' && !lock.current) onClose(); }; document.addEventListener('keydown', handler); return () => document.removeEventListener('keydown', handler); }, [onClose]);
  const apply = async () => {
    if (lock.current || invalid || !plan.assignments.length) return;
    lock.current = true; setBusy(true); setError('');
    try { await receivingCapacity.apply(plan); await onApplied(); onClose(); }
    catch (e) { setError(message(e)); }
    finally { lock.current = false; setBusy(false); }
  };
  return createPortal(<div className="receiving-plan-overlay"><section role="dialog" aria-modal="true" aria-labelledby="receiving-plan-title" className="receiving-plan-dialog">
    <header><div><h2 id="receiving-plan-title">Xem trước phân công trong ca</h2><p>{plan.assignments.length} đơn được gợi ý · {plan.unassigned.length} đơn chưa xếp được</p></div><button autoFocus className="ops-btn" disabled={busy} onClick={onClose}>Đóng</button></header>
    <p>Chỉ thêm đơn chưa phân công; giữ nguyên các đơn team đang nhận. Cân bằng số đơn và kg dự kiến, ưu tiên cùng khu vực khi tải tương đương. Bạn có thể đổi team hoặc bỏ đơn khỏi đợt này.</p>
    <div className="receiving-capacity-grid">{loads.map(team => <article key={team.id}><h3>{team.teamName}</h3><ReceivingLoad team={team} /></article>)}</div>
    <div className="receiving-plan-table"><table><thead><tr><th>Đơn / địa chỉ</th><th>Kg dự kiến</th><th>Team nhận</th><th /></tr></thead><tbody>{plan.assignments.map(row => <tr key={row.requestId}>
      <td><b>{row.code}</b><p>{row.address}</p></td><td>{fmt(row.estimateWeight)}</td>
      <td><select aria-label={`Team cho ${row.code}`} disabled={busy} value={row.teamId} onChange={e => setPlan(p => ({ ...p, assignments: p.assignments.map(a => a.requestId === row.requestId ? { ...a, teamId: e.target.value } : a) }))}>{plan.teams.filter(t => row.eligibleTeamIds.includes(t.id)).map(t => <option key={t.id} value={t.id}>{t.teamName}</option>)}</select></td>
      <td><button disabled={busy} className="ops-btn" onClick={() => setPlan(p => ({ ...p, assignments: p.assignments.filter(a => a.requestId !== row.requestId), unassigned: [...p.unassigned, { ...row, reason: 'Manager để lại cho đợt phân công khác.' }] }))}>Bỏ khỏi đợt</button></td>
    </tr>)}</tbody></table></div>
    {!!plan.unassigned.length && <section className="receiving-unassigned"><h3>Chưa phân công</h3>{plan.unassigned.map(r => <p key={r.requestId}><b>{r.code}</b> · {fmt(r.estimateWeight)} kg — {r.reason}</p>)}</section>}
    {invalid && <p role="alert" className="receiving-capacity-error">Có team vượt giới hạn. Chuyển bớt đơn trước khi xác nhận.</p>}
    {error && <p role="alert" className="receiving-capacity-error">{error} Đóng và tạo lại gợi ý nếu dữ liệu đã thay đổi.</p>}
    <footer><button className="ops-btn" disabled={busy} onClick={onClose}>Quay lại</button><button className="ops-btn ops-btn-primary" disabled={busy || invalid || !plan.assignments.length} onClick={apply}>{busy ? 'Đang phân công...' : `Xác nhận phân công ${plan.assignments.length} đơn`}</button></footer>
  </section></div>, document.body);
}

export default function ReceivingCapacityPanel({ warehouseId, date, refreshVersion, onChanged }: { warehouseId?: string; date?: string; refreshVersion: number; onChanged: () => void | Promise<void> }) {
  const [board, setBoard] = useState<CapacityBoard>({ warehouses: [], teams: [] }), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<{ kind: 'team' | 'warehouse'; id: string; title: string; requests: string; kg: string } | null>(null);
  const [plan, setPlan] = useState<PlanPreview | null>(null);
  const version = useRef(0), lock = useRef(false);
  const load = useCallback(async () => { const run = ++version.current; try { const next = await receivingCapacity.board(warehouseId, date); if (run === version.current) { setBoard(next); setError(''); } } catch (e) { if (run === version.current) setError(message(e)); } }, [warehouseId, date]);
  useEffect(() => { setEditing(null); setPlan(null); void load(); return () => { version.current++; }; }, [load, refreshVersion]);
  const run = async (action: () => Promise<unknown>) => { if (lock.current) return; lock.current = true; setBusy(true); setError(''); try { await action(); } catch (e) { setError(message(e)); } finally { lock.current = false; setBusy(false); } };
  const save = () => run(async () => {
    if (!editing) return;
    const limits: ReceivingLimits = { maxRequests: Number(editing.requests), maxWeightKg: Number(editing.kg.replace(',', '.')) };
    if (!/^\d+$/.test(editing.requests) || limits.maxRequests < 1 || limits.maxRequests > 1000 || !/^\d+(?:[.,]\d{1,2})?$/.test(editing.kg) || limits.maxWeightKg <= 0 || limits.maxWeightKg > 100000) throw new Error('Nhập 1–1000 đơn và kg lớn hơn 0, tối đa 100000, tối đa 2 số lẻ.');
    await receivingCapacity[editing.kind](editing.id, limits); setEditing(null); await load(); await onChanged();
  });
  return <section className="receiving-capacity-panel"><header><div><h2>Tải tiếp nhận theo team / ca</h2><p>Dùng kg dự kiến khi phân công. Khi cân thực tế cao hơn khai báo, ghi nhận đúng số cân và báo Manager.</p></div><button className="ops-btn" disabled={busy} onClick={() => void load()}>Tải lại</button></header>
    {error && <p role="alert" className="receiving-capacity-error">{error}</p>}
    <div className="receiving-capacity-defaults">{board.warehouses.map(w => <div key={w.id}><b>{w.name}</b><span>Mặc định: {w.maxRequests} đơn / {fmt(w.maxWeightKg)} kg</span><button className="ops-btn" disabled={busy} onClick={() => setEditing({ kind: 'warehouse', id: w.id, title: w.name, requests: String(w.maxRequests), kg: String(w.maxWeightKg) })}>Chỉnh mặc định</button></div>)}</div>
    {editing && <form className="receiving-capacity-editor" onSubmit={e => { e.preventDefault(); void save(); }}><h3>Giới hạn: {editing.title}</h3><label>Số đơn tối đa<input type="number" min="1" max="1000" step="1" required value={editing.requests} onChange={e => setEditing({ ...editing, requests: e.target.value })} /></label><label>Kg dự kiến tối đa<input type="number" min="0.01" max="100000" step="0.01" required value={editing.kg} onChange={e => setEditing({ ...editing, kg: e.target.value })} /></label><div><button type="button" className="ops-btn" disabled={busy} onClick={() => setEditing(null)}>Hủy</button><button className="ops-btn ops-btn-primary" disabled={busy}>Lưu giới hạn</button></div></form>}
    <div className="receiving-capacity-grid">{board.teams.map(t => <article key={t.id}><h3>{t.teamName}</h3><p>{t.shiftName} · {t.startTime.slice(0, 5)}–{t.endTime.slice(0, 5)} · {t.teamType === 'ReceivingWarehouse' ? 'Trực kho' : 'Đi lấy hàng'}</p><ReceivingLoad team={t} /><small>{t.usesWarehouseDefaults ? 'Theo mặc định của kho' : 'Giới hạn riêng của team'}</small><div className="receiving-capacity-actions"><button className="ops-btn" disabled={busy || t.status === 'Completed'} onClick={() => setEditing({ kind: 'team', id: t.id, title: t.teamName, requests: String(t.maxRequests), kg: String(t.maxWeightKg) })}>Chỉnh giới hạn</button>{!t.usesWarehouseDefaults && <button className="ops-btn" disabled={busy || t.status === 'Completed'} onClick={() => run(async () => { await receivingCapacity.reset(t.id); await load(); await onChanged(); })}>Dùng mặc định kho</button>}</div></article>)}</div>
    {!board.teams.length && <p>Không có receiving team trong ngày đã chọn.</p>}
    <div className="receiving-capacity-actions">{[...new Map(board.teams.filter(t => t.status === 'Scheduled').map(t => [t.shiftId, t])).values()].map(t => <button key={t.shiftId} className="ops-btn ops-btn-primary" disabled={busy} onClick={() => run(async () => setPlan(await receivingCapacity.preview(t.shiftId)))}>Gợi ý chia đơn · {t.shiftName} · {board.warehouses.find(w => w.id === t.warehouseId)?.name}</button>)}</div>
    {plan && <ReceivingPlanDialog initial={plan} onClose={() => setPlan(null)} onApplied={async () => { await load(); await onChanged(); }} />}
  </section>;
}
