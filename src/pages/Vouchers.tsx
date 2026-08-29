import { useEffect, useState } from 'react';
import { Gift, History, Leaf, TicketCheck, WalletCards } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { voucherService, type MyVoucher, type PointSummary, type Voucher } from '@/services/voucherService';
import './Vouchers.css';

export default function Vouchers() {
  const toast = useToast();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [mine, setMine] = useState<MyVoucher[]>([]);
  const [summary, setSummary] = useState<PointSummary>({ donationPoint: 0, pointsPerKg: 10, transactions: [] });
  const [tab, setTab] = useState<'catalog' | 'mine' | 'history'>('catalog');
  const [loadingId, setLoadingId] = useState('');
  const load = async () => {
    try {
      const [catalog, owned, points] = await Promise.all([
        voucherService.available(), voucherService.myVouchers(), voucherService.pointSummary(),
      ]);
      setVouchers(catalog); setMine(owned); setSummary(points);
    } catch { toast.error('Không tải được dữ liệu điểm và voucher.'); }
  };
  useEffect(() => { void load(); }, []);
  const redeem = async (voucher: Voucher) => {
    if (summary.donationPoint < voucher.requiredPoints) return toast.warning('Bạn chưa đủ điểm để đổi voucher này.');
    setLoadingId(voucher.id);
    try {
      const result = await voucherService.redeem(voucher.id);
      toast.success(`Đổi voucher thành công. Mã của bạn: ${result.code}`);
      await load(); setTab('mine');
    } catch (error: any) { toast.error(error?.response?.data?.message || 'Không thể đổi voucher.'); }
    finally { setLoadingId(''); }
  };
  return <div className="voucher-page container">
    <section className="voucher-hero">
      <div><span><Leaf size={17}/> Điểm xanh ReThreads</span><h1>Đổi đóng góp thành những món quà ý nghĩa</h1>
        <p>Mỗi kg quần áo được tiếp nhận thành công mang về {summary.pointsPerKg} điểm.</p></div>
      <div className="point-wallet"><WalletCards/><b>{summary.donationPoint}</b><span>điểm hiện có</span></div>
    </section>
    <nav className="voucher-tabs">
      <button className={tab==='catalog'?'active':''} onClick={()=>setTab('catalog')}><Gift/> Kho voucher</button>
      <button className={tab==='mine'?'active':''} onClick={()=>setTab('mine')}><TicketCheck/> Voucher của tôi</button>
      <button className={tab==='history'?'active':''} onClick={()=>setTab('history')}><History/> Lịch sử điểm</button>
    </nav>
    {tab==='catalog' && <div className="voucher-grid">{vouchers.map(v => <article className="voucher-card" key={v.id}>
      <div className="voucher-image">{v.imageUrl?<img src={v.imageUrl} alt={v.name}/>:<Gift/>}</div>
      <div className="voucher-content"><small>{v.partnerName}</small><h3>{v.name}</h3><p>{v.description || 'Ưu đãi dành cho cộng đồng ReThreads.'}</p>
        <div className="voucher-meta"><b>{v.requiredPoints} điểm</b><span>Còn {v.availableQuantity} mã</span></div>
        <button disabled={loadingId===v.id || summary.donationPoint<v.requiredPoints} onClick={()=>void redeem(v)}>
          {loadingId===v.id?'Đang đổi...':summary.donationPoint<v.requiredPoints?'Chưa đủ điểm':'Đổi voucher'}</button></div>
    </article>)}</div>}
    {tab==='mine' && <div className="owned-vouchers">{mine.map(v => <article key={v.voucherCodeId}><TicketCheck/><div><small>{v.partnerName}</small><h3>{v.voucherName}</h3><code>{v.code}</code><p>Hạn dùng: {new Date(v.expireDate).toLocaleDateString('vi-VN')}</p></div></article>)}{!mine.length&&<div className="voucher-empty">Bạn chưa đổi voucher nào.</div>}</div>}
    {tab==='history' && <div className="point-history">{summary.transactions.map(t => <article key={t.id}>
      <span className={t.points>0?'earned':'spent'}>{t.points>0?'+':''}{t.points}</span><div><b>{t.description}</b><small>{new Date(t.occurredAt).toLocaleString('vi-VN')} · Số dư {t.balanceAfter} điểm</small></div>
    </article>)}{!summary.transactions.length&&<div className="voucher-empty">Chưa có giao dịch điểm.</div>}</div>}
  </div>;
}
