import { useRef, useState } from 'react';
import { uploadImages } from '@/utils/uploadImages';
import { validateOrganizationCertificate } from '@/utils/organizationCertificate';

type Props = {
  value: string;
  onChange: (url: string) => void;
  onBusyChange: (busy: boolean) => void;
  disabled?: boolean;
};

export default function VoucherImageUpload({ value, onChange, onBusyChange, disabled }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const input = useRef<HTMLInputElement>(null);

  const upload = async (file: File) => {
    setBusy(true);
    onBusyChange(true);
    setError('');
    try {
      await validateOrganizationCertificate(file);
      const [url] = await uploadImages([file], 'voucher-images');
      onChange(url);
    } catch (e) {
      setError(
        e instanceof TypeError
          ? 'Không kết nối được kho ảnh. Vui lòng thử lại.'
          : e instanceof Error
            ? e.message
            : 'Không tải được ảnh voucher.',
      );
    } finally {
      setBusy(false);
      onBusyChange(false);
      if (input.current) input.current.value = '';
    }
  };

  return (
    <div className="ops-field" style={{ marginBlock: 16, display: 'grid', gap: 12 }}>
      <label htmlFor="voucher-image">Ảnh voucher</label>
      <input
        ref={input}
        id="voucher-image"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        disabled={busy || disabled}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void upload(file);
        }}
      />
      <small>JPG, PNG hoặc WebP, tối đa 5 MB.</small>
      {busy && <span role="status">Đang tải ảnh lên…</span>}
      {error && (
        <span role="alert" style={{ color: '#b91c1c' }}>
          {error}
        </span>
      )}
      {value && (
        <>
          <img
            src={value}
            alt="Ảnh voucher"
            style={{ width: '100%', height: 180, objectFit: 'contain', borderRadius: 12 }}
          />
          <button
            type="button"
            className="ops-btn ops-btn-secondary"
            disabled={busy || disabled}
            onClick={() => onChange('')}
          >
            Xóa ảnh
          </button>
        </>
      )}
    </div>
  );
}
