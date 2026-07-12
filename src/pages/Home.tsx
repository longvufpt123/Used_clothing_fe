import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Leaf, ShieldCheck, Sparkles, RefreshCw } from 'lucide-react';
import { Button } from '@/components/common/Button';
import './Home.css';

// Mock data representing charity and recycling campaigns
const LATEST_CAMPAIGNS = [
  {
    id: 1,
    title: 'Áo ấm mùa đông - Hà Giang 2026',
    description: 'Quyên góp áo khoác, đồ len ấm hỗ trợ trẻ em và các hộ gia đình khó khăn vùng cao biên giới.',
    status: 'Đã hoàn thành' as const,
    image: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=500&auto=format&fit=crop&q=80',
    tag: 'Từ thiện',
  },
  {
    id: 2,
    title: 'Dự án Sợi Tái Sinh ReThreads',
    description: 'Thu gom denim và kaki cotton quá cũ để xé sợi dệt lại, giảm thiểu chôn lấp rác thải dệt may.',
    status: 'Đang tiến hành' as const,
    image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=500&auto=format&fit=crop&q=80',
    tag: 'Tái chế',
  },
  {
    id: 3,
    title: 'Đồng phục trẻ em - Mái ấm Tình thương',
    description: 'Tiếp nhận quần áo học sinh cấp 1, cấp 2 để xử lý khử khuẩn và gửi tặng các mái ấm cơ nhỡ.',
    status: 'Đang tiến hành' as const,
    image: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=500&auto=format&fit=crop&q=80',
    tag: 'Từ thiện',
  },
];

export const Home: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="container hero-container">
          <div className="hero-content">
            <span className="hero-tag">
              <Leaf size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> 
              Green & Sustainable Impact
            </span>
            <h1 className="hero-title">
              Quyên góp quần áo cũ, <br />
              trao tặng <span className="text-gradient">sự hy vọng.</span>
            </h1>
            <p className="hero-subtitle">
              Chung tay bảo vệ tài nguyên môi trường thông qua quy trình tiếp nhận chuyên nghiệp, giặt sấy khử khuẩn y tế và phân phối từ thiện hoặc xé sợi tái chế khép kín.
            </p>
            <div className="hero-actions-row">
              <Button size="lg" onClick={() => navigate('/products')}>
                Quyên góp Ngay <ArrowRight size={18} />
              </Button>
              <Button variant="secondary" size="lg" onClick={() => navigate('/admin')}>
                Báo cáo Tác động
              </Button>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-image-glow"></div>
            <video
              className="hero-image"
              src="/assets/videos/login-bg.mp4"
              autoPlay
              loop
              muted
              playsInline
              aria-label="Sustainable Fashion and Recycling"
            />
          </div>
        </div>
      </section>

      {/* 4-Step Processing Cycle */}
      <section className="workflow-section container">
        <div className="section-title-wrapper">
          <span className="section-subtitle">Quy trình Khép kín</span>
          <h2>Chu trình Phân loại & Xử lý</h2>
        </div>
        
        <div className="features">
          <div className="feature-card glass">
            <div className="step-badge">01</div>
            <Leaf className="feature-icon text-gradient" />
            <h3>Tiếp nhận quyên góp</h3>
            <p>Người dân đăng ký quyên góp qua cổng trực tuyến. Điều phối viên xác nhận và thu gom tại nhà hoặc bưu cục.</p>
          </div>
          <div className="feature-card glass">
            <div className="step-badge">02</div>
            <ShieldCheck className="feature-icon text-gradient" />
            <h3>Kiểm tra & Phân loại</h3>
            <p>Đồ được kiểm tra chất liệu: cotton, jean, poly. Phân chia làm 2 nhánh: đồ tái sử dụng (Từ thiện) và sợi tái chế (Tái chế).</p>
          </div>
          <div className="feature-card glass">
            <div className="step-badge">03</div>
            <Sparkles className="feature-icon text-gradient" />
            <h3>Khử trùng & Giặt sạch</h3>
            <p>Quần áo từ thiện được đưa qua dây chuyền giặt là sấy nhiệt độ cao và khử khuẩn bằng ô-zôn y tế để đảm bảo vệ sinh tối đa.</p>
          </div>
          <div className="feature-card glass">
            <div className="step-badge">04</div>
            <RefreshCw className="feature-icon text-gradient" />
            <h3>Trao tặng hoặc Tái chế</h3>
            <p>Quần áo đạt chuẩn được đóng gói gửi các quỹ từ thiện. Quần áo mục/rách được chuyển sang nhà máy xé tơi sợi dệt lại dệt thảm, bao bì.</p>
          </div>
        </div>
      </section>

      {/* System Statistics Board */}
      <section className="stats-dashboard container">
        <div className="glass stats-wrapper">
          <div className="stat-item">
            <span className="stat-label">Tổng khối lượng nhận</span>
            <span className="stat-number text-gradient">8.450 kg</span>
            <span className="stat-desc">Quần áo cũ thu gom từ tháng 1/2026</span>
          </div>
          <div className="stat-item border-left">
            <span className="stat-label">Phân phối từ thiện</span>
            <span className="stat-number text-gradient">4.120 kg</span>
            <span className="stat-desc">Đã xử lý sạch và gửi tặng vùng cao</span>
          </div>
          <div className="stat-item border-left">
            <span className="stat-label">Xé sợi dệt tái chế</span>
            <span className="stat-number text-gradient">3.890 kg</span>
            <span className="stat-desc">Tách sợi dệt thảm & đệm công nghiệp</span>
          </div>
          <div className="stat-item border-left">
            <span className="stat-label">Giảm phát thải CO2</span>
            <span className="stat-number text-gradient">12.5 tấn</span>
            <span className="stat-desc">Tương đương trồng 570 cây xanh</span>
          </div>
        </div>
      </section>

      {/* Campaigns Section */}
      <section className="featured container">
        <div className="section-header">
          <div>
            <span className="section-subtitle">Dự án cộng đồng</span>
            <h2>Chiến dịch đang triển khai</h2>
          </div>
          <Button variant="ghost" onClick={() => navigate('/products')}>
            Xem lịch trình <ArrowRight size={16} />
          </Button>
        </div>
        <div className="campaign-grid">
          {LATEST_CAMPAIGNS.map((camp) => (
            <div key={camp.id} className="campaign-card glass card-hover">
              <div className="campaign-img-wrapper">
                <img src={camp.image} alt={camp.title} className="campaign-img" />
                <span className={`campaign-tag ${camp.tag === 'Từ thiện' ? 'charity' : 'recycle'}`}>
                  {camp.tag}
                </span>
              </div>
              <div className="campaign-info">
                <h3>{camp.title}</h3>
                <p>{camp.description}</p>
                <div className="campaign-footer">
                  <span className={`status-dot ${camp.status === 'Đã hoàn thành' ? 'completed' : 'active'}`}></span>
                  <span className="status-text">{camp.status}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;
