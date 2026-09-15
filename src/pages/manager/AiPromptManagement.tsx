import { useEffect, useState } from 'react';
import { Bot, RotateCcw, Save, ShieldCheck, Sparkles } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { aiPromptService } from '@/services/aiPromptService';
import '@/styles/ops-shared.css';
import './AiPromptManagement.css';

export default function AiPromptManagement() {
  const toast = useToast();
  const [form,setForm]=useState({name:'',promptText:'',enabled:true});
  const [usingDefault,setUsingDefault]=useState(true); const [updatedAt,setUpdatedAt]=useState<string>();
  const [saving,setSaving]=useState(false);
  const load=async()=>{try{const x=await aiPromptService.getClassification();setForm({name:x.name,promptText:x.promptText,enabled:x.enabled});setUsingDefault(x.isUsingDefault);setUpdatedAt(x.updatedAt);}catch{toast.error('Không tải được cấu hình prompt AI.');}};
  useEffect(()=>{void load();},[]);
  const save=async()=>{if(!form.name.trim()||!form.promptText.trim())return toast.warning('Tên và nội dung prompt không được để trống.');setSaving(true);try{await aiPromptService.saveClassification(form);toast.success('Đã cập nhật prompt phân loại AI.');await load();}catch(e:any){toast.error(e?.response?.data?.message||'Không lưu được prompt.');}finally{setSaving(false);}};
  const reset=async()=>{if(!window.confirm('Khôi phục prompt mặc định của hệ thống?'))return;try{await aiPromptService.resetClassification();toast.success('Đã khôi phục prompt mặc định.');await load();}catch{toast.error('Không thể khôi phục prompt.');}};
  return <div className="ops-page ai-prompt-page"><header className="ops-pagehead"><div><span className="ops-pagehead-kicker"><Sparkles/> AI Configuration</span><h1>Quản lý prompt phân loại</h1><p>Điều chỉnh hướng dẫn nghiệp vụ mà Gemini sử dụng khi phân tích hình ảnh quần áo.</p></div><span className={`ops-badge ${form.enabled?'done':'pending'}`}>{form.enabled?'Đang áp dụng':'Đang tắt'}</span></header>
    <div className="ai-prompt-layout"><section className="ops-panel glass ai-prompt-editor"><div className="ai-prompt-section-head"><Bot/><div><h2>Prompt đang sử dụng</h2><p>{usingDefault?'Đang dùng cấu hình mặc định':'Đang dùng cấu hình do Manager thiết lập'}{updatedAt?` · cập nhật ${new Date(updatedAt).toLocaleString('vi-VN')}`:''}</p></div></div>
      <div className="ops-field"><label>Tên cấu hình</label><input maxLength={160} value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></div>
      <div className="ops-field"><label>Nội dung hướng dẫn</label><textarea rows={18} maxLength={12000} value={form.promptText} onChange={e=>setForm({...form,promptText:e.target.value})}/><small>{form.promptText.length.toLocaleString('vi-VN')}/12.000 ký tự</small></div>
      <label className="ai-prompt-toggle"><input type="checkbox" checked={form.enabled} onChange={e=>setForm({...form,enabled:e.target.checked})}/><span><b>Kích hoạt prompt tùy chỉnh</b><small>Khi tắt, hệ thống tự động dùng prompt mặc định an toàn.</small></span></label>
      <div className="ops-actions"><button className="ops-btn ops-btn-secondary" onClick={()=>void reset()}><RotateCcw/>Khôi phục mặc định</button><button className="ops-btn ops-btn-primary" disabled={saving} onClick={()=>void save()}><Save/>{saving?'Đang lưu...':'Lưu và áp dụng'}</button></div></section>
      <aside className="ops-panel glass ai-prompt-guide"><ShieldCheck/><h3>Quy tắc an toàn được giữ cố định</h3><p>Prompt Manager chỉ bổ sung hướng dẫn nghiệp vụ. Hệ thống vẫn luôn bắt buộc AI:</p><ul><li>Chỉ chọn ID có trong danh mục hiện hành.</li><li>Trả về đúng cấu trúc dữ liệu mà API yêu cầu.</li><li>Không phân loại vật thể không phải quần áo.</li><li>Trả lời đủ bộ câu hỏi đánh giá nhãn A/B/C.</li><li>Không được phá vỡ quan hệ nhóm và loại quần áo.</li></ul><h3>Gợi ý viết prompt</h3><p>Nêu rõ cách ưu tiên khi ảnh mờ, quy ước đối tượng người lớn/trẻ em và cách mô tả mức độ chắc chắn. Không cần chép danh sách category hoặc ID vì hệ thống tự gắn dữ liệu mới nhất.</p></aside></div>
  </div>;
}
