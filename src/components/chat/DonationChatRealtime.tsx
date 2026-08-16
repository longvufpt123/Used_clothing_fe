import { useEffect, useRef, useState } from 'react';
import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { MessageCircle, Search, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { donationChatService } from '@/services/donationChatService';
import DonationChatDialog from './DonationChatDialog';
import './DonationChatRealtime.css';

interface ChatItem { id: string; type: 'direct' | 'request'; participantId?: string; requestId?: string;
  requestCode?: string; participantLabel: string; role?: string; avatarUrl: string | null;
  lastMessage: string | null; lastMessageAt: string | null; }
interface ChatNotice { conversationType?: 'direct' | 'request'; participantId?: string; requestId?: string;
  requestCode?: string; participantLabel?: string; senderId: string; senderName: string; message: string; sentAt: string; }

const roleLabels: Record<string, string> = { Manager: 'Quản lý', ReceivingStaff: 'Tiếp nhận',
  ClassificationStaff: 'Phân loại', WarehouseStaff: 'Nhân viên kho', Donor: 'Người quyên góp',
  CharityOrganization: 'Tổ chức từ thiện', RecyclingOrganization: 'Tổ chức tái chế' };

export default function DonationChatRealtime() {
  const { user } = useAuth(); const toast = useToast(); const toastRef = useRef(toast);
  const [listOpen, setListOpen] = useState(false); const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState(''); const [unread, setUnread] = useState(0);
  const [items, setItems] = useState<ChatItem[]>([]); const [active, setActive] = useState<ChatItem | null>(null);
  toastRef.current = toast;

  useEffect(() => {
    if (!listOpen || !user) return; setUnread(0); setLoading(true);
    const direct = donationChatService.getDirectContacts().then((rows) => rows.map((x): ChatItem => ({
      id: `direct:${x.userId}`, type: 'direct', participantId: x.userId, participantLabel: x.fullName,
      role: x.role, avatarUrl: x.avatarUrl, lastMessage: x.lastMessage, lastMessageAt: x.lastMessageAt })));
    const requests = ['Donor', 'ReceivingStaff'].includes(user.role)
      ? donationChatService.getConversations().then((rows) => rows.map((x): ChatItem => ({
          id: `request:${x.requestId}`, type: 'request', requestId: x.requestId, requestCode: x.requestCode,
          participantLabel: x.participantLabel, avatarUrl: x.avatarUrl, lastMessage: x.lastMessage,
          lastMessageAt: x.lastMessageAt }))) : Promise.resolve([] as ChatItem[]);
    void Promise.all([direct, requests]).then(([a, b]) => setItems([...a, ...b].sort((x, y) =>
      (y.lastMessageAt || '').localeCompare(x.lastMessageAt || ''))))
      .catch(() => toastRef.current.error('Không thể tải danh sách trò chuyện.')).finally(() => setLoading(false));
  }, [listOpen, user?.userId, user?.role]);

  useEffect(() => {
    if (!user) return; let disposed = false;
    const api = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
    const connection = new HubConnectionBuilder().withUrl(`${api.replace(/\/api\/?$/, '')}/hubs/donation-chat`,
      { accessTokenFactory: () => localStorage.getItem('accessToken') || '' })
      .withAutomaticReconnect().configureLogging(LogLevel.Warning).build();
    connection.on('ChatNotification', (n: ChatNotice) => {
      if (disposed || n.senderId === user.userId) return;
      const direct = n.conversationType === 'direct'; const id = direct ? `direct:${n.participantId}` : `request:${n.requestId}`;
      const item: ChatItem = { id, type: direct ? 'direct' : 'request', participantId: n.participantId,
        requestId: n.requestId, requestCode: n.requestCode, participantLabel: n.participantLabel || n.senderName,
        avatarUrl: null, lastMessage: n.message, lastMessageAt: n.sentAt };
      toastRef.current.info(`${n.senderName}: ${n.message}`); setUnread((v) => v + 1);
      setItems((current) => [item, ...current.filter((x) => x.id !== id)]); setActive(item); setListOpen(false);
      window.dispatchEvent(new CustomEvent('chat:message', { detail: n }));
    });
    const timer = window.setTimeout(() => { if (!disposed) void connection.start().catch(() => undefined); }, 0);
    return () => { disposed = true; window.clearTimeout(timer); connection.off('ChatNotification'); void connection.stop(); };
  }, [user?.userId]);

  if (!user) return null;
  const q = search.trim().toLocaleLowerCase('vi'); const filtered = items.filter((x) => !q ||
    x.participantLabel.toLocaleLowerCase('vi').includes(q) || (x.requestCode || '').toLowerCase().includes(q));
  return <>
    {!active && <button className="chat-launcher" type="button" aria-label="Mở trò chuyện" onClick={() => setListOpen((v) => !v)}>
      {listOpen ? <X size={25} /> : <MessageCircle size={26} />}{!listOpen && unread > 0 && <span>{unread > 9 ? '9+' : unread}</span>}
    </button>}
    {listOpen && !active && <aside className="chat-conversation-panel"><header><strong>Tin nhắn</strong><small>Danh bạ theo quyền và phạm vi làm việc</small></header>
      <label><Search size={18} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm người hoặc mã đơn..." /></label>
      <div className="chat-conversation-list">{loading && <p className="chat-list-state">Đang tải...</p>}
        {!loading && !filtered.length && <p className="chat-list-state">Chưa có người nào có thể nhắn tin.</p>}
        {filtered.map((x) => <button type="button" key={x.id} onClick={() => { setActive(x); setListOpen(false); }}>
          <span className="chat-avatar">{x.avatarUrl ? <img src={x.avatarUrl} alt="" /> : x.participantLabel[0]?.toUpperCase()}</span>
          <span className="chat-person"><strong>{x.participantLabel}</strong><small>{x.requestCode || roleLabels[x.role || ''] || x.role}</small><em>{x.lastMessage || 'Bắt đầu cuộc trò chuyện'}</em></span>
          {x.lastMessageAt && <time>{new Date(x.lastMessageAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}</time>}
        </button>)}</div></aside>}
    {active && <DonationChatDialog requestId={active.requestId} requestCode={active.requestCode}
      directUserId={active.participantId} participantLabel={active.participantLabel} onClose={() => setActive(null)} />}
  </>;
}
