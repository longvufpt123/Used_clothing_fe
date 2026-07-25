import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, Plus, RefreshCw, Warehouse } from 'lucide-react';
import AdminLayout from '@/shared/layouts/AdminLayout';
import { receivingService } from '@/services/receivingService';
import type { ManagerReceivingSetup, ManagerShiftOverview } from '@/services/receivingService';
import { useToast } from '@/context/ToastContext';
import '@/styles/ops-shared.css';
import './ShiftCalendar.css';
import './ShiftDetail.css';

const iso=(date:Date)=>{const x=new Date(date);x.setMinutes(x.getMinutes()-x.getTimezoneOffset());return x.toISOString().slice(0,10);};
const startMonth=(date:Date)=>new Date(date.getFullYear(),date.getMonth(),1);
const monthNames=['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6','Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12'];
const statusLabel:Record<string,string>={Scheduled:'Đã lên lịch',InProgress:'Đang diễn ra',Completed:'Hoàn thành'};

export default function ShiftCalendar(){
  const toast=useToast();
  const [setup,setSetup]=useState<ManagerReceivingSetup>({warehouses:[],receivingStaff:[],shifts:[]});
  const [month,setMonth]=useState(startMonth(new Date()));
  const [selected,setSelected]=useState(iso(new Date()));
  const [warehouseId,setWarehouseId]=useState('');
  const [loading,setLoading]=useState(true);
  const [creating,setCreating]=useState(false);
  const [yearOpen,setYearOpen]=useState(false);
  const [year,setYear]=useState(new Date().getFullYear());
  const [holidays,setHolidays]=useState('');
  const [creatingYear,setCreatingYear]=useState(false);
  const [detailShift,setDetailShift]=useState<ManagerShiftOverview|null>(null);
  const load=async()=>{setLoading(true);try{const data=await receivingService.getManagerSetup();setSetup(data);if(!warehouseId&&data.warehouses.length)setWarehouseId(data.warehouses[0].id);}catch{toast.error('Không thể tải lịch ca.');}finally{setLoading(false);}};
  useEffect(()=>{void load();},[]);
  const days=useMemo(()=>{
    const first=startMonth(month);const start=new Date(first);start.setDate(1-first.getDay());
    return Array.from({length:42},(_,i)=>{const d=new Date(start);d.setDate(start.getDate()+i);return d;});
  },[month]);
  const filtered=setup.shifts.filter(x=>!warehouseId||x.warehouseId===warehouseId);
  const byDate=useMemo(()=>{const map=new Map<string,ManagerShiftOverview[]>();filtered.forEach(x=>{const key=x.shiftDate.slice(0,10);map.set(key,[...(map.get(key)||[]),x]);});return map;},[filtered]);
  const selectedShifts=byDate.get(selected)||[];
  const createDay=async()=>{if(!warehouseId)return toast.warning('Chọn kho.');setCreating(true);try{await receivingService.generateStandardShifts(warehouseId,selected);toast.success('Đã tạo ca sáng và ca chiều.');await load();}catch(e:any){toast.error(e?.response?.data?.message||'Không thể tạo ca.');}finally{setCreating(false);}};
  const holidayDates=()=>holidays.split(/[\s,;]+/).map(x=>x.trim()).filter(Boolean);
  const requestYear=()=>{const dates=holidayDates();if(dates.some(x=>!new RegExp(`^${year}-\\d{2}-\\d{2}$`).test(x)))return toast.warning(`Ngày phải có dạng ${year}-MM-DD.`);void createYear();};
  const createYear=async()=>{setCreatingYear(true);try{const result=await receivingService.generateYearShifts(warehouseId,year,holidayDates());toast.success(`Đã tạo ${result.createdShifts} ca; bỏ qua ${result.skippedExisting} ca đã có.`);setYearOpen(false);setMonth(new Date(year,0,1));await load();}catch(e:any){toast.error(e?.response?.data?.message||'Không thể tạo lịch năm.');}finally{setCreatingYear(false);}};
  const move=(value:number)=>setMonth(new Date(month.getFullYear(),month.getMonth()+value,1));
  return <AdminLayout><div className="teams-calendar-page">
    <header className="teams-calendar-head">
      <div><span>LỊCH VẬN HÀNH</span><h1>Ca làm việc</h1><p>Lập và theo dõi lịch tiếp nhận theo ngày, tuần và tháng.</p></div>
      <div className="teams-calendar-actions"><button onClick={load}><RefreshCw size={16}/></button><button className="primary" onClick={()=>setYearOpen(true)}><CalendarDays size={16}/> Tạo lịch năm</button></div>
    </header>
    <div className="teams-calendar-toolbar">
      <button className="today" onClick={()=>{const now=new Date();setMonth(startMonth(now));setSelected(iso(now));}}>Hôm nay</button>
      <button onClick={()=>move(-1)}><ChevronLeft size={18}/></button><button onClick={()=>move(1)}><ChevronRight size={18}/></button>
      <h2>{monthNames[month.getMonth()]} {month.getFullYear()}</h2>
      <select value={warehouseId} onChange={e=>setWarehouseId(e.target.value)}>{setup.warehouses.map(x=><option value={x.id} key={x.id}>{x.name}</option>)}</select>
    </div>
    <div className="teams-calendar-layout">
      <section className="teams-month">
        <div className="teams-weekdays">{['CN','T2','T3','T4','T5','T6','T7'].map(x=><span key={x}>{x}</span>)}</div>
        <div className="teams-days">{days.map(day=>{const key=iso(day);const shifts=byDate.get(key)||[];const outside=day.getMonth()!==month.getMonth();const weekend=day.getDay()===0||day.getDay()===6;return <button key={key} className={`${outside?'outside ':''}${weekend?'weekend ':''}${selected===key?'selected ':''}${key===iso(new Date())?'current ':''}`} onClick={()=>setSelected(key)}>
          <span className="teams-day-number">{day.getDate()}</span>
          <div className="teams-day-events">{shifts.slice(0,2).map(x=><span className={x.status} key={x.id} onClick={event=>{event.stopPropagation();setSelected(key);setDetailShift(x);}}><i/>{x.startTime.slice(0,5)} {x.shiftName}</span>)}{shifts.length>2&&<small>+{shifts.length-2} ca</small>}</div>
        </button>})}</div>
      </section>
      <aside className="teams-agenda">
        <div className="teams-agenda-title"><div><span>{new Date(`${selected}T00:00:00`).toLocaleDateString('vi-VN',{weekday:'long'})}</span><h3>{new Date(`${selected}T00:00:00`).toLocaleDateString('vi-VN')}</h3></div><button onClick={createDay} disabled={creating||!warehouseId}><Plus size={16}/>{creating?'Đang tạo':'Tạo 2 ca'}</button></div>
        <div className="teams-agenda-list">{selectedShifts.map(shift=><article key={shift.id} role="button" tabIndex={0} onClick={()=>setDetailShift(shift)} onKeyDown={event=>{if(event.key==='Enter')setDetailShift(shift)}}><div className={`teams-time-line ${shift.status}`}/><div><span><Clock3 size={14}/>{shift.startTime.slice(0,5)}–{shift.endTime.slice(0,5)}</span><h4>{shift.shiftName}</h4><p><Warehouse size={13}/>{shift.warehouseName}</p><small>{shift.team?.teamName||'Chưa có team'} · {shift.assignedRequests} đơn</small></div><b className={shift.status}>{statusLabel[shift.status]||shift.status}</b></article>)}{!loading&&!selectedShifts.length&&<div className="teams-agenda-empty"><CalendarDays size={30}/><strong>Chưa có ca</strong><span>Tạo ca sáng và chiều cho ngày này.</span></div>}</div>
      </aside>
    </div>
    {yearOpen&&<div className="manager-modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget&&!creatingYear)setYearOpen(false)}}><section className="ops-panel teams-year-modal"><span className="ops-panel-label">LỊCH HÀNG LOẠT</span><h2>Tạo lịch làm việc cả năm</h2><p>Tự bỏ Thứ 7, Chủ nhật và các ngày lễ cố định.</p>
      <div className="ops-field"><label>Kho</label><select value={warehouseId} onChange={e=>setWarehouseId(e.target.value)}>{setup.warehouses.map(x=><option value={x.id} key={x.id}>{x.name}</option>)}</select></div>
      <div className="ops-field"><label>Năm</label><input type="number" min="2020" max="2100" value={year} onChange={e=>setYear(Number(e.target.value))}/></div>
      <div className="ops-field"><label>Ngày lễ bổ sung</label><textarea rows={3} value={holidays} onChange={e=>setHolidays(e.target.value)} placeholder={`${year}-02-16, ${year}-02-17`}/><small>Tết, Giỗ Tổ và ngày nghỉ bù; cách nhau bằng dấu phẩy.</small></div>
      <div className="teams-year-note">Tự loại: 01/01 · 30/04 · 01/05 · 02/09 · Tất cả cuối tuần</div>
      <div className="teams-year-actions"><button className="ops-btn ops-btn-secondary" onClick={()=>setYearOpen(false)} disabled={creatingYear}>Hủy</button><button className="ops-btn ops-btn-primary" onClick={requestYear} disabled={creatingYear||!warehouseId}>{creatingYear?'Đang tạo...':'Xác nhận tạo lịch'}</button></div>
    </section></div>}
    {detailShift&&<div className="manager-modal-backdrop" onMouseDown={event=>{if(event.target===event.currentTarget)setDetailShift(null)}}><section className="ops-panel teams-shift-detail" role="dialog" aria-modal="true" aria-labelledby="shift-detail-title">
      <div className="teams-detail-head"><div><span>CHI TIẾT CA LÀM VIỆC</span><h2 id="shift-detail-title">{detailShift.shiftName}</h2><p>{new Date(detailShift.shiftDate).toLocaleDateString('vi-VN',{weekday:'long',day:'2-digit',month:'2-digit',year:'numeric'})}</p></div><button onClick={()=>setDetailShift(null)}>×</button></div>
      <div className="teams-detail-summary">
        <div><span>Thời gian</span><strong><Clock3 size={16}/>{detailShift.startTime.slice(0,5)}–{detailShift.endTime.slice(0,5)}</strong></div>
        <div><span>Kho phụ trách</span><strong><Warehouse size={16}/>{detailShift.warehouseName}</strong></div>
        <div><span>Trạng thái</span><strong>{statusLabel[detailShift.status]||detailShift.status}</strong></div>
      </div>
      <section className="teams-detail-section"><div className="teams-detail-section-title"><div><span>01</span><h3>Receiving Team</h3></div><b>{detailShift.team?.members.length||0} thành viên</b></div>
        {detailShift.team?<><h4 className="teams-detail-team-name">{detailShift.team.teamName}</h4><div className="teams-detail-members">{detailShift.team.members.map((member,index)=><div key={member.id}><span>{member.fullName.split(/\s+/).slice(-2).map(x=>x[0]).join('').toUpperCase()}</span><div><strong>{member.fullName}</strong><a href={`tel:${member.phoneNumber}`}>{member.phoneNumber||'Chưa có số điện thoại'}</a></div><small>Thành viên {index+1}</small></div>)}</div></>:<div className="teams-detail-empty">Ca này chưa được tạo Receiving Team.</div>}
      </section>
      <section className="teams-detail-section"><div className="teams-detail-section-title"><div><span>02</span><h3>Intake Batch của ca</h3></div><b>{detailShift.intakeBatchId?'1 batch':'0 batch'}</b></div>
        {detailShift.intakeBatchId?<div className="teams-detail-batch"><div className="teams-detail-batch-code"><CalendarDays size={20}/><div><span>Mã Intake Batch</span><strong>{detailShift.intakeBatchCode}</strong></div><b>{detailShift.intakeBatchStatus||'Planned'}</b></div><div className="teams-detail-batch-grid"><div><span>Tuyến nhận hàng</span><strong>{detailShift.intakeBatchRoute||'Chưa xác định tuyến'}</strong></div><div><span>Donation Request</span><strong>{detailShift.assignedRequests} đơn</strong></div><div><span>Khối lượng thực nhận</span><strong>{detailShift.intakeBatchWeight||0} kg</strong></div></div></div>:<div className="teams-detail-empty">Chưa có Intake Batch. Batch sẽ được tạo khi đơn đầu tiên được assign cho team.</div>}
      </section>
      <div className="teams-detail-actions"><button className="ops-btn ops-btn-primary" onClick={()=>setDetailShift(null)}>Đóng chi tiết</button></div>
    </section></div>}
  </div></AdminLayout>;
}
