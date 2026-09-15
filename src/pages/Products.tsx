import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Search,
  PlusCircle,
  Clock,
  ShieldCheck,
  ArrowRight,
  ImagePlus,
  X,
  XCircle,
  CheckCircle,
  MapPin,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import AddressSearchMap from '@/components/common/AddressSearchMap';
import WorkdayDatePicker from '@/components/common/WorkdayDatePicker';
import { useToast } from '@/context/ToastContext';
import apiClient from '@/services/api';
import './Products.css';

// Type definitions for Donation requests
interface DonationRequest {
  code: string;
  name: string;
  phone: string;
  category: string;
  weight: string;
  condition: string;
  address: string;
  status: 'pending' | 'confirmed' | 'classifying' | 'processed' | 'distributed' | 'cancelled';
  statusText: string;
  date: string;
  imageUrls?: string[];
}

interface UploadedImage {
  file: File;
  previewUrl: string;
}

interface CreateDonationPayload {
  pickupDate?: string | null;
  description: string;
  imageUrls: string[];
  estimateWeight: number;
  pickupAddress: string;
  pickupLatitude: number;
  pickupLongitude: number;
  contactName: string;
  contactPhoneNumber: string;
  deliveryMethod: 'StaffPickup' | 'DonorDropOff';
  warehouseId?: string;
  dropOffMethod?: 'SelfDelivery' | 'ThirdPartyDelivery';
  carrierName?: string;
  trackingCode?: string;
}

interface WarehouseOption {
  id: string;
  warehouseName: string;
  address: string;
}

interface DonationConfirmation {
  payload: CreateDonationPayload;
  categoryLabel: string;
  conditionLabel: string;
  warehouse: WarehouseOption;
  notes: string;
  images: UploadedImage[];
}

interface PickupWindow {
  shiftId: string;
  shiftName: string;
  startTime: string;
  endTime: string;
  label: string;
}

interface PickupAvailability {
  warehouseId: string;
  windows: PickupWindow[];
}

interface DonorRequestSearchApiResponse {
  id: string;
  code: string;
  donorName: string;
  phoneNumber: string;
  description?: string;
  imageUrls?: string[];
  estimateWeight: number;
  actualWeight?: number | null;
  pickupAddress: string;
  pickupDate?: string | null;
  warehouseId: string;
  warehouseAddress: string;
  status: string;
  statusText: string;
  deliveryMethod: string;
  createdAt?: string | null;
}
interface CreateDonationResponse {
  message?: string;
  Message?: string;
  requestId?: string;
  RequestId?: string;
}

const MAX_DONATION_IMAGES = 5;
const MAX_DONATION_WEIGHT_KG = 50;

const toLocalDateInputValue = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
const getVietnamNow = () =>
  new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));

const getEarliestPickupDate = () => {
  const date = getVietnamNow();
  return toLocalDateInputValue(date);
};

const getDefaultPickupDate = getEarliestPickupDate;

const getAvailablePickupTimes = (pickupDate: string, windows: PickupWindow[]) => {
  const vietnamNow = getVietnamNow();
  const today = toLocalDateInputValue(vietnamNow);
  const currentMinutes = vietnamNow.getHours() * 60 + vietnamNow.getMinutes();
  const values = new Set<string>();
  windows.forEach((window) => {
    const [startHour, startMinute] = window.startTime.split(':').map(Number);
    const [endHour, endMinute] = window.endTime.split(':').map(Number);
    for (let minute = startHour * 60 + startMinute; minute < endHour * 60 + endMinute; minute += 30) {
      if (pickupDate === today && minute <= currentMinutes) continue;
      values.add(`${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`);
    }
  });
  return [...values].sort().map((value) => ({ value, label: value }));
};

const getDescriptionValue = (description: string | undefined, label: string) => {
  if (!description) {
    return '';
  }

  const line = description
    .split('\n')
    .find((item) => item.toLowerCase().startsWith(label.toLowerCase()));

  return line?.split(':').slice(1).join(':').trim() || '';
};

const mapApiStatusToDonationStatus = (status: string): DonationRequest['status'] => {
  switch (status) {
    case 'Cancelled':
    case 'Reject':
      return 'cancelled';
    case 'Confirmed':
      return 'confirmed';
    case 'SendToClassification':
    case 'Classifying':
      return 'classifying';
    case 'Classified':
    case 'Stored':
      return 'processed';
    default:
      return 'pending';
  }
};

