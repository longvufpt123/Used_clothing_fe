import { useEffect, useState } from 'react';
import { ArrowRight, ClipboardList, Package, Scale } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/context/ToastContext';
import { classificationService, type ClassificationBatchSummary } from '@/services/classificationService';
import '@/styles/ops-shared.css';

export default function ClassificationDashboard() {
  const [batches,setBatches]=useState<ClassificationBatchSummary[]>([]);
  const [loading,setLoading]=useState(true); const navigate=useNavigate(); const toast=useToast();
  useEffect(()=>{ classificationService.getBatches().then(setBatches).catch(()=>toast.error('Không tải được danh sách Intake Batch.')).finally(()=>setLoading(false)); },[toast]);
  const open=async(b:ClassificationBatchSummary)=>{
    try { if(b.status==='Classified'){navigate(`/classification/batches/${b.id}`);return;} if(b.status==='PendingConfirmation'){navigate(`/classification/confirm/${b.id}`);return;} if(b.status==='PendingClassification') await classificationService.startBatch(b.id); navigate(`/classification/classify/${b.id}`); }
    catch(e:any){toast.error(e?.response?.data?.message||'Không thể bắt đầu phân loại.');}
  };
  return <div className="ops-page">
    <header className="ops-pagehead"><div className="ops-pagehead-main"><span className="ops-pagehead-kicker">Bộ phận Phân loại</span><h1>Phân loại từng vật phẩm</h1><p>Chọn Intake Batch được chuyển từ bộ phận tiếp nhận và đánh giá từng món theo tiêu chí A, B, C.</p></div></header>
    <div className="ops-stats"><div className="ops-stat-card"><span className="ops-stat-label">Intake Batch</span><div className="ops-stat-value"><Package size={18}/>{batches.length}</div></div><div className="ops-stat-card"><span className="ops-stat-label">Đang phân loại</span><div className="ops-stat-value"><ClipboardList size={18}/>{batches.filter(x=>x.status==='Classifying').length}</div></div><div className="ops-stat-card"><span className="ops-stat-label">Tổng khối lượng</span><div className="ops-stat-value"><Scale size={18}/>{batches.reduce((s,x)=>s+x.totalWeight,0).toFixed(1)} kg</div></div></div>
    <section><div className="ops-section-head"><h2>Danh sách Intake Batch</h2><span>{loading?'Đang tải...':'Chọn một lô để bắt đầu'}</span></div><div className="ops-list">
      {batches.map(b=><article key={b.id} className="ops-card" role="button" tabIndex={0} onClick={()=>open(b)}><div className="ops-card-top"><div><div className="ops-card-code">{b.batchCode}</div><div className="ops-card-meta"><span>{new Date(b.intakeDate).toLocaleDateString('vi-VN')}</span><span>{b.totalWeight} kg</span></div></div><span className={`ops-badge ${b.status.toLowerCase()}`}>{b.status}</span></div><h3>{b.routeName||'Tuyến tiếp nhận'}</h3><div className="ops-card-footer"><span>Đã phân loại: <strong>{b.classifiedItems}</strong> món · {b.donationRequests} đơn</span><span className="ops-card-action">{b.status==='Classified'?'Xem chi tiết':'Mở lô'} <ArrowRight size={14}/></span></div></article>)}
      {!loading&&batches.length===0&&<div className="ops-empty"><ClipboardList size={36}/><h4>Chưa có Intake Batch</h4><p>Batch được gửi sang phân loại sẽ xuất hiện tại đây.</p></div>}
    </div></section>
  </div>;
}
