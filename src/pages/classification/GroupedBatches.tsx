import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Boxes,
  CalendarDays,
  CheckCircle2,
  Package,
  Send,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { useToast } from '@/context/ToastContext';
import {
  classificationService,
  type GroupedClassifiedBatch,
} from '@/services/classificationService';
import '@/styles/ops-shared.css';

const localDateValue = () => {
  const now = new Date();
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-');
};

interface GroupedBatchesProps {
  view?: 'open' | 'sent';
}

export default function GroupedBatches({ view = 'open' }: GroupedBatchesProps) {
  const [date, setDate] = useState(localDateValue);
  const [groups, setGroups] = useState<GroupedClassifiedBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [sending, setSending] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const loadGroups = async () => {
    setLoading(true);
    try {
      setGroups(await classificationService.getGroupedBatches(date));
    } catch {
      toast.error('Không tải được Classified Batch.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, [date]);

  const openGroups = useMemo(
    () => groups.filter((group) => group.status === 'Open'),
    [groups],
  );
  const visibleGroups = useMemo(
    () =>
      view === 'open'
        ? groups.filter((group) => group.status === 'Open')
        : groups.filter((group) => group.status !== 'Open'),
    [groups, view],
  );

  const sendAll = async () => {
    if (!openGroups.length) return;
    setSending(true);
    try {
      const result = await classificationService.sendGroupedBatchesToWarehouse(
        openGroups.map((group) => group.id),
      );
      toast.success(`Đã gửi ${result.sent} Classified Batch sang kho.`);
      if (result.skipped > 0) {
        toast.info(`${result.skipped} batch đã được gửi trước đó nên được bỏ qua.`);
      }
      setConfirming(false);
      await loadGroups();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          'Không thể gửi tất cả Classified Batch sang kho.',
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="ops-page">
      <header className="ops-pagehead">
        <div className="ops-pagehead-main">
          <span className="ops-pagehead-kicker">
            {view === 'open' ? 'Batch tổng hợp theo thuộc tính' : 'Lịch sử bàn giao kho'}
          </span>
          <h1>{view === 'open' ? 'Classified Batch chưa gửi kho' : 'Classified Batch đã gửi sang kho'}</h1>
          <p>
            {view === 'open'
              ? 'Các item cùng thuộc tính được gom chung và đang chờ bàn giao cho bộ phận kho.'
              : 'Theo dõi các batch đã bàn giao và trạng thái xử lý hiện tại tại bộ phận kho.'}
          </p>
        </div>
      </header>

      <section className="ops-panel glass">
        <div className="ops-field">
          <label htmlFor="groupDate">Ngày phân loại</label>
          <input
            id="groupDate"
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
        </div>
      </section>

      <div className="ops-stats">
        <div className="ops-stat-card">
          <span className="ops-stat-label">Số batch nhóm</span>
          <div className="ops-stat-value"><Boxes size={18} />{visibleGroups.length}</div>
        </div>
        <div className="ops-stat-card">
          <span className="ops-stat-label">Tổng item</span>
          <div className="ops-stat-value">
            <Package size={18} />
            {visibleGroups.reduce((sum, group) => sum + group.totalItem, 0)}
          </div>
        </div>
        <div className="ops-stat-card">
          <span className="ops-stat-label">Ngày</span>
          <div className="ops-stat-value">
            <CalendarDays size={18} />
            {new Date(`${date}T00:00:00`).toLocaleDateString('vi-VN')}
          </div>
        </div>
      </div>

      <section>
        <div className="ops-section-head">
          <div>
            <h2>{view === 'open' ? 'Danh sách chờ gửi kho' : 'Danh sách đã gửi kho'}</h2>
            <span>
              {loading
                ? 'Đang tải...'
                : `${visibleGroups.length} batch`}
            </span>
          </div>
          {view === 'open' && (
            <button
              type="button"
              className="ops-btn ops-btn-primary"
              disabled={loading || sending || openGroups.length === 0}
              onClick={() => setConfirming(true)}
            >
              <Send size={16} />
              Gửi tất cả sang kho ({openGroups.length})
            </button>
          )}
        </div>

        <div className="ops-list">
          {visibleGroups.map((group) => {
            const sent = group.status !== 'Open';
            return (
              <article
                key={group.id}
                className="ops-card"
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/classification/groups/${group.id}`)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    navigate(`/classification/groups/${group.id}`);
                  }
                }}
              >
                <div className="ops-card-top">
                  <div className="ops-card-code">{group.batchCode}</div>
                  <span
                    className={`ops-badge ${
                      sent
                        ? 'stored'
                        : group.conditionGrade === 'A'
                          ? 'done'
                          : group.conditionGrade === 'B'
                            ? 'pending'
                            : 'classified'
                    }`}
                  >
                    {sent ? <><CheckCircle2 size={13} /> Đã gửi kho</> : `Nhãn ${group.conditionGrade}`}
                  </span>
                </div>
                <h3>{group.clothingType} · {group.fabricType}</h3>
                <div className="ops-card-meta">
                  <span>{group.gender}</span>
                  <span>{group.targetUser}</span>
                  <span>Size {group.size}</span>
                  <span>{group.processingDirection}</span>
                </div>
                <div className="ops-card-footer">
                  <span><strong>{group.totalItem}</strong> item</span>
                  <span className="ops-card-action">
                    Xem chi tiết <ArrowRight size={14} />
                  </span>
                </div>
              </article>
            );
          })}
          {!loading && !visibleGroups.length && (
            <div className="ops-empty">
              <Boxes size={36} />
              <h4>
                {view === 'open'
                  ? 'Không có batch nào đang chờ gửi kho'
                  : 'Chưa có batch nào được gửi kho trong ngày này'}
              </h4>
              <p>
                {view === 'open'
                  ? 'Batch mới sẽ tự tạo khi Classification Staff lưu item đầu tiên.'
                  : 'Batch sẽ xuất hiện ở đây sau khi được bàn giao sang bộ phận kho.'}
              </p>
            </div>
          )}
        </div>
      </section>

      <ConfirmDialog
        isOpen={confirming}
        title="Gửi tất cả Classified Batch sang kho?"
        message={`Hệ thống sẽ gửi ${openGroups.length} batch chưa chuyển của ngày ${new Date(
          `${date}T00:00:00`,
        ).toLocaleDateString('vi-VN')} sang bộ phận kho.`}
        confirmText={`Gửi ${openGroups.length} batch`}
        cancelText="Hủy"
        tone="info"
        isLoading={sending}
        onConfirm={sendAll}
        onCancel={() => setConfirming(false)}
      />
    </div>
  );
}
