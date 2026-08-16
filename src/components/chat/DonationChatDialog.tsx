import { useCallback, useEffect, useRef, useState } from 'react';
import { MessageCircle, Send, X } from 'lucide-react';
import { donationChatService } from '@/services/donationChatService';
import type { DonationChatMessage } from '@/services/donationChatService';
import { useToast } from '@/context/ToastContext';
import './DonationChatDialog.css';

interface Props {
  requestId: string;
  requestCode: string;
  participantLabel: string;
  onClose: () => void;
}

export default function DonationChatDialog({ requestId, requestCode, participantLabel, onClose }: Props) {
  const [messages, setMessages] = useState<DonationChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const toast = useToast();
  const endRef = useRef<HTMLDivElement>(null);

  const loadMessages = useCallback(async (showError = false) => {
    try {
      setMessages(await donationChatService.getMessages(requestId));
    } catch (error: any) {
      if (showError) toast.error(error?.response?.data?.message || 'Không thể tải cuộc trò chuyện.');
    }
  }, [requestId, toast]);

  useEffect(() => {
    void loadMessages(true);
    const timer = window.setInterval(() => void loadMessages(), 5000);
    return () => window.clearInterval(timer);
  }, [loadMessages]);

  useEffect(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), [messages]);

  const send = async () => {
    const message = draft.trim();
    if (!message || sending) return;
    setSending(true);
    try {
      await donationChatService.sendMessage(requestId, message);
      setDraft('');
      await loadMessages();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Không thể gửi tin nhắn.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="donation-chat-overlay" onMouseDown={onClose}>
      <section className="donation-chat-dialog" onMouseDown={(event) => event.stopPropagation()}>
        <header>
          <div><MessageCircle size={20} /><span><strong>{participantLabel}</strong><small>{requestCode}</small></span></div>
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
