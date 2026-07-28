import { useEffect, useMemo, useState } from 'react';
import {
  CalendarDays, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Clock3, FilterX,
  MapPinned, PackageCheck, Pencil, RefreshCw, Save, Search, Trash2, Truck, UserPlus,
  Users, Warehouse, X,
} from 'lucide-react';
import AdminLayout from '@/shared/layouts/AdminLayout';
import { receivingService } from '@/services/receivingService';
import type { ManagerReceivingSetup, ManagerShiftOverview, ManagerTeamOverview } from '@/services/receivingService';
import { useToast } from '@/context/ToastContext';
import DispatchPanel from './DispatchPanel';
import RouteMap from '@/pages/receiving/RouteMap';
import '@/styles/ops-shared.css';
import './ReceivingOperations.css';
import './ShiftDetail.css';

const today=()=>{const d=new Date();d.setMinutes(d.getMinutes()-d.getTimezoneOffset());return d.toISOString().slice(0,10)};
const shiftStatus:Record<string,string>={Scheduled:'Đã lên lịch',InProgress:'Đang trong ca',Completed:'Đã hoàn thành'};
const normalize=(value:string)=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
const pages=(page:number,total:number):(number|string)[]=>{
  if(total<=7)return Array.from({length:total},(_,i)=>i+1);
  if(page<=4)return [1,2,3,4,5,'end',total];
  if(page>=total-3)return [1,'start',total-4,total-3,total-2,total-1,total];
  return [1,'start',page-1,page,page+1,'end',total];
};

