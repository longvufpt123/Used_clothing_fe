import { useEffect, useRef, useState } from 'react';
import { isAxiosError } from 'axios';
import { Truck, RefreshCw, X } from 'lucide-react';
import { findAdministrativeMatch, resolveGhnDestination } from '@/utils/ghnAddress';
import '../distribution/DistributionPortal.css';
import apiClient from '@/services/api';
import { processingService, type ProcessingDetail } from '@/services/processingService';
import { getStatusLabel } from '@/utils/statusLabels';
import { parseVietnamTimestamp } from '@/utils/dateTime';

type Province = { ProvinceID: number; ProvinceName: string };
type District = { DistrictID: number; DistrictName: string; ProvinceID: number };
type Ward = { WardCode: string; WardName: string };
type Address = {
  provinceId: string;
  districtId: string;
  wardCode: string;
  provinceName: string;
  districtName: string;
  wardName: string;
};
const emptyAddress: Address = {
  provinceId: '',
  districtId: '',
  wardCode: '',
  provinceName: '',
  districtName: '',
  wardName: '',
};
const message = (e: unknown) =>
  isAxiosError<{ message?: string }>(e)
    ? e.response?.data?.message || 'Không kết nối được GHN. Vui lòng thử lại.'
    : 'Không thể xử lý yêu cầu GHN.';

