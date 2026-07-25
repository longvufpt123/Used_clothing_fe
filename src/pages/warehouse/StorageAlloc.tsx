import { useEffect, useState } from 'react';
import { CheckCircle, ChevronLeft, MapPin, PackageOpen, Sparkles } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from '@/context/ToastContext';
import { warehouseService, type StorageLocation, type WarehouseBatch } from '@/services/warehouseService';
import '@/styles/ops-shared.css';

export default function StorageAlloc(){
 const {batchId}=useParams();const nav=useNavigate();const toast=useToast();const [batch,setBatch]=useState<WarehouseBatch|null>(null);const [locations,setLocations]=useState<StorageLocation[]>([]);const [selected,setSelected]=useState('');const [notes,setNotes]=useState('');const [saving,setSaving]=useState(false);
 useEffect(()=>{if(!batchId)return;Promise.all([warehouseService.getBatch(batchId),warehouseService.locations(batchId)]).then(([b,l])=>{setBatch(b);setLocations(l);setSelected(l[0]?.id||'');}).catch(()=>{toast.error('Không tải được vị trí lưu trữ.');nav('/warehouse');});},[batchId]);
 const store=async()=>{if(!batchId||!selected)return toast.error('Chọn vị trí lưu trữ.');setSaving(true);try{await warehouseService.putaway(batchId,{locationId:selected,notes});toast.success('Đã nhập vị trí và ghi transaction PUTAWAY.');nav('/warehouse/inventory');}catch(e:any){toast.error(e?.response?.data?.message||'Không thể xếp vị trí.');}finally{setSaving(false);}};
 if(!batch)return <div className="ops-page">Đang tải...</div>;
 return <div className="ops-page"><div className="ops-nav"><button className="ops-back" onClick={()=>nav('/warehouse')}><ChevronLeft size={16}/> Quay lại</button><div className="ops-title-row"><h1>Xếp vị trí lưu kho</h1><span className="ops-badge pending">Awaiting putaway</span></div></div>
 <header className="ops-pagehead"><div className="ops-pagehead-main"><span className="ops-pagehead-kicker">{batch.batchCode}</span><h1>{batch.clothingType} · Nhãn {batch.conditionGrade}</h1><p>Hệ thống chấm điểm vị trí dựa trên khu xử lý, loại quần áo và sức chứa còn lại. Warehouse Staff vẫn là người xác nhận vị trí cuối cùng.</p></div></header>
 <div className="ops-stats"><div className="ops-stat-card"><span className="ops-stat-label">Số lượng</span><div className="ops-stat-value"><PackageOpen size={18}/>{batch.receivedItemCount} item</div></div><div className="ops-stat-card"><span className="ops-stat-label">Khối lượng</span><div className="ops-stat-value">{batch.receivedWeightKg} kg</div></div><div className="ops-stat-card"><span className="ops-stat-label">Hướng xử lý</span><div className="ops-stat-value">{batch.processingDirection}</div></div></div>
 <section><div className="ops-section-head"><h2>Vị trí đề xuất</h2><span><Sparkles size={14}/> Sắp theo độ phù hợp</span></div><div className="ops-list">{locations.map((location,index)=><button type="button" key={location.id} className={`ops-card ops-location-card ${selected===location.id?'active':''}`} onClick={()=>setSelected(location.id)}>
  <div className="ops-card-top"><div><div className="ops-card-code">{location.locationCode}</div><div className="ops-card-meta"><span>{location.areaName}</span><span>Hàng {location.aisleCode}</span><span>Kệ {location.rackCode}</span><span>Tầng {location.shelfCode}</span><span>Ô {location.binCode}</span></div></div><span className={`ops-badge ${index===0?'done':'pending'}`}>{location.matchScore} điểm</span></div>
  <div className="ops-card-footer"><span>Còn <strong>{location.availableCapacityKg.toFixed(1)} kg</strong> / {location.capacityKg} kg</span>{selected===location.id&&<span className="ops-card-action"><CheckCircle size={16}/> Đã chọn</span>}</div>
 </button>)}</div></section>
 <section className="ops-panel glass" style={{marginTop:20}}><div className="ops-field"><label>Ghi chú xếp kho</label><textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Tình trạng pallet, yêu cầu FIFO/FEFO, lưu ý thao tác..."/></div><button className="ops-btn ops-btn-primary ops-btn-block" disabled={!selected||saving} onClick={store}><MapPin size={16}/>{saving?'Đang nhập kho...':'Xác nhận vị trí và nhập kho'}</button></section></div>;
}
