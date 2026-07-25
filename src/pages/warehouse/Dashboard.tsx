import { useEffect, useState } from 'react';
import { Archive, ArrowRight, Boxes, PackageCheck, Scale, Warehouse } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '@/context/ToastContext';
import { warehouseService, type WarehouseBatch, type WarehouseDashboard as DashboardData } from '@/services/warehouseService';
import '@/styles/ops-shared.css';

type Tab = 'inbound'|'putaway'|'stored';
const labels:Record<string,string> = {
  PendingWarehouseReceipt:'Chờ xác nhận nhận', WarehouseReceived:'Chờ xếp vị trí', Stored:'Đã lưu kho',
};

export default function WarehouseDashboard(){
  const nav=useNavigate(); const toast=useToast(); const [params,setParams]=useSearchParams();
  const tab=(params.get('tab') as Tab)||'inbound'; const [stats,setStats]=useState<DashboardData|null>(null);
  const [batches,setBatches]=useState<WarehouseBatch[]>([]); const [loading,setLoading]=useState(true);
  const load=async()=>{try{const [dashboard,list]=await Promise.all([warehouseService.dashboard(),warehouseService.inboundBatches()]);setStats(dashboard);setBatches(list);}catch{toast.error('Không tải được dữ liệu vận hành kho.');}finally{setLoading(false);}};
  useEffect(()=>{load();const id=window.setInterval(load,10000);return()=>window.clearInterval(id);},[]);
  const shown=batches.filter(batch=>tab==='inbound'?batch.status==='PendingWarehouseReceipt':tab==='putaway'?batch.status==='WarehouseReceived':batch.status==='Stored');
  const open=(batch:WarehouseBatch)=>nav(batch.status==='PendingWarehouseReceipt'?`/warehouse/receive/${batch.id}`:batch.status==='WarehouseReceived'?`/warehouse/storage/${batch.id}`:`/warehouse/inventory?batch=${batch.id}`);
  return <div className="ops-page">
    <header className="ops-pagehead"><div className="ops-pagehead-main"><span className="ops-pagehead-kicker">Warehouse Control Center</span><h1>Điều hành nhập–xuất–tồn kho</h1><p>Đối chiếu bàn giao, xếp vị trí có kiểm soát sức chứa và theo dõi đầy đủ audit trail của từng batch.</p></div></header>
    <div className="ops-stats">
      <div className="ops-stat-card"><span className="ops-stat-label">Chờ nhận</span><div className="ops-stat-value"><PackageCheck size={18}/>{stats?.pendingReceipt||0}</div></div>
      <div className="ops-stat-card"><span className="ops-stat-label">Chờ xếp vị trí</span><div className="ops-stat-value"><Archive size={18}/>{stats?.awaitingPutaway||0}</div></div>
      <div className="ops-stat-card"><span className="ops-stat-label">Tồn khả dụng</span><div className="ops-stat-value"><Boxes size={18}/>{stats?.availableQuantity||0}</div><span className="ops-stat-foot">{stats?.availableWeightKg||0} kg</span></div>
      <div className="ops-stat-card"><span className="ops-stat-label">Sử dụng sức chứa</span><div className="ops-stat-value"><Scale size={18}/>{stats?.capacityUsedPercent||0}%</div></div>
    </div>
    <section><div className="ops-section-head"><h2>Luồng Classified Batch</h2><span>{loading?'Đang đồng bộ...':'Dữ liệu trực tiếp từ hệ thống'}</span></div>
      <div className="ops-tabs">
        {[['inbound','Chờ nhập kho',stats?.pendingReceipt],['putaway','Chờ xếp vị trí',stats?.awaitingPutaway],['stored','Đã lưu kho',stats?.storedBatches]].map(([key,label,count])=><button key={String(key)} className={`ops-tab ${tab===key?'active':''}`} onClick={()=>setParams({tab:String(key)})}>{label}<span className="ops-tab-count">{count||0}</span></button>)}
      </div>
      <div className="ops-list">{shown.map(batch=><article className="ops-card" key={batch.id} role="button" tabIndex={0} onClick={()=>open(batch)} onKeyDown={e=>e.key==='Enter'&&open(batch)}>
        <div className="ops-card-top"><div><div className="ops-card-code">{batch.batchCode}</div><div className="ops-card-meta"><span>{new Date(batch.classificationDate).toLocaleDateString('vi-VN')}</span><span>Nhãn {batch.conditionGrade}</span><span>{batch.processingDirection}</span></div></div><span className={`ops-badge ${batch.status==='Stored'?'done':'pending'}`}>{labels[batch.status]||batch.status}</span></div>
        <h3>{batch.clothingType} · {batch.fabricType}</h3><div className="ops-card-meta"><span>{batch.gender}</span><span>{batch.targetUser}</span><span>Size {batch.size}</span></div>
        <div className="ops-card-footer"><span><strong>{batch.receivedItemCount??batch.expectedItemCount}</strong> item · <strong>{batch.receivedWeightKg??batch.expectedWeightKg}</strong> kg</span><span className="ops-card-action">Mở nghiệp vụ <ArrowRight size={14}/></span></div>
      </article>)}{!loading&&!shown.length&&<div className="ops-empty"><Warehouse size={36}/><h4>Không có batch trong hàng đợi này</h4><p>Dữ liệu sẽ tự cập nhật khi bộ phận trước hoàn tất bàn giao.</p></div>}</div>
    </section>
  </div>;
}
