import { useEffect, useMemo, useState } from 'react';
import { ArrowDownToLine, ArrowRightLeft, ArrowUpFromLine, ClipboardList, Search } from 'lucide-react';
import { warehouseService, type WarehouseTransaction } from '@/services/warehouseService';
import Pagination from '@/components/common/Pagination';
import '@/styles/ops-shared.css';

const icon:Record<string,typeof ClipboardList>={RECEIPT:ArrowDownToLine,PUTAWAY:ArrowDownToLine,MOVE:ArrowRightLeft,OUT:ArrowUpFromLine};
const PAGE_SIZE=6;

export default function WarehouseTransactions(){
  const [type,setType]=useState('');
  const [list,setList]=useState<WarehouseTransaction[]>([]);
  const [search,setSearch]=useState('');
  const [page,setPage]=useState(1);
  useEffect(()=>{warehouseService.transactions(type||undefined).then(setList);},[type]);
  useEffect(()=>setPage(1),[type,search]);
  const filtered=useMemo(()=>{
    const q=search.trim().toLowerCase();
    if(!q)return list;
    return list.filter(tx=>[
      tx.transactionCode,tx.transactionType,tx.performedBy,tx.notes,
      ...tx.items.flatMap(item=>[item.sku,item.sourceLocationCode,item.destinationLocationCode]),
    ].some(value=>String(value||'').toLowerCase().includes(q)));
  },[list,search]);
  const pages=Math.max(1,Math.ceil(filtered.length/PAGE_SIZE));
  const shown=filtered.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE);
  useEffect(()=>{if(page>pages)setPage(pages);},[page,pages]);

  return <div className="ops-page">
    <header className="ops-pagehead"><div className="ops-pagehead-main"><span className="ops-pagehead-kicker">Immutable Audit Trail</span><h1>Sổ giao dịch kho</h1><p>Mỗi nghiệp vụ lưu người thực hiện, thời gian, chứng từ tham chiếu, vị trí nguồn–đích và tồn trước–sau.</p></div></header>
    <div className="ops-tabs">{['','RECEIPT','PUTAWAY','MOVE','OUT'].map(value=><button className={`ops-tab ${type===value?'active':''}`} key={value} onClick={()=>setType(value)}>{value||'Tất cả'}</button>)}</div>
    <div className="ops-list-toolbar"><label className="ops-list-search"><Search size={17}/><input value={search} onChange={event=>setSearch(event.target.value)} placeholder="Tìm mã giao dịch, SKU, nhân viên hoặc vị trí..."/></label><span className="ops-list-result">{filtered.length} giao dịch · 6 item/trang</span></div>
    <div className="ops-list">{shown.map(tx=>{const Icon=icon[tx.transactionType]||ClipboardList;return <article className="ops-card" key={tx.id}>
      <div className="ops-card-top"><div><div className="ops-card-code">{tx.transactionCode}</div><div className="ops-card-meta"><span>{new Date(tx.performedAt).toLocaleString('vi-VN')}</span><span>{tx.performedBy}</span></div></div><span className="ops-badge done"><Icon size={14}/>{tx.transactionType}</span></div>
      {tx.items.map(item=><div className="ops-kv-grid" key={item.id}><div className="ops-kv"><span>SKU</span><strong>{item.sku}</strong></div><div className="ops-kv"><span>Số lượng</span><strong>{item.quantityBefore} → {item.quantityAfter}</strong></div><div className="ops-kv"><span>Khối lượng</span><strong>{item.weightBefore} → {item.weightAfter} kg</strong></div><div className="ops-kv"><span>Vị trí</span><strong>{item.sourceLocationCode||'RECEIVING'} → {item.destinationLocationCode||'OUTBOUND'}</strong></div></div>)}
      {tx.notes&&<p>Ghi chú: {tx.notes}</p>}
    </article>})}
    {!filtered.length&&<div className="ops-empty"><ClipboardList size={36}/><h4>Không có giao dịch phù hợp</h4></div>}</div>
    {filtered.length>PAGE_SIZE&&<div className="ops-list-pagination"><Pagination currentPage={page} totalPages={pages} onPageChange={setPage}/></div>}
  </div>;
}