const mapSearchResultToDonationRequest = (
  item: DonorRequestSearchApiResponse,
): DonationRequest => ({
  code: item.code,
  name: item.donorName,
  phone: item.phoneNumber,
  category: getDescriptionValue(item.description, 'Loai quan ao') || 'Khac',
  weight:
    getDescriptionValue(item.description, 'Khoi luong uoc luong') || `${item.estimateWeight} kg`,
  condition: getDescriptionValue(item.description, 'Tinh trang') || 'Dang cap nhat',
  address: item.pickupAddress,
  status: mapApiStatusToDonationStatus(item.status),
  statusText: item.statusText,
  date: (item.createdAt || item.pickupDate || new Date().toISOString()).split('T')[0],
  imageUrls: item.imageUrls,
});
const INITIAL_DONATIONS: DonationRequest[] = [
  {
    code: 'RT-2026-801',
    name: 'Nguyễn Văn An',
    phone: '0901234567',
    category: 'Đồ ấm / Áo khoác',
    weight: '5-10 kg',
    condition: 'Còn tốt, giặt sạch',
    address: '123 Đường Lê Lợi, Quận 1, TP. HCM',
    status: 'distributed',
    statusText: 'Đã phân phối từ thiện (Hà Giang)',
    date: '2026-07-01',
  },
  {
    code: 'RT-2026-802',
    name: 'Lê Thị Bình',
    phone: '0987654321',
    category: 'Quần áo cũ hỗn hợp',
    weight: '10-20 kg',
    condition: 'Cũ rách / Cần tái chế xé sợi',
    address: '456 Đường Nguyễn Trãi, Quận 5, TP. HCM',
    status: 'processed',
    statusText: 'Đang xé sợi tái chế',
    date: '2026-07-02',
  },
  {
    code: 'RT-2026-803',
    name: 'Trần Minh Cường',
    phone: '0912345678',
    category: 'Áo phông / Sơ mi',
    weight: 'Dưới 5 kg',
    condition: 'Hỗn hợp (Tốt & Tái chế)',
    address: '789 Đường CMT8, Quận 3, TP. HCM',
    status: 'pending',
    statusText: 'Đang chờ thu gom',
    date: '2026-07-03',
  },
];

