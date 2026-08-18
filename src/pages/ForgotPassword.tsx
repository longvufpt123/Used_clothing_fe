import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Leaf, Lock, Mail, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { forgotPasswordApi, resetPasswordApi } from '@/services/authService';
import './Login.css';
import './ForgotPassword.css';

const passwordValid = (value: string) => value.length >= 8 && /[A-Z]/.test(value) && /\d/.test(value) && /[^A-Za-z0-9]/.test(value);

function AuthMascot() {
  return <div className="mascot-wrapper flex-center" aria-hidden="true"><svg className="mascot" viewBox="0 0 100 100" width="90" height="90">
    <circle cx="25" cy="25" r="9" fill="var(--color-primary)" /><circle cx="25" cy="25" r="4" fill="#a7f3d0" /><circle cx="75" cy="25" r="9" fill="var(--color-primary)" /><circle cx="75" cy="25" r="4" fill="#a7f3d0" />
    <circle cx="50" cy="50" r="30" fill="var(--color-primary)" /><circle cx="29" cy="55" r="3" fill="#f43f5e" opacity=".4" /><circle cx="71" cy="55" r="3" fill="#f43f5e" opacity=".4" />
    <ellipse cx="50" cy="62" rx="13" ry="9" fill="#a7f3d0" /><polygon points="47,59 53,59 50,63" fill="#0f172a" /><path d="M47,66 Q50,68 53,66" stroke="#0f172a" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    <circle cx="38" cy="46" r="7" fill="#fff" /><circle cx="62" cy="46" r="7" fill="#fff" /><circle cx="38" cy="46" r="3.5" fill="#0f172a" /><circle cx="62" cy="46" r="3.5" fill="#0f172a" />
    <circle cx="22" cy="80" r="8" fill="var(--color-primary-hover)" stroke="#fff" strokeWidth="2" /><circle cx="78" cy="80" r="8" fill="var(--color-primary-hover)" stroke="#fff" strokeWidth="2" />
  </svg></div>;
}

export default function ForgotPassword() {
  const navigate = useNavigate(); const [step, setStep] = useState<'email' | 'reset'>('email');
  const [email, setEmail] = useState(''); const [code, setCode] = useState(''); const [password, setPassword] = useState(''); const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false); const [error, setError] = useState(''); const [message, setMessage] = useState('');

  const requestCode = async (event: React.FormEvent) => { event.preventDefault(); if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError('Vui lòng nhập email hợp lệ.'); setLoading(true); setError(''); try { await forgotPasswordApi(email.trim()); setMessage('Nếu email tồn tại trong hệ thống, mã đặt lại mật khẩu đã được gửi.'); setStep('reset'); } catch (e) { setError(e instanceof Error ? e.message : 'Không thể gửi mã.'); } finally { setLoading(false); } };
  const reset = async (event: React.FormEvent) => { event.preventDefault(); setError(''); if (!/^\d{6}$/.test(code)) return setError('Mã xác thực phải gồm đúng 6 chữ số.'); if (!passwordValid(password)) return setError('Mật khẩu cần ít nhất 8 ký tự, có chữ hoa, số và ký tự đặc biệt.'); if (password !== confirmPassword) return setError('Mật khẩu xác nhận không trùng khớp.'); setLoading(true); try { await resetPasswordApi({ email: email.trim(), code, newPassword: password }); navigate('/login', { replace: true, state: { passwordReset: true } }); } catch (e) { setError(e instanceof Error ? e.message : 'Không thể đặt lại mật khẩu.'); } finally { setLoading(false); } };

  return <div className="login-container forgot-login-container">
    <div className="login-visual-side">
      <video autoPlay loop muted playsInline className="login-video" src="/assets/videos/login-bg.mp4"><source src="https://assets.mixkit.co/videos/preview/mixkit-rotating-world-globe-with-green-continents-41883-large.mp4" type="video/mp4" /></video>
      <div className="login-visual-overlay" /><div className="login-visual-content">
        <div className="visual-logo-wrapper"><Leaf className="visual-logo" size={40} /><span className="visual-brand-name">ReThreads</span></div>
        <h1 className="visual-heading">Hành trình mới cho quần áo cũ</h1>
        <p className="visual-description">Cùng ReThreads xây dựng hệ thống quyên góp, phân loại và tái chế quần áo thông minh, góp phần giảm thiểu rác thải thời trang và kiến tạo tương lai xanh bền vững.</p>
        <div className="visual-stats"><div className="stat-item"><span className="stat-num">50T+</span><span className="stat-label">Quần áo thu gom</span></div><div className="stat-item"><span className="stat-num">12K+</span><span className="stat-label">Thành viên xanh</span></div></div>
      </div>
    </div>
    <div className="login-form-side"><div className="login-card glass forgot-auth-card"><AuthMascot /><div className="auth-form-wrapper fade-in">
      <h3 className="login-title text-gradient">{step === 'email' ? 'Quên Mật Khẩu' : 'Tạo Mật Khẩu Mới'}</h3>
      <p className="login-subtitle">{step === 'email' ? 'Nhập email đã đăng ký để nhận mã xác thực.' : 'Nhập mã OTP trong email và tạo mật khẩu mới.'}</p>
      {message && <div className="forgot-message">{message}</div>}
      <form onSubmit={step === 'email' ? requestCode : reset} className="login-form">
        <Input label="Email" type="email" icon={<Mail size={18} />} value={email} onChange={e => setEmail(e.target.value)} disabled={step === 'reset'} />
        {step === 'reset' && <><Input label="Mã xác thực" inputMode="numeric" maxLength={6} icon={<ShieldCheck size={18} />} value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))} /><Input label="Mật khẩu mới" type="password" icon={<Lock size={18} />} value={password} onChange={e => setPassword(e.target.value)} /><Input label="Xác nhận mật khẩu" type="password" icon={<Lock size={18} />} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} /></>}
        {error && <div className="forgot-error">{error}</div>}
        <Button type="submit" isLoading={loading} className="login-submit">{step === 'email' ? 'Gửi mã xác thực' : 'Đặt lại mật khẩu'}</Button>
        {step === 'reset' && <button type="button" className="forgot-link" onClick={() => { setStep('email'); setMessage(''); }}>Gửi lại mã</button>}
      </form>
      <Link to="/login" className="forgot-link">Quay lại đăng nhập</Link>
    </div></div></div>
  </div>;
}
