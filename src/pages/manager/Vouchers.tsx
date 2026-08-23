import { useEffect, useState } from 'react';
import { Gift, Plus, Power, Ticket } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { voucherService, type Voucher } from '@/services/voucherService';
import '@/styles/ops-shared.css';

const today = new Date().toISOString().slice(0, 10);
const nextMonth = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
export default function ManagerVouchers() {
  const toast = useToast();
  const [items, setItems] = useState<Voucher[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [codeTarget, setCodeTarget] = useState<Voucher | null>(null);
  const [codes, setCodes] = useState('');
  const [form, setForm] = useState({ name:'', partnerName:'', imageUrl:'', voucherUrl:'', description:'',
    termsAndConditions:'', value:0, requiredPoints:100, startDate:today, expireDate:nextMonth });
  const load = () => voucherService.manager().then(setItems).catch(()=>toast.error('Không tải được voucher.'));
  useEffect(()=>{void load();},[]);
  const create = async () => {
    if(!form.name.trim()||!form.partnerName.trim()) return toast.warning('Nhập tên voucher và đối tác.');
    try { await voucherService.create({...form,startDate:new Date(form.startDate).toISOString(),expireDate:new Date(form.expireDate).toISOString()});
      toast.success('Đã tạo voucher.'); setShowForm(false); load();
    } catch(e:any){toast.error(e?.response?.data?.message||'Không tạo được voucher.');}
  };
  const addCodes = async () => {
    if(!codeTarget) return; const values=codes.split(/\r?\n|,/).map(x=>x.trim()).filter(Boolean);
    if(!values.length)return toast.warning('Nhập ít nhất một mã voucher.');
    try{await voucherService.addCodes(codeTarget.id,values.map(code=>({code,expireDate:codeTarget.expireDate})));
      toast.success(`Đã thêm ${values.length} mã.`);setCodeTarget(null);setCodes('');load();
    }catch(e:any){toast.error(e?.response?.data?.message||'Không thêm được mã.');}
  };
  const isActive = (voucher: Voucher) => voucher.status === 0 || voucher.status === 'Active';
  return <div className="ops-page"><header className="ops-pagehead"><div><span className="ops-pagehead-kicker">Rewards</span><h1>Quản lý voucher</h1><p>Tạo ưu đãi, đặt mức điểm và quản lý kho mã đổi thưởng.</p></div>
    <button className="ops-btn ops-btn-primary" onClick={()=>setShowForm(true)}><Plus/>Tạo voucher</button></header>
    <div className="ops-card-grid">{items.map(v=><article className="ops-card" key={v.id}><div className="ops-card-head"><div><div className="ops-card-code">{v.partnerName}</div><h3>{v.name}</h3></div><span className={`ops-badge ${isActive(v)?'done':'pending'}`}>{isActive(v)?'Đang mở':'Tạm dừng'}</span></div>
      <div className="ops-kv-grid"><div className="ops-kv"><span>Điểm đổi</span><strong>{v.requiredPoints}</strong></div><div className="ops-kv"><span>Mã khả dụng</span><strong>{v.availableQuantity}</strong></div><div className="ops-kv"><span>Giá trị</span><strong>{v.value.toLocaleString('vi-VN')}</strong></div><div className="ops-kv"><span>Hết hạn</span><strong>{new Date(v.expireDate).toLocaleDateString('vi-VN')}</strong></div></div>
      <div className="ops-actions"><button className="ops-btn ops-btn-secondary" onClick={()=>setCodeTarget(v)}><Ticket/>Thêm mã</button><button className="ops-btn ops-btn-secondary" onClick={async()=>{await voucherService.updateStatus(v.id,isActive(v)?1:0);load();}}><Power/>{isActive(v)?'Tạm dừng':'Kích hoạt'}</button></div></article>)}</div>
    {showForm&&<div className="ops-modal-overlay"><section className="ops-modal glass"><h2>Tạo voucher mới</h2>{[['Tên voucher','name'],['Đối tác','partnerName'],['URL hình ảnh','imageUrl'],['Liên kết voucher','voucherUrl'],['Mô tả','description'],['Điều kiện sử dụng','termsAndConditions']].map(([label,key])=><div className="ops-field" key={key}><label>{label}</label><input value={(form as any)[key]} onChange={e=>setForm({...form,[key]:e.target.value})}/></div>)}<div className="ops-form-grid two-col"><div className="ops-field"><label>Điểm cần đổi</label><input type="number" min="1" value={form.requiredPoints} onChange={e=>setForm({...form,requiredPoints:+e.target.value})}/></div><div className="ops-field"><label>Giá trị</label><input type="number" min="0" value={form.value} onChange={e=>setForm({...form,value:+e.target.value})}/></div><div className="ops-field"><label>Ngày bắt đầu</label><input type="date" value={form.startDate} onChange={e=>setForm({...form,startDate:e.target.value})}/></div><div className="ops-field"><label>Ngày hết hạn</label><input type="date" value={form.expireDate} onChange={e=>setForm({...form,expireDate:e.target.value})}/></div></div><div className="ops-actions"><button className="ops-btn ops-btn-secondary" onClick={()=>setShowForm(false)}>Hủy</button><button className="ops-btn ops-btn-primary" onClick={()=>void create()}><Gift/>Tạo voucher</button></div></section></div>}
    {codeTarget&&<div className="ops-modal-overlay"><section className="ops-modal glass"><h2>Thêm mã cho {codeTarget.name}</h2><div className="ops-field"><label>Mỗi mã một dòng hoặc cách nhau bằng dấu phẩy</label><textarea rows={7} value={codes} onChange={e=>setCodes(e.target.value)}/></div><div className="ops-actions"><button className="ops-btn ops-btn-secondary" onClick={()=>setCodeTarget(null)}>Hủy</button><button className="ops-btn ops-btn-primary" onClick={()=>void addCodes()}>Thêm mã</button></div></section></div>}
  </div>;
}
