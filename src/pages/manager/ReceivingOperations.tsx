import { useEffect, useMemo, useState } from 'react';
import {
  CalendarDays, CheckCircle2, Clock3, PackageCheck, Plus, RefreshCw,
  Truck, UserPlus, Users, Warehouse,
} from 'lucide-react';
import AdminLayout from '@/shared/layouts/AdminLayout';
import { useToast } from '@/context/ToastContext';
import { receivingService } from '@/services/receivingService';
import type { ManagerReceivingSetup, ManagerShiftOverview } from '@/services/receivingService';
import DispatchPanel from './DispatchPanel';
import '@/styles/ops-shared.css';
import './ReceivingOperations.css';

const today = () => {
  const value = new Date();
  value.setMinutes(value.getMinutes() - value.getTimezoneOffset());
  return value.toISOString().slice(0, 10);
};

const shiftStatus:Record<string,string> = {
  Scheduled:'Đã lên lịch', InProgress:'Đang trong ca', Completed:'Đã hoàn thành',
};
const batchStatus:Record<string,string> = {
  Planned:'Đã lập lô', Receiving:'Đang thu gom', Completed:'Đã gom xong',
  SentToClassification:'Đã gửi phân loại',
};

export default function ReceivingOperations(){
  const toast=useToast();
  const [setup,setSetup]=useState<ManagerReceivingSetup>({warehouses:[],receivingStaff:[],shifts:[]});
  const [loading,setLoading]=useState(true);
  const [warehouseId,setWarehouseId]=useState('');
  const [date,setDate]=useState(today());
  const [creatingShifts,setCreatingShifts]=useState(false);
  const [year,setYear]=useState(new Date().getFullYear());
  const [holidayText,setHolidayText]=useState('');
  const [creatingYear,setCreatingYear]=useState(false);
  const [confirmYearOpen,setConfirmYearOpen]=useState(false);
  const [teamShift,setTeamShift]=useState<ManagerShiftOverview|null>(null);
  const [teamName,setTeamName]=useState('');
  const [staffIds,setStaffIds]=useState<string[]>([]);
  const [savingTeam,setSavingTeam]=useState(false);
  const [planningId,setPlanningId]=useState<string>();

  const load=async()=>{
    setLoading(true);
    try{
      const data=await receivingService.getManagerSetup();
      setSetup(data);
      if(!warehouseId&&data.warehouses.length)setWarehouseId(data.warehouses[0].id);
    }catch(e:any){toast.error(e?.response?.data?.message||'Không thể tải dữ liệu vận hành.');}
    finally{setLoading(false);}
  };
  useEffect(()=>{void load();},[]);

  const upcoming=useMemo(()=>setup.shifts.filter(x=>x.shiftDate.slice(0,10)>=today()||x.status!=='Completed'),[setup.shifts]);
  const stats={
    scheduled:setup.shifts.filter(x=>x.status==='Scheduled').length,
    teams:setup.shifts.filter(x=>x.team).length,
    active:setup.shifts.filter(x=>x.status==='InProgress').length,
    assigned:setup.shifts.reduce((sum,x)=>sum+x.assignedRequests,0),
  };
  const createShifts=async()=>{
    if(!warehouseId||!date)return toast.warning('Chọn kho và ngày làm việc.');
    setCreatingShifts(true);
    try{await receivingService.generateStandardShifts(warehouseId,date);toast.success('Đã tạo ca sáng và ca chiều.');await load();}
    catch(e:any){toast.error(e?.response?.data?.message||'Không thể tạo ca làm việc.');}
    finally{setCreatingShifts(false);}
  };
  const parsedHolidayDates=()=>holidayText.split(/[\s,;]+/).map(x=>x.trim()).filter(Boolean);
  const requestYearShifts=()=>{
    if(!warehouseId)return toast.warning('Chọn kho trước khi tạo lịch năm.');
    const holidayDates=parsedHolidayDates();
    if(holidayDates.some(x=>!new RegExp(`^${year}-\\d{2}-\\d{2}$`).test(x)))
      return toast.warning(`Ngày lễ bổ sung phải có định dạng ${year}-MM-DD.`);
    setConfirmYearOpen(true);
  };
  const createYearShifts=async()=>{
    const holidayDates=parsedHolidayDates();
    setCreatingYear(true);
    try{
      const result=await receivingService.generateYearShifts(warehouseId,year,holidayDates);
      toast.success(`Đã tạo ${result.createdShifts} ca trên ${result.workingDays} ngày; bỏ qua ${result.skippedExisting} ca đã có.`);
      setConfirmYearOpen(false);
      await load();
    }catch(e:any){toast.error(e?.response?.data?.message||'Không thể tạo lịch làm việc cả năm.');}
    finally{setCreatingYear(false);}
  };
  const openTeam=(shift:ManagerShiftOverview)=>{
    setTeamShift(shift);setTeamName(`Team ${shift.shiftName} ${new Date(shift.shiftDate).toLocaleDateString('vi-VN')}`);setStaffIds([]);
  };
  const toggleStaff=(id:string)=>setStaffIds(v=>v.includes(id)?v.filter(x=>x!==id):v.length<2?[...v,id]:v);
  const createTeam=async()=>{
    if(!teamShift||staffIds.length!==2)return toast.warning('Team phải có đúng 2 Receiving Staff.');
    if(!teamName.trim())return toast.warning('Nhập tên team.');
    setSavingTeam(true);
    try{await receivingService.createTeam(teamShift.id,teamName.trim(),staffIds);toast.success('Đã tạo receiving team.');setTeamShift(null);await load();}
    catch(e:any){toast.error(e?.response?.data?.message||'Không thể tạo team.');}
    finally{setSavingTeam(false);}
  };
  const plan=async(shift:ManagerShiftOverview)=>{
    if(!shift.team)return;
    setPlanningId(shift.id);
    try{
      const result=await receivingService.planShift(shift.id,shift.team.id);
      toast.success(`Đã tự động phân công ${result.plannedRequests} đơn phù hợp.`);
      await load();
    }catch(e:any){toast.error(e?.response?.data?.message||'Không thể lập tuyến tự động.');}
    finally{setPlanningId(undefined);}
  };

  return <AdminLayout><div className="ops-page manager-ops">
    <header className="ops-pagehead"><div className="ops-pagehead-main">
      <span className="ops-pagehead-kicker">Manager Operations</span>
      <h1>Ca làm, team và điều phối tiếp nhận</h1>
      <p>Chuẩn bị nguồn lực và phân công Donation Request.</p>
    </div><button className="ops-btn ops-btn-secondary" onClick={load} disabled={loading}><RefreshCw size={16}/> Làm mới</button></header>

    <div className="ops-stats">
      <div className="ops-stat-card"><span className="ops-stat-label">Ca chờ thực hiện</span><strong className="ops-stat-value">{stats.scheduled}</strong></div>
      <div className="ops-stat-card"><span className="ops-stat-label">Team đã lập</span><strong className="ops-stat-value">{stats.teams}</strong></div>
      <div className="ops-stat-card"><span className="ops-stat-label">Ca đang chạy</span><strong className="ops-stat-value">{stats.active}</strong></div>
      <div className="ops-stat-card"><span className="ops-stat-label">Đơn đã phân công</span><strong className="ops-stat-value">{stats.assigned}</strong></div>
    </div>

    <section className="ops-panel manager-shift-create">
      <div className="ops-section-head"><div><span className="ops-panel-label">Bước 1</span><h2>Tạo ca chuẩn</h2></div><span>Tự tạo 08:00–11:00 và 13:00–17:00</span></div>
      {setup.warehouses.length===0?<div className="ops-empty"><Warehouse size={34}/><h4>Chưa có kho hoạt động</h4><p>Hãy tạo Warehouse trước khi lập ca.</p></div>:
      <div className="manager-create-grid">
        <div className="ops-field"><label>Kho phụ trách</label><select value={warehouseId} onChange={e=>setWarehouseId(e.target.value)}>{setup.warehouses.map(x=><option value={x.id} key={x.id}>{x.name} — {x.address}</option>)}</select></div>
        <div className="ops-field"><label>Ngày làm việc</label><input type="date" min={today()} value={date} onChange={e=>setDate(e.target.value)}/></div>
        <button className="ops-btn ops-btn-primary" onClick={createShifts} disabled={creatingShifts}><Plus size={16}/>{creatingShifts?'Đang tạo...':'Tạo 2 ca làm'}</button>
      </div>}
      <div className="manager-year-divider"><span>HOẶC TẠO LỊCH CẢ NĂM</span></div>
      <div className="manager-year-grid">
        <div className="ops-field"><label>Năm làm việc</label><input type="number" min="2020" max="2100" value={year} onChange={e=>setYear(Number(e.target.value))}/></div>
        <div className="ops-field"><label>Ngày lễ bổ sung</label><textarea rows={2} value={holidayText} onChange={e=>setHolidayText(e.target.value)} placeholder={`${year}-02-16, ${year}-02-17, ${year}-04-26`}/><small>Nhập ngày Tết, Giỗ Tổ… cách nhau bằng dấu phẩy. Hệ thống tự bỏ cuối tuần và 01/01, 30/04, 01/05, 02/09.</small></div>
        <button className="ops-btn ops-btn-secondary" disabled={creatingYear||!warehouseId} onClick={requestYearShifts}><CalendarDays size={16}/>{creatingYear?'Đang tạo lịch...':`Tạo lịch năm ${year}`}</button>
      </div>
    </section>

    <section>
      <div className="ops-section-head"><div><span className="ops-panel-label">Bước 2</span><h2>Lập Receiving Team</h2></div><span>Mỗi ca một team, mỗi team đúng 2 người</span></div>
      <div className="manager-shift-grid">{upcoming.map(shift=><article className="manager-shift-card" key={shift.id}>
        <div className="manager-shift-head"><div><strong>{shift.shiftName}</strong><span>{shift.warehouseName}</span></div><span className={`ops-badge ${shift.status==='InProgress'?'stored':shift.status==='Completed'?'done':'pending'}`}>{shiftStatus[shift.status]||shift.status}</span></div>
        <div className="manager-shift-meta"><span><CalendarDays size={15}/>{new Date(shift.shiftDate).toLocaleDateString('vi-VN')}</span><span><Clock3 size={15}/>{shift.startTime.slice(0,5)}–{shift.endTime.slice(0,5)}</span></div>
        {shift.team?<div className="manager-team-summary"><div><Users size={18}/><strong>{shift.team.teamName}</strong></div>{shift.team.members.map(x=><span key={x.id}>{x.fullName} · {x.phoneNumber}</span>)}</div>:
          <button className="ops-btn ops-btn-secondary ops-btn-block" disabled={shift.status!=='Scheduled'} onClick={()=>openTeam(shift)}><UserPlus size={16}/> Tạo team cho ca</button>}
        <div className="manager-batch-summary"><span><PackageCheck size={15}/>{shift.intakeBatchCode||'Chưa có Intake Batch'}</span><strong>{shift.assignedRequests} đơn</strong></div>
        {shift.intakeBatchStatus&&<small>Trạng thái lô: {batchStatus[shift.intakeBatchStatus]||shift.intakeBatchStatus}</small>}
        {shift.team&&shift.status==='Scheduled'&&<button className="ops-btn ops-btn-primary ops-btn-block" disabled={planningId===shift.id} onClick={()=>plan(shift)}><Truck size={16}/>{planningId===shift.id?'Đang lập tuyến...':'Tự động lấy đơn phù hợp'}</button>}
      </article>)}{!loading&&!upcoming.length&&<div className="ops-empty"><CalendarDays size={34}/><h4>Chưa có ca làm</h4><p>Tạo ca chuẩn ở bước 1.</p></div>}</div>
    </section>

    <div><div className="ops-section-head"><div><span className="ops-panel-label">Bước 3</span><h2>Điều phối từng đơn</h2></div><span>Chọn team cùng kho cho từng Donation Request</span></div><DispatchPanel key={`${stats.teams}-${stats.assigned}`}/></div>

    {teamShift&&<div className="manager-modal-backdrop"><section className="ops-panel manager-team-modal">
      <div className="ops-section-head"><div><span className="ops-panel-label">{teamShift.shiftName}</span><h2>Tạo Receiving Team</h2></div><button className="manager-close" onClick={()=>setTeamShift(null)}>×</button></div>
      <div className="ops-field"><label>Tên team</label><input value={teamName} onChange={e=>setTeamName(e.target.value)}/></div>
      <label className="manager-staff-label">Chọn đúng 2 Receiving Staff <strong>{staffIds.length}/2</strong></label>
      <div className="manager-staff-list">{setup.receivingStaff.map(staff=><button type="button" className={staffIds.includes(staff.id)?'selected':''} onClick={()=>toggleStaff(staff.id)} key={staff.id}><span>{staff.fullName}<small>@{staff.userName} · {staff.phoneNumber}</small></span>{staffIds.includes(staff.id)?<CheckCircle2 size={19}/>:<span className="manager-check"/>}</button>)}</div>
      {setup.receivingStaff.length<2&&<p className="manager-warning">Cần ít nhất 2 tài khoản Receiving Staff đang active.</p>}
      <button className="ops-btn ops-btn-primary ops-btn-block" onClick={createTeam} disabled={savingTeam||staffIds.length!==2}><Users size={16}/>{savingTeam?'Đang tạo...':'Xác nhận tạo team'}</button>
    </section></div>}
    {confirmYearOpen&&<div className="manager-modal-backdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget&&!creatingYear)setConfirmYearOpen(false);}}>
      <section className="ops-panel manager-year-modal" role="dialog" aria-modal="true" aria-labelledby="confirm-year-title">
        <div className="manager-year-modal-icon"><CalendarDays size={25}/></div>
        <div className="manager-year-modal-title">
          <span>Xác nhận tạo lịch hàng loạt</span>
          <h2 id="confirm-year-title">Tạo lịch làm việc năm {year}?</h2>
          <p>Hệ thống sẽ thêm ca cho tất cả ngày làm việc hợp lệ và tự bỏ qua ca đã tồn tại.</p>
        </div>
        <div className="manager-year-confirm-grid">
          <div><span>Kho áp dụng</span><strong>{setup.warehouses.find(x=>x.id===warehouseId)?.name}</strong></div>
          <div><span>Ca mỗi ngày</span><strong>2 ca · Sáng và chiều</strong></div>
          <div><span>Cuối tuần</span><strong>Không tạo Thứ 7, Chủ nhật</strong></div>
          <div><span>Ngày lễ bổ sung</span><strong>{parsedHolidayDates().length} ngày</strong></div>
        </div>
        <div className="manager-year-holidays">
          <strong>Ngày hệ thống tự loại</strong>
          <span>01/01 · 30/04 · 01/05 · 02/09</span>
          {parsedHolidayDates().length>0&&<small>Thêm: {parsedHolidayDates().map(x=>new Date(`${x}T00:00:00`).toLocaleDateString('vi-VN')).join(' · ')}</small>}
        </div>
        <div className="manager-year-modal-actions">
          <button className="ops-btn ops-btn-secondary" disabled={creatingYear} onClick={()=>setConfirmYearOpen(false)}>Hủy bỏ</button>
          <button className="ops-btn ops-btn-primary" disabled={creatingYear} onClick={createYearShifts}><CalendarDays size={16}/>{creatingYear?'Đang tạo lịch...':'Xác nhận tạo lịch'}</button>
        </div>
      </section>
    </div>}
  </div></AdminLayout>;
}
