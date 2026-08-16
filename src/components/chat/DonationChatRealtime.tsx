import { useEffect, useRef, useState } from 'react';
import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { MessageCircle, Search, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { donationChatService } from '@/services/donationChatService';
import type { DonationChatConversation } from '@/services/donationChatService';
import DonationChatDialog from './DonationChatDialog';
import './DonationChatRealtime.css';

interface ChatNotification extends DonationChatConversation { senderId: string; senderName: string; message: string; sentAt: string; }

export default function DonationChatRealtime() {
  const { user } = useAuth();
  const toast = useToast();
  const toastRef = useRef(toast);
  const [listOpen, setListOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [unread, setUnread] = useState(0);
  const [conversations, setConversations] = useState<DonationChatConversation[]>([]);
  const [activeChat, setActiveChat] = useState<DonationChatConversation | null>(null);
  toastRef.current = toast;

  useEffect(() => {
    if (!listOpen) return;
    setUnread(0); setLoading(true);
    void donationChatService.getConversations().then(setConversations)
      .catch(() => toastRef.current.error('Không thể tải danh sách trò chuyện.'))
      .finally(() => setLoading(false));
  }, [listOpen]);

  useEffect(() => {
    if (!user || !['Donor', 'ReceivingStaff'].includes(user.role)) return;
    let disposed = false;
    const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
    const connection = new HubConnectionBuilder().withUrl(`${apiBase.replace(/\/api\/?$/, '')}/hubs/donation-chat`,
      { accessTokenFactory: () => localStorage.getItem('accessToken') || '' })
      .withAutomaticReconnect().configureLogging(LogLevel.Warning).build();
    connection.on('ChatNotification', (notice: ChatNotification) => {
      if (disposed || notice.senderId === user.userId) return;
      toastRef.current.info(`${notice.senderName}: ${notice.message}`); setUnread((n) => n + 1);
      const item: DonationChatConversation = { requestId: notice.requestId, requestCode: notice.requestCode,
        participantLabel: notice.participantLabel || notice.senderName, avatarUrl: null,
        lastMessage: notice.message, lastMessageAt: notice.sentAt };
      setConversations((items) => [item, ...items.filter((x) => x.requestId !== item.requestId)]);
      setActiveChat(item); setListOpen(false);
    });
    const timer = window.setTimeout(() => { if (!disposed) void connection.start().catch(() => undefined); }, 0);
    return () => { disposed = true; window.clearTimeout(timer); connection.off('ChatNotification'); void connection.stop(); };
  }, [user?.userId, user?.role]);

  if (!user || !['Donor', 'ReceivingStaff'].includes(user.role)) return null;
  const keyword = search.trim().toLocaleLowerCase('vi');
  const filtered = conversations.filter((x) => !keyword || x.participantLabel.toLocaleLowerCase('vi').includes(keyword) || x.requestCode.toLowerCase().includes(keyword));
  return <>
    {!activeChat && <button className="chat-launcher" type="button" aria-label="Mở trò chuyện" onClick={() => setListOpen((v) => !v)}>
      {listOpen ? <X size={25} /> : <MessageCircle size={26} />}{!listOpen && unread > 0 && <span>{unread > 9 ? '9+' : unread}</span>}
    </button>}
    {listOpen && !activeChat && <aside className="chat-conversation-panel">
      <header><strong>Tin nhắn</strong><small>Chọn người để bắt đầu trò chuyện</small></header>
      <label><Search size={18} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm người hoặc mã đơn..." /></label>
      <div className="chat-conversation-list">
        {loading && <p className="chat-list-state">Đang tải...</p>}
        {!loading && filtered.length === 0 && <p className="chat-list-state">Chưa có người nào có thể nhắn tin.</p>}
        {filtered.map((item) => <button type="button" key={item.requestId} onClick={() => { setActiveChat(item); setListOpen(false); }}>
          <span className="chat-avatar">{item.avatarUrl ? <img src={item.avatarUrl} alt="" /> : item.participantLabel.charAt(0).toUpperCase()}</span>
          <span className="chat-person"><strong>{item.participantLabel}</strong><small>{item.requestCode}</small><em>{item.lastMessage || 'Bắt đầu cuộc trò chuyện'}</em></span>
          {item.lastMessageAt && <time>{new Date(item.lastMessageAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}</time>}
        </button>)}
      </div>
    </aside>}
    {activeChat && <DonationChatDialog requestId={activeChat.requestId} requestCode={activeChat.requestCode}
      participantLabel={activeChat.participantLabel} onClose={() => setActiveChat(null)} />}
  </>;
}