export const Products: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'register' | 'tracker'>('register');
  const [, setDonations] = useState<DonationRequest[]>(INITIAL_DONATIONS);

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [category, setCategory] = useState('mixed');
  const [weight, setWeight] = useState('');
  const [condition, setCondition] = useState('good');
  const [address, setAddress] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState<'StaffPickup' | 'DonorDropOff'>(
    'StaffPickup',
  );
  const [warehouses, setWarehouses] = useState<WarehouseOption[]>([]);
  const [warehouseId, setWarehouseId] = useState('');
  const [dropOffMethod, setDropOffMethod] = useState<'' | 'SelfDelivery' | 'ThirdPartyDelivery'>('');
  const [carrierName, setCarrierName] = useState('');
  const [trackingCode, setTrackingCode] = useState('');
  const [pickupDate, setPickupDate] = useState(getDefaultPickupDate);
  const [pickupLocation, setPickupLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [selectedPickupTime, setSelectedPickupTime] = useState('');
  const [notes, setNotes] = useState('');
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [confirmation, setConfirmation] = useState<DonationConfirmation | null>(null);
  const [submissionError, setSubmissionError] = useState('');
  const submittingDonation = useRef(false);
  const [pickupWindows, setPickupWindows] = useState<PickupWindow[]>([]);
  const [loadingPickupWindows, setLoadingPickupWindows] = useState(false);
  const [availablePickupDates, setAvailablePickupDates] = useState<string[] | undefined>();
  const [loadingPickupDates, setLoadingPickupDates] = useState(false);
  const [warehouseAvailabilityError, setWarehouseAvailabilityError] = useState('');
  const [nearestWarehouse, setNearestWarehouse] = useState<WarehouseOption | null>(null);
  const [loadingNearestWarehouse, setLoadingNearestWarehouse] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => `${getDefaultPickupDate().slice(0, 7)}-01`);
  const availablePickupTimes = useMemo(
    () => getAvailablePickupTimes(pickupDate, pickupWindows),
    [pickupDate, pickupWindows],
  );

  useEffect(() => {
    if (dropOffMethod === 'ThirdPartyDelivery') {
      setPickupWindows([]);
      return;
    }
    apiClient
      .get<unknown, WarehouseOption[]>('/warehouses')
      .then((data) => setWarehouses((data || []).filter((warehouse: any) => warehouse.isActive !== false)))
      .catch(() => toast.error('Không thể tải danh sách kho tiếp nhận.'));
  }, [toast]);

  useEffect(() => {
    let cancelled = false;
    setNearestWarehouse(null);
    setWarehouseAvailabilityError('');
    if (deliveryMethod !== 'StaffPickup' || !pickupLocation) {
      setLoadingNearestWarehouse(false);
      return;
    }
    setLoadingNearestWarehouse(true);
    const params = new URLSearchParams({ latitude: String(pickupLocation.lat), longitude: String(pickupLocation.lon) });
    apiClient.get<unknown, WarehouseOption>(`/donor-requests/nearest-warehouse?${params}`)
      .then((warehouse) => { if (!cancelled) setNearestWarehouse(warehouse); })
      .catch((error: any) => {
        if (!cancelled) setWarehouseAvailabilityError(error?.response?.data?.message || 'Chưa thể xác định kho tiếp nhận. Vui lòng chọn lại địa chỉ.');
      })
      .finally(() => { if (!cancelled) setLoadingNearestWarehouse(false); });
    return () => { cancelled = true; };
  }, [deliveryMethod, pickupLocation]);

  useEffect(() => {
    const hasTarget = deliveryMethod === 'StaffPickup' ? Boolean(pickupLocation) : Boolean(warehouseId);
    if (!pickupDate || !hasTarget) {
      setPickupWindows([]);
      setLoadingPickupWindows(false);
      return;
    }
    const params = new URLSearchParams({ date: pickupDate });
    if (deliveryMethod === 'StaffPickup' && pickupLocation) {
      params.set('latitude', String(pickupLocation.lat));
      params.set('longitude', String(pickupLocation.lon));
    } else {
      params.set('warehouseId', warehouseId);
    }
    let cancelled = false;
    setLoadingPickupWindows(true);
    apiClient.get<unknown, PickupAvailability>(`/donor-requests/pickup-windows?${params}`)
      .then((result) => {
        if (!cancelled) setPickupWindows(result.windows || []);
      })
      .catch(() => {
        if (!cancelled) setPickupWindows([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingPickupWindows(false);
      });
    return () => { cancelled = true; };
  }, [deliveryMethod, dropOffMethod, pickupDate, pickupLocation, warehouseId]);

  useEffect(() => {
    if (dropOffMethod === 'ThirdPartyDelivery') {
      setAvailablePickupDates(undefined);
      setLoadingPickupDates(false);
      return;
    }
    const hasTarget = deliveryMethod === 'StaffPickup' ? Boolean(pickupLocation) : Boolean(warehouseId);
    if (!hasTarget) {
      setAvailablePickupDates(undefined);
      setLoadingPickupDates(false);
      return;
    }
    const params = new URLSearchParams({ month: calendarMonth });
    if (deliveryMethod === 'StaffPickup' && pickupLocation) {
      params.set('latitude', String(pickupLocation.lat));
      params.set('longitude', String(pickupLocation.lon));
    } else {
      params.set('warehouseId', warehouseId);
    }
    let cancelled = false;
    setLoadingPickupDates(true);
    apiClient.get<unknown, string[]>(`/donor-requests/pickup-dates?${params}`)
      .then((dates) => {
        if (cancelled) return;
        const normalizedDates = (dates || []).map((date) => date.slice(0, 10));
        setAvailablePickupDates(normalizedDates);
        if (pickupDate.startsWith(calendarMonth.slice(0, 7)) && !normalizedDates.includes(pickupDate)) {
          setPickupDate(normalizedDates[0] || '');
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAvailablePickupDates([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingPickupDates(false);
      });
    return () => { cancelled = true; };
  }, [calendarMonth, deliveryMethod, dropOffMethod, pickupLocation, warehouseId]);

  useEffect(() => {
    if (!availablePickupTimes.some((option) => option.value === selectedPickupTime)) {
      setSelectedPickupTime('');
    }
  }, [pickupDate, selectedPickupTime, availablePickupTimes]);

  // Tracking states
  const [searchPhone, setSearchPhone] = useState('');
  const [searchResults, setSearchResults] = useState<DonationRequest[] | null>(null);

  const categoryOptions = [
    { value: 'mixed', label: 'Hỗn hợp / Khác' },
    { value: 'outerwear', label: 'Áo khoác / Đồ ấm mùa đông' },
    { value: 'shirts', label: 'Áo thun / Áo sơ mi dệt kim' },
    { value: 'pants', label: 'Quần denim / Quần dài / kaki' },
    { value: 'kids', label: 'Quần áo trẻ em' },
  ];

  const conditionOptions = [
    { value: 'good', label: 'Còn tốt, lành lặn (Dùng làm từ thiện)' },
    { value: 'recycle', label: 'Cũ rách, mục hỏng (Dành để tái chế dệt lại)' },
    { value: 'mixed', label: 'Hỗn hợp (Có cả đồ từ thiện và đồ tái chế)' },
  ];
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files ?? []);
    const imageFiles = selectedFiles.filter((file) => file.type.startsWith('image/'));

    if (imageFiles.length !== selectedFiles.length) {
      toast.error('Chi ho tro tai len file hinh anh.');
    }

    if (imageFiles.length === 0) {
      e.target.value = '';
      return;
    }

    const availableSlots = MAX_DONATION_IMAGES - images.length;
    if (availableSlots <= 0) {
      toast.error(`Chi duoc tai len toi da ${MAX_DONATION_IMAGES} hinh anh.`);
      e.target.value = '';
      return;
    }

    const acceptedFiles = imageFiles.slice(0, availableSlots);
    if (imageFiles.length > availableSlots) {
      toast.info(
        `Chi them ${availableSlots} hinh anh vi gioi han toi da la ${MAX_DONATION_IMAGES} hinh.`,
      );
    }

    setImages((prev) => [
      ...prev,
      ...acceptedFiles.map((file) => ({
        file,
        previewUrl: URL.createObjectURL(file),
      })),
    ]);
    e.target.value = '';
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => {
      const imageToRemove = prev[index];
      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.previewUrl);
      }

      return prev.filter((_, currentIndex) => currentIndex !== index);
    });
  };

  const uploadDonationImages = async (selectedImages: UploadedImage[]): Promise<string[]> => {
    if (selectedImages.length === 0) {
      return [];
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    const bucket = import.meta.env.VITE_SUPABASE_BUCKET || 'donation-images';

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error(
        'Thieu cau hinh Supabase. Vui long them VITE_SUPABASE_URL va VITE_SUPABASE_ANON_KEY.',
      );
    }

    const uploadedUrls = await Promise.all(
      selectedImages.map(async ({ file }) => {
        const extension = file.name.split('.').pop() || 'jpg';
        const filePath = `donations/${Date.now()}-${crypto.randomUUID()}.${extension}`;
        const uploadUrl = `${supabaseUrl}/storage/v1/object/${bucket}/${filePath}`;

        const response = await fetch(uploadUrl, {
          method: 'POST',
          headers: {
            apikey: supabaseAnonKey,
            Authorization: `Bearer ${supabaseAnonKey}`,
            'Content-Type': file.type,
            'x-upsert': 'false',
          },
          body: file,
        });

        if (!response.ok) {
          throw new Error('Khong the tai hinh anh len Supabase.');
        }

        return `${supabaseUrl}/storage/v1/object/public/${bucket}/${filePath}`;
      }),
    );

    return uploadedUrls;
  };

  // Handle donation registration submit
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const estimatedWeight = Number(weight);
    if (estimatedWeight > MAX_DONATION_WEIGHT_KG) {
      toast.error('Mỗi đơn quyên góp nhận tối đa 50 kg. Vui lòng điều chỉnh khối lượng.');
      return;
    }
    if (!Number.isFinite(estimatedWeight) || estimatedWeight <= 0 || !/^\d+(?:\.\d{1,2})?$/.test(weight)) {
      toast.error('Nhập khối lượng lớn hơn 0 kg, tối đa 2 chữ số thập phân.');
      return;
    }
    if (
      !name ||
      !phone ||
      (dropOffMethod !== 'ThirdPartyDelivery' && (!pickupDate || !selectedPickupTime)) ||
      (deliveryMethod === 'StaffPickup' && (!address || !pickupLocation)) ||
      (deliveryMethod === 'DonorDropOff' && (!warehouseId || !dropOffMethod))
    ) {
      toast.error('Vui lòng điền đầy đủ các thông tin bắt buộc (*)!');
      return;
    }

    const targetWarehouse = deliveryMethod === 'StaffPickup'
      ? nearestWarehouse : warehouses.find((warehouse) => warehouse.id === warehouseId);
    if (!targetWarehouse || (deliveryMethod === 'StaffPickup' && loadingNearestWarehouse)) {
      toast.error('Vui lòng chờ xác định kho tiếp nhận hoặc chọn lại địa chỉ.');
      return;
    }
      const selectedCategoryLabel =
        categoryOptions.find((o) => o.value === category)?.label || 'Hỗn hợp';
      const selectedWeightLabel = `${estimatedWeight} kg`;
      const selectedConditionLabel =
        conditionOptions.find((o) => o.value === condition)?.label || 'Còn tốt';

      const payload: CreateDonationPayload = {
        pickupDate: dropOffMethod === 'ThirdPartyDelivery'
          ? null
          : `${pickupDate}T${selectedPickupTime}:00`,
        description: [
          `Nguoi quyen gop: ${name}`,
          `So dien thoai: ${phone}`,
          `Loai quan ao: ${selectedCategoryLabel}`,
          `Khoi luong uoc luong: ${selectedWeightLabel}`,
          `Tinh trang: ${selectedConditionLabel}`,
          deliveryMethod === 'DonorDropOff'
            ? `Cach gui den kho: ${dropOffMethod === 'SelfDelivery' ? 'Tu mang den kho' : 'Gui qua dich vu van chuyen khac'}`
            : '',
          notes.trim() ? `Ghi chu: ${notes.trim()}` : '',
        ]
          .filter(Boolean)
          .join('\n'),
        imageUrls: [],
        estimateWeight: estimatedWeight,
        pickupAddress:
          deliveryMethod === 'DonorDropOff'
            ? warehouses.find((warehouse) => warehouse.id === warehouseId)?.address || ''
            : address,
        pickupLatitude: deliveryMethod === 'StaffPickup' ? pickupLocation!.lat : 0,
        pickupLongitude: deliveryMethod === 'StaffPickup' ? pickupLocation!.lon : 0,
        contactName: name.trim(),
        contactPhoneNumber: phone.trim(),
        deliveryMethod,
        warehouseId: deliveryMethod === 'DonorDropOff' ? warehouseId : undefined,
        dropOffMethod: deliveryMethod === 'DonorDropOff' ? dropOffMethod || undefined : undefined,
        carrierName: dropOffMethod === 'ThirdPartyDelivery' ? carrierName.trim() : undefined,
        trackingCode: dropOffMethod === 'ThirdPartyDelivery' ? trackingCode.trim() : undefined,
      };

      setSubmissionError('');
      setConfirmation({ payload, categoryLabel: selectedCategoryLabel, conditionLabel: selectedConditionLabel,
        warehouse: { ...targetWarehouse }, notes: notes.trim(), images: [...images] });
  };

  const submitConfirmedDonation = async () => {
    if (!confirmation || submittingDonation.current) return;
    submittingDonation.current = true;
    setLoading(true);
    setSubmissionError('');
    try {
      const { payload, categoryLabel, conditionLabel } = confirmation;
      const imageUrls = await uploadDonationImages(confirmation.images);
      const code = `RT-2026-${Math.floor(100 + Math.random() * 900)}`;
      const response = await apiClient.post<unknown, CreateDonationResponse>(
        '/donor-requests',
        { ...payload, imageUrls },
      );

      const newRequest: DonationRequest = {
        code,
        name: payload.contactName,
        phone: payload.contactPhoneNumber,
        category: categoryLabel,
        weight: `${payload.estimateWeight} kg`,
        condition: conditionLabel,
        address: payload.pickupAddress,
        imageUrls,
        status: 'pending',
        statusText:
          payload.deliveryMethod === 'StaffPickup'
            ? 'Chờ điều phối viên liên hệ thu gom'
            : payload.dropOffMethod === 'ThirdPartyDelivery'
              ? 'Chờ đơn vị vận chuyển giao hàng đến kho'
              : 'Chờ người quyên góp mang hàng đến kho',
        date: new Date().toISOString().split('T')[0],
      };

      setDonations((prev) => [newRequest, ...prev]);
      setConfirmation(null);
      // Reset form
      setName('');
      setPhone('');
      setCategory('mixed');
      setWeight('');
      setAddress('');
      setPickupLocation(null);
      setSelectedPickupTime('');
      setDeliveryMethod('StaffPickup');
      setWarehouseId('');
      setDropOffMethod('');
      setCarrierName('');
      setTrackingCode('');
      setPickupDate(getDefaultPickupDate());
      setNotes('');
      images.forEach((image) => URL.revokeObjectURL(image.previewUrl));
      setImages([]);

      toast.success(
        response.message ||
          response.Message ||
          'Dang ky thanh cong! Ma quyen gop cua ban la: ' + code,
      );
      const createdRequestId = response.requestId || response.RequestId;
      navigate(createdRequestId ? `/my-orders?created=${createdRequestId}` : '/my-orders');
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Không thể gửi đơn quyên góp. Vui lòng thử lại.';
      setSubmissionError(message);
      toast.error(message);
    } finally {
      submittingDonation.current = false;
      setLoading(false);
    }
  };

  // Handle tracking search
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchPhone) {
      toast.error('Vui lòng nhập số điện thoại để tra cứu!');
      return;
    }

    setLoading(true);
    try {
      const apiResults = await apiClient.get<unknown, DonorRequestSearchApiResponse[]>(
        '/donor-requests/search',
        {
          params: { phoneNumber: searchPhone.trim() },
        },
      );
      const results = apiResults.map(mapSearchResultToDonationRequest);
      setSearchResults(results);
      if (results.length === 0) {
        toast.info('Không tìm thấy lịch sử quyên góp cho số điện thoại này.');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Tra cứu đơn quyên góp thất bại.');
    } finally {
      setLoading(false);
    }
  };
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'cancelled':
        return <XCircle className="status-icon cancelled" size={20} />;
      case 'pending':
        return <Clock className="status-icon pending" size={20} />;
      case 'confirmed':
        return <CheckCircle className="status-icon confirmed" size={20} />;
      case 'classifying':
        return <ShieldCheck className="status-icon classifying" size={20} />;
      case 'processed':
      case 'distributed':
        return <CheckCircle className="status-icon processed" size={20} />;
      default:
        return <Clock className="status-icon pending" size={20} />;
    }
  };

  return (
    <div className="donation-portal-page container">
      {confirmation && createPortal(
        <Modal isOpen title="Xác nhận thông tin quyên góp" className="donation-confirmation-modal"
          onClose={() => { if (!submittingDonation.current) setConfirmation(null); }}
          footer={<>
            <Button type="button" variant="outline" autoFocus disabled={loading} onClick={() => setConfirmation(null)}>Quay lại chỉnh sửa</Button>
            <Button type="button" isLoading={loading} onClick={() => void submitConfirmedDonation()}>Xác nhận và gửi đơn</Button>
          </>}>
          <p className="donation-confirmation-intro">Vui lòng kiểm tra lại thông tin trước khi gửi yêu cầu quyên góp.</p>
          <dl className="donation-confirmation-details">
            <div><dt>Người quyên góp</dt><dd>{confirmation.payload.contactName}</dd></div>
            <div><dt>Số điện thoại</dt><dd>{confirmation.payload.contactPhoneNumber}</dd></div>
            <div><dt>Loại quần áo</dt><dd>{confirmation.categoryLabel}</dd></div>
            <div><dt>Khối lượng ước tính</dt><dd>{confirmation.payload.estimateWeight} kg</dd></div>
            <div><dt>Tình trạng</dt><dd>{confirmation.conditionLabel}</dd></div>
            <div><dt>Phương thức giao</dt><dd>{confirmation.payload.deliveryMethod === 'StaffPickup' ? 'Nhân viên đến lấy tại địa chỉ của tôi' : confirmation.payload.dropOffMethod === 'SelfDelivery' ? 'Tự mang đến kho' : 'Gửi qua dịch vụ vận chuyển khác'}</dd></div>
            {confirmation.payload.deliveryMethod === 'StaffPickup' && <div><dt>Địa chỉ lấy hàng</dt><dd>{confirmation.payload.pickupAddress}</dd></div>}
            <div><dt>Kho tiếp nhận</dt><dd><strong>{confirmation.warehouse.warehouseName}</strong><br />{confirmation.warehouse.address}</dd></div>
            <div><dt>{confirmation.payload.deliveryMethod === 'StaffPickup' ? 'Ngày, giờ lấy hàng' : 'Ngày, giờ giao đến kho'}</dt><dd>{confirmation.payload.pickupDate
              ? `${confirmation.payload.pickupDate.slice(0, 10).split('-').reverse().join('/')} · ${confirmation.payload.pickupDate.slice(11, 16)}`
              : 'Cập nhật sau khi đặt dịch vụ vận chuyển'}</dd></div>
            {confirmation.notes && <div><dt>Ghi chú</dt><dd>{confirmation.notes}</dd></div>}
          </dl>
          {confirmation.images.length > 0 && <div className="donation-confirmation-images" aria-label="Ảnh quần áo">
            {confirmation.images.map((image, index) => <img key={image.previewUrl} src={image.previewUrl} alt={`Ảnh quần áo ${index + 1}`} />)}
          </div>}
          {submissionError && <p className="donation-confirmation-error" role="alert">{submissionError}</p>}
        </Modal>, document.body)}
      {/* Title Header */}
      <div className="portal-header text-center">
        <span className="section-subtitle">Vì một tương lai xanh</span>
        <h1 className="text-gradient">Cổng Tiếp Nhận Quyên Góp</h1>
        <p className="portal-desc">
          Gửi gắm những bộ quần áo không còn sử dụng để trao đi yêu thương hoặc tái chế để thân thiện với môi trường.
        </p>
      </div>

      {/* Tabs Row */}
      <div className="tabs-navigation flex-center">
        <button
          className={`tab-btn glass ${activeTab === 'register' ? 'active' : ''}`}
          onClick={() => setActiveTab('register')}
        >
          <PlusCircle size={18} style={{ marginRight: '6px' }} />
          Đăng ký quyên góp mới
        </button>
        <button className="tab-btn glass" onClick={() => navigate('/my-orders')}>
          <Search size={18} style={{ marginRight: '6px' }} />
          Đơn của tôi
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content-area">
        {activeTab === 'register' ? (
          <div className="form-card-wrapper flex-center">
            <form onSubmit={handleRegister} className="donation-form glass">
              <h2 className="form-title">Thông tin quyên góp</h2>
              <p className="form-subtitle">
                Điền thông tin và chúng tôi sẽ thu gom tận nơi miễn phí.
              </p>

              <div className="form-row">
                <Input
                  label="Họ tên người quyên góp *"
                  placeholder="Ví dụ: Nguyễn Văn An"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                <Input
                  label="Số điện thoại *"
                  placeholder="Ví dụ: 0901234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  type="tel"
                  name="phoneNumber"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  required
                />
              </div>

              <div className="form-row">
                <Select
                  label="Loại quần áo chính"
                  options={categoryOptions}
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                />
                <Input
                  label="Ước lượng khối lượng (kg) *"
                  type="text"
                  inputMode="decimal"
                  placeholder="Ví dụ: 7.5"
                  pattern="[0-9]+([.][0-9]{1,2})?"
                  helperText="Tối đa 50 kg mỗi đơn, có thể nhập số lẻ."
                  error={weight !== '' && !/^\d+(?:\.\d{1,2})?$/.test(weight)
                    ? 'Nhập khối lượng hợp lệ, tối đa 2 chữ số thập phân.'
                    : weight !== '' && Number(weight) <= 0
                    ? 'Khối lượng phải lớn hơn 0 kg.'
                    : Number(weight) > MAX_DONATION_WEIGHT_KG
                      ? 'Mỗi đơn quyên góp nhận tối đa 50 kg.'
                      : undefined}
                  required
                  value={weight}
                  onChange={(e) => {
                    const next = e.target.value.replace(/,/g, '.');
                    if (/^\d*(?:\.\d{0,2})?$/.test(next)) {
                      setWeight(next);
                    } else {
                      e.currentTarget.value = weight;
                    }
                  }}
                />
              </div>

              <Select
                label="Tình trạng quần áo"
                options={conditionOptions}
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
              />

              <Select
                label="Phương thức giao quần áo *"
                options={[
                  {
                    value: 'StaffPickup',
                    label: 'Nhân viên tiếp nhận đến lấy tại địa chỉ của tôi',
                  },
                  { value: 'DonorDropOff', label: 'Tôi sẽ chủ động gửi quần áo đến kho' },
                ]}
                value={deliveryMethod}
                onChange={(e) => {
                  const method = e.target.value as 'StaffPickup' | 'DonorDropOff';
                  setDeliveryMethod(method);
                  setWarehouseAvailabilityError('');
                  if (method === 'StaffPickup') {
                    setWarehouseId('');
                    setDropOffMethod('');
                    setCarrierName('');
                    setTrackingCode('');
                  }
                  else {
                    setAddress('');
                    setPickupLocation(null);
                  }
                }}
              />
              {deliveryMethod === 'StaffPickup' && warehouseAvailabilityError && (
                <div className="warehouse-availability-warning" role="alert">
                  <XCircle size={19} />
                  <div>
                    <strong>Chưa xác định được kho tiếp nhận</strong>
                    <span>{warehouseAvailabilityError}</span>
                    <button type="button" onClick={() => {
                      setDeliveryMethod('DonorDropOff');
                      setWarehouseAvailabilityError('');
                      setAddress('');
                      setPickupLocation(null);
                    }}>
                      Chuyển sang tự mang đến kho
                    </button>
                  </div>
                </div>
              )}

              {deliveryMethod === 'StaffPickup' ? (
                <>
                <AddressSearchMap
                  value={address}
                  onChange={setAddress}
                  onLocationChange={(location) => {
                    setPickupLocation(location);
                    setWarehouseAvailabilityError('');
                  }}
                  required
                />
                {pickupLocation && (loadingNearestWarehouse || nearestWarehouse) && (
                  <div className="nearest-warehouse-info" role="status" aria-live="polite">
                    {loadingNearestWarehouse ? <span>Đang tìm kho gần nhất...</span> : nearestWarehouse && <>
                      <MapPin size={20} aria-hidden="true" />
                      <div>
                        <span>Kho tiếp nhận gần nhất</span>
                        <strong>{nearestWarehouse.warehouseName}</strong>
                        <p>{nearestWarehouse.address}</p>
                      </div>
                    </>}
                  </div>
                )}
                </>
              ) : (
                <div className="input-wrapper">
                  <label className="input-label" htmlFor="dropoff-warehouse">
                    Kho tiếp nhận *
                  </label>
                  <select
                    id="dropoff-warehouse"
                    className="custom-input"
                    value={warehouseId}
                    onChange={(event) => setWarehouseId(event.target.value)}
                    required
                  >
                    <option value="">Chọn kho bạn sẽ mang quần áo đến</option>
                    {warehouses.map((warehouse) => (
                      <option value={warehouse.id} key={warehouse.id}>
                        {warehouse.warehouseName}
                      </option>
                    ))}
                  </select>
                  {warehouseId && (
                    <small className="selected-warehouse-address">
                      <MapPin size={14} />
                      {warehouses.find((warehouse) => warehouse.id === warehouseId)?.address}
                    </small>
                  )}
                  <label className="input-label" htmlFor="dropoff-method">
                    Cách gửi quần áo đến kho *
                  </label>
                  <select
                    id="dropoff-method"
                    className="custom-input"
                    value={dropOffMethod}
                    onChange={(event) => setDropOffMethod(
                      event.target.value as '' | 'SelfDelivery' | 'ThirdPartyDelivery',
                    )}
                    required
                  >
                    <option value="">Chọn cách bạn sẽ gửi quần áo</option>
                    <option value="SelfDelivery">Tôi sẽ tự mang đến kho</option>
                    <option value="ThirdPartyDelivery">
                      Tôi sẽ gửi qua dịch vụ vận chuyển khác
                    </option>
                  </select>
                  {dropOffMethod === 'ThirdPartyDelivery' && (
                    <div className="third-party-shipping-fields">
                      <small className="input-helper-text">
                        Sau khi tạo đơn và đặt dịch vụ vận chuyển, bạn sẽ cập nhật đơn vị vận chuyển
                        và mã vận đơn cùng thời gian dự kiến đến kho trong mục “Đơn của tôi”.
                      </small>
                    </div>
                  )}
                </div>
              )}

              {dropOffMethod !== 'ThirdPartyDelivery' && <div className="form-row">
                <WorkdayDatePicker
                  label={
                    deliveryMethod === 'StaffPickup'
                      ? 'Ngày lấy hàng *'
                      : 'Ngày dự kiến mang đến kho'
                  }
                  value={pickupDate}
                  min={getEarliestPickupDate()}
                  onChange={setPickupDate}
                  availableDates={availablePickupDates}
                  availabilityLoading={loadingPickupDates}
                  onMonthChange={(month) => setCalendarMonth(toLocalDateInputValue(new Date(month.getFullYear(), month.getMonth(), 1)))}
                  footer="Chọn ngày có ca tiếp nhận tại kho. Cuối tuần vẫn khả dụng nếu kho có ca."
                  required
                />
                <div className="input-wrapper">
                  <label className="input-label" htmlFor="pickup-time">
                    Giờ tiếp nhận *
                  </label>
                  <select
                    id="pickup-time"
                    className="custom-input"
                    value={selectedPickupTime}
                    onChange={(event) => setSelectedPickupTime(event.target.value)}
                    disabled={loadingPickupWindows || availablePickupTimes.length === 0}
                    required
                  >
                    <option value="">Chọn giờ tiếp nhận</option>
                    {availablePickupTimes.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <small className="input-helper-text">
                    {loadingPickupWindows
                      ? 'Đang kiểm tra ca làm việc của kho...'
                      : availablePickupTimes.length > 0
                        ? `Các giờ khả dụng theo ${pickupWindows.length} ca làm việc của kho.`
                        : 'Ngày này không có ca tiếp nhận còn khả dụng tại kho'}
                  </small>
                </div>
              </div>}

              <div className="input-wrapper">
                <label className="input-label">Ghi chú thêm (không bắt buộc)</label>
                <textarea
                  className="custom-textarea"
                  placeholder="Ví dụ: Đồ đông gói trong 2 thùng giấy, chỉ rảnh lấy vào ngày cuối tuần..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="input-wrapper">
                <label className="input-label">Hình ảnh quần áo (tối đa 5 hình)</label>
                <label className="image-upload-box" htmlFor="donation-images">
                  <ImagePlus size={24} />
                  <span>Chọn hình ảnh</span>
                  <small>
                    {images.length}/{MAX_DONATION_IMAGES} hình đã chọn
                  </small>
                </label>
                <input
                  id="donation-images"
                  className="image-upload-input"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  disabled={images.length >= MAX_DONATION_IMAGES}
                />

                {images.length > 0 && (
                  <div className="image-preview-grid">
                    {images.map((image, index) => (
                      <div className="image-preview-item" key={image.previewUrl}>
                        <img src={image.previewUrl} alt={`Hinh quan ao ${index + 1}`} />
                        <button
                          type="button"
                          className="remove-image-btn"
                          onClick={() => handleRemoveImage(index)}
                          aria-label="Xoa hinh anh"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Button
                type="submit"
                isLoading={loading}
                className="submit-donation-btn"
              >
                Xác nhận Quyên góp <ArrowRight size={18} style={{ marginLeft: '6px' }} />
              </Button>
            </form>
          </div>
        ) : (
          <div className="tracker-card-wrapper flex-center">
            <div className="tracker-box glass">
              <h2 className="tracker-title">Tra cứu lịch trình quyên góp</h2>
              <p className="tracker-subtitle">
                Nhập số điện thoại đăng ký của bạn để xem quy trình phân loại quần áo.
              </p>

              <form onSubmit={handleSearch} className="tracker-search-form flex-center">
                <Input
                  placeholder="Nhập số điện thoại (ví dụ: 0901234567)"
                  value={searchPhone}
                  onChange={(e) => setSearchPhone(e.target.value)}
                  icon={<Search size={18} />}
                  className="tracker-input"
                />
                <Button type="submit" variant="primary" isLoading={loading}>
                  Tìm kiếm
                </Button>
              </form>

              {searchResults !== null && (
                <div className="search-results-section">
                  <h3>Kết quả tra cứu ({searchResults.length})</h3>
                  {searchResults.length === 0 ? (
                    <div className="empty-results flex-center text-center">
                      <p>
                        Không tìm thấy lịch sử quyên góp cho số điện thoại này. Hãy chắc chắn bạn đã
                        nhập đúng số điện thoại đăng ký quyên góp.
                      </p>
                    </div>
                  ) : (
                    <div className="results-list">
                      {searchResults.map((item) => (
                        <div key={item.code} className="result-item glass">
                          <div className="result-header flex-center">
                            <span className="result-code">{item.code}</span>
                            <span className="result-date">{item.date}</span>
                          </div>

                          <div className="result-body">
                            <div className="info-grid">
                              <div>
                                <strong>Người gửi:</strong> {item.name}
                              </div>
                              <div>
                                <strong>Loại đồ:</strong> {item.category}
                              </div>
                              <div>
                                <strong>Khối lượng:</strong> {item.weight}
                              </div>
                              <div>
                                <strong>Tình trạng:</strong> {item.condition}
                              </div>
                            </div>

                            {item.imageUrls && item.imageUrls.length > 0 && (
                              <div className="result-images-section">
                                <span className="result-images-title">Hình ảnh quần áo</span>
                                <div className="result-images-grid">
                                  {item.imageUrls.map((imageUrl, index) => (
                                    <a
                                      href={imageUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="result-image-link"
                                      key={`${item.code}-${imageUrl}`}
                                    >
                                      <img
                                        src={imageUrl}
                                        alt={`Hinh anh don ${item.code} ${index + 1}`}
                                        loading="lazy"
                                      />
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div className="tracking-timeline-wrapper">
                              <span className="timeline-title">Hành trình Xử lý & Phân loại:</span>
                              <div className="timeline-steps">
                                <div
                                  className={`timeline-step ${item.status !== 'pending' ? 'active' : ''}`}
                                >
                                  {getStatusIcon(item.status)}
                                  <span className="step-label">{item.statusText}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;
