import React from 'react';
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
              <li><a href="/products">Tiếp nhận quyên góp</a></li>
              <li><a href="/products">Phân loại & Xử lý</a></li>
              <li><a href="/admin">Kho phân phối</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Hệ thống</h4>
            <ul>
              <li><a href="/admin">Thống kê tác động</a></li>
              <li><a href="/login">Cổng nhân viên</a></li>
              <li><a href="/">Trang chủ</a></li>
            </ul>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <div className="container footer-bottom-container">
          <p>&copy; {new Date().getFullYear()} ReThreads. Bảo lưu mọi quyền. Hệ thống Quản lý Tiếp nhận & Phân loại Quần áo Cũ.</p>
        </div>
      </div>
    </footer>
  );
};
export default Footer;
