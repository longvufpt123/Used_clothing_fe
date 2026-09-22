import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import MainLayout from '@/layouts/MainLayout';
import AdminLayout from '@/shared/layouts/AdminLayout';
import OrganizationShell from '@/shared/layouts/OrganizationShell';
import { Modal } from '@/components/common/Modal';
import { operatingFund as api, type Contribution, type Expense, type FundPage, type FundSummary } from '@/services/operatingFund';
import MoneyInput from '@/components/common/MoneyInput';
import './OperatingFund.css';

const money = (n: number) => n.toLocaleString('vi-VN') + ' ₫';
const state: Record<string, string> = { Paid: 'Đã ghi nhận', Pending: 'Chờ xác nhận', Cancelled: 'Đã hủy', Expired: 'Đã hết hạn' };
const message = (e: any) => e?.response?.data?.message || e?.message || 'Không thực hiện được. Vui lòng thử lại.';
const empty = { items: [], total: 0, page: 1, pageSize: 20 };
export default function OperatingFund() {
  const { user } = useAuth(); const manager = user?.role === 'Manager';
  const [params] = useSearchParams(); const returnedId = params.get('contribution');
  const [summary, setSummary] = useState<FundSummary>();
  const [mine, setMine] = useState<FundPage<Contribution>>(empty);
  const [expenses, setExpenses] = useState<FundPage<Expense>>(empty);
  const [page, setPage] = useState(1), [minePage, setMinePage] = useState(1);
  const [amount, setAmount] = useState('50000'), [error, setError] = useState(''), [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false), [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState<'donate' | 'expense' | null>(null);
  const [voiding, setVoiding] = useState<Expense | null>(null), [reason, setReason] = useState('');
  const [title, setTitle] = useState(''), [description, setDescription] = useState(''), [expenseAmount, setExpenseAmount] = useState('');
  const [spentOn, setSpentOn] = useState(new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date()));
  const [receipt, setReceipt] = useState<File | null>(null);
  const fileInput = useRef<HTMLInputElement>(null), lock = useRef(false), requestKey = useRef(crypto.randomUUID());
  const load = useCallback(async () => {
    setLoading(true);
    try { const [s, m, e] = await Promise.all([api.summary(), (manager ? api.contributions(minePage) : api.mine(minePage)), api.expenses(page)]); setSummary(s); setMine(m); setExpenses(e); }
    catch (e) { setError(message(e)); } finally { setLoading(false); }
  }, [page, minePage, manager]);
  useEffect(() => { void load(); }, [load]);
  const run = async (action: () => Promise<void>) => {
    if (lock.current) return; lock.current = true; setBusy(true); setError(''); setNotice('');
    try { await action(); } catch (e) { setError(message(e)); } finally { lock.current = false; setBusy(false); }
  };
  const refresh = (id: string) => run(async () => {
    const c = await api.refresh(id); setNotice(`Giao dịch ${c.orderCode}: ${state[c.status] || c.status}.`); await load();
  });
  // A return URL is not proof of payment; ignore PayOS query-string status/amount.
  useEffect(() => { if (returnedId && /^[a-f0-9-]{36}$/i.test(returnedId)) void refresh(returnedId); }, [returnedId]);
  const donate = () => run(async () => {
    const storageKey = `fund-request-${user?.userId}`;
    let saved: { key: string; amount: number } | null = null;
    try { saved = JSON.parse(sessionStorage.getItem(storageKey) || 'null'); } catch { /* Replace malformed local data. */ }
    if (!saved || saved.amount !== Number(amount)) saved = { key: crypto.randomUUID(), amount: Number(amount) };
    sessionStorage.setItem(storageKey, JSON.stringify(saved));
    const c = await api.checkout(saved.key, saved.amount);
    if (c.checkoutUrl) { sessionStorage.removeItem(storageKey); window.location.assign(c.checkoutUrl); }
    else { sessionStorage.removeItem(storageKey); setConfirm(null); await load(); setNotice(state[c.status] || c.status); }
  });
  const publish = () => run(async () => {
    const data = new FormData(); data.append('requestKey', requestKey.current); data.append('amount', expenseAmount);
    data.append('title', title); data.append('description', description); data.append('spentOn', spentOn); data.append('receipt', receipt!);
    await api.publish(data); requestKey.current = crypto.randomUUID(); setConfirm(null); setTitle(''); setDescription(''); setExpenseAmount(''); setReceipt(null);
    if (fileInput.current) fileInput.current.value = ''; await load(); setNotice('Đã công bố khoản chi và chứng từ.');
  });
  const download = (id: string) => run(async () => {
    const blob = await api.receipt(id); const url = URL.createObjectURL(blob); const a = document.createElement('a');
    a.href = url; a.download = `chung-tu-${id}.${blob.type === 'application/pdf' ? 'pdf' : blob.type === 'image/png' ? 'png' : 'jpg'}`;
    a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  const pager = (p: number, total: number, update: (n: number) => void) => <nav className="fund-actions" aria-label="Phân trang"><button disabled={loading || p <= 1} onClick={() => update(p - 1)}>Trước</button><span>Trang {p} / {Math.max(1, Math.ceil(total / 20))}</span><button disabled={loading || p * 20 >= total} onClick={() => update(p + 1)}>Sau</button></nav>;
  const content = <main className="fund-page">
    <header className="fund-heading"><div><span>ĐỒNG HÀNH CÙNG RETHREADS</span><h1>Quỹ vận hành minh bạch</h1><p>Mỗi đóng góp giúp duy trì việc tiếp nhận, phân loại và phân phối quần áo.</p></div><button disabled={busy || loading} onClick={() => void load()}>Làm mới</button></header>
    {error && <div role="alert" className="fund-error">{error}</div>}{notice && <div role="status" className="fund-notice">{notice}</div>}
    {loading && !summary && <p role="status">Đang tải quỹ…</p>}
    {summary && <section className="fund-stats" aria-label="Tổng quan quỹ"><article><span>Đã nhận qua PayOS</span><strong>{money(summary.totalReceived)}</strong><small>{summary.contributions} lượt đóng góp đã xác nhận</small></article><article><span>Đã chi</span><strong>{money(summary.totalSpent)}</strong><small>Không tính khoản ghi nhầm đã hủy</small></article><article><span>Số dư theo sổ quỹ</span><strong>{money(summary.balance)}</strong><small>Không phải số dư tài khoản ngân hàng</small></article></section>}
    {!manager && <section className="fund-card"><h2>Đóng góp cho ReThreads</h2><p>Thanh toán qua PayOS. Tiền chỉ được ghi nhận sau khi máy chủ xác minh. Đóng góp tiền không cộng điểm quyên góp quần áo.</p>{summary && !summary.paymentEnabled && <p className="fund-notice">Kênh PayOS chưa được cấu hình. Bạn có thể xem thu–chi; thanh toán sẽ được mở sau.</p>}<form onSubmit={e => { e.preventDefault(); setConfirm('donate'); }}><label>Số tiền (VND)<MoneyInput min={1000} max={500000000} value={amount} onChange={setAmount} /></label><div className="fund-actions">{[50000,100000,200000].map(n => <button type="button" key={n} onClick={() => setAmount(String(n))}>{money(n)}</button>)}</div><button className="fund-primary" disabled={busy || !summary?.paymentEnabled}>Đóng góp qua PayOS</button></form></section>}
    {manager && <section className="fund-card"><h2>Ghi nhận khoản đã chi</h2><p>Khoản chi được công bố ngay cho donor và tổ chức. Chức năng này ghi sổ, không chuyển tiền từ tài khoản ngân hàng.</p><form onSubmit={e => { e.preventDefault(); if (receipt) setConfirm('expense'); }}>
      <div className="fund-grid"><label>Nội dung chi<input required maxLength={160} value={title} onChange={e => setTitle(e.target.value)} /></label><label>Số tiền (VND)<MoneyInput min={1} max={Math.min(summary?.balance || 0,500000000)} value={expenseAmount} onChange={setExpenseAmount} /></label><label>Ngày chi<input required type="date" min="2026-01-01" max={new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date())} value={spentOn} onChange={e => setSpentOn(e.target.value)} /></label><label>Chứng từ JPG, PNG hoặc PDF (tối đa 5 MB)<input ref={fileInput} required type="file" accept="image/jpeg,image/png,application/pdf" onChange={e => { const file = e.target.files?.[0]; if (file && file.size > 5*1024*1024) { setError('Chứng từ tối đa 5 MB.'); e.target.value = ''; setReceipt(null); } else setReceipt(file || null); }} /></label></div>
      <label>Mục đích / diễn giải<textarea required maxLength={2000} rows={4} value={description} onChange={e => setDescription(e.target.value)} /></label><small>Chỉ tải bản chứng từ đã che số tài khoản và thông tin cá nhân không cần công khai.</small><button className="fund-primary" disabled={busy || !summary || summary.balance <= 0}>Xem lại và công bố</button>
    </form></section>}
    <section className="fund-card"><h2>Tiền đóng góp được dùng vào đâu?</h2><p>Chỉ tài khoản donor, tổ chức và Manager đã đăng nhập được xem nội dung và chứng từ.</p>{!expenses.items.length && <p>Chưa có khoản chi được công bố.</p>}<div className="fund-expenses">{expenses.items.map(e => <article key={e.id}><div className="fund-heading"><h3>{e.title}</h3><strong>{money(e.amount)}</strong></div><p className="fund-description">{e.description}</p><small>Ngày chi: {e.spentOn} · Công bố: {new Date(e.publishedAt).toLocaleString('vi-VN')} · {e.publishedBy}</small>{e.voidedAt && <p className="fund-error">Đã hủy ghi nhận lúc {new Date(e.voidedAt).toLocaleString('vi-VN')}: {e.voidReason}</p>}<div className="fund-actions"><button disabled={busy} onClick={() => void download(e.id)}>Tải chứng từ</button>{manager && !e.voidedAt && <button disabled={busy} onClick={() => { setVoiding(e); setReason(''); }}>Hủy khoản ghi nhầm</button>}</div></article>)}</div>{pager(page, expenses.total, setPage)}</section>
    <section className="fund-card"><h2>{manager ? "Lịch sử thu qua PayOS" : "Đóng góp của tôi"}</h2>{!mine.items.length && <p>Chưa có giao dịch đóng góp.</p>}<div className="fund-history">{mine.items.map(c => <article key={c.id}><div><b>{money(c.amount)}</b><p>#{c.orderCode} · {new Date(c.createdAt).toLocaleString('vi-VN')}</p><span>{state[c.status] || c.status}</span></div><div className="fund-actions">{c.status !== 'Paid' && <button disabled={busy} onClick={() => void refresh(c.id)}>Kiểm tra thanh toán</button>}{!manager && c.status === 'Pending' && c.checkoutUrl && <a href={c.checkoutUrl}>Mở PayOS</a>}</div></article>)}</div>{pager(minePage, mine.total, setMinePage)}</section>
    <Modal isOpen={!!confirm} title={confirm === 'donate' ? 'Xác nhận đóng góp' : 'Xác nhận công bố khoản chi'} onClose={() => { if (!busy) setConfirm(null); }}><div className="fund-confirm"><strong>{money(Number(confirm === 'donate' ? amount : expenseAmount))}</strong>{confirm === 'expense' ? <><p>{title}</p><p>{description}</p><p>Ngày chi: {spentOn} · Chứng từ: {receipt?.name}</p></> : <p>Bạn sẽ được chuyển sang PayOS để thanh toán.</p>}{error && <p role="alert">{error}</p>}<button disabled={busy} className="fund-primary" onClick={() => void (confirm === 'donate' ? donate() : publish())}>{busy ? 'Đang xử lý…' : 'Xác nhận'}</button></div></Modal>
    <Modal isOpen={!!voiding} title="Hủy khoản ghi nhầm" onClose={() => { if (!busy) setVoiding(null); }}><form className="fund-confirm" onSubmit={e => { e.preventDefault(); void run(async () => { await api.void(voiding!.id, reason); setVoiding(null); await load(); setNotice('Đã hủy ghi nhận; lý do vẫn hiển thị trong lịch sử.'); }); }}><p>{voiding?.title}. Chỉ dùng để sửa ghi sổ sai; thao tác này không hoàn tiền ngân hàng.</p><label>Lý do công khai<textarea required maxLength={1000} value={reason} onChange={e => setReason(e.target.value)} /></label>{error && <p role="alert">{error}</p>}<button disabled={busy}>Xác nhận hủy ghi nhận</button></form></Modal>
  </main>;
  return manager ? <AdminLayout>{content}</AdminLayout> : user?.role.endsWith('Organization') ? <OrganizationShell>{content}</OrganizationShell> : <MainLayout>{content}</MainLayout>;
}
