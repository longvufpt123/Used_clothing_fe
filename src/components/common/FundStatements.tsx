import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Modal } from './Modal';
import MoneyInput from './MoneyInput';
import { operatingFund as api, type FundPage, type FundStatement, type StatementStatus } from '@/services/operatingFund';

const monthLabel = (month: string) => month.split('-').reverse().join('/');
const money = (value: number) => value.toLocaleString('vi-VN') + ' ₫';
const errorText = (e: any) => e?.response?.data?.message || e?.message || 'Không thực hiện được. Vui lòng thử lại.';

export default function FundStatements({ manager }: { manager: boolean }) {
  const { hash } = useLocation();
  const sectionRef = useRef<HTMLElement>(null);
  const [page, setPage] = useState(1);
  const [data, setData] = useState<FundPage<FundStatement>>({ items: [], total: 0, page: 1, pageSize: 12 });
  const [status, setStatus] = useState<StatementStatus>();
  const [month, setMonth] = useState(''), [balance, setBalance] = useState(''), [note, setNote] = useState('');
  const [document, setDocument] = useState<File | null>(null);
  const [error, setError] = useState(''), [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true), [busy, setBusy] = useState(false), [confirm, setConfirm] = useState(false);
  const lock = useRef(false), key = useRef(crypto.randomUUID()), fileInput = useRef<HTMLInputElement>(null);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [rows, state] = await Promise.all([api.statements(page), manager ? api.statementStatus() : Promise.resolve(undefined)]);
      setData(rows); setStatus(state);
      if (state) setMonth(current => state.missingMonths.includes(current) ? current : state.missingMonths[0] || '');
    } catch (e) { setError(errorText(e)); } finally { setLoading(false); }
  }, [manager, page]);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (hash === '#statements' && !loading) sectionRef.current?.scrollIntoView({ block: 'start' });
  }, [hash, loading]);
  const run = async (action: () => Promise<void>) => {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError(''); setNotice('');
    try { await action(); } catch (e) { setError(errorText(e)); } finally { lock.current = false; setBusy(false); }
  };
  const publish = () => run(async () => {
    if (!document) return;
    const form = new FormData();
    form.append('requestKey', key.current); form.append('month', month); form.append('closingBalance', balance);
    form.append('note', note); form.append('document', document);
    await api.publishStatement(form);
    key.current = crypto.randomUUID(); setConfirm(false); setBalance(''); setNote(''); setDocument(null);
    if (fileInput.current) fileInput.current.value = '';
    setNotice('Đã công bố sao kê tháng ' + monthLabel(month) + '.');
    if (page !== 1) setPage(1); else await load();
  });
  const download = (statement: FundStatement) => run(async () => {
    const blob = await api.statementDocument(statement.id);
    const url = URL.createObjectURL(blob), link = window.document.createElement('a');
    link.href = url; link.download = `sao-ke-${statement.month}.${blob.type === 'application/pdf' ? 'pdf' : blob.type === 'image/png' ? 'png' : 'jpg'}`;
    link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  return <section ref={sectionRef} id="statements" className="fund-card fund-statements">
    <div className="fund-heading"><h2>Sao kê ngân hàng hàng tháng</h2><button type="button" disabled={busy || loading} onClick={() => { setError(''); void load(); }}>Làm mới sao kê</button></div>
    <p>Sao kê và số dư cuối tháng do Manager cung cấp. Đây là thông tin tại thời điểm chốt tháng, không phải số dư ngân hàng trực tiếp.</p>
    {error && <p role="alert" className="fund-error">{error}</p>}
    {notice && <p role="status" className="fund-notice">{notice}</p>}
    {loading && <p role="status">Đang tải sao kê…</p>}
    {manager && status && <>
      {status.missingMonths.length > 0 ? <>
        <div className="fund-notice" role="status"><strong>Cần đăng sao kê {status.missingMonths.length} tháng</strong><p>{status.missingMonths.map(monthLabel).join(', ')}</p><small>Ngày 1 mỗi tháng, hệ thống nhắc đăng sao kê tháng trước theo giờ Việt Nam. Một sao kê cho mỗi tháng của toàn dự án.</small></div>
        <form onSubmit={e => { e.preventDefault(); if (document) { setError(''); setConfirm(true); } }}>
          <div className="fund-grid">
            <label htmlFor="statement-month">Tháng sao kê<select id="statement-month" aria-label="Tháng sao kê" required value={month} disabled={busy} onChange={e => setMonth(e.target.value)}>{status.missingMonths.map(m => <option key={m} value={m}>{monthLabel(m)}</option>)}</select></label>
            <label>Số dư cuối tháng (VND)<MoneyInput value={balance} onChange={setBalance} min={0} max={999999999999999} /></label>
          </div>
          <label>File sao kê PDF, JPG hoặc PNG (tối đa 5 MB)<input ref={fileInput} type="file" required disabled={busy} accept="application/pdf,image/jpeg,image/png" onChange={e => {
            const file = e.target.files?.[0];
            if (file && (file.size > 5 * 1024 * 1024 || !['application/pdf', 'image/jpeg', 'image/png'].includes(file.type))) {
              setError('Chọn file PDF, JPG hoặc PNG, tối đa 5 MB.'); e.target.value = ''; setDocument(null);
            } else { setDocument(file || null); setError(''); }
          }} /></label>
          <label>Ghi chú sao kê<textarea rows={3} maxLength={2000} value={note} disabled={busy} onChange={e => setNote(e.target.value)} placeholder="Giải thích số dư hoặc các giao dịch cần lưu ý…" /></label>
          <small>Che thông tin cá nhân không cần công khai trước khi tải lên. Donor và tổ chức đã đăng nhập sẽ xem được file. Sao kê không làm thay đổi số dư sổ quỹ.</small>
          <button className="fund-primary" disabled={busy || loading}>Xem lại và đăng sao kê</button>
        </form>
      </> : <p className="fund-notice">Đã đủ sao kê các tháng đến hạn. Kỳ mới được mở vào ngày 1 tháng tiếp theo.</p>}
    </>}
    {!loading && !data.items.length && <p>Chưa có sao kê được công bố.</p>}
    <div className="fund-expenses">{data.items.map(s => <article key={s.id}>
      <div className="fund-heading"><h3>Sao kê tháng {monthLabel(s.month)}</h3><strong>{money(s.closingBalance)}</strong></div>
      <small>Số dư cuối tháng theo sao kê do Manager cung cấp</small>
      {s.note && <p className="fund-description">{s.note}</p>}
      <small>Đăng bởi {s.publishedBy} · {new Date(s.publishedAt).toLocaleString('vi-VN')}</small>
      <div className="fund-actions"><button type="button" disabled={busy} onClick={() => void download(s)}>Tải sao kê tháng {monthLabel(s.month)}</button></div>
    </article>)}</div>
    {data.total > 12 && <nav className="fund-actions" aria-label="Phân trang sao kê"><button disabled={loading || busy || page <= 1} onClick={() => setPage(page - 1)}>Trước</button><span>Trang {page} / {Math.ceil(data.total / 12)}</span><button disabled={loading || busy || page * 12 >= data.total} onClick={() => setPage(page + 1)}>Sau</button></nav>}
    <Modal isOpen={confirm} title="Xác nhận đăng sao kê" onClose={() => { if (!busy) setConfirm(false); }}>
      <div className="fund-confirm"><p>Tháng {monthLabel(month)}</p><strong>{money(Number(balance))}</strong><p>Số dư cuối tháng · File: {document?.name}</p>{note && <p>{note}</p>}<p>Mỗi tháng chỉ đăng một lần cho toàn dự án. Vui lòng kiểm tra đúng tháng, số dư và file trước khi công bố.</p>{error && <p role="alert" className="fund-error">{error}</p>}<div className="fund-actions"><button disabled={busy} onClick={() => setConfirm(false)}>Quay lại</button><button className="fund-primary" disabled={busy} onClick={() => void publish()}>{busy ? 'Đang đăng…' : 'Xác nhận đăng sao kê'}</button></div></div>
    </Modal>
  </section>;
}
