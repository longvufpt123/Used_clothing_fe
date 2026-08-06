import { Bell, CheckCheck, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationService, type AppNotification } from '@/services/notificationService';
import { parseUtcTimestamp } from '@/utils/dateTime';
import './NotificationBell.css';
import './NotificationBellPosition.css';

const timeText=(value:string)=>{const date=parseUtcTimestamp(value);return date?new Intl.DateTimeFormat('vi-VN',{timeZone:'Asia/Ho_Chi_Minh',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}).format(date):''};
export default function NotificationBell(){
 const navigate=useNavigate(); const rootRef=useRef<HTMLDivElement>(null); const [open,setOpen]=useState(false);
 const [items,setItems]=useState<AppNotification[]>([]); const [unread,setUnread]=useState(0);
 const load=async()=>{try{const data=await notificationService.getMine();setItems(data.items);setUnread(data.unreadCount);}catch{/* non-blocking */}};
 useEffect(()=>{load();const timer=window.setInterval(load,30000);return()=>window.clearInterval(timer);},[]);
 useEffect(()=>{const close=(e:MouseEvent)=>{if(!rootRef.current?.contains(e.target as Node))setOpen(false)};document.addEventListener('mousedown',close);return()=>document.removeEventListener('mousedown',close)},[]);
 const select=async(item:AppNotification)=>{if(!item.isRead){await notificationService.markRead(item.id);setItems(v=>v.map(x=>x.id===item.id?{...x,isRead:true}:x));setUnread(v=>Math.max(0,v-1));}setOpen(false);const target=item.type==='DonationRequestCreated'&&item.donationRequestId?`/manager/dispatch?requestId=${item.donationRequestId}`:item.targetUrl;if(target)navigate(target)};
 return <div className="app-notification" ref={rootRef}><button type="button" className="app-notification-trigger" aria-label="Thông báo" onClick={()=>{setOpen(v=>!v);if(!open)load()}}><Bell size={20}/>{unread>0&&<span>{unread>99?'99+':unread}</span>}</button>
 {open&&<section className="app-notification-panel"><header><div><strong>Thông báo</strong><small>{unread} chưa đọc</small></div><div><button title="Đọc tất cả" disabled={!unread} onClick={async()=>{await notificationService.markAllRead();setUnread(0);setItems(v=>v.map(x=>({...x,isRead:true})))}}><CheckCheck size={17}/></button><button title="Xóa tất cả" disabled={!items.length} onClick={async()=>{await notificationService.clearAll();setItems([]);setUnread(0)}}><Trash2 size={16}/></button></div></header><div className="app-notification-list">{!items.length&&<p className="app-notification-empty">Chưa có thông báo.</p>}{items.map(item=><button type="button" key={item.id} className={item.isRead?'is-read':'is-unread'} onClick={()=>select(item)}><strong>{item.title}</strong><p>{item.message}</p><time>{timeText(item.createdAt)}</time></button>)}</div></section>}</div>;
}
