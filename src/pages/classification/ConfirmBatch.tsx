import { useEffect, useState } from 'react';
import { AlertCircle, Check, ChevronLeft, Package, Scale } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from '@/context/ToastContext';
import { classificationService, type ClassificationBatchDetail } from '@/services/classificationService';
import '@/styles/ops-shared.css';
import './ConfirmBatch.css';

export default function ConfirmBatch(){
  const {batchId}=useParams(); const navigate=useNavigate(); const toast=useToast();
  const [batch,setBatch]=useState<ClassificationBatchDetail|null>(null);
  const [checks,setChecks]=useState({seal:false,weight:false,manifest:false}); const [loading,setLoading]=useState(false);
  useEffect(()=>{if(!batchId)return;classificationService.getBatch(batchId).then(b=>{if(b.status!=='PendingConfirmation'){navigate('/classification');return;}setBatch(b);}).catch(()=>{toast.error('Không tải được Intake Batch.');navigate('/classification');});},[batchId,navigate,toast]);
  const ready=checks.seal&&checks.weight&&checks.manifest;
  const confirm=async()=>{if(!batchId||!ready)return;setLoading(true);try{await classificationService.confirmReceipt(batchId);toast.success('Đã xác nhận nhận Intake Batch từ Receiving Staff.');navigate('/classification');}catch(e:any){toast.error(e?.response?.data?.message||'Không thể xác nhận nhận batch.');}finally{setLoading(false);}};
  if(!batch)return <div className="ops-page">Đang tải...</div>;
  return <div className="ops-page confirm-batch-page"><div className="ops-nav"><button className="ops-back" onClick={()=>navigate('/classification')}><ChevronLeft size={16}/> Quay lại</button><div className="ops-title-row"><h1>Xác nhận bàn giao Intake Batch</h1><span className="ops-badge pending">Chờ xác nhận nhận</span></div></div>
    <div className="ops-form-grid two-col"><section className="ops-panel glass"><span className="ops-panel-label">Thông tin từ Receiving Staff</span><h2>{batch.batchCode}</h2><div className="ops-kv-grid"><div className="ops-kv"><span>Tuyến thu gom</span><strong>{batch.routeName}</strong></div><div className="ops-kv"><span>Khối lượng</span><strong><Scale size={14}/> {batch.totalWeight} kg</strong></div><div className="ops-kv"><span>Số đơn trong batch</span><strong><Package size={14}/> {batch.donationRequests}</strong></div></div><p style={{display:'flex',gap:8,marginTop:16}}><AlertCircle size={17}/> Chỉ xác nhận khi Intake Batch vật lý đã được bàn giao đầy đủ.</p></section>
    <section className="ops-panel glass"><span className="ops-panel-label">Biên bản tiếp nhận</span><h2>Kiểm tra thực tế</h2><div className="ops-item-list">{[['seal','Niêm phong/bao kiện còn nguyên vẹn'],['weight','Khối lượng thực tế phù hợp biên bản'],['manifest','Số lượng và mã Intake Batch trùng khớp']].map(([key,text])=><button type="button" key={key} className={`ops-item-row ${(checks as any)[key]?'active':''}`} onClick={()=>setChecks(p=>({...p,[key]:!(p as any)[key]}))}><div className="ops-item-main"><strong>{text}</strong><span>{(checks as any)[key]?'Đã kiểm tra':'Chưa kiểm tra'}</span></div>{(checks as any)[key]&&<Check size={18}/>}</button>)}</div><div className="ops-actions"><button className="ops-btn ops-btn-primary ops-btn-block" disabled={!ready||loading} onClick={confirm}><Check size={16}/> {loading?'Đang xác nhận...':'Xác nhận đã nhận Intake Batch'}</button></div></section></div>
  </div>;
}
