import { useEffect, useMemo, useState } from 'react';
import { Edit3, Plus, Power, Save, Tags, X } from 'lucide-react';
import AdminLayout from '@/shared/layouts/AdminLayout';
import apiClient from '@/services/api';
import { useToast } from '@/context/ToastContext';
import '@/styles/ops-shared.css';

interface Category {
  id:string;
  code:string;
  name:string;
  type:string;
  parentId?:string|null;
  sortOrder:number;
  description:string;
  isActive?:boolean;
}

const types = [
  ['FabricType','Loại vải'], ['GarmentGroup','Nhóm quần áo'],
  ['ClothingType','Loại quần áo'], ['Gender','Giới tính'],
  ['TargetUser','Đối tượng'], ['Size','Kích cỡ'], ['ConditionGrade','Nhãn A/B/C'],
] as const;
const blank = { id:'', code:'', name:'', type:'FabricType', parentId:'', sortOrder:10, description:'' };

export default function Categories(){
  const toast=useToast();
  const [items,setItems]=useState<Category[]>([]);
  const [filter,setFilter]=useState('FabricType');
  const [form,setForm]=useState({...blank});
  const [open,setOpen]=useState(false);
  const [saving,setSaving]=useState(false);
  const load=()=>apiClient.get<unknown,Category[]>('/categories').then(setItems)
    .catch(()=>toast.error('Không thể tải danh mục phân loại.'));
  useEffect(()=>{load();},[]);
  const visible=useMemo(()=>items.filter(x=>x.type===filter).sort((a,b)=>a.sortOrder-b.sortOrder),[items,filter]);
  const groups=items.filter(x=>x.type==='GarmentGroup');
  const edit=(item:Category)=>{setForm({...blank,...item,parentId:item.parentId||''});setOpen(true);};
  const create=()=>{setForm({...blank,type:filter});setOpen(true);};
  const save=async()=>{
    if(!form.code.trim()||!form.name.trim()){toast.error('Code và tên là bắt buộc.');return;}
    if(form.type==='ClothingType'&&!form.parentId){toast.error('Loại quần áo phải thuộc một nhóm.');return;}
    setSaving(true);
    const payload={...form,code:form.code.trim().toUpperCase(),name:form.name.trim(),
      parentId:form.parentId||null,isActive:true};
    try{
      if(form.id) await apiClient.put(`/categories/${form.id}`,payload);
      else await apiClient.post('/categories',payload);
      toast.success(form.id?'Đã cập nhật danh mục.':'Đã thêm danh mục.');
      setOpen(false); await load();
    }catch(e:any){toast.error(e?.response?.data?.message||'Code hoặc tên danh mục đã tồn tại.');}
    finally{setSaving(false);}
  };
  const disable=async(item:Category)=>{
    if(!confirm(`Ngừng sử dụng “${item.name}”? Dữ liệu lịch sử vẫn được giữ lại.`))return;
    try{await apiClient.delete(`/categories/${item.id}`);toast.success('Đã ngừng sử dụng danh mục.');await load();}
    catch{toast.error('Không thể ngừng sử dụng danh mục.');}
  };
  return <AdminLayout><div className="ops-page">
    <header className="ops-pagehead"><div className="ops-pagehead-main">
      <span className="ops-pagehead-kicker">Cấu hình hệ thống</span>
      <h1>Danh mục phân loại quần áo</h1>
      <p>Quản lý các lựa chọn hiển thị cho Classification Staff. Thay đổi không làm mất dữ liệu lịch sử.</p>
    </div><button className="ops-btn ops-btn-primary" onClick={create}><Plus size={16}/> Thêm danh mục</button></header>
    <div className="ops-tabs">{types.map(([value,label])=><button key={value} className={`ops-tab ${filter===value?'active':''}`} onClick={()=>setFilter(value)}><Tags size={14}/>{label}<span className="ops-tab-count">{items.filter(x=>x.type===value).length}</span></button>)}</div>
    <section className="ops-panel"><div className="ops-section-head"><h2>{types.find(x=>x[0]===filter)?.[1]}</h2><span>{visible.length} giá trị đang sử dụng</span></div>
      <div className="ops-item-list">{visible.map(item=><div className="ops-item-row" key={item.id}>
        <div className="ops-item-main"><strong>{item.name}</strong><span>{item.code}{item.parentId?` · Thuộc ${groups.find(g=>g.id===item.parentId)?.name||'nhóm không tồn tại'}`:''}{item.description?` · ${item.description}`:''}</span></div>
        <span className="ops-badge done">Thứ tự {item.sortOrder}</span>
        <button className="ops-btn ops-btn-secondary" onClick={()=>edit(item)}><Edit3 size={14}/> Sửa</button>
        <button className="ops-btn ops-btn-danger" onClick={()=>disable(item)}><Power size={14}/> Ngừng dùng</button>
      </div>)}{!visible.length&&<div className="ops-empty"><Tags size={34}/><h4>Chưa có giá trị</h4><p>Thêm danh mục để Classification Staff có thể lựa chọn.</p></div>}</div>
    </section>
    {open&&<div className="rcv-modal-overlay"><section className="ops-panel rcv-modal">
      <div className="ops-section-head"><h2>{form.id?'Sửa danh mục':'Thêm danh mục'}</h2><button className="ops-back" onClick={()=>setOpen(false)}><X size={17}/></button></div>
      <div className="ops-field"><label>Loại cấu hình</label><select value={form.type} onChange={e=>setForm(p=>({...p,type:e.target.value,parentId:''}))}>{types.map(([v,l])=><option value={v} key={v}>{l}</option>)}</select></div>
      <div className="ops-field"><label>Code duy nhất</label><input value={form.code} disabled={!!form.id} onChange={e=>setForm(p=>({...p,code:e.target.value}))} placeholder="VD: FABRIC_COTTON"/></div>
      <div className="ops-field"><label>Tên hiển thị</label><input value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))}/></div>
      {form.type==='ClothingType'&&<div className="ops-field"><label>Thuộc nhóm quần áo</label><select value={form.parentId} onChange={e=>setForm(p=>({...p,parentId:e.target.value}))}><option value="">-- Chọn nhóm --</option>{groups.map(g=><option value={g.id} key={g.id}>{g.name}</option>)}</select></div>}
      <div className="ops-field"><label>Thứ tự hiển thị</label><input type="number" value={form.sortOrder} onChange={e=>setForm(p=>({...p,sortOrder:Number(e.target.value)}))}/></div>
      <div className="ops-field"><label>Mô tả</label><textarea value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))}/></div>
      <button className="ops-btn ops-btn-primary ops-btn-block" disabled={saving} onClick={save}><Save size={16}/>{saving?'Đang lưu...':'Lưu danh mục'}</button>
    </section></div>}
  </div></AdminLayout>;
}
