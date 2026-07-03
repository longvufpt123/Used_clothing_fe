import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Leaf, ArrowLeft, Home as HomeIcon } from 'lucide-react';
import { Button } from '@/components/common/Button';
import './NotFound.css';

export const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="notfound-page container flex-center">
      <div className="notfound-content">
        <div className="notfound-glow" aria-hidden="true" />
        <span className="notfound-code text-gradient">404</span>
        <div className="notfound-badge">
          <Leaf size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
          Trang không tồn tại
        </div>
        <h1 className="notfound-title">Không tìm thấy trang bạn cần</h1>
        <p className="notfound-desc">
          Đường dẫn này có thể đã bị di chuyển hoặc không còn tồn tại. Hãy quay lại
          trang trước hoặc trở về trang chủ để tiếp tục quyên góp.
        </p>
        <div className="notfound-actions">
          <Button size="lg" onClick={() => navigate('/')}>
            <HomeIcon size={18} style={{ marginRight: '6px' }} /> Về trang chủ
          </Button>
          <Button variant="ghost" size="lg" onClick={() => navigate(-1)}>
            <ArrowLeft size={18} style={{ marginRight: '6px' }} /> Quay lại
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
