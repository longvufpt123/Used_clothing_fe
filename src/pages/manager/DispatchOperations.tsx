import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, CheckCircle2, Clock3, PackageCheck, RefreshCw, Truck, UserPlus, Users } from 'lucide-react';
import AdminLayout from '@/shared/layouts/AdminLayout';
import { receivingService } from '@/services/receivingService';
import type { ManagerReceivingSetup, ManagerShiftOverview } from '@/services/receivingService';
import { useToast } from '@/context/ToastContext';
import DispatchPanel from './DispatchPanel';
import '@/styles/ops-shared.css';
import './ReceivingOperations.css';

const today=()=>{const d=new Date();d.setMinutes(d.getMinutes()-d.getTimezoneOffset());return d.toISOString().slice(0,10)};
const shiftStatus:Record<string,string>={Scheduled:'Đã lên lịch',InProgress:'Đang trong ca',Completed:'Đã hoàn thành'};
const batchStatus:Record<string,string>={Planned:'Đã lập lô',Receiving:'Đang thu gom',Completed:'Đã gom xong',SentToClassification:'Đã gửi phân loại'};

export default function DispatchOperations(){
  const toast=useToast();
  const [setup,setSetup]=useState<ManagerReceivingSetup>({warehouses:[],receivingStaff:[],shifts:[]});
  const [loading,setLoading]=useState(true);
  const [teamShift,setTeamShift]=useState<ManagerShiftOverview|null>(null);
  const [teamName,setTeamName]=useState('');
  const [staffIds,setStaffIds]=useState<string[]>([]);
  const [savingTeam,setSavingTeam]=useState(false);
  const [planningId,setPlanningId]=useState<string>();
  const load=async()=>{setLoading(true);try{setSetup(await receivingService.getManagerSetup());}catch{toast.error('Không thể tải dữ liệu điều phối.');}finally{setLoading(false);}};
  useEffect(()=>{void load();},[]);
  const shifts=useMemo(()=>setup.shifts.filter(x=>x.shiftDate.slice(0,10)>=today()||x.status==='InProgress').sort((a,b)=>a.shiftDate.localeCompare(b.shiftDate)||a.startTime.localeCompare(b.startTime)),[setup.shifts]);
  const stats={teams:shifts.filter(x=>x.team).length,withoutTeam:shifts.filter(x=>!x.team&&x.status==='Scheduled').length,active:shifts.filter(x=>x.status==='InProgress').length,assigned:shifts.reduce((s,x)=>s+x.assignedRequests,0)};
  const openTeam=(shift:ManagerShiftOverview)=>{setTeamShift(shift);setTeamName(`Team ${shift.shiftName} ${new Date(shift.shiftDate).toLocaleDateString('vi-VN')}`);setStaffIds([])};
  const toggle=(id:string)=>setStaffIds(v=>v.includes(id)?v.filter(x=>x!==id):v.length<2?[...v,id]:v);
  const createTeam=async()=>{if(!teamShift||staffIds.length!==2)return toast.warning('Chọn đúng 2 Receiving Staff.');setSavingTeam(true);try{await receivingService.createTeam(teamShift.id,teamName.trim(),staffIds);toast.success('Đã tạo Receiving Team.');setTeamShift(null);await load();}catch(e:any){toast.error(e?.response?.data?.message||'Không thể tạo team.');}finally{setSavingTeam(false);}};
  const plan=async(shift:ManagerShiftOverview)=>{if(!shift.team)return;setPlanningId(shift.id);try{const result=await receivingService.planShift(shift.id,shift.team.id);toast.success(`Đã phân công ${result.plannedRequests} đơn phù hợp.`);await load();}catch(e:any){toast.error(e?.response?.data?.message||'Không thể lập tuyến.');}finally{setPlanningId(undefined);}};
  return <AdminLayout><div className="ops-page manager-ops">
    <header className="ops-pagehead"><div className="ops-pagehead-main"><span className="ops-pagehead-kicker">Receiving Dispatch</span><h1>Điều phối tiếp nhận</h1><p>Lập team, phân bổ nguồn lực và assign Donation Request vào đúng team cùng kho.</p></div><button className="ops-btn ops-btn-secondary" onClick={load} disabled={loading}><RefreshCw size={16}/> Làm mới</button></header>
    <div className="ops-stats">
      <div className="ops-stat-card"><span className="ops-stat-label">Team sẵn sàng</span><strong className="ops-stat-value">{stats.teams}</strong></div>
      <div className="ops-stat-card"><span className="ops-stat-label">Ca chưa có team</span><strong className="ops-stat-value">{stats.withoutTeam}</strong></div>
      <div className="ops-stat-card"><span className="ops-stat-label">Team đang chạy</span><strong className="ops-stat-value">{stats.active}</strong></div>
      <div className="ops-stat-card"><span className="ops-stat-label">Đơn đã assign</span><strong className="ops-stat-value">{stats.assigned}</strong></div>
    </div>
    <section><div className="ops-section-head"><div><span className="ops-panel-label">QUẢN LÝ TEAM</span><h2>Ca và Receiving Team</h2></div><span>{shifts.length} ca sắp tới</span></div>
      <div className="manager-shift-grid">{shifts.map(shift=><article className="manager-shift-card" key={shift.id}>
        <div className="manager-shift-head"><div><strong>{shift.shiftName}</strong><span>{shift.warehouseName}</span></div><span className={`ops-badge ${shift.status==='InProgress'?'stored':'pending'}`}>{shiftStatus[shift.status]||shift.status}</span></div>
        <div className="manager-shift-meta"><span><CalendarDays size={15}/>{new Date(shift.shiftDate).toLocaleDateString('vi-VN')}</span><span><Clock3 size={15}/>{shift.startTime.slice(0,5)}–{shift.endTime.slice(0,5)}</span></div>
        {shift.team?<div className="manager-team-summary"><div><Users size={18}/><strong>{shift.team.teamName}</strong></div>{shift.team.members.map(x=><span key={x.id}>{x.fullName} · {x.phoneNumber}</span>)}</div>:<button className="ops-btn ops-btn-secondary ops-btn-block" onClick={()=>openTeam(shift)}><UserPlus size={16}/> Tạo team cho ca</button>}
        <div className="manager-batch-summary"><span><PackageCheck size={15}/>{shift.intakeBatchCode||'Chưa có Intake Batch'}</span><strong>{shift.assignedRequests} đơn</strong></div>
        {shift.intakeBatchStatus&&<small>{batchStatus[shift.intakeBatchStatus]||shift.intakeBatchStatus}</small>}
        {shift.team&&shift.status==='Scheduled'&&<button className="ops-btn ops-btn-primary ops-btn-block" onClick={()=>plan(shift)} disabled={planningId===shift.id}><Truck size={16}/>{planningId===shift.id?'Đang lập tuyến...':'Tự động assign đơn phù hợp'}</button>}
      </article>)}{!loading&&!shifts.length&&<div className="ops-empty"><CalendarDays size={34}/><h4>Không có ca sắp tới</h4><p>Hãy tạo ca tại màn hình Ca làm việc.</p></div>}</div>
    </section>
    <section><div className="ops-section-head"><div><span className="ops-panel-label">ASSIGN ĐƠN</span><h2>Donation Request chờ điều phối</h2></div><span>Phân công riêng từng đơn</span></div><DispatchPanel key={`${stats.teams}-${stats.assigned}`}/></section>
    {teamShift&&<div className="manager-modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget&&!savingTeam)setTeamShift(null)}}><section className="ops-panel manager-team-modal">
      <div className="ops-section-head"><div><span className="ops-panel-label">{teamShift.shiftName}</span><h2>Tạo Receiving Team</h2></div><button className="manager-close" onClick={()=>setTeamShift(null)}>×</button></div>
      <div className="ops-field"><label>Tên team</label><input value={teamName} onChange={e=>setTeamName(e.target.value)}/></div>
      <label className="manager-staff-label">Chọn đúng 2 Receiving Staff <strong>{staffIds.length}/2</strong></label>
      <div className="manager-staff-list">{setup.receivingStaff.map(staff=><button type="button" className={staffIds.includes(staff.id)?'selected':''} onClick={()=>toggle(staff.id)} key={staff.id}><span>{staff.fullName}<small>@{staff.userName} · {staff.phoneNumber}</small></span>{staffIds.includes(staff.id)?<CheckCircle2 size={19}/>:<span className="manager-check"/>}</button>)}</div>
      {setup.receivingStaff.length<2&&<p className="manager-warning">Cần ít nhất 2 Receiving Staff active.</p>}
      <button className="ops-btn ops-btn-primary ops-btn-block" onClick={createTeam} disabled={savingTeam||staffIds.length!==2||!teamName.trim()}><Users size={16}/>{savingTeam?'Đang tạo...':'Xác nhận tạo team'}</button>
    </section></div>}
  </div></AdminLayout>;
}
