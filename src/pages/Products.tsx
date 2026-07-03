import React, { useState } from 'react';
import { Leaf, Search, PlusCircle, Clock, Truck, ShieldCheck, Heart, ArrowRight } from 'lucide-react';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { Button } from '@/components/common/Button';
import { useToast } from '@/context/ToastContext';
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
  status: 'pending' | 'collected' | 'classifying' | 'processed' | 'distributed';
  statusText: string;
  date: string;
}

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
  const [activeTab, setActiveTab] = useState<'register' | 'tracker'>('register');
  const [donations, setDonations] = useState<DonationRequest[]>(INITIAL_DONATIONS);

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [category, setCategory] = useState('outerwear');
  const [weight, setWeight] = useState('5-10');
  const [condition, setCondition] = useState('good');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  // Tracking states
  const [searchPhone, setSearchPhone] = useState('');
  const [searchResults, setSearchResults] = useState<DonationRequest[] | null>(null);

  const categoryOptions = [
    { value: 'outerwear', label: 'Áo khoác / Đồ ấm mùa đông' },
    { value: 'shirts', label: 'Áo thun / Áo sơ mi dệt kim' },
    { value: 'pants', label: 'Quần jeans / Quần dài / Kaki' },
    { value: 'kids', label: 'Quần áo trẻ em' },
    { value: 'mixed', label: 'Hỗn hợp / Khác' },
  ];

  const weightOptions = [
    { value: 'under-5', label: 'Dưới 5 kg (Túi nhỏ)' },
    { value: '5-10', label: 'Từ 5 - 10 kg (Thùng carton vừa)' },
    { value: '10-20', label: 'Từ 10 - 20 kg (Bao tải lớn)' },
    { value: 'over-20', label: 'Trên 20 kg (Nhiều bao tải)' },
  ];

  const conditionOptions = [
    { value: 'good', label: 'Còn tốt, lành lặn (Dùng làm từ thiện)' },
    { value: 'recycle', label: 'Cũ rách, mục hỏng (Dành để tái chế dệt lại)' },
    { value: 'mixed', label: 'Hỗn hợp (Có cả đồ từ thiện và đồ tái chế)' },
  ];

  // Handle donation registration submit
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !address) {
      toast.error('Vui lòng điền đầy đủ các thông tin bắt buộc (*)!');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const code = `RT-2026-${Math.floor(100 + Math.random() * 900)}`;
      const selectedCategoryLabel = categoryOptions.find(o => o.value === category)?.label || 'Hỗn hợp';
      const selectedWeightLabel = weightOptions.find(o => o.value === weight)?.label || 'Dưới 5 kg';
      const selectedConditionLabel = conditionOptions.find(o => o.value === condition)?.label || 'Còn tốt';

      const newRequest: DonationRequest = {
        code,
        name,
        phone,
        category: selectedCategoryLabel,
        weight: selectedWeightLabel,
        condition: selectedConditionLabel,
        address,
        status: 'pending',
        statusText: 'Chờ điều phối viên liên hệ thu gom',
        date: new Date().toISOString().split('T')[0],
      };

      setDonations(prev => [newRequest, ...prev]);
      setLoading(false);
      toast.success(`Đăng ký thành công! Mã quyên góp của bạn là: ${code}`);
      
      // Reset form
      setName('');
      setPhone('');
      setAddress('');
      setNotes('');
      
      // Switch tab to tracker and automatically search
      setActiveTab('tracker');
      setSearchPhone(phone);
      setSearchResults([newRequest, ...donations.filter(d => d.phone === phone)]);
    }, 1500);
  };

  // Handle tracking search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchPhone) {
      toast.error('Vui lòng nhập số điện thoại để tra cứu!');
      return;
    }
    const results = donations.filter(d => d.phone.trim() === searchPhone.trim());
    setSearchResults(results);
    if (results.length === 0) {
      toast.info('Không tìm thấy lịch sử quyên góp cho số điện thoại này.');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="status-icon pending" size={20} />;
      case 'collected': return <Truck className="status-icon collected" size={20} />;
      case 'classifying': return <ShieldCheck className="status-icon classifying" size={20} />;
      case 'processed': return <Leaf className="status-icon processed" size={20} />;
      case 'distributed': return <Heart className="status-icon distributed" size={20} />;
      default: return <Clock className="status-icon" size={20} />;
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
                  onChange={(e) => setPhone(e.target.value)}
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

              <div className="input-wrapper">
                <label className="input-label">Ghi chú thêm (không bắt buộc)</label>
                <textarea
                  className="custom-textarea"
                  placeholder="Ví dụ: Đồ đông gói trong 2 thùng carton, chỉ rảnh lấy vào ngày cuối tuần..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <Button type="submit" isLoading={loading} className="submit-donation-btn">
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
                <Button type="submit" variant="primary">
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
