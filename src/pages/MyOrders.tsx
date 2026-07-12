import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { CalendarDays, ImageIcon, PackageSearch, RefreshCw, Truck } from 'lucide-react';
import { Button } from '@/components/common/Button';
import apiClient from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import './MyOrders.css';

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
  warehouseAddress: string;
  status: string;
  statusText: string;
  createdAt?: string | null;
}

const getDescriptionValue = (description: string | undefined, label: string) => {
  if (!description) {
    return '';
  }

  const line = description
    .split('\n')
    .find(item => item.toLowerCase().startsWith(label.toLowerCase()));

  return line?.split(':').slice(1).join(':').trim() || '';
};

const formatDate = (value?: string | null) => {
  if (!value) {
    return 'Chua cap nhat';
  }

  return new Date(value).toLocaleDateString('vi-VN');
};

export const MyOrders: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const toast = useToast();
  const [orders, setOrders] = useState<DonorRequestSearchApiResponse[] | null>(null);
  const [loading, setLoading] = useState(false);

  const loadMyOrders = async () => {
    setLoading(true);
    try {
      const result = await apiClient.get<unknown, DonorRequestSearchApiResponse[]>('/donor-requests/my');
      setOrders(result);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Khong the tai danh sach don.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadMyOrders();
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="my-orders-page container">
      <div className="my-orders-header">
        <span className="section-subtitle">Đơn của tôi</span>
        <h1>Lịch sử quyên góp</h1>
      </div>

      <div className="my-orders-toolbar glass">
        <div>
          <strong>Danh sách đơn hàng</strong>
          <p>Danh sách đơn hàng mà bạn đã quyên góp</p>
        </div>
        <Button type="button" isLoading={loading} onClick={loadMyOrders}>
          Làm mới <RefreshCw size={16} style={{ marginLeft: 8 }} />
        </Button>
      </div>

      {orders !== null && (
        <section className="orders-list">
          {orders.length === 0 ? (
            <div className="orders-empty glass">
              <PackageSearch size={34} />
              <p>Tai khoan nay chua co don quyen gop nao.</p>
            </div>
          ) : (
            orders.map(order => (
              <article className="order-card glass" key={order.id}>
                <div className="order-card-header">
                  <div>
                    <span className="order-code">{order.code}</span>
                    <h2>{getDescriptionValue(order.description, 'Loai quan ao') || 'Don quyen gop'}</h2>
                  </div>
                  <span className="order-status">{order.statusText}</span>
                </div>

                <div className="order-meta-grid">
                  <div><strong>Người gửi</strong><span>{order.donorName}</span></div>
                  <div><strong>Số điện thoại</strong><span>{order.phoneNumber}</span></div>
                  <div><strong>Khối lượng</strong><span>{getDescriptionValue(order.description, 'Khoi luong uoc luong') || `${order.estimateWeight} kg`}</span></div>
                  <div><strong>Tình trạng</strong><span>{getDescriptionValue(order.description, 'Tinh trang') || 'Dang cap nhat'}</span></div>
                  <div><strong>Ngày lấy hàng</strong><span>{formatDate(order.pickupDate)}</span></div>
                  <div><strong>Kho tiếp nhận</strong><span>{order.warehouseAddress}</span></div>
                </div>

                <div className="order-address">
                  <Truck size={17} />
                  <span>{order.pickupAddress}</span>
                </div>

                {order.imageUrls && order.imageUrls.length > 0 && (
                  <div className="order-images-block">
                    <div className="order-images-title">
                      <ImageIcon size={17} />
                      <span>Hình ảnh</span>
                    </div>
                    <div className="order-images-grid">
                      {order.imageUrls.map((url, index) => (
                        <a href={url} target="_blank" rel="noreferrer" className="order-image" key={`${order.id}-${url}`}>
                          <img src={url} alt={`Hinh anh don ${order.code} ${index + 1}`} loading="lazy" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                <div className="order-footer">
                  <CalendarDays size={16} />
                  <span>Tao ngay {formatDate(order.createdAt)}</span>
                </div>
              </article>
            ))
          )}
        </section>
      )}
    </div>
  );
};

export default MyOrders;