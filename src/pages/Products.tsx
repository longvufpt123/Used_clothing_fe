import React, { useEffect, useState } from 'react';
import { Search, PlusCircle, Clock, ShieldCheck, ArrowRight, ImagePlus, X, XCircle, CheckCircle } from 'lucide-react';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { Button } from '@/components/common/Button';
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

interface WarehouseOption {
  id: string;
  address: string;
}

interface CreateDonationPayload {
  pickupDate: string;
  description: string;
  imageUrls: string[];
  estimateWeight: number;
  pickupAddress: string;
  warehouseId: string;
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
  createdAt?: string | null;
}
interface CreateDonationResponse {
  message?: string;
  Message?: string;
}

const MAX_DONATION_IMAGES = 5;
const DEFAULT_PICKUP_OFFSET_DAYS = 1;

const getDefaultPickupDate = () => {
  const date = new Date();
  date.setDate(date.getDate() + DEFAULT_PICKUP_OFFSET_DAYS);
  return date.toISOString().split('T')[0];
};

const estimateWeightByOption: Record<string, number> = {
  'under-5': 3,
  '5-10': 7.5,
  '10-20': 15,
  'over-20': 25,
};


const getDescriptionValue = (description: string | undefined, label: string) => {
  if (!description) {
    return '';
  }

  const line = description
    .split('\n')
    .find(item => item.toLowerCase().startsWith(label.toLowerCase()));

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

const mapSearchResultToDonationRequest = (item: DonorRequestSearchApiResponse): DonationRequest => ({
  code: item.code,
  name: item.donorName,
  phone: item.phoneNumber,
  category: getDescriptionValue(item.description, 'Loai quan ao') || 'Khac',
  weight: getDescriptionValue(item.description, 'Khoi luong uoc luong') || `${item.estimateWeight} kg`,
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
  const toast = useToast();
  const showToastError = toast.error;
  const [activeTab, setActiveTab] = useState<'register' | 'tracker'>('register');
  const [donations, setDonations] = useState<DonationRequest[]>(INITIAL_DONATIONS);

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [category, setCategory] = useState('outerwear');
  const [weight, setWeight] = useState('5-10');
  const [condition, setCondition] = useState('good');
  const [address, setAddress] = useState('');
  const [pickupDate, setPickupDate] = useState(getDefaultPickupDate);
  const [warehouseId, setWarehouseId] = useState('');
  const [notes, setNotes] = useState('');
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseOption[]>([]);
  const [warehouseLoading, setWarehouseLoading] = useState(false);
  const [loading, setLoading] = useState(false);

  // Tracking states
  const [searchPhone, setSearchPhone] = useState('');
  const [searchResults, setSearchResults] = useState<DonationRequest[] | null>(null);

  const categoryOptions = [
    { value: 'outerwear', label: 'Áo khoác / Đồ ấm mùa đông' },
    { value: 'shirts', label: 'Áo thun / Áo sơ mi dệt kim' },
    { value: 'pants', label: 'Quần denim / Quần dài / kaki' },
    { value: 'kids', label: 'Quần áo trẻ em' },
    { value: 'mixed', label: 'Hỗn hợp / Khác' },
  ];

  const weightOptions = [
    { value: 'under-5', label: 'Dưới 5 kg (Túi nhỏ)' },
    { value: '5-10', label: 'Từ 5 - 10 kg (Thùng giấy vừa)' },
    { value: '10-20', label: 'Từ 10 - 20 kg (Bao tải lớn)' },
    { value: 'over-20', label: 'Trên 20 kg (Nhiều bao tải)' },
  ];

  const conditionOptions = [
    { value: 'good', label: 'Còn tốt, lành lặn (Dùng làm từ thiện)' },
    { value: 'recycle', label: 'Cũ rách, mục hỏng (Dành để tái chế dệt lại)' },
    { value: 'mixed', label: 'Hỗn hợp (Có cả đồ từ thiện và đồ tái chế)' },
  ];
  const warehouseOptions = warehouses.map(warehouse => ({
    value: warehouse.id,
    label: warehouse.address,
  }));

  useEffect(() => {
    let isMounted = true;

    const loadWarehouses = async () => {
      setWarehouseLoading(true);
      try {
        const data = await apiClient.get<unknown, WarehouseOption[]>('/warehouses');
        if (!isMounted) {
          return;
        }

        setWarehouses(data);
        setWarehouseId(prev => prev || data[0]?.id || '');
      } catch {
        if (isMounted) {
          showToastError('Khong the tai danh sach kho nhan hang.');
        }
      } finally {
        if (isMounted) {
          setWarehouseLoading(false);
        }
      }
    };

    loadWarehouses();

    return () => {
      isMounted = false;
    };
  }, [showToastError]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files ?? []);
    const imageFiles = selectedFiles.filter(file => file.type.startsWith('image/'));

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
      toast.info(`Chi them ${availableSlots} hinh anh vi gioi han toi da la ${MAX_DONATION_IMAGES} hinh.`);
    }

    setImages(prev => [
      ...prev,
      ...acceptedFiles.map(file => ({
        file,
        previewUrl: URL.createObjectURL(file),
      })),
    ]);
    e.target.value = '';
  };

  const handleRemoveImage = (index: number) => {
    setImages(prev => {
      const imageToRemove = prev[index];
      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.previewUrl);
      }

      return prev.filter((_, currentIndex) => currentIndex !== index);
    });
  };

  const uploadDonationImages = async (): Promise<string[]> => {
    if (images.length === 0) {
      return [];
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    const bucket = import.meta.env.VITE_SUPABASE_BUCKET || 'donation-images';

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Thieu cau hinh Supabase. Vui long them VITE_SUPABASE_URL va VITE_SUPABASE_ANON_KEY.');
    }

    const uploadedUrls = await Promise.all(
      images.map(async ({ file }) => {
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
    if (!name || !phone || !address || !pickupDate || !warehouseId) {
      toast.error('Vui lòng điền đầy đủ các thông tin bắt buộc (*)!');
      return;
    }

    setLoading(true);

    try {
      const imageUrls = await uploadDonationImages();
      const code = `RT-2026-${Math.floor(100 + Math.random() * 900)}`;
      const selectedCategoryLabel = categoryOptions.find(o => o.value === category)?.label || 'Hỗn hợp';
      const selectedWeightLabel = weightOptions.find(o => o.value === weight)?.label || 'Dưới 5 kg';
      const selectedConditionLabel = conditionOptions.find(o => o.value === condition)?.label || 'Còn tốt';

      const payload: CreateDonationPayload = {
        pickupDate: new Date(`${pickupDate}T00:00:00`).toISOString(),
        description: [
          `Nguoi quyen gop: ${name}`,
          `So dien thoai: ${phone}`,
          `Loai quan ao: ${selectedCategoryLabel}`,
          `Khoi luong uoc luong: ${selectedWeightLabel}`,
          `Tinh trang: ${selectedConditionLabel}`,
          notes.trim() ? `Ghi chu: ${notes.trim()}` : '',
        ].filter(Boolean).join('\n'),
        imageUrls,
        estimateWeight: estimateWeightByOption[weight] ?? 0,
        pickupAddress: address,
        warehouseId,
      };

      const response = await apiClient.post<unknown, CreateDonationResponse>('/donor-requests', payload);

      const newRequest: DonationRequest = {
        code,
        name,
        phone,
        category: selectedCategoryLabel,
        weight: selectedWeightLabel,
        condition: selectedConditionLabel,
        address: payload.pickupAddress,
        imageUrls,
        status: 'pending',
        statusText: 'Chờ điều phối viên liên hệ thu gom',
        date: new Date().toISOString().split('T')[0],
      };

      setDonations(prev => [newRequest, ...prev]);
      setLoading(false);
      // Reset form
      setName('');
      setPhone('');
      setAddress('');
      setPickupDate(getDefaultPickupDate());
      setNotes('');
      images.forEach(image => URL.revokeObjectURL(image.previewUrl));
      setImages([]);
      
      // Switch tab to tracker and automatically search
      setActiveTab('tracker');
      setSearchPhone(phone);
      setSearchResults([newRequest, ...donations.filter(d => d.phone === phone)]);
      toast.success(response.message || response.Message || 'Dang ky thanh cong! Ma quyen gop cua ban la: ' + code);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Dang ky quyen gop that bai.');
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
      const apiResults = await apiClient.get<unknown, DonorRequestSearchApiResponse[]>('/donor-requests/search', {
        params: { phoneNumber: searchPhone.trim() },
      });
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
      case 'cancelled': return <XCircle className="status-icon cancelled" size={20} />;
      case 'pending': return <Clock className="status-icon pending" size={20} />;
      case 'confirmed': return <CheckCircle className="status-icon confirmed" size={20} />;
      case 'classifying': return <ShieldCheck className="status-icon classifying" size={20} />;
      case 'processed':
      case 'distributed': return <CheckCircle className="status-icon processed" size={20} />;
      default: return <Clock className="status-icon pending" size={20} />;
    }
  };

  return (
    <div className="donation-portal-page container">
      {/* Title Header */}
      <div className="portal-header text-center">
        <span className="section-subtitle">Vì một tương lai xanh</span>
        <h1 className="text-gradient">Cổng Tiếp Nhận Quyên Góp</h1>
        <p className="portal-desc">
          Gửi gắm những bộ quần áo không còn sử dụng để trao đi yêu thương hoặc tái chế thành sợi sinh học dệt may thân thiện với môi trường.
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
        <button
          className={`tab-btn glass ${activeTab === 'tracker' ? 'active' : ''}`}
          onClick={() => setActiveTab('tracker')}
        >
          <Search size={18} style={{ marginRight: '6px' }} />
          Tra cứu & Theo dõi đơn
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content-area">
        {activeTab === 'register' ? (
          <div className="form-card-wrapper flex-center">
            <form onSubmit={handleRegister} className="donation-form glass">
              <h2 className="form-title">Thông tin quyên góp</h2>
              <p className="form-subtitle">Điền thông tin và chúng tôi sẽ thu gom tận nơi miễn phí.</p>
              
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
                <Select
                  label="Ước lượng khối lượng"
                  options={weightOptions}
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                />
              </div>

              <Select
                label="Tình trạng quần áo cũ"
                options={conditionOptions}
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
              />

              <Input
                label="Địa chỉ lấy hàng *"
                placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
              />

              <div className="form-row">
                <Input
                  label="Ngay lay hang *"
                  type="date"
                  value={pickupDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setPickupDate(e.target.value)}
                  required
                />
                <Select
                  label="Kho tiep nhan *"
                  options={warehouseOptions.length > 0 ? warehouseOptions : [{ value: '', label: warehouseLoading ? 'Dang tai danh sach kho...' : 'Khong co kho tiep nhan' }]}
                  value={warehouseId}
                  onChange={(e) => setWarehouseId(e.target.value)}
                  disabled={warehouseLoading || warehouseOptions.length === 0}
                  required
                />
              </div>

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
                  <small>{images.length}/{MAX_DONATION_IMAGES} hình đã chọn</small>
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

              <Button type="submit" isLoading={loading} className="submit-donation-btn" disabled={warehouseLoading || warehouseOptions.length === 0}>
                Xác nhận Quyên góp <ArrowRight size={18} style={{ marginLeft: '6px' }} />
              </Button>
            </form>
          </div>
        ) : (
          <div className="tracker-card-wrapper flex-center">
            <div className="tracker-box glass">
              <h2 className="tracker-title">Tra cứu lịch trình quyên góp</h2>
              <p className="tracker-subtitle">Nhập số điện thoại đăng ký của bạn để xem quy trình phân loại quần áo.</p>
              
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
                      <p>Không tìm thấy lịch sử quyên góp cho số điện thoại này. Hãy chắc chắn bạn đã nhập đúng số điện thoại đăng ký quyên góp.</p>
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
                              <div><strong>Người gửi:</strong> {item.name}</div>
                              <div><strong>Loại đồ:</strong> {item.category}</div>
                              <div><strong>Khối lượng:</strong> {item.weight}</div>
                              <div><strong>Tình trạng:</strong> {item.condition}</div>
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
                                      <img src={imageUrl} alt={`Hinh anh don ${item.code} ${index + 1}`} loading="lazy" />
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div className="tracking-timeline-wrapper">
                              <span className="timeline-title">Hành trình Xử lý & Phân loại:</span>
                              <div className="timeline-steps">
                                <div className={`timeline-step ${item.status !== 'pending' ? 'active' : ''}`}>
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
