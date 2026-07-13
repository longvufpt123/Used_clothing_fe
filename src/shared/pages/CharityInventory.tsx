import React, { useState } from 'react';
import AdminLayout from '@/shared/layouts/AdminLayout';
import Table from '@/components/common/Table';
import Badge from '@/components/common/Badge';
import { useToast } from '@/context/ToastContext';
import { Send, Inbox } from 'lucide-react';
import './CharityInventory.css';

interface StockItem {
  id: number;
  name: string;
  category: 'Outerwear' | 'Pants' | 'Shirts' | 'Mixed';
  ageGroup: string;
  quantity: number;
  status: 'good' | 'low' | 'empty';
}

interface DistributionCampaign {
  id: number;
  campaignName: string;
  destination: string;
  neededItems: { itemType: string; qty: number; currentStockId: number }[];
  status: 'pending' | 'shipped';
}

const INITIAL_STOCK: StockItem[] = [
  { id: 1, name: 'Áo khoác ấm dày Trẻ em Nam', category: 'Outerwear', ageGroup: '6-10 tuổi', quantity: 45, status: 'good' },
  { id: 2, name: 'Áo phao mùa đông Trẻ em Nữ', category: 'Outerwear', ageGroup: '11-15 tuổi', quantity: 8, status: 'low' },
  { id: 3, name: 'Quần dài kaki Người lớn Nam', category: 'Pants', ageGroup: 'Người lớn', quantity: 120, status: 'good' },
  { id: 4, name: 'Áo sơ mi/Áo thun trẻ em', category: 'Shirts', ageGroup: '3-5 tuổi', quantity: 0, status: 'empty' },
];

const INITIAL_CAMPAIGNS: DistributionCampaign[] = [
  {
    id: 1,
    campaignName: 'Áo ấm mùa đông - Hà Giang 2026',
    destination: 'Huyện Đồng Văn, Hà Giang',
    neededItems: [
      { itemType: 'Áo khoác ấm dày Trẻ em Nam', qty: 20, currentStockId: 1 },
      { itemType: 'Áo phao mùa đông Trẻ em Nữ', qty: 5, currentStockId: 2 },
    ],
    status: 'pending',
  },
  {
    id: 2,
    campaignName: 'Học sinh tới trường - Quảng Nam',
    destination: 'Huyện Tây Giang, Quảng Nam',
    neededItems: [
      { itemType: 'Quần dài kaki Người lớn Nam', qty: 40, currentStockId: 3 },
    ],
    status: 'pending',
  },
];