export default function ProcessingGhnPanel({
  detail,
  mode,
  onChanged,
}: {
  detail: ProcessingDetail;
  mode: string;
  onChanged: () => Promise<void>;
}) {
  const shipping = detail.shipping;
  const canBook =
    mode === 'warehouse' &&
    ['ReadyForGhn', 'Issued'].includes(detail.status) &&
    !shipping?.ghnOrderCode;
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [loading, setLoading] = useState(false);
  const [retry, setRetry] = useState(0);
  const [from, setFrom] = useState<Address>({ ...emptyAddress });
  const [to, setTo] = useState<Address>({ ...emptyAddress });
  const [form, setForm] = useState({
    fromName: detail.warehouseName,
    fromPhone: shipping?.warehousePhone || '',
    fromAddress: shipping?.warehouseAddress || '',
    paymentTypeId: '1',
    requiredNote: 'KHONGCHOXEMHANG',
    serviceTypeId: '2',
    length: '40',
    width: '40',
    height: '30',
  });
  const submitting = useRef(false);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (!open || !canBook) return;
    const element = dialog.current;
    element?.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      element?.close();
      document.body.style.overflow = previousOverflow;
    };
  }, [open, canBook]);
  const weight = detail.inputs.reduce((total, item) => total + item.issuedWeight, 0);
  const heavy = weight >= 20 || form.serviceTypeId === '5';
  const packageCount = heavy
    ? detail.inputs.reduce((total, item) => total + Math.ceil(item.issuedWeight / 30), 0)
    : 1;
  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoading(true);
    setError('');
    apiClient
      .get<unknown, Province[]>('/distribution-operations/ghn/provinces')
      .then((data) => {
        if (active) setProvinces(data);
      })
      .catch((e) => {
        if (active) setError(message(e));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [open, retry]);
  async function book() {
    if (submitting.current) return;
    submitting.current = true;
    setBusy(true);
    setError('');
    try {
      await processingService.createGhn(detail.id, {
        fromName: form.fromName.trim(),
        fromPhone: form.fromPhone.trim(),
        fromAddress: form.fromAddress.trim(),
        fromDistrictId: Number(from.districtId),
        fromWardCode: from.wardCode,
        fromProvinceName: from.provinceName,
        fromDistrictName: from.districtName,
        fromWardName: from.wardName,
        toDistrictId: Number(to.districtId),
        toWardCode: to.wardCode,
        toProvinceName: to.provinceName,
        toDistrictName: to.districtName,
        toWardName: to.wardName,
        paymentTypeId: Number(form.paymentTypeId),
        requiredNote: form.requiredNote,
        serviceTypeId: heavy ? 5 : Number(form.serviceTypeId),
        length: Number(form.length),
        width: Number(form.width),
        height: Number(form.height),
      });
      setOpen(false);
      await onChanged();
    } catch (e) {
      setError(message(e));
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }
  async function refresh() {
    if (submitting.current) return;
    submitting.current = true;
    setBusy(true);
    setError('');
    try {
      await processingService.action(detail.id, 'ghn/refresh');
      await onChanged();
    } catch (e) {
      setError(message(e));
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }
  if (!canBook && !shipping?.ghnOrderCode && detail.status !== 'ReadyForGhn') return null;
  return (
    <section className="ops-panel">
      <div className="processing-sectionhead">
        <h2>
          <Truck size={19} /> Giao hàng GHN
        </h2>
        {shipping?.ghnOrderCode && (
          <button className="processing-button" disabled={busy} onClick={() => void refresh()}>
            <RefreshCw size={16} />
            {busy ? 'Đang cập nhật...' : 'Cập nhật GHN'}
          </button>
        )}
        {canBook && (
          <button
            className="processing-button primary"
            disabled={busy}
            onClick={() => setOpen(!open)}
          >
            {open ? 'Đóng biểu mẫu GHN' : 'Tạo vận đơn GHN'}
          </button>
        )}
      </div>
      {error && !open && (
        <div className="processing-alert" role="alert">
          {error}
          {open && (
            <button
              type="button"
              className="processing-button"
              disabled={busy}
              onClick={() => setRetry((x) => x + 1)}
            >
              Tải lại địa chỉ
            </button>
          )}
        </div>
      )}
      {shipping?.ghnOrderCode ? (
        <>
          <div className="ops-kv-grid">
            <div className="ops-kv">
              <span>Mã vận đơn</span>
              <strong>{shipping.ghnOrderCode}</strong>
            </div>
            <div className="ops-kv">
              <span>Trạng thái GHN</span>
              <strong>{getStatusLabel(shipping.ghnStatus || '')}</strong>
            </div>
          </div>
          {['ShipmentCancelled', 'Returned', 'DeliveryException'].includes(detail.status) && (
            <p className="processing-alert">
              Vận chuyển cần được kiểm tra với GHN. Khối lượng chưa được tự động nhập lại kho.
            </p>
          )}
          <p className="processing-note">
            Cập nhật gần nhất:{' '}
            {parseVietnamTimestamp(shipping.ghnUpdatedAt)?.toLocaleString('vi-VN') ||
              'Chưa cập nhật'}
          </p>
          {(shipping.history || []).length > 0 && (
            <div className="processing-table-scroll">
              <table className="processing-table">
                <thead>
                  <tr>
                    <th>Thời gian</th>
                    <th>Trạng thái</th>
                    <th>Nội dung</th>
                  </tr>
                </thead>
                <tbody>
                  {shipping.history.map((event, index) => (
                    <tr key={`${event.occurredAt}-${index}`}>
                      <td>{parseVietnamTimestamp(event.occurredAt)?.toLocaleString('vi-VN')}</td>
                      <td>{getStatusLabel(event.status)}</td>
                      <td>{event.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : (
        <p className="processing-note">
          Kho đã lập phiếu xuất. Nhân viên kho tạo vận đơn để GHN đến lấy và giao hàng tới tổ chức.
        </p>
      )}
      {open && canBook && (
        <dialog
          ref={dialog}
          className="ghn-create-modal processing-ghn-dialog"
          aria-labelledby="processing-ghn-title"
          onCancel={(e) => {
            e.preventDefault();
            if (!submitting.current) setOpen(false);
          }}
        >
          <header>
            <div>
              <span>TẠO VẬN ĐƠN GIAO HÀNG</span>
              <h2 id="processing-ghn-title">Thông tin vận đơn GHN</h2>
              <p>
                {detail.warehouseName} → {detail.organizationName}
              </p>
            </div>
            <button type="button" aria-label="Đóng" disabled={busy} onClick={() => setOpen(false)}>
              <X />
            </button>
          </header>
          <form
            className="processing-confirm"
            onSubmit={(e) => {
              e.preventDefault();
              void book();
            }}
          >
            {error && (
              <div className="processing-alert" role="alert">
                {error}
                <button
                  type="button"
                  className="processing-button"
                  disabled={busy}
                  onClick={() => setRetry((x) => x + 1)}
                >
                  Tải lại địa chỉ
                </button>
              </div>
            )}
            <p className="processing-note">
              Địa chỉ được tự điền từ thông tin kho và tổ chức. Kiểm tra lại trước khi tạo vận đơn;
              chọn bổ sung các mục chưa nhận diện được.
            </p>
            <div className="ops-kv-grid">
              <div className="ops-kv">
                <span>Người nhận</span>
                <strong>{detail.organizationName}</strong>
                <span>{shipping?.recipientPhone || 'Thiếu số điện thoại'}</span>
              </div>
              <div className="ops-kv">
                <span>Địa chỉ tổ chức</span>
                <strong>{shipping?.recipientAddress || 'Thiếu địa chỉ'}</strong>
              </div>
            </div>
            <fieldset disabled={busy || loading} className="processing-ghn-fields">
              <h3>Điểm lấy hàng tại kho</h3>
              <div className="ops-form-grid two-col">
                {(['fromName', 'fromPhone', 'fromAddress'] as const).map((key) => (
                  <div className="ops-field" key={key}>
                    <label htmlFor={`ghn-${key}`}>
                      {key === 'fromName'
                        ? 'Tên điểm lấy hàng'
                        : key === 'fromPhone'
                          ? 'Điện thoại lấy hàng'
                          : 'Địa chỉ lấy hàng'}{' '}
                      *
                    </label>
                    <input
                      id={`ghn-${key}`}
                      required
                      value={form[key]}
                      maxLength={key === 'fromPhone' ? 20 : 1024}
                      onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    />
                  </div>
                ))}
              </div>
              <AddressFields
                key={`from-${retry}`}
                prefix="pickup"
                address={form.fromAddress}
                provinces={provinces}
                value={from}
                onChange={setFrom}
              />
              <h3>Địa chỉ giao hàng của tổ chức</h3>
              <AddressFields
                key={`to-${retry}`}
                prefix="delivery"
                address={shipping?.recipientAddress || ''}
                provinces={provinces}
                value={to}
                onChange={setTo}
              />
              <div className="ops-form-grid two-col">
                <div className="ops-field">
                  <label htmlFor="ghn-payment">Bên thanh toán phí *</label>
                  <select
                    id="ghn-payment"
                    value={form.paymentTypeId}
                    onChange={(e) => setForm({ ...form, paymentTypeId: e.target.value })}
                  >
                    <option value="1">Kho thanh toán</option>
                    <option value="2">Tổ chức nhận thanh toán</option>
                  </select>
                </div>
                <div className="ops-field">
                  <label htmlFor="ghn-service">Dịch vụ *</label>
                  <select
                    id="ghn-service"
                    value={heavy ? '5' : form.serviceTypeId}
                    disabled={weight >= 20}
                    onChange={(e) => setForm({ ...form, serviceTypeId: e.target.value })}
                  >
                    <option value="2">Hàng nhẹ</option>
                    <option value="5">Hàng nặng / nhiều kiện</option>
                  </select>
                </div>
                <div className="ops-field">
                  <label htmlFor="ghn-note">Yêu cầu giao hàng *</label>
                  <select
                    id="ghn-note"
                    value={form.requiredNote}
                    onChange={(e) => setForm({ ...form, requiredNote: e.target.value })}
                  >
                    <option value="KHONGCHOXEMHANG">Không cho xem hàng</option>
                    <option value="CHOXEMHANGKHONGTHU">Cho xem, không thử</option>
                    <option value="CHOTHUHANG">Cho thử hàng</option>
                  </select>
                </div>
                {(['length', 'width', 'height'] as const).map((key) => (
                  <div className="ops-field" key={key}>
                    <label htmlFor={`ghn-${key}`}>
                      {key === 'length' ? 'Dài' : key === 'width' ? 'Rộng' : 'Cao'} mỗi kiện (cm) *
                    </label>
                    <input
                      id={`ghn-${key}`}
                      type="number"
                      required
                      min="1"
                      max="200"
                      step="1"
                      value={form[key]}
                      onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    />
                  </div>
                ))}
              </div>
              <p className="processing-note">
                {weight.toLocaleString('vi-VN')} kg · {packageCount} kiện.{' '}
                {heavy
                  ? 'Đóng riêng từng batch thành kiện tối đa 30 kg, theo kích thước nhập ở trên.'
                  : 'Nhập kích thước thực tế của kiện đã đóng.'}{' '}
                Không thu hộ COD.
              </p>
              <button
                type="submit"
                className="processing-button primary"
                disabled={
                  busy ||
                  loading ||
                  !from.wardCode ||
                  !to.wardCode ||
                  !shipping?.recipientPhone ||
                  !shipping?.recipientAddress
                }
              >
                {busy
                  ? 'Đang tạo vận đơn...'
                  : loading
                    ? 'Đang tải địa chỉ...'
                    : 'Xác nhận tạo vận đơn GHN'}
              </button>
            </fieldset>
          </form>
        </dialog>
      )}
    </section>
  );
}

function AddressFields({
  prefix,
  address,
  provinces,
  value,
  onChange,
}: {
  prefix: string;
  address: string;
  provinces: Province[];
  value: Address;
  onChange: (value: Address) => void;
}) {
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [error, setError] = useState('');
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);
  const manual = useRef(false);
  useEffect(() => {
    if (manual.current) return;
    if (!value.provinceId && provinces.length) {
      const hint = resolveGhnDestination(address).province?.name || address;
      const match = findAdministrativeMatch(
        hint,
        provinces.map((p) => ({ ...p, name: p.ProvinceName })),
      );
      if (match)
        onChange({
          ...emptyAddress,
          provinceId: String(match.ProvinceID),
          provinceName: match.ProvinceName,
        });
    } else if (!value.districtId && districts.length) {
      const match = findAdministrativeMatch(
        address,
        districts.map((d) => ({ ...d, name: d.DistrictName })),
      );
      if (match)
        onChange({
          ...value,
          districtId: String(match.DistrictID),
          districtName: match.DistrictName,
        });
    } else if (!value.wardCode && wards.length) {
      const match = findAdministrativeMatch(
        address,
        wards.map((w) => ({ ...w, name: w.WardName })),
      );
      if (match) onChange({ ...value, wardCode: match.WardCode, wardName: match.WardName });
    }
  }, [address, provinces, districts, wards, value, onChange]);
  useEffect(() => {
    let active = true;
    setDistricts([]);
    setError('');
    if (!value.provinceId) return;
    setLoadingDistricts(true);
    apiClient
      .get<unknown, District[]>('/distribution-operations/ghn/districts', {
        params: { provinceId: value.provinceId },
      })
      .then((data) => {
        if (active) setDistricts(data);
      })
      .catch((e) => {
        if (active) setError(message(e));
      })
      .finally(() => {
        if (active) setLoadingDistricts(false);
      });
    return () => {
      active = false;
    };
  }, [value.provinceId]);
  useEffect(() => {
    let active = true;
    setWards([]);
    setError('');
    if (!value.districtId) return;
    setLoadingWards(true);
    apiClient
      .get<unknown, Ward[]>('/distribution-operations/ghn/wards', {
        params: { districtId: value.districtId },
      })
      .then((data) => {
        if (active) setWards(data);
      })
      .catch((e) => {
        if (active) setError(message(e));
      })
      .finally(() => {
        if (active) setLoadingWards(false);
      });
    return () => {
      active = false;
    };
  }, [value.districtId]);
  return (
    <>
      <div
        className="processing-filters"
        onChangeCapture={() => {
          manual.current = true;
        }}
      >
        <div className="ops-field">
          <label htmlFor={`${prefix}-province`}>Tỉnh / thành phố *</label>
          <select
            id={`${prefix}-province`}
            required
            value={value.provinceId}
            onChange={(e) =>
              onChange({
                ...emptyAddress,
                provinceId: e.target.value,
                provinceName:
                  provinces.find((p) => String(p.ProvinceID) === e.target.value)?.ProvinceName ||
                  '',
              })
            }
          >
            <option value="">Chọn tỉnh / thành phố</option>
            {provinces.map((p) => (
              <option key={p.ProvinceID} value={p.ProvinceID}>
                {p.ProvinceName}
              </option>
            ))}
          </select>
        </div>
        <div className="ops-field">
          <label htmlFor={`${prefix}-district`}>Quận / huyện GHN *</label>
          <select
            id={`${prefix}-district`}
            required
            disabled={!value.provinceId || loadingDistricts}
            value={value.districtId}
            onChange={(e) =>
              onChange({
                ...value,
                districtId: e.target.value,
                districtName:
                  districts.find((d) => String(d.DistrictID) === e.target.value)?.DistrictName ||
                  '',
                wardCode: '',
                wardName: '',
              })
            }
          >
            <option value="">{loadingDistricts ? 'Đang tải...' : 'Chọn quận / huyện'}</option>
            {districts.map((d) => (
              <option key={d.DistrictID} value={d.DistrictID}>
                {d.DistrictName}
              </option>
            ))}
          </select>
        </div>
        <div className="ops-field">
          <label htmlFor={`${prefix}-ward`}>Phường / xã GHN *</label>
          <select
            id={`${prefix}-ward`}
            required
            disabled={!value.districtId || loadingWards}
            value={value.wardCode}
            onChange={(e) =>
              onChange({
                ...value,
                wardCode: e.target.value,
                wardName: wards.find((w) => w.WardCode === e.target.value)?.WardName || '',
              })
            }
          >
            <option value="">{loadingWards ? 'Đang tải...' : 'Chọn phường / xã'}</option>
            {wards.map((w) => (
              <option key={w.WardCode} value={w.WardCode}>
                {w.WardName}
              </option>
            ))}
          </select>
        </div>
      </div>
      {error && (
        <p className="processing-alert" role="alert">
          {error} Chọn lại tỉnh/quận để tải lại.
        </p>
      )}
    </>
  );
}
