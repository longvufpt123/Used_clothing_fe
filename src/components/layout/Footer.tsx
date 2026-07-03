import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

export const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="container footer-container">
        <div className="footer-brand">
          <h3>ReThreads</h3>
          <p>Hệ thống tiếp nhận, phân loại và xử lý quần áo cũ vì cộng đồng và môi trường. Đưa quần áo cũ tái chế thành sợi hoặc giặt là sạch sẽ trao tặng người có hoàn cảnh khó khăn.</p>
        </div>
        <div className="footer-links">
          <div className="footer-col">
            <h4>Quy trình</h4>
            <ul>
              <li><Link to="/products">Tiếp nhận quyên góp</Link></li>
              <li><Link to="/products">Phân loại & Xử lý</Link></li>
              <li><Link to="/admin">Kho phân phối</Link></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Hệ thống</h4>
            <ul>
              <li><Link to="/admin">Thống kê tác động</Link></li>
              <li><Link to="/login">Cổng nhân viên</Link></li>
              <li><Link to="/">Trang chủ</Link></li>
            </ul>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <div className="container footer-bottom-container">
          <p>&copy; {new Date().getFullYear()} ReThreads. Bảo lưu mọi quyền.</p>
          <nav className="footer-legal" aria-label="Liên kết pháp lý">
            <Link to="/privacy">Chính sách bảo mật</Link>
            <span aria-hidden="true">·</span>
            <Link to="/terms">Điều khoản sử dụng</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
};
export default Footer;