export const CharityInventory: React.FC = () => {
  const toast = useToast();
  const [stock, setStock] = useState<StockItem[]>(INITIAL_STOCK);
  const [campaigns, setCampaigns] = useState<DistributionCampaign[]>(INITIAL_CAMPAIGNS);

  const handleShipCampaign = (campId: number) => {
    const campaign = campaigns.find(c => c.id === campId);
    if (!campaign) return;

    // Deduct stock quantities
    let insufficientStock = false;
    campaign.neededItems.forEach((item) => {
      const stockEntry = stock.find(s => s.id === item.currentStockId);
      if (!stockEntry || stockEntry.quantity < item.qty) {
        insufficientStock = true;
      }
    });

    if (insufficientStock) {
      toast.error(`Không thể xuất kho đơn hàng: Không đủ số lượng tồn kho cho một số mặt hàng.`);
      return;
    }

    // Perform deduction
    setStock((prevStock) =>
      prevStock.map((sItem) => {
        const needed = campaign.neededItems.find(item => item.currentStockId === sItem.id);
        if (needed) {
          const newQty = sItem.quantity - needed.qty;
          const newStatus = newQty === 0 ? 'empty' : newQty <= 10 ? 'low' : 'good';
          return { ...sItem, quantity: newQty, status: newStatus };
        }
        return sItem;
      })
    );

    // Update campaign status
    setCampaigns((prevCamps) =>
      prevCamps.map(c => (c.id === campId ? { ...c, status: 'shipped' } : c))
    );

    toast.success(`Đã xuất kho thành công hàng từ thiện cho chiến dịch: ${campaign.campaignName}!`);
  };

  const stockColumns = [
    { header: 'ID', accessor: 'id' as const },
    { header: 'Tên phân loại đồ từ thiện', accessor: 'name' as const },
    {
      header: 'Nhóm tuổi',
      accessor: (row: StockItem) => <Badge variant="primary">{row.ageGroup}</Badge>,
    },
    {
      header: 'Số lượng tồn kho',
      accessor: (row: StockItem) => <strong>{row.quantity} chiếc</strong>,
    },
    {
      header: 'Tình trạng kho',
      accessor: (row: StockItem) => {
        if (row.status === 'good') return <Badge variant="success">Tồn kho tốt</Badge>;
        if (row.status === 'low') return <Badge variant="warning">Sắp hết hàng</Badge>;
        return <Badge variant="danger">Hết hàng</Badge>;
      },
    },
  ];

  return (
    <AdminLayout role="staff">
      <div className="charity-inventory-page">
        <div className="admin-page-header">
          <h2 className="dashboard-title">Kiểm kho quần áo từ thiện</h2>
          <p className="dashboard-subtitle">Theo dõi quần áo đã qua xử lý khử khuẩn sạch sẽ trong kho và thực hiện xuất kho bàn giao tới các chiến dịch từ thiện.</p>
        </div>

        <div className="inventory-layout-grid">
          {/* Stock Table */}
          <div className="stock-list-card glass">
            <div className="card-header-flex">
              <h3>Tồn kho quần áo sạch</h3>
              <Badge variant="primary">Tổng loại mặt hàng: {stock.length}</Badge>
            </div>
            <Table columns={stockColumns} data={stock} />
          </div>

          {/* Distribution Orders Section */}
          <div className="campaign-dispatch-section glass">
            <h3>Xuất kho chiến dịch từ thiện</h3>
            <p className="dispatch-subtitle">Bàn giao các kiện hàng sạch tới các đoàn tình nguyện vùng cao.</p>

            {campaigns.length === 0 ? (
              <div className="dispatch-empty">
                <Inbox size={36} />
                <p>Chưa có yêu cầu xuất kho nào. Các chiến dịch cần hàng sẽ hiển thị ở đây.</p>
              </div>
            ) : (
            <div className="campaign-dispatch-list">
              {campaigns.map((camp) => (
                <div key={camp.id} className={`dispatch-item glass ${camp.status}`}>
                  <div className="dispatch-item-header">
                    <h4>{camp.campaignName}</h4>
                    <span className={`dispatch-status-badge ${camp.status}`}>
                      {camp.status === 'shipped' ? 'Đã xuất kho' : 'Chờ xuất kho'}
                    </span>
                  </div>
                  <div className="dispatch-destination">
                    <strong>Điểm nhận:</strong> {camp.destination}
                  </div>
                  
                  <div className="dispatch-needed-list">
                    <strong>Sản phẩm yêu cầu xuất:</strong>
                    <ul>
                      {camp.neededItems.map((item, idx) => {
                        const stockEntry = stock.find(s => s.id === item.currentStockId);
                        const isShortage = stockEntry ? stockEntry.quantity < item.qty : true;
                        
                        return (
                          <li key={idx} className={isShortage && camp.status === 'pending' ? 'shortage' : ''}>
                            {item.itemType} ({item.qty} chiếc)
                            {isShortage && camp.status === 'pending' && (
                              <span className="shortage-warning"> (Thiếu tồn kho!)</span>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>

                  {camp.status === 'pending' && (
                    <button
                      className="dispatch-action-btn flex-center"
                      onClick={() => handleShipCampaign(camp.id)}
                    >
                      <Send size={14} style={{ marginRight: '6px' }} />
                      Xác nhận xuất kho
                    </button>
                  )}
                </div>
              ))}
            </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default CharityInventory;
