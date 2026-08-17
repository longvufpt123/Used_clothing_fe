import { useCallback, useEffect, useRef, useState } from 'react';
import { MessageCircle, Send, X } from 'lucide-react';
import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { donationChatService } from '@/services/donationChatService';
import type { DonationChatMessage } from '@/services/donationChatService';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import './DonationChatDialog.css';

interface Props {
  requestId?: string;
  requestCode?: string;
  directUserId?: string;
  participantLabel: string;
  onClose: () => void;
}

export default function DonationChatDialog({ requestId, requestCode, directUserId, participantLabel, onClose }: Props) {
  const [messages, setMessages] = useState<DonationChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const toast = useToast();
  const { user } = useAuth();
  const endRef = useRef<HTMLDivElement>(null);
  const toastRef = useRef(toast);
  toastRef.current = toast;

  const loadMessages = useCallback(async (showError = false) => {
    try {
      setMessages(directUserId
        ? await donationChatService.getDirectMessages(directUserId)
        : await donationChatService.getMessages(requestId!));
    } catch (error: any) {
      if (showError) toastRef.current.error(error?.response?.data?.message || 'Không thể tải cuộc trò chuyện.');
    }
  }, [requestId, directUserId]);

  useEffect(() => {
    let disposed = false;
    void loadMessages(true);
    const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
    const hubBase = apiBase.replace(/\/api\/?$/, '');
    const connection = new HubConnectionBuilder()
      .withUrl(`${hubBase}/hubs/donation-chat`, {
        accessTokenFactory: () => localStorage.getItem('accessToken') || '',
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build();
    connection.on('MessageReceived', (incoming: DonationChatMessage) => {
      if (disposed) return;
      const message = { ...incoming, isMine: incoming.senderId === user?.userId };
      setMessages((current) => current.some((item) => item.id === message.id)
        ? current : [...current, message]);
    });
    connection.onreconnected(() => {
      if (!disposed && requestId) void connection.invoke('JoinRequest', requestId);
    });
    const startTimer = window.setTimeout(() => {
      if (disposed) return;
      void connection.start()
        .then(() => {
          if (!disposed && requestId) return connection.invoke('JoinRequest', requestId);
          return undefined;
        })
        .catch(() => {
          if (!disposed) toastRef.current.error('Không thể kết nối trò chuyện realtime.');
        });
    }, 0);
    return function disconnectChat(): void {
      disposed = true;
      window.clearTimeout(startTimer);
      connection.off('MessageReceived');
      void connection.stop();
    };
  }, [loadMessages, requestId, user?.userId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!directUserId) return;
    const refresh = (event: Event) => {
      const detail = (event as CustomEvent<{ participantId?: string }>).detail;
      if (detail?.participantId === directUserId) void loadMessages();
    };
    window.addEventListener('chat:message', refresh);
    return () => window.removeEventListener('chat:message', refresh);
  }, [directUserId, loadMessages]);

  const send = async () => {
    const message = draft.trim();
    if (!message || sending) return;
    setSending(true);
    try {
      if (directUserId) {
        await donationChatService.sendDirectMessage(directUserId, message);
        await loadMessages();
      } else await donationChatService.sendMessage(requestId!, message);
      setDraft('');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Không thể gửi tin nhắn.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="donation-chat-overlay">
      <section className="donation-chat-dialog">
        <header>
          <div><MessageCircle size={20} /><span><strong>{participantLabel}</strong>{requestCode && <small>{requestCode}</small>}</span></div>
          <button type="button" onClick={onClose} aria-label="Đóng trò chuyện"><X size={19} /></button>
        </header>
        <div className="donation-chat-messages">
          {messages.length === 0 && <p className="donation-chat-empty">Hãy gửi tin nhắn đầu tiên về lịch tiếp nhận đơn này.</p>}
          {messages.map((item) => (
            <article className={item.isMine ? 'mine' : ''} key={item.id}>
              {!item.isMine && <span>{item.senderName}</span>}
              <p>{item.message}</p>
              <time>{new Date(item.sentAt).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}</time>
            </article>
          ))}
          <div ref={endRef} />
        </div>
        <footer>
          <textarea value={draft} maxLength={2000} rows={2} placeholder="Nhập tin nhắn..."
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void send(); } }} />
          <button type="button" disabled={!draft.trim() || sending} onClick={() => void send()}><Send size={18} /></button>
        </footer>
      </section>
    </div>
  );
}
