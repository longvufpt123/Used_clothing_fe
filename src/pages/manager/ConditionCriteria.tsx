import { useEffect, useState } from 'react';
import { ClipboardCheck, Edit3, Plus, Power, Save, X } from 'lucide-react';
import AdminLayout from '@/shared/layouts/AdminLayout';
import apiClient from '@/services/api';
import { useToast } from '@/context/ToastContext';
import '@/styles/ops-shared.css';
import './Categories.css';
import './CategoriesStatus.css';

interface ConditionQuestionConfig {
  id: string;
  questionText: string;
  displayOrder: number;
  answers: { id: string; text: string; grade: 'A' | 'B' | 'C' }[];
}

const blankQuestion = {
  id: '',
  questionText: '',
  displayOrder: 1,
  answerA: '',
  answerB: '',
  answerC: '',
};

export default function ConditionCriteria() {
  const toast = useToast();
  const [questions, setQuestions] = useState<ConditionQuestionConfig[]>([]);
  const [form, setForm] = useState({ ...blankQuestion });
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = () =>
    apiClient
      .get<unknown, ConditionQuestionConfig[]>('/condition-question-configurations')
      .then(setQuestions)
      .catch(() => toast.error('Không thể tải tiêu chí đánh giá.'));
  useEffect(() => {
    load();
  }, []);

  const create = () => {
    setForm({ ...blankQuestion, displayOrder: (questions.at(-1)?.displayOrder ?? 0) + 1 });
    setOpen(true);
  };
  const edit = (question: ConditionQuestionConfig) => {
    const answer = (grade: string) => question.answers.find((x) => x.grade === grade)?.text ?? '';
    setForm({
      id: question.id,
      questionText: question.questionText,
      displayOrder: question.displayOrder,
      answerA: answer('A'),
      answerB: answer('B'),
      answerC: answer('C'),
    });
    setOpen(true);
  };
  const save = async () => {
    if (
      !form.questionText.trim() ||
      !form.answerA.trim() ||
      !form.answerB.trim() ||
      !form.answerC.trim()
    )
      return toast.error('Câu hỏi và cả ba lựa chọn A/B/C đều bắt buộc.');
    if (form.displayOrder < 1) return toast.error('Thứ tự phải từ 1 trở lên.');
    const maximumOrder = form.id ? questions.length : questions.length + 1;
    if (form.displayOrder > maximumOrder)
      return toast.error(`Thứ tự không được vượt quá ${maximumOrder}.`);
    setSaving(true);
    try {
      const payload = {
        ...form,
        questionText: form.questionText.trim(),
        answerA: form.answerA.trim(),
        answerB: form.answerB.trim(),
        answerC: form.answerC.trim(),
      };
      if (form.id) await apiClient.put(`/condition-question-configurations/${form.id}`, payload);
      else await apiClient.post('/condition-question-configurations', payload);
      toast.success(form.id ? 'Đã cập nhật tiêu chí.' : 'Đã thêm tiêu chí mới.');
      setOpen(false);
      await load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Không thể lưu tiêu chí.');
    } finally {
      setSaving(false);
    }
  };
  const disable = async (question: ConditionQuestionConfig) => {
    if (!confirm(`Ngừng sử dụng tiêu chí “${question.questionText}”?`)) return;
    try {
      await apiClient.delete(`/condition-question-configurations/${question.id}`);
      toast.success('Đã ngừng sử dụng tiêu chí.');
      await load();
    } catch {
      toast.error('Không thể ngừng sử dụng tiêu chí.');
    }
  };

  return (
    <AdminLayout>
      <div className="ops-page">
        <header className="ops-pagehead">
          <div className="ops-pagehead-main">
            <span className="ops-pagehead-kicker">Cấu hình phân loại</span>
            <h1>Tiêu chí đánh giá tình trạng</h1>
            <p>Quản lý các câu hỏi A/B/C mà Nhân viên phân loại sử dụng khi phân loại.</p>
          </div>
          <button className="ops-btn ops-btn-primary" onClick={create}>
            <Plus size={16} /> Thêm tiêu chí
          </button>
        </header>

        <section className="ops-panel condition-question-config">
          <div className="ops-section-head">
            <div>
              <h2>Danh sách tiêu chí</h2>
              <p>Mỗi tiêu chí phải có đầy đủ lựa chọn tương ứng Nhãn A, B và C.</p>
            </div>
            <span>{questions.length} tiêu chí đang sử dụng</span>
          </div>
          <div className="condition-question-list">
            {questions.map((question) => (
              <article key={question.id}>
                <header>
                  <div>
                    <span>Tiêu chí {question.displayOrder}</span>
                    <h3>{question.questionText}</h3>
                  </div>
                </header>
                <div className="condition-answer-grid">
                  {(['A', 'B', 'C'] as const).map((grade) => (
                    <div className={`grade-${grade.toLowerCase()}`} key={grade}>
                      <strong>Nhãn {grade}</strong>
                      <span>
                        {question.answers.find((x) => x.grade === grade)?.text || 'Chưa cấu hình'}
                      </span>
                    </div>
                  ))}
                </div>
                <footer>
                  <button className="ops-btn ops-btn-secondary" onClick={() => edit(question)}>
                    <Edit3 size={14} /> Sửa
                  </button>
                  <button className="ops-btn ops-btn-danger" onClick={() => disable(question)}>
                    <Power size={14} /> Ngừng dùng
                  </button>
                </footer>
              </article>
            ))}
          </div>
          {!questions.length && (
            <div className="ops-empty">
              <ClipboardCheck size={34} />
              <h4>Chưa có tiêu chí</h4>
              <p>Thêm tiêu chí đầu tiên để Classification Staff sử dụng.</p>
            </div>
          )}
        </section>

        {open && (
          <div className="rcv-modal-overlay">
            <section className="ops-panel rcv-modal condition-question-modal">
              <div className="ops-section-head">
                <div>
                  <span className="ops-panel-label">CẤU HÌNH TIÊU CHÍ</span>
                  <h2>{form.id ? 'Sửa tiêu chí đánh giá' : 'Thêm tiêu chí đánh giá'}</h2>
                </div>
                <button className="ops-back" onClick={() => setOpen(false)}>
                  <X size={17} />
                </button>
              </div>
              <div className="ops-field">
                <label>Nội dung tiêu chí *</label>
                <input
                  value={form.questionText}
                  onChange={(e) => setForm({ ...form, questionText: e.target.value })}
                  placeholder="VD: Tình trạng đường may"
                />
              </div>
              <div className="condition-question-meta">
                <div className="ops-field">
                  <label>Thứ tự *</label>
                  <input
                    type="number"
                    min="1"
                    max={form.id ? questions.length : questions.length + 1}
                    value={form.displayOrder}
                    onChange={(e) => setForm({ ...form, displayOrder: Number(e.target.value) })}
                  />
                  <small>
                    {form.id
                      ? `Từ 1 đến ${questions.length}. Chọn vị trí đã có để đổi chỗ.`
                      : `Từ 1 đến ${questions.length + 1}. Các tiêu chí phía sau sẽ tự dịch xuống.`}
                  </small>
                </div>
              </div>
              <div className="condition-answer-editor">
                <label className="grade-a">
                  <strong>Lựa chọn Nhãn A *</strong>
                  <textarea
                    rows={3}
                    value={form.answerA}
                    onChange={(e) => setForm({ ...form, answerA: e.target.value })}
                  />
                </label>
                <label className="grade-b">
                  <strong>Lựa chọn Nhãn B *</strong>
                  <textarea
                    rows={3}
                    value={form.answerB}
                    onChange={(e) => setForm({ ...form, answerB: e.target.value })}
                  />
                </label>
                <label className="grade-c">
                  <strong>Lựa chọn Nhãn C *</strong>
                  <textarea
                    rows={3}
                    value={form.answerC}
                    onChange={(e) => setForm({ ...form, answerC: e.target.value })}
                  />
                </label>
              </div>
              <button
                className="ops-btn ops-btn-primary ops-btn-block"
                disabled={saving}
                onClick={save}
              >
                <Save size={16} />
                {saving ? 'Đang lưu...' : 'Lưu tiêu chí'}
              </button>
            </section>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
