import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Check,
  MapPin,
  PackageCheck,
  Recycle,
  ShieldCheck,
  Shirt,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import './Home.css';

const PROCESS_STEPS = [
  {
    title: 'Gửi yêu cầu',
    detail: 'Chọn đồ muốn quyên góp, điểm tiếp nhận hoặc thời gian phù hợp để bàn giao.',
    icon: PackageCheck,
  },
  {
    title: 'Kiểm tra và phân loại',
    detail: 'Mỗi đợt tiếp nhận được đánh giá theo tình trạng sử dụng và chất liệu.',
    icon: ShieldCheck,
  },
  {
    title: 'Đi đến đúng nơi cần thiết',
    detail: 'Đồ còn dùng tốt được chuẩn bị để trao tặng. Vật liệu không còn phù hợp được chuyển sang tái chế.',
    icon: Recycle,
  },
] as const;

const DONATION_GUIDE = [
  'Quần áo khô, sạch và không có vật sắc nhọn bên trong.',
  'Giày dép, chăn mỏng và phụ kiện còn nguyên vẹn được tiếp nhận cùng quần áo.',
  'Đồ rách hoặc quá cũ vẫn hữu ích nếu được tách riêng cho mục đích tái chế.',
] as const;

export const Home: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="home-page">
      <section className="home-hero" aria-labelledby="home-title">
        <div className="container home-hero-grid">
          <div className="home-hero-copy">
            <p className="home-kicker">Quyên góp có định hướng</p>
            <h1 id="home-title">Quần áo cũ vẫn có thể đi tiếp.</h1>
            <p className="home-lead">
              Gửi đồ còn dùng tốt đến nơi cần thiết, hoặc đưa vật liệu đã cũ vào đúng chu trình tái chế.
            </p>
            <div className="home-actions">
              <Button size="lg" onClick={() => navigate('/products')}>
                Tạo yêu cầu quyên góp <ArrowRight size={18} aria-hidden="true" />
              </Button>
              <Button variant="outline" size="lg" onClick={() => navigate('/map')}>
                <MapPin size={18} aria-hidden="true" /> Tìm điểm thu gom
              </Button>
            </div>
            <p className="home-action-note">Bạn chọn cách bàn giao. Hệ thống hướng dẫn phần còn lại.</p>
          </div>

          <figure className="home-hero-media">
            <video
              className="home-process-video"
              src="/assets/videos/login-bg.mp4"
              autoPlay
              loop
              muted
              playsInline
              aria-label="Quy trình xử lý quần áo để tái sử dụng và tái chế"
            />
            <figcaption>Phân loại đúng từ đầu giúp mỗi món đồ có cơ hội phù hợp hơn.</figcaption>
          </figure>
        </div>
      </section>

      <section className="home-paths" aria-labelledby="paths-title">
        <div className="container">
          <div className="home-section-heading">
            <p className="home-kicker">Không phải mọi món đồ đều có cùng điểm đến</p>
            <h2 id="paths-title">Hai hướng xử lý, một mục tiêu: hạn chế lãng phí.</h2>
          </div>
          <div className="home-path-grid">
            <article className="home-path-card home-path-reuse">
              <Shirt size={32} strokeWidth={1.5} aria-hidden="true" />
              <div>
                <h3>Còn sử dụng tốt</h3>
                <p>
                  Được kiểm tra, làm sạch và chuẩn bị cho các hoạt động trao tặng phù hợp.
                </p>
              </div>
            </article>
            <article className="home-path-card home-path-recycle">
              <Recycle size={32} strokeWidth={1.5} aria-hidden="true" />
              <div>
                <h3>Đã cũ hoặc hư hỏng</h3>
                <p>
                  Được tách theo chất liệu để định hướng vào luồng tái chế thay vì bị bỏ đi.
                </p>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="home-ledger" aria-labelledby="ledger-title">
        <div className="container home-ledger-layout">
          <div className="home-ledger-intro">
            <p className="home-kicker">Từ yêu cầu đến bàn giao</p>
            <h2 id="ledger-title">Theo dõi từng bước từ lúc gửi yêu cầu đến khi bàn giao.</h2>
            <p>
              ReThreads ghi nhận các bước tiếp nhận, phân loại và điều hướng đồ vào luồng xử lý phù hợp.
            </p>
          </div>

          <ol className="home-process-list">
            {PROCESS_STEPS.map(({ title, detail, icon: Icon }, index) => (
              <li key={title} className="home-process-step">
                <span className="home-process-index">0{index + 1}</span>
                <Icon className="home-process-icon" size={24} strokeWidth={1.5} aria-hidden="true" />
                <div>
                  <h3>{title}</h3>
                  <p>{detail}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="home-guide" aria-labelledby="guide-title">
        <div className="container home-guide-layout">
          <div className="home-guide-copy">
            <p className="home-kicker">Chuẩn bị trước khi gửi</p>
            <h2 id="guide-title">Một vài lưu ý nhỏ giúp việc phân loại nhanh và chính xác hơn.</h2>
          </div>
          <ul className="home-guide-list">
            {DONATION_GUIDE.map((item) => (
              <li key={item}>
                <Check size={18} strokeWidth={2} aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="home-closing" aria-labelledby="closing-title">
        <div className="container home-closing-inner">
          <Sparkles size={28} strokeWidth={1.5} aria-hidden="true" />
          <div>
            <h2 id="closing-title">Bắt đầu từ một túi đồ bạn không còn dùng.</h2>
            <p>Chọn cách bàn giao phù hợp và gửi yêu cầu khi bạn đã sẵn sàng.</p>
          </div>
          <Button size="lg" onClick={() => navigate('/products')}>
            Bắt đầu quyên góp <ArrowRight size={18} aria-hidden="true" />
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Home;
