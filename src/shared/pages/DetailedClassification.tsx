import React, { useState } from 'react';
import AdminLayout from '@/shared/layouts/AdminLayout';
import { Select } from '@/components/common/Select';
import { Button } from '@/components/common/Button';
import { useToast } from '@/context/ToastContext';
import { Scan, Plus, Minus, Printer, CheckCircle, RefreshCw, Heart } from 'lucide-react';
import './DetailedClassification.css';

interface PackageToClassify {
  code: string;
  donorName: string;
  weight: string;
  estCategory: string;
  status: 'pending' | 'completed';
}

const PENDING_PACKAGES: PackageToClassify[] = [
  { code: 'RT-2026-804', donorName: 'Trần Văn Hoàng', weight: '12 kg', estCategory: 'Áo khoác gió & Đồ nỉ', status: 'pending' },
  { code: 'RT-2026-807', donorName: 'Hoàng Thị Dung', weight: '7 kg', estCategory: 'Đồ trẻ em tổng hợp', status: 'pending' },
  { code: 'RT-2026-808', donorName: 'Lê Minh Quân', weight: '18 kg', estCategory: 'Quần áo kaki dệt', status: 'pending' },
];

export const DetailedClassification: React.FC = () => {
  const toast = useToast();
  const [packages, setPackages] = useState<PackageToClassify[]>(PENDING_PACKAGES);
  const [selectedCode, setSelectedCode] = useState(packages[0]?.code || '');
  const [isScanning, setIsScanning] = useState(false);
  const [scannedPackage, setScannedPackage] = useState<PackageToClassify | null>(null);

  // Sorting counters state
  const [charityJackets, setCharityJackets] = useState(0);
  const [charityTshirts, setCharityTshirts] = useState(0);
  const [charityPants, setCharityPants] = useState(0);
  const [recycleScrapsWeight, setRecycleScrapsWeight] = useState(0); // kg
  
  const [printPreview, setPrintPreview] = useState<{
    code: string;
    charityPacks: string;
    recyclePacks: string;
    date: string;
  } | null>(null);

  const selectedPkg = packages.find((p) => p.code === selectedCode);

  const handleScan = () => {
    if (!selectedCode) return;
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setScannedPackage(selectedPkg || null);
      // Reset counters
      setCharityJackets(0);
      setCharityTshirts(0);
      setCharityPants(0);
      setRecycleScrapsWeight(0);
      setPrintPreview(null);
      toast.success(`Đã quét mã đơn hàng: ${selectedCode} thành công!`);
    }, 1500);
  };

  const handleConfirmClassification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scannedPackage) return;

    if (charityJackets === 0 && charityTshirts === 0 && charityPants === 0 && recycleScrapsWeight === 0) {
      toast.error('Vui lòng phân loại ít nhất 1 mặt hàng dệt may!');
      return;
    }

    toast.success('Xác nhận phân loại thành công! Nhãn dán kho dệt đã được sinh ra.');
    
    // Generate label preview
    setPrintPreview({
      code: scannedPackage.code,
      charityPacks: `Từ thiện: ${charityJackets} áo khoác, ${charityTshirts} áo phông, ${charityPants} quần dài`,
      recyclePacks: `Tái chế: ${recycleScrapsWeight} kg xơ sợi dệt lại`,
      date: new Date().toISOString().split('T')[0],
    });

    // Remove from pending list
    setPackages((prev) => prev.filter((p) => p.code !== scannedPackage.code));
    setScannedPackage(null);
    if (packages.length > 1) {
      const nextPkg = packages.filter((p) => p.code !== scannedPackage.code)[0];
      setSelectedCode(nextPkg?.code || '');
    } else {
      setSelectedCode('');
    }
  };

  return (
    <AdminLayout role="staff">
      <div className="classification-page">
        <div className="admin-page-header">
          <h2 className="dashboard-title">Phân loại chi tiết kiện hàng</h2>
          <p className="dashboard-subtitle">Thực hiện mở kiện, kiểm đếm số lượng chi tiết và chia tách thành kiện từ thiện hoặc thùng xé sợi tái chế dệt may.</p>
        </div>

        <div className="classification-grid">
          {/* Left panel: Scanner and selector */}
          <div className="scanner-section glass">
            <h3>Trạm quét & mở kiện</h3>
            <p className="scanner-desc">Chọn mã kiện hàng thu gom được để tiến hành mở kiện phân loại.</p>

            {packages.length > 0 ? (
              <div className="scanner-controller">
                <Select
                  label="Kiện hàng đang ở trạm phân loại"
                  options={packages.map((p) => ({
                    value: p.code,
                    label: `${p.code} - ${p.donorName} (${p.weight})`,
                  }))}
                  value={selectedCode}
                  onChange={(e) => setSelectedCode(e.target.value)}
                />
                
                <Button 
                  onClick={handleScan} 
                  isLoading={isScanning} 
                  className="scan-btn"
                  variant="primary"
                >
                  <Scan size={18} style={{ marginRight: '6px' }} />
                  Quét mã đơn & Mở kiện
                </Button>
              </div>
            ) : (
              <div className="all-cleared-box text-center">
                <CheckCircle size={40} className="text-gradient" />
                <h4>Hoàn thành phân loại!</h4>
                <p>Mọi kiện hàng quyên góp trong ngày hôm nay đã được xử lý phân loại sạch sẽ.</p>
              </div>
            )}

            {/* Scanned Package Details Card */}
            {scannedPackage && (
              <div className="scanned-info-card">
                <h4>Chi tiết kiện đang mở: {scannedPackage.code}</h4>
                <div className="info-row">
                  <div><strong>Người gửi:</strong> {scannedPackage.donorName}</div>
                  <div><strong>Khối lượng:</strong> {scannedPackage.weight}</div>
                </div>
                <div className="info-row">
                  <div><strong>Mô tả của người dân:</strong> {scannedPackage.estCategory}</div>
                </div>
              </div>
            )}
          </div>

          {/* Center panel: Counting workspace */}
          <div className="sorting-workspace-section glass">
            <h3>Không gian phân loại chi tiết</h3>
            <p className="sorting-desc">Nhập số lượng thực tế kiểm đếm được.</p>

            {scannedPackage ? (
              <form onSubmit={handleConfirmClassification} className="sorting-form">
                {/* Branch 1: Charity Clothes count */}
                <div className="sorting-group">
                  <h4 className="branch-title text-success">
                    <Heart size={16} style={{ marginRight: '6px' }} />
                    Quần áo Từ thiện (Còn tốt - Đưa đi giặt hấp)
                  </h4>
                  
                  <div className="counter-item">
                    <span>Áo khoác / Đồ ấm:</span>
                    <div className="counter-controls">
                      <button type="button" onClick={() => setCharityJackets(v => Math.max(0, v - 1))}>
                        <Minus size={14} />
                      </button>
                      <span className="counter-value">{charityJackets}</span>
                      <button type="button" onClick={() => setCharityJackets(v => v + 1)}>
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="counter-item">
                    <span>Áo thun / Áo sơ mi:</span>
                    <div className="counter-controls">
                      <button type="button" onClick={() => setCharityTshirts(v => Math.max(0, v - 1))}>
                        <Minus size={14} />
                      </button>
                      <span className="counter-value">{charityTshirts}</span>
                      <button type="button" onClick={() => setCharityTshirts(v => v + 1)}>
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="counter-item">
                    <span>Quần denim / Quần kaki:</span>
                    <div className="counter-controls">
                      <button type="button" onClick={() => setCharityPants(v => Math.max(0, v - 1))}>
                        <Minus size={14} />
                      </button>
                      <span className="counter-value">{charityPants}</span>
                      <button type="button" onClick={() => setCharityPants(v => v + 1)}>
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Branch 2: Recycling cotton weight */}
                <div className="sorting-group">
                  <h4 className="branch-title text-info">
                    <RefreshCw size={16} style={{ marginRight: '6px' }} />
                    Quần áo cũ nát (Để Tái chế xé sợi)
                  </h4>
                  
                  <div className="counter-item">
                    <span>Khối lượng sợi cotton kaki thu hồi (kg):</span>
                    <div className="counter-controls">
                      <button type="button" onClick={() => setRecycleScrapsWeight(v => Math.max(0, v - 1))}>
                        <Minus size={14} />
                      </button>
                      <span className="counter-value">{recycleScrapsWeight} kg</span>
                      <button type="button" onClick={() => setRecycleScrapsWeight(v => v + 1)}>
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                </div>

                <Button type="submit" className="confirm-btn">
                  Xác nhận & In tem phân phối
                </Button>
              </form>
            ) : (
              <div className="workspace-empty flex-center">
                Vui lòng quét mã đơn ở cột bên trái để bắt đầu không gian phân loại.
              </div>
            )}
          </div>

          {/* Right panel: Printer Preview */}
          <div className="printer-section glass">
            <h3>Xem trước tem mã vạch kho</h3>
            <p className="printer-desc">Mã vạch sinh ra tự động dán lên thùng hàng phân loại để chuyển sang kho giặt khử khuẩn hoặc nhà máy dệt.</p>

            {printPreview ? (
              <div className="label-preview-card">
                <div className="label-header">
                  <div className="bar-code-title">Tem kho ReThreads</div>
                  <span className="label-code">{printPreview.code}</span>
                </div>
                
                {/* Simulated barcode */}
                <div className="barcode-sim">
                  <div className="barcode-lines"></div>
                  <span className="barcode-code-text">{printPreview.code}-CLS</span>
                </div>

                <div className="label-body">
                  <div className="label-stat">
                    <strong>Đồ quyên góp từ thiện:</strong>
                    <p>{printPreview.charityPacks}</p>
                  </div>
                  <div className="label-stat">
                    <strong>Vải dệt tái chế:</strong>
                    <p>{printPreview.recyclePacks}</p>
                  </div>
                  <div className="label-date">Ngày tạo: {printPreview.date}</div>
                </div>

                <Button variant="secondary" className="print-action-btn" onClick={() => toast.success('Đang gửi lệnh tới máy in tem...')}>
                  <Printer size={16} style={{ marginRight: '6px' }} />
                  In Nhãn Kho
                </Button>
              </div>
            ) : (
              <div className="printer-empty flex-center">
                Nhãn dán kho dệt sẽ tự động hiển thị ở đây sau khi bạn xác nhận phân loại thành công.
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default DetailedClassification;
