import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Leaf, User, Mail, Lock, ShieldCheck, ArrowRight, Check, Circle } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Checkbox } from '@/components/common/Checkbox';
import { useToast } from '@/context/ToastContext';
import { useNavigate } from 'react-router-dom';
import './Login.css';

// Login validation schema
const loginSchema = z.object({
  email: z.string().min(1, 'Email không được để trống').email('Định dạng email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu phải chứa ít nhất 6 ký tự'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

// Register validation schema
const registerSchema = z.object({
  fullName: z.string().min(2, 'Họ và tên phải có ít nhất 2 ký tự'),
  email: z.string().min(1, 'Email không được để trống').email('Định dạng email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu phải chứa ít nhất 6 ký tự'),
  confirmPassword: z.string().min(6, 'Mật khẩu xác nhận phải chứa ít nhất 6 ký tự'),
  agreeTerms: z.boolean().refine((val) => val === true, {
    message: 'Bạn phải đồng ý với Điều khoản dịch vụ và Chính sách bảo mật',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Mật khẩu xác nhận không trùng khớp',
  path: ['confirmPassword'],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export const Login: React.FC = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<'email' | 'password' | 'name' | null>(null);
  const toast = useToast();
  const navigate = useNavigate();

  const mascotRef = useRef<SVGSVGElement>(null);
  const leftPupilRef = useRef<SVGCircleElement>(null);
  const rightPupilRef = useRef<SVGCircleElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (focusedField === 'password') {
        if (leftPupilRef.current) leftPupilRef.current.style.transform = '';
        if (rightPupilRef.current) rightPupilRef.current.style.transform = '';
        return;
      }

      if (!mascotRef.current) return;

      const rect = mascotRef.current.getBoundingClientRect();
      const mascotCenterX = rect.left + rect.width / 2;
      const mascotCenterY = rect.top + rect.height / 2;

      const dx = e.clientX - mascotCenterX;
      const dy = e.clientY - mascotCenterY;
      const angle = Math.atan2(dy, dx);
      
      // Calculate look distance, cap at 2.5px to stay inside eyeball white boundaries
      const distance = Math.min(2.5, Math.sqrt(dx * dx + dy * dy) / 75);
      
      const pupilX = Math.cos(angle) * distance;
      const pupilY = Math.sin(angle) * distance;

      const transformStr = `translate(${pupilX.toFixed(2)}px, ${pupilY.toFixed(2)}px)`;
      
      if (leftPupilRef.current) leftPupilRef.current.style.transform = transformStr;
      if (rightPupilRef.current) rightPupilRef.current.style.transform = transformStr;
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [focusedField]);

  // Separate forms for Login and Register to avoid validation & value conflicts
  const {
    register: registerLogin,
    handleSubmit: handleSubmitLogin,
    formState: { errors: loginErrors },
    reset: resetLoginForm,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'admin@rethreads.vn',
      password: 'password123',
    },
  });

  const {
    register: registerSignUp,
    handleSubmit: handleSubmitSignUp,
    formState: { errors: registerErrors },
    reset: resetRegisterForm,
    watch: watchSignUp,
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      agreeTerms: false,
    },
  });

  const onLoginSubmit = (data: LoginFormValues) => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      console.log('[Login Submitted]', data);
      toast.success('Đăng nhập hệ thống quản lý thành công!');
      navigate('/admin');
    }, 1500);
  };

  const onRegisterSubmit = (data: RegisterFormValues) => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      console.log('[Register Submitted]', data);
      toast.success('Đăng ký tài khoản thành công! Bạn có thể đăng nhập ngay bây giờ.');
      // Switch back to login form and pre-fill email
      setIsRegister(false);
      resetRegisterForm();
      resetLoginForm({
        email: data.email,
        password: '',
      });
    }, 1500);
  };

  const handleTabChange = (toRegister: boolean) => {
    setIsRegister(toRegister);
    setFocusedField(null);
  };

  const getMascotClass = () => {
    if (focusedField === 'password') return 'cover-eyes';
    if (focusedField === 'email' || focusedField === 'name') return 'look-down';
    return '';
  };

  // Watch password value for strength indicator
  const registerPasswordVal = watchSignUp('password') || '';

  const criteria = {
    length: registerPasswordVal.length >= 6,
    uppercase: /[A-Z]/.test(registerPasswordVal),
    number: /[0-9]/.test(registerPasswordVal),
    special: /[^A-Za-z0-9]/.test(registerPasswordVal),
  };

  const strengthCount = Object.values(criteria).filter(Boolean).length;

  const getStrengthLevel = () => {
    if (!registerPasswordVal) return { label: '', color: '', width: '0%' };
    if (strengthCount <= 1) return { label: 'Yếu', color: 'var(--color-danger)', width: '25%' };
    if (strengthCount <= 3) return { label: 'Trung bình', color: '#f59e0b', width: '60%' };
    return { label: 'Mạnh', color: 'var(--color-primary)', width: '100%' };
  };

  const strength = getStrengthLevel();

  return (
    <div className="login-container">
      {/* Visual side with Loop Video */}
      <div className="login-visual-side">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="login-video"
          src="/assets/videos/login-bg.mp4"
        >
          {/* Dynamic eco-themed rotating world globe video from mixkit as high-quality default fallback */}
          <source
            src="https://assets.mixkit.co/videos/preview/mixkit-rotating-world-globe-with-green-continents-41883-large.mp4"
            type="video/mp4"
          />
          Trình duyệt của bạn không hỗ trợ thẻ video.
        </video>
        <div className="login-visual-overlay" />
        <div className="login-visual-content">
          <div className="visual-logo-wrapper">
            <Leaf className="visual-logo" size={40} />
            <span className="visual-brand-name">ReThreads</span>
          </div>
          <h1 className="visual-heading">Hành trình mới cho quần áo cũ</h1>
          <p className="visual-description">
            Cùng ReThreads xây dựng hệ thống quyên góp, phân loại và tái chế quần áo thông minh, 
            góp phần giảm thiểu rác thải thời trang và kiến tạo tương lai xanh bền vững.
          </p>
          <div className="visual-stats">
            <div className="stat-item">
              <span className="stat-num">50T+</span>
              <span className="stat-label">Quần áo thu gom</span>
            </div>
            <div className="stat-item">
              <span className="stat-num">12K+</span>
              <span className="stat-label">Thành viên xanh</span>
            </div>
          </div>
        </div>
      </div>

      {/* Form side */}
      <div className="login-form-side">
        <div className="login-card glass">
          
          {/* Interactive SVG Mascot */}
          <div className="mascot-wrapper flex-center">
            <svg
              ref={mascotRef}
              className={`mascot ${getMascotClass()}`}
              viewBox="0 0 100 100"
              width="90"
              height="90"
            >
              {/* Ears */}
              <circle cx="25" cy="25" r="9" fill="var(--color-primary)" />
              <circle cx="25" cy="25" r="4" fill="var(--color-bg-tertiary)" />
              <circle cx="75" cy="25" r="9" fill="var(--color-primary)" />
              <circle cx="75" cy="25" r="4" fill="var(--color-bg-tertiary)" />

              {/* Head */}
              <circle cx="50" cy="50" r="30" fill="var(--color-primary)" />

              {/* Cheeks */}
              <circle cx="29" cy="55" r="3" fill="#f43f5e" opacity="0.4" />
              <circle cx="71" cy="55" r="3" fill="#f43f5e" opacity="0.4" />

              {/* Face/Muzzle */}
              <ellipse cx="50" cy="62" rx="13" ry="9" fill="#a7f3d0" />
              
              {/* Nose */}
              <polygon points="47,59 53,59 50,63" fill="var(--color-bg-primary)" />

              {/* Mouth */}
              <path d="M47,66 Q50,68 53,66" stroke="var(--color-bg-primary)" strokeWidth="1.5" fill="none" strokeLinecap="round" />

              {/* Eyes White */}
              <circle cx="38" cy="46" r="7" fill="#ffffff" />
              <circle cx="62" cy="46" r="7" fill="#ffffff" />

              {/* Pupils */}
              <circle ref={leftPupilRef} className="mascot-pupil" cx="38" cy="46" r="3.5" fill="var(--color-bg-primary)" />
              <circle ref={rightPupilRef} className="mascot-pupil" cx="62" cy="46" r="3.5" fill="var(--color-bg-primary)" />

              {/* Hands */}
              <circle className="mascot-hand-left" cx="22" cy="80" r="8" fill="var(--color-primary-hover)" stroke="var(--color-bg-secondary)" strokeWidth="2" />
              <circle className="mascot-hand-right" cx="78" cy="80" r="8" fill="var(--color-primary-hover)" stroke="var(--color-bg-secondary)" strokeWidth="2" />
            </svg>
          </div>

          <div className="auth-tabs">
            <button
              type="button"
              className={`auth-tab ${!isRegister ? 'active' : ''}`}
              onClick={() => handleTabChange(false)}
            >
              Đăng nhập
            </button>
            <button
              type="button"
              className={`auth-tab ${isRegister ? 'active' : ''}`}
              onClick={() => handleTabChange(true)}
            >
              Đăng ký
            </button>
          </div>

          {!isRegister ? (
            /* LOGIN FORM */
            <div className="auth-form-wrapper fade-in">
              <h3 className="login-title text-gradient">Cổng Thông Tin Nhân Viên</h3>
              <p className="login-subtitle">
                Đăng nhập để quản lý phân loại và xử lý quần áo quyên góp
              </p>

              <form onSubmit={handleSubmitLogin(onLoginSubmit)} className="login-form">
                <Input
                  label="Tài khoản email"
                  placeholder="admin@rethreads.vn"
                  error={loginErrors.email?.message}
                  icon={<Mail size={18} />}
                  {...registerLogin('email', {
                    onBlur: () => setFocusedField(null),
                  })}
                  onFocus={() => setFocusedField('email')}
                />

                <Input
                  label="Mật khẩu"
                  type="password"
                  placeholder="••••••••"
                  error={loginErrors.password?.message}
                  icon={<Lock size={18} />}
                  {...registerLogin('password', {
                    onBlur: () => setFocusedField(null),
                  })}
                  onFocus={() => setFocusedField('password')}
                />

                <Button type="submit" isLoading={loading} className="login-submit">
                  Đăng nhập hệ thống
                </Button>
              </form>

              <div className="login-footer">
                <p>Tài khoản dùng thử mặc định:</p>
                <code>admin@rethreads.vn / password123</code>
              </div>
            </div>
          ) : (
            /* REGISTER FORM */
            <div className="auth-form-wrapper fade-in">
              <h3 className="login-title text-gradient">Tạo Tài Khoản Thành Viên</h3>
              <p className="login-subtitle">
                Tham gia mạng lưới tình nguyện viên và nhân viên phân loại của ReThreads
              </p>

              <form onSubmit={handleSubmitSignUp(onRegisterSubmit)} className="login-form">
                <Input
                  label="Họ và tên"
                  placeholder="Nguyễn Văn A"
                  error={registerErrors.fullName?.message}
                  icon={<User size={18} />}
                  {...registerSignUp('fullName', {
                    onBlur: () => setFocusedField(null),
                  })}
                  onFocus={() => setFocusedField('name')}
                />

                <Input
                  label="Địa chỉ email"
                  placeholder="example@rethreads.vn"
                  error={registerErrors.email?.message}
                  icon={<Mail size={18} />}
                  {...registerSignUp('email', {
                    onBlur: () => setFocusedField(null),
                  })}
                  onFocus={() => setFocusedField('email')}
                />

                <Input
                  label="Mật khẩu"
                  type="password"
                  placeholder="••••••••"
                  error={registerErrors.password?.message}
                  icon={<Lock size={18} />}
                  {...registerSignUp('password', {
                    onBlur: () => setFocusedField(null),
                  })}
                  onFocus={() => setFocusedField('password')}
                />

                {/* Password Strength Checklist */}
                {registerPasswordVal && (
                  <div className="password-strength-container fade-in">
                    <div className="strength-bar-wrapper">
                      <div
                        className="strength-bar"
                        style={{ width: strength.width, backgroundColor: strength.color }}
                      />
                    </div>
                    <div className="strength-text" style={{ color: strength.color }}>
                      Độ mạnh mật khẩu: {strength.label}
                    </div>
                    <ul className="strength-criteria">
                      <li className={criteria.length ? 'met' : ''}>
                        {criteria.length ? <Check size={13} /> : <Circle size={13} />}
                        <span>Tối thiểu 6 ký tự</span>
                      </li>
                      <li className={criteria.uppercase ? 'met' : ''}>
                        {criteria.uppercase ? <Check size={13} /> : <Circle size={13} />}
                        <span>Có chữ viết hoa</span>
                      </li>
                      <li className={criteria.number ? 'met' : ''}>
                        {criteria.number ? <Check size={13} /> : <Circle size={13} />}
                        <span>Có ít nhất 1 chữ số</span>
                      </li>
                      <li className={criteria.special ? 'met' : ''}>
                        {criteria.special ? <Check size={13} /> : <Circle size={13} />}
                        <span>Có ký tự đặc biệt</span>
                      </li>
                    </ul>
                  </div>
                )}

                <Input
                  label="Xác nhận mật khẩu"
                  type="password"
                  placeholder="••••••••"
                  error={registerErrors.confirmPassword?.message}
                  icon={<ShieldCheck size={18} />}
                  {...registerSignUp('confirmPassword', {
                    onBlur: () => setFocusedField(null),
                  })}
                  onFocus={() => setFocusedField('password')}
                />

                <Checkbox
                  label="Tôi đồng ý với các Điều khoản & Chính sách bảo mật của ReThreads"
                  error={registerErrors.agreeTerms?.message}
                  {...registerSignUp('agreeTerms')}
                />

                <Button type="submit" isLoading={loading} className="login-submit">
                  Đăng ký tài khoản <ArrowRight size={16} style={{ marginLeft: 8 }} />
                </Button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
