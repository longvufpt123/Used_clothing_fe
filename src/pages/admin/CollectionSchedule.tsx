import React, { useState } from 'react';
import AdminLayout from '@/shared/layouts/AdminLayout';
import Table from '@/components/common/Table';
import Badge from '@/components/common/Badge';
import { useToast } from '@/context/ToastContext';
import { Truck, MapPin, Phone } from 'lucide-react';
import './CollectionSchedule.css';

interface PickupTask {
  id: number;
  code: string;
  donorName: string;
  phone: string;
  address: string;
  weight: string;
  date: string;
  status: 'assigned' | 'picking' | 'completed';
}

const INITIAL_TASKS: PickupTask[] = [
  { id: 1, code: 'RT-2026-803', donorName: 'Trần Minh Cường', phone: '0912345678', address: '789 Đường CMT8, Quận 3, TP. HCM', weight: 'Dưới 5 kg', date: '2026-07-03', status: 'assigned' },
  { id: 2, code: 'RT-2026-805', donorName: 'Nguyễn Bích Phương', phone: '0933445566', address: '12 Đường Lê Văn Sỹ, Phú Nhuận, TP. HCM', weight: '10-20 kg', date: '2026-07-03', status: 'picking' },
  { id: 3, code: 'RT-2026-806', donorName: 'Đặng Tuấn Anh', phone: '0909887766', address: '345 Điện Biên Phủ, Bình Thạnh, TP. HCM', weight: '5-10 kg', date: '2026-07-02', status: 'completed' },
];

export const CollectionSchedule: React.FC = () => {
  const toast = useToast();
  const [tasks, setTasks] = useState<PickupTask[]>(INITIAL_TASKS);

  const handleUpdateStatus = (id: number, newStatus: 'picking' | 'completed') => {
    setTasks(prev =>
      prev.map(task => {
        if (task.id === id) {
          return { ...task, status: newStatus };
        }
        return task;
      })
    );

    const code = tasks.find(t => t.id === id)?.code;
    let message = '';
    if (newStatus === 'picking') message = `Đã bắt đầu đi thu gom đơn ${code}.`;
    if (newStatus === 'completed') message = `Đã xác nhận THU GOM THÀNH CÔNG đơn ${code}. Kiện hàng đã đưa vào kho phân loại.`;

    toast.success(message);
  };

  const columns = [
    { header: 'Mã đơn', accessor: 'code' as const },
    { header: 'Người gửi', accessor: 'donorName' as const },
    { header: 'Điện thoại', accessor: 'phone' as const },
    { header: 'Địa chỉ thu nhận', accessor: 'address' as const },
    { header: 'Ước lượng', accessor: 'weight' as const },
    {
      header: 'Trạng thái',
      accessor: (row: PickupTask) => {
        switch (row.status) {
          case 'assigned':
            return <Badge variant="warning">Đã phân công</Badge>;
          case 'picking':
            return <Badge variant="info">Đang lấy hàng</Badge>;
          case 'completed':
            return <Badge variant="success">Đã thu gom</Badge>;
          default:
            return <Badge variant="warning">Chờ xử lý</Badge>;
        }
      },
    },
    {
      header: 'Hành động',
      accessor: (row: PickupTask) => {
        if (row.status === 'assigned') {
          return (
            <button
              className="action-btn btn-info-light"
              onClick={() => handleUpdateStatus(row.id, 'picking')}
            >
              <Truck size={14} style={{ marginRight: '4px' }} /> Đi thu gom
            </button>
          );
        }
        if (row.status === 'picking') {
          return (
            <button
              className="action-btn btn-success-light"
              onClick={() => handleUpdateStatus(row.id, 'completed')}
            >
              Đã lấy đồ xong
            </button>
          );
        }
        return <span className="action-done-text">Hoàn thành</span>;
      },
    },
  ];

  return (
    <AdminLayout role="staff">
      <div className="collection-schedule-page">
        <div className="admin-page-header">
          <h2 className="dashboard-title">Lịch Trình Thu Gom Tại Nhà</h2>
          <p className="dashboard-subtitle">Quản lý lộ trình điều phối của tài xế và kiểm soát tiến độ thu gom kiện quần áo quyên góp.</p>
        </div>

        <div className="schedule-layout-grid">
          {/* Active Tasks Table */}
          <div className="tasks-table-section glass">
            <h3>Danh sách lịch hẹn thu gom hôm nay</h3>
            <Table columns={columns} data={tasks} />
          </div>

          {/* Logistics Route Map Tracker Card */}
          <div className="route-tracker-sidebar glass">
            <h3>Lộ trình thu gom tối ưu</h3>
            <p className="route-sub">Thứ tự các điểm di chuyển được thuật toán sắp xếp tối ưu thời gian.</p>

            <div className="timeline-route-steps">
              {tasks.map((task, idx) => (
                <div key={task.id} className={`route-step ${task.status}`}>
                  <div className="route-step-number flex-center">{idx + 1}</div>
                  <div className="route-step-info">
                    <div className="route-step-header">
                      <strong>{task.donorName}</strong>
                      <span className="route-step-code">{task.code}</span>
                    </div>
                    <span className="route-step-address">
                      <MapPin size={12} style={{ marginRight: '4px' }} />
                      {task.address}
                    </span>
                    <span className="route-step-phone">
                      <Phone size={12} style={{ marginRight: '4px' }} />
                      {task.phone}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="route-summary-box">
              <div className="summary-title">Ước tính di chuyển</div>
              <div className="summary-details">
                <div>Tổng quãng đường: <strong>14.5 km</strong></div>
                <div>Thời gian ước tính: <strong>45 phút</strong></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default CollectionSchedule;