export default function DispatchOperations(){
  const toast=useToast();
  const [setup,setSetup]=useState<ManagerReceivingSetup>({warehouses:[],receivingStaff:[],shifts:[]});
  const [loading,setLoading]=useState(true);
  const [warehouseFilter,setWarehouseFilter]=useState('');
  const [dateFilter,setDateFilter]=useState('');
  const [yearFilter,setYearFilter]=useState('');
  const [page,setPage]=useState(1);
  const pageSize=5;

  const [detailShift,setDetailShift]=useState<ManagerShiftOverview|null>(null);
  const [teamShift,setTeamShift]=useState<ManagerShiftOverview|null>(null);
  const [teamName,setTeamName]=useState('');
  const [teamType,setTeamType]=useState<'ReceivingPickup'|'ReceivingWarehouse'>('ReceivingPickup');
  const [staffIds,setStaffIds]=useState<string[]>([]);
  const [savingTeam,setSavingTeam]=useState(false);
  const [editingTeamId,setEditingTeamId]=useState<string>();
  const [editTeamName,setEditTeamName]=useState('');
  const [editTeamStaffIds,setEditTeamStaffIds]=useState<string[]>([]);
  const [staffSearch,setStaffSearch]=useState('');
  const [savingTeamMembers,setSavingTeamMembers]=useState(false);
  const [busyTeamId,setBusyTeamId]=useState<string>();
  const [balancingId,setBalancingId]=useState<string>();
  const [routeTeamId,setRouteTeamId]=useState<string>();
  const [collapsedTeamIds,setCollapsedTeamIds]=useState<Set<string>>(new Set());

  const [editingShift,setEditingShift]=useState(false);
  const [savingShift,setSavingShift]=useState(false);
  const [deletingShift,setDeletingShift]=useState(false);
  const [deleteConfirm,setDeleteConfirm]=useState(false);
  const [editForm,setEditForm]=useState({warehouseId:'',shiftName:'',shiftDate:'',startTime:'',endTime:''});

  const load=async(detailId?:string)=>{
    setLoading(true);
    try{
      const data=await receivingService.getManagerSetup();
      setSetup(data);
      setWarehouseFilter(current=>current||data.warehouses[0]?.id||'');
      if(detailId)setDetailShift(data.shifts.find(x=>x.id===detailId)||null);
      return data;
    }catch{toast.error('Không thể tải dữ liệu điều phối.');}
    finally{setLoading(false);}
  };
  useEffect(()=>{void load();},[]);

  const shifts=useMemo(()=>setup.shifts
    .filter(x=>x.shiftDate.slice(0,10)>=today()||x.status==='InProgress')
    .sort((a,b)=>a.shiftDate.localeCompare(b.shiftDate)||a.startTime.localeCompare(b.startTime)),[setup.shifts]);
  const years=useMemo(()=>Array.from(new Set(shifts.map(x=>x.shiftDate.slice(0,4)))).sort(),[shifts]);
  const filtered=useMemo(()=>shifts.filter(x=>
    (!warehouseFilter||x.warehouseId===warehouseFilter)&&
    (!yearFilter||x.shiftDate.slice(0,4)===yearFilter)&&
    (!dateFilter||x.shiftDate.slice(0,10)===dateFilter)),[shifts,warehouseFilter,yearFilter,dateFilter]);
  const workDays=useMemo(()=>Array.from(filtered.reduce((groups,shift)=>{
    const key=`${shift.warehouseId}-${shift.shiftDate.slice(0,10)}`;
    const current=groups.get(key);
    if(current)current.shifts.push(shift);
    else groups.set(key,{key,date:shift.shiftDate.slice(0,10),warehouseName:shift.warehouseName,shifts:[shift]});
    return groups;
  },new Map<string,{key:string;date:string;warehouseName:string;shifts:ManagerShiftOverview[]}>()).values())
    .map(day=>({...day,shifts:day.shifts.sort((a,b)=>a.startTime.localeCompare(b.startTime))}))
    .sort((a,b)=>a.date.localeCompare(b.date)),[filtered]);
  const totalPages=Math.max(1,Math.ceil(workDays.length/pageSize));
  const pagedDays=workDays.slice((page-1)*pageSize,page*pageSize);
  useEffect(()=>setPage(1),[warehouseFilter,yearFilter,dateFilter]);
  useEffect(()=>{if(page>totalPages)setPage(totalPages)},[page,totalPages]);

  const stats={
    teams:shifts.reduce((sum,x)=>sum+x.teams.length,0),
    withoutTeam:shifts.filter(x=>!x.teams.length&&x.status==='Scheduled').length,
    active:shifts.filter(x=>x.status==='InProgress').length,
    assigned:shifts.reduce((sum,x)=>sum+x.assignedRequests,0),
  };

  const openDetail=(shift:ManagerShiftOverview)=>{
    setDetailShift(shift);setEditingShift(false);setEditingTeamId(undefined);
    setDeleteConfirm(false);setStaffSearch('');setRouteTeamId(undefined);
    setCollapsedTeamIds(new Set(shift.teams.map(team=>team.id)));
    setEditForm({warehouseId:shift.warehouseId,shiftName:shift.shiftName,
      shiftDate:shift.shiftDate.slice(0,10),startTime:shift.startTime.slice(0,5),endTime:shift.endTime.slice(0,5)});
  };
  const toggleTeamCollapsed=(teamId:string)=>setCollapsedTeamIds(current=>{
    const next=new Set(current);
    if(next.has(teamId))next.delete(teamId);else next.add(teamId);
    return next;
  });
  const openCreateTeam=(shift:ManagerShiftOverview,type:'ReceivingPickup'|'ReceivingWarehouse'='ReceivingPickup')=>{
    setTeamType(type);setTeamShift(shift);
    setTeamName(type==='ReceivingWarehouse'
      ? `Team trực kho · ${shift.shiftName}`
      : `Team ${shift.teams.filter(x=>x.teamType!=='ReceivingWarehouse').length+1} · ${shift.shiftName}`);
    setStaffIds([]);setStaffSearch('');
  };
  const assignedTeam=(shift:ManagerShiftOverview,staffId:string,exceptTeamId?:string)=>
    shift.teams.find(team=>team.id!==exceptTeamId&&team.members.some(member=>member.id===staffId));
  const toggleCreateStaff=(id:string)=>{
    if(!teamShift||assignedTeam(teamShift,id))return;
    setStaffIds(v=>v.includes(id)?v.filter(x=>x!==id):v.length<2?[...v,id]:v);
  };
  const createTeam=async()=>{
    if(!teamShift||staffIds.length!==2)return toast.warning('Chọn đúng 2 Receiving Staff.');
    setSavingTeam(true);
    try{await receivingService.createTeam(teamShift.id,teamName.trim(),staffIds,teamType);toast.success(teamType==='ReceivingWarehouse'?'Đã tạo team trực kho.':'Đã thêm pickup team vào ca.');setTeamShift(null);await load(detailShift?.id);}
    catch(e:any){toast.error(e?.response?.data?.message||'Không thể tạo team.');}
    finally{setSavingTeam(false);}
  };

  const startEditTeam=(team:ManagerTeamOverview)=>{
    setEditingTeamId(team.id);setEditTeamName(team.teamName);
    setEditTeamStaffIds(team.members.map(x=>x.id));setStaffSearch('');
    setCollapsedTeamIds(current=>{const next=new Set(current);next.delete(team.id);return next});
  };
  const toggleEditStaff=(id:string)=>{
    if(!detailShift||assignedTeam(detailShift,id,editingTeamId))return;
    setEditTeamStaffIds(v=>v.includes(id)?v.filter(x=>x!==id):v.length<2?[...v,id]:v);
  };
  const saveTeam=async()=>{
    if(!detailShift||!editingTeamId||editTeamStaffIds.length!==2)return;
    setSavingTeamMembers(true);
    try{await receivingService.updateTeam(editingTeamId,editTeamName.trim(),editTeamStaffIds);toast.success('Đã cập nhật team.');setEditingTeamId(undefined);await load(detailShift.id);}
    catch(e:any){toast.error(e?.response?.data?.message||'Không thể cập nhật team.');}
    finally{setSavingTeamMembers(false);}
  };
  const deleteTeam=async(team:ManagerTeamOverview)=>{
    if(!detailShift||!window.confirm(`Xóa ${team.teamName}?`))return;
    setBusyTeamId(team.id);
    try{await receivingService.deleteTeam(team.id);toast.success('Đã xóa team.');await load(detailShift.id);}
    catch(e:any){toast.error(e?.response?.data?.message||'Không thể xóa team.');}
    finally{setBusyTeamId(undefined);}
  };
  const autoBalance=async(shift:ManagerShiftOverview)=>{
    setBalancingId(shift.id);
    try{
      const result=await receivingService.autoBalanceShift(shift.id);
      toast.success(`Đã điều phối ${result.requestCount} đơn trong ngày cho ${result.teamCount} team ca sáng và chiều.`);
      await load(detailShift?.id===shift.id?shift.id:undefined);
    }catch(e:any){toast.error(e?.response?.data?.message||'Không thể tự động cân bằng đơn.');}
    finally{setBalancingId(undefined);}
  };
  const moveRequest=async(requestId:string,teamId:string)=>{
    if(!detailShift||!teamId)return;
    try{await receivingService.assignRequest(requestId,teamId);toast.success('Đã chuyển đơn sang team mới.');await load(detailShift.id);}
    catch(e:any){toast.error(e?.response?.data?.message||'Không thể chuyển đơn.');}
  };

  const saveShift=async()=>{
    if(!detailShift)return;
    if(!editForm.shiftName.trim())return toast.warning('Vui lòng nhập tên ca.');
    if(editForm.startTime>=editForm.endTime)return toast.warning('Giờ kết thúc phải sau giờ bắt đầu.');
    setSavingShift(true);
    try{await receivingService.updateShift(detailShift.id,{...editForm,startTime:`${editForm.startTime}:00`,endTime:`${editForm.endTime}:00`});toast.success('Đã cập nhật ca.');setEditingShift(false);await load(detailShift.id);}
    catch(e:any){toast.error(e?.response?.data?.message||'Không thể cập nhật ca.');}
    finally{setSavingShift(false);}
  };
  const removeShift=async()=>{
    if(!detailShift)return;setDeletingShift(true);
    try{await receivingService.deleteShift(detailShift.id);toast.success('Đã xóa ca.');setDetailShift(null);await load();}
    catch(e:any){toast.error(e?.response?.data?.message||'Không thể xóa ca.');}
    finally{setDeletingShift(false);}
  };

  const staffAt=(warehouseId:string,query:string)=>setup.receivingStaff.filter(x=>x.warehouseId===warehouseId)
    .filter(x=>{const q=normalize(query);return !q||normalize(x.fullName).includes(q)||x.phoneNumber.includes(q)});

  return <AdminLayout><div className="ops-page manager-ops">
    <header className="ops-pagehead"><div className="ops-pagehead-main"><span className="ops-pagehead-kicker">Receiving Dispatch</span><h1>Điều phối tiếp nhận</h1><p>Quản lý ca, nhiều team, tuyến thu gom, intake batch và phân bổ đơn cân bằng.</p></div><button className="ops-btn ops-btn-secondary" onClick={()=>load()} disabled={loading}><RefreshCw size={16}/> Làm mới</button></header>
    <div className="ops-stats">
      <div className="ops-stat-card"><span className="ops-stat-label">Team đã xếp lịch</span><strong className="ops-stat-value">{stats.teams}</strong></div>
      <div className="ops-stat-card"><span className="ops-stat-label">Ca chưa có team</span><strong className="ops-stat-value">{stats.withoutTeam}</strong></div>
      <div className="ops-stat-card"><span className="ops-stat-label">Ca đang chạy</span><strong className="ops-stat-value">{stats.active}</strong></div>
      <div className="ops-stat-card"><span className="ops-stat-label">Đơn đã assign</span><strong className="ops-stat-value">{stats.assigned}</strong></div>
    </div>

    <section>
      <div className="ops-section-head"><div><span className="ops-panel-label">QUẢN LÝ TEAM</span><h2>Lịch tiếp nhận theo ngày</h2></div><span>{workDays.length} ngày · {filtered.length} ca</span></div>
      <div className="manager-shift-toolbar"><div className="manager-date-filter"><Warehouse size={16}/><label>Kho</label><select value={warehouseFilter} onChange={e=>setWarehouseFilter(e.target.value)}>{setup.warehouses.map(x=><option value={x.id} key={x.id}>{x.name}</option>)}</select><CalendarDays size={16}/><label>Năm</label><select value={yearFilter} onChange={e=>setYearFilter(e.target.value)}><option value="">Tất cả năm</option>{years.map(x=><option key={x}>{x}</option>)}</select><label>Ngày</label><input type="date" value={dateFilter} onChange={e=>{setDateFilter(e.target.value);if(e.target.value)setYearFilter(e.target.value.slice(0,4))}}/>{(yearFilter||dateFilter)&&<button onClick={()=>{setYearFilter('');setDateFilter('')}}><FilterX size={16}/> Xóa ngày/năm</button>}</div><span>{workDays.length?((page-1)*pageSize)+1:0}–{Math.min(page*pageSize,workDays.length)} / {workDays.length} ngày</span></div>
      <div className="manager-workday-list">{pagedDays.map(day=>{const scheduled=day.shifts.find(x=>x.status==='Scheduled');const teamCount=day.shifts.reduce((sum,x)=>sum+x.teams.length,0);const requestCount=day.shifts.reduce((sum,x)=>sum+x.assignedRequests,0);return <article className="manager-workday-card" key={day.key}>
        <div className="manager-workday-head"><div><CalendarDays size={18}/><span><strong>{new Date(`${day.date}T00:00:00`).toLocaleDateString('vi-VN',{weekday:'long',day:'2-digit',month:'2-digit',year:'numeric'})}</strong><small>{day.warehouseName}</small></span></div><b>{teamCount} team · {requestCount} đơn</b></div>
        <div className="manager-workday-shifts">{day.shifts.map(shift=><section className="manager-day-shift" onClick={()=>openDetail(shift)} key={shift.id}>
          <div className="manager-shift-head"><div><strong>{shift.shiftName}</strong><span><Clock3 size={13}/>{shift.startTime.slice(0,5)}–{shift.endTime.slice(0,5)}</span></div><span className={`ops-badge ${shift.status==='InProgress'?'stored':'pending'}`}>{shiftStatus[shift.status]||shift.status}</span></div>
          <div className="manager-compact-team-row"><span><Users size={15}/><strong>{shift.teams.length} team</strong><small>{shift.assignedRequests} đơn</small></span>{shift.status==='Scheduled'&&<div className="manager-shift-team-actions"><button onClick={e=>{e.stopPropagation();openCreateTeam(shift)}} title={`Thêm pickup team vào ${shift.shiftName}`}><UserPlus size={14}/> Pickup</button>{shift.pendingDropOffRequests>0&&!shift.teams.some(x=>x.teamType==='ReceivingWarehouse')&&<button className="warehouse-team-btn" onClick={e=>{e.stopPropagation();openCreateTeam(shift,'ReceivingWarehouse')}} title={`Tạo team trực kho cho ${shift.shiftName}`}><Warehouse size={14}/> Trực kho</button>}</div>}</div>
          {shift.pendingDropOffRequests>0&&<small className="manager-dropoff-demand">{shift.pendingDropOffRequests} đơn dự kiến mang đến kho trong ngày</small>}
        </section>)}</div>
        {scheduled&&<div className="manager-workday-footer"><button className="ops-btn ops-btn-primary ops-btn-block" onClick={()=>void autoBalance(scheduled)} disabled={!!balancingId}><Truck size={15}/>{balancingId?'Đang chia...':'Điều phối cả ngày'}</button></div>}
      </article>})}{!loading&&!workDays.length&&<div className="ops-empty"><CalendarDays size={34}/><h4>Không có ca phù hợp</h4></div>}</div>
      {totalPages>1&&<nav className="manager-shift-pagination"><button onClick={()=>setPage(x=>Math.max(1,x-1))} disabled={page===1}><ChevronLeft size={17}/> Trước</button>{pages(page,totalPages).map(x=>typeof x==='number'?<button className={x===page?'active':''} onClick={()=>setPage(x)} key={x}>{x}</button>:<span className="manager-page-gap" key={x}>…</span>)}<button onClick={()=>setPage(x=>Math.min(totalPages,x+1))} disabled={page===totalPages}>Sau <ChevronRight size={17}/></button></nav>}
    </section>

    <section><div className="ops-section-head"><div><span className="ops-panel-label">ASSIGN THỦ CÔNG</span><h2>Donation Request chờ điều phối</h2></div><span>Chọn team đúng kho và đúng ngày</span></div><DispatchPanel key={`${stats.teams}-${stats.assigned}`}/></section>

    {detailShift&&<div className="manager-modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget&&!savingShift)setDetailShift(null)}}><section className="ops-panel teams-shift-detail manager-multi-detail">
      <div className="teams-detail-head"><div><span>CHI TIẾT CA · {detailShift.teams.length} TEAM</span><h2>{detailShift.shiftName}</h2><p>{new Date(detailShift.shiftDate).toLocaleDateString('vi-VN',{weekday:'long',day:'2-digit',month:'2-digit',year:'numeric'})}</p></div><button onClick={()=>setDetailShift(null)}>×</button></div>
      {editingShift?<div className="teams-shift-edit-form"><div className="ops-field"><label>Tên ca</label><input value={editForm.shiftName} onChange={e=>setEditForm({...editForm,shiftName:e.target.value})}/></div><div className="ops-field"><label>Kho</label><select value={editForm.warehouseId} onChange={e=>setEditForm({...editForm,warehouseId:e.target.value})}>{setup.warehouses.map(x=><option value={x.id} key={x.id}>{x.name}</option>)}</select></div><div className="ops-field"><label>Ngày</label><input type="date" value={editForm.shiftDate} onChange={e=>setEditForm({...editForm,shiftDate:e.target.value})}/></div><div className="teams-shift-time-fields"><div className="ops-field"><label>Bắt đầu</label><input type="time" value={editForm.startTime} onChange={e=>setEditForm({...editForm,startTime:e.target.value})}/></div><div className="ops-field"><label>Kết thúc</label><input type="time" value={editForm.endTime} onChange={e=>setEditForm({...editForm,endTime:e.target.value})}/></div></div></div>:<>
        <div className="teams-detail-summary"><div><span>Thời gian</span><strong><Clock3 size={16}/>{detailShift.startTime.slice(0,5)}–{detailShift.endTime.slice(0,5)}</strong></div><div><span>Kho</span><strong><Warehouse size={16}/>{detailShift.warehouseName}</strong></div><div><span>Tổng tải</span><strong>{detailShift.teams.length} team · {detailShift.assignedRequests} đơn</strong></div></div>
        <div className="manager-team-command"><button className="ops-btn ops-btn-secondary" onClick={()=>openCreateTeam(detailShift)} disabled={detailShift.status!=='Scheduled'}><UserPlus size={15}/> Thêm pickup team</button>{detailShift.pendingDropOffRequests>0&&!detailShift.teams.some(x=>x.teamType==='ReceivingWarehouse')&&<button className="ops-btn ops-btn-secondary" onClick={()=>openCreateTeam(detailShift,'ReceivingWarehouse')} disabled={detailShift.status!=='Scheduled'}><Warehouse size={15}/> Tạo team trực kho</button>}<button className="ops-btn ops-btn-primary" onClick={()=>autoBalance(detailShift)} disabled={detailShift.status!=='Scheduled'||balancingId===detailShift.id}><Truck size={15}/>{balancingId===detailShift.id?'Đang tối ưu...':'Điều phối ca sáng & chiều'}</button></div>
        <div className="manager-multi-team-list">{detailShift.teams.map(team=><section className="manager-multi-team" key={team.id}>
          <div className="manager-multi-team-head"><div>{team.teamType==='ReceivingWarehouse'?<Warehouse size={18}/>:<Users size={18}/>}<div><strong>{team.teamName}</strong><span>{team.teamType==='ReceivingWarehouse'?'Team trực kho':'Team đi thu gom'} · {team.members.length} thành viên · {team.requests.length} đơn</span></div></div><div><button className="manager-collapse-team" onClick={()=>toggleTeamCollapsed(team.id)}>{collapsedTeamIds.has(team.id)?<><ChevronDown size={14}/> Mở rộng</>:<><ChevronUp size={14}/> Thu gọn</>}</button><button onClick={()=>startEditTeam(team)} disabled={detailShift.status!=='Scheduled'}><Pencil size={14}/> Sửa</button><button className="danger" onClick={()=>deleteTeam(team)} disabled={busyTeamId===team.id||!!team.requests.length}><Trash2 size={14}/></button></div></div>
          {!collapsedTeamIds.has(team.id)&&(editingTeamId===team.id?<div className="manager-edit-team"><div className="ops-field"><label>Tên team</label><input value={editTeamName} onChange={e=>setEditTeamName(e.target.value)}/></div><div className="manager-staff-search"><Search size={16}/><input value={staffSearch} onChange={e=>setStaffSearch(e.target.value)} placeholder="Tìm tên hoặc số điện thoại..."/>{staffSearch&&<button onClick={()=>setStaffSearch('')}><X size={14}/></button>}</div><label>Chọn đúng 2 thành viên <strong>{editTeamStaffIds.length}/2</strong></label><div className="manager-staff-list">{staffAt(detailShift.warehouseId,staffSearch).map(staff=>{const occupied=assignedTeam(detailShift,staff.id,team.id);return <button className={`${editTeamStaffIds.includes(staff.id)?'selected':''}${occupied?' assigned':''}`} onClick={()=>toggleEditStaff(staff.id)} disabled={!!occupied} key={staff.id}><span>{staff.fullName}<small>{staff.phoneNumber}</small>{occupied&&<small className="manager-assigned-note">Đã thuộc {occupied.teamName}</small>}</span>{editTeamStaffIds.includes(staff.id)?<CheckCircle2 size={18}/>:<span className="manager-check"/>}</button>})}</div><div className="manager-inline-actions"><button className="ops-btn ops-btn-secondary" onClick={()=>setEditingTeamId(undefined)}>Hủy</button><button className="ops-btn ops-btn-primary" onClick={saveTeam} disabled={editTeamStaffIds.length!==2||savingTeamMembers}><Save size={14}/> Lưu team</button></div></div>:<>
            <div className="manager-team-members">{team.members.map(member=><span key={member.id}>{member.fullName}<small>{member.phoneNumber}</small></span>)}</div>
            <div className="manager-team-batch"><PackageCheck size={17}/><div><span>{team.intakeBatchCode||'Chưa tạo Intake Batch'}</span><small>{team.intakeBatchRoute||'Chưa có tuyến'}</small></div><b>{team.intakeBatchStatus||'—'}</b></div>
            {team.teamType!=='ReceivingWarehouse'&&<button className="ops-btn ops-btn-secondary manager-route-toggle" onClick={()=>setRouteTeamId(team.id)} disabled={!team.requests.length}><MapPinned size={16}/>Xem tuyến đường trên bản đồ</button>}
            {team.teamType==='ReceivingWarehouse'?<div className="manager-warehouse-duty-note"><Warehouse size={18}/><strong>Không phân công đơn trước cho team trực kho</strong></div>:<div className="manager-team-requests">{team.requests.map(request=><div key={request.id}><span><strong>{request.routeOrder}. {request.code}</strong><small>{request.contactName} · {request.phoneNumber}</small><small>{request.address}</small></span><select value={team.id} onChange={e=>moveRequest(request.id,e.target.value)} disabled={detailShift.status!=='Scheduled'}>{detailShift.teams.filter(target=>target.teamType!=='ReceivingWarehouse').map(target=><option value={target.id} key={target.id}>Chuyển đến {target.teamName}</option>)}</select></div>)}{!team.requests.length&&<div className="teams-detail-empty">Team chưa có đơn. Chạy auto-assign hoặc phân công thủ công.</div>}</div>}
          </>)}
        </section>)}</div>
      </>}
      {deleteConfirm&&<div className="teams-delete-confirm"><strong>Xóa ca “{detailShift.shiftName}”?</strong><span>Chỉ xóa được khi ca không còn team, batch hoặc đơn.</span><div><button className="ops-btn ops-btn-secondary" onClick={()=>setDeleteConfirm(false)}>Hủy</button><button className="ops-btn teams-danger-solid" onClick={removeShift} disabled={deletingShift}>{deletingShift?'Đang xóa...':'Xác nhận xóa'}</button></div></div>}
      <div className="teams-detail-actions">{editingShift?<><button className="ops-btn ops-btn-secondary" onClick={()=>setEditingShift(false)}>Hủy</button><button className="ops-btn ops-btn-primary" onClick={saveShift} disabled={savingShift}><Save size={15}/> Lưu ca</button></>:<><button className="ops-btn teams-danger-btn" onClick={()=>setDeleteConfirm(true)} disabled={detailShift.status!=='Scheduled'||!!detailShift.teams.length}><Trash2 size={15}/> Xóa ca</button><button className="ops-btn ops-btn-secondary" onClick={()=>setEditingShift(true)} disabled={detailShift.status!=='Scheduled'}><Pencil size={15}/> Sửa ca</button><button className="ops-btn ops-btn-primary" onClick={()=>setDetailShift(null)}>Đóng</button></>}</div>
    </section></div>}

    {routeTeamId&&detailShift&&(()=>{
      const routeTeam=detailShift.teams.find(team=>team.id===routeTeamId);
      if(!routeTeam)return null;
      return <div className="manager-modal-backdrop manager-route-modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setRouteTeamId(undefined)}}>
        <section className="ops-panel manager-route-modal">
          <div className="teams-detail-head"><div><span>TUYẾN ĐƯỜNG THU GOM · {routeTeam.requests.length} ĐƠN</span><h2>{routeTeam.teamName}</h2><p>{routeTeam.intakeBatchCode||'Intake Batch chưa có mã'} · {detailShift.warehouseName}</p></div><button onClick={()=>setRouteTeamId(undefined)}>×</button></div>
          <RouteMap autoBuild batch={{
            warehouseAddress:setup.warehouses.find(x=>x.id===detailShift.warehouseId)?.address||detailShift.warehouseName,
            requests:[...routeTeam.requests].sort((a,b)=>a.routeOrder-b.routeOrder).map(request=>({
              id:request.id,donorName:request.contactName,pickupAddress:request.address,deliveryMethod:'StaffPickup',
            })),
          }}/>
          <div className="manager-route-modal-actions"><button className="ops-btn ops-btn-primary" onClick={()=>setRouteTeamId(undefined)}>Đóng bản đồ</button></div>
        </section>
      </div>;
    })()}

    {teamShift&&<div className="manager-modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget&&!savingTeam)setTeamShift(null)}}><section className="ops-panel manager-team-modal">
      <div className="ops-section-head"><div><span className="ops-panel-label">{teamShift.shiftName} · {teamShift.warehouseName}</span><h2>{teamType==='ReceivingWarehouse'?'Tạo team Receiving trực kho':'Thêm team đi thu gom'}</h2><p>{teamType==='ReceivingWarehouse'?'Team tiếp nhận donor mang hàng đến kho, không tham gia tuyến thu gom.':'Team đến lấy Donation Request tại địa chỉ donor.'}</p></div><button className="manager-close" onClick={()=>setTeamShift(null)}>×</button></div>
      <div className="ops-field"><label>Tên team</label><input value={teamName} onChange={e=>setTeamName(e.target.value)}/></div>
      <div className="manager-staff-search"><Search size={16}/><input value={staffSearch} onChange={e=>setStaffSearch(e.target.value)} placeholder="Tìm tên hoặc số điện thoại..."/></div>
      <label className="manager-staff-label">Chọn đúng 2 staff cùng kho <strong>{staffIds.length}/2</strong></label>
      <div className="manager-staff-list">{staffAt(teamShift.warehouseId,staffSearch).map(staff=>{const occupied=assignedTeam(teamShift,staff.id);return <button className={`${staffIds.includes(staff.id)?'selected':''}${occupied?' assigned':''}`} onClick={()=>toggleCreateStaff(staff.id)} disabled={!!occupied} key={staff.id}><span>{staff.fullName}<small>@{staff.userName} · {staff.phoneNumber}</small>{occupied&&<small className="manager-assigned-note">Đã thuộc {occupied.teamName} trong ca này</small>}</span>{staffIds.includes(staff.id)?<CheckCircle2 size={19}/>:<span className="manager-check"/>}</button>})}</div>
      <button className="ops-btn ops-btn-primary ops-btn-block" onClick={createTeam} disabled={savingTeam||staffIds.length!==2||!teamName.trim()}>{teamType==='ReceivingWarehouse'?<Warehouse size={16}/>:<Users size={16}/>} {savingTeam?'Đang tạo...':teamType==='ReceivingWarehouse'?'Tạo team trực kho':'Thêm pickup team vào ca'}</button>
    </section></div>}
  </div></AdminLayout>;
}
