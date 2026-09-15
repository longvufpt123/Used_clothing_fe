import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Leaf,
  User,
  Mail,
  Lock,
  ShieldCheck,
  ArrowRight,
  Check,
  Circle,
  Phone,
  MapPin,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Checkbox } from '@/components/common/Checkbox';
import { useToast } from '@/context/ToastContext';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  loginApi,
  registerApi,
  resendVerificationApi,
  verifyRegistrationApi,
} from '@/services/authService';
import './Login.css';
import { uploadOrganizationCertificate, validateOrganizationCertificate } from '@/utils/organizationCertificate';

// Login validation schema
const loginSchema = z.object({
  userName: z.string().min(1, 'Tên đăng nhập không được để trống'),
  password: z.string().min(6, 'Mật khẩu phải chứa ít nhất 6 ký tự'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

// Register validation schema
const registerSchema = z
  .object({
    accountType: z.enum(['Donor', 'CharityOrganization', 'RecyclingOrganization', 'DisposalOrganization']),
    representativeName: z.string().trim().max(100, 'Tên người đại diện tối đa 100 ký tự'),
    taxCode: z.string().trim().max(50, 'Mã số tối đa 50 ký tự'),
    fullName: z.string().trim().min(2, 'Tên phải có ít nhất 2 ký tự').max(100, 'Tên tối đa 100 ký tự'),
    userName: z
      .string()
      .regex(/^[A-Za-z0-9._]{3,30}$/, 'Tên đăng nhập chỉ gồm chữ, số, dấu chấm hoặc gạch dưới'),
    email: z.string().min(1, 'Email không được để trống').email('Định dạng email không hợp lệ'),
    phoneNumber: z
      .string()
      .regex(/^(?:\+84|0)(?:3|5|7|8|9)\d{8}$/, 'Số điện thoại Việt Nam không hợp lệ'),
    address: z.string().trim().min(5, 'Địa chỉ phải có ít nhất 5 ký tự').max(500, 'Địa chỉ tối đa 500 ký tự'),
    password: z
      .string()
      .min(8, 'Mật khẩu phải có ít nhất 8 ký tự')
      .regex(/[A-Z]/, 'Mật khẩu cần chữ hoa')
      .regex(/\d/, 'Mật khẩu cần chữ số')
      .regex(/[^A-Za-z0-9]/, 'Mật khẩu cần ký tự đặc biệt'),
    confirmPassword: z.string().min(6, 'Mật khẩu xác nhận phải chứa ít nhất 6 ký tự'),
    agreeTerms: z.boolean().refine((val) => val === true, {
      message: 'Bạn phải đồng ý với Điều khoản dịch vụ và Chính sách bảo mật',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không trùng khớp',
    path: ['confirmPassword'],
  })
  .superRefine((data, ctx) => {
    if (data.accountType !== 'Donor') {
      if (data.representativeName.length < 2) ctx.addIssue({ code: 'custom', path: ['representativeName'], message: 'Nhập tên người đại diện (ít nhất 2 ký tự)' });
      if (!data.taxCode) ctx.addIssue({ code: 'custom', path: ['taxCode'], message: 'Nhập mã số thuế hoặc số đăng ký tổ chức' });
    }
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;

export const Login: React.FC = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verification, setVerification] = useState<{ userId: string } | null>(null);
  const [emailCode, setEmailCode] = useState('');
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [certificatePreview, setCertificatePreview] = useState('');
  const [certificateError, setCertificateError] = useState('');
  const uploadedCertificate = useRef<{ file: File; url: string } | null>(null);
  const certificateSelection = useRef(0);
  useEffect(() => {
    if (!certificateFile) { setCertificatePreview(''); return; }
    const url = URL.createObjectURL(certificateFile);
    setCertificatePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [certificateFile]);
  const [focusedField, setFocusedField] = useState<'email' | 'password' | 'name' | null>(null);
  const toast = useToast();
  const navigate = useNavigate();
  const { login } = useAuth();

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
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      userName: '',
      password: '',
    },
  });

  const {
    register: registerSignUp,
    handleSubmit: handleSubmitSignUp,
    formState: { errors: registerErrors },
    reset: resetRegisterForm,
    watch: watchSignUp,
    setValue: setRegisterValue,
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      accountType: 'Donor',
      representativeName: '',
      taxCode: '',
      fullName: '',
      userName: '',
      email: '',
      phoneNumber: '',
      address: '',
      password: '',
      confirmPassword: '',
      agreeTerms: false,
    },
  });

  const isOrganization = watchSignUp('accountType') !== 'Donor';
  const chooseCertificate = async (file?: File) => {
    const selection = ++certificateSelection.current;
    setCertificateFile(null);
    setCertificateError('');
    uploadedCertificate.current = null;
    if (!file) return;
    try {
      await validateOrganizationCertificate(file);
      if (selection === certificateSelection.current) setCertificateFile(file);
    } catch (error) {
      if (selection === certificateSelection.current) setCertificateError(error instanceof Error ? error.message : 'Ảnh không hợp lệ.');
    }
  };

  const onLoginSubmit = async (data: LoginFormValues) => {
    setLoading(true);
    try {
      const response = await loginApi(data);
      login(response.token, {
        userId: response.userId,
        fullName: response.fullName,
        userName: response.userName,
        avatarUrl: response.avatarUrl,
        role: response.role.trim(),
      }, response.expiredAt);
      toast.success('Đăng nhập thành công!');

      // Redirect based on role
      const role = response.role.trim();
      if (role === 'ReceivingStaff') {
        navigate('/receiving', { replace: true });
      } else if (role === 'ClassificationStaff') {
        navigate('/classification', { replace: true });
      } else if (role === 'WarehouseStaff') {
        navigate('/warehouse', { replace: true });
      } else if (role === 'Manager') {
        navigate('/manager', { replace: true });
      } else if (role === 'CharityOrganization') {
        navigate('/organization/distributions', { replace: true });
      } else if (role === 'RecyclingOrganization' || role === 'DisposalOrganization') {
        navigate('/organization/processing-operations', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } catch (error: any) {
      console.error(error);
      const errorMsg =
        error?.response?.data?.message ||
        error?.message ||
        'Tài khoản hoặc mật khẩu không chính xác';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const onRegisterSubmit = async (data: RegisterFormValues) => {
    if (data.accountType !== 'Donor' && !certificateFile) {
      setCertificateError('Vui lòng chọn ảnh chứng nhận của tổ chức.');
      return;
    }
    setLoading(true);
    try {
      let certificateImageUrl: string | undefined;
      if (data.accountType !== 'Donor' && certificateFile) {
        if (uploadedCertificate.current?.file !== certificateFile) {
          uploadedCertificate.current = { file: certificateFile, url: await uploadOrganizationCertificate(certificateFile) };
        }
        certificateImageUrl = uploadedCertificate.current.url;
      }
      const result = await registerApi({
        fullName: data.fullName,
        userName: data.userName,
        email: data.email,
        phoneNumber: data.phoneNumber,
        address: data.address,
        password: data.password,
        accountType: data.accountType,
        ...(data.accountType !== 'Donor' ? { representativeName: data.representativeName, taxCode: data.taxCode, certificateImageUrl } : {}),
      });
      setVerification({ userId: result.userId });
      toast.success('Đã gửi mã xác nhận qua email.');
    } catch (error: any) {
      console.error(error);
      const errorMsg =
        error?.response?.data?.message || error?.message || 'Đăng ký thất bại. Vui lòng thử lại.';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const verifyEmail = async () => {
    if (!verification) return;
    setLoading(true);
    try {
      const result = await verifyRegistrationApi(verification.userId, emailCode);
      toast.success(result.message);
      if (result.accountActivated) {
        resetRegisterForm();
        setCertificateFile(null);
        uploadedCertificate.current = null;
        setEmailCode('');
        setVerification(null);
        setIsRegister(false);
        toast.success('Tài khoản đã kích hoạt. Bạn có thể đăng nhập.');
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Mã xác nhận không hợp lệ.');
    } finally {
      setLoading(false);
    }
  };

  const resendCode = async () => {
    if (!verification) return;
    try {
      await resendVerificationApi(verification.userId);
      toast.success('Đã gửi lại mã xác nhận qua email.');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Không thể gửi lại mã.');
    }
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
    length: registerPasswordVal.length >= 8,
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
            Cùng ReThreads xây dựng hệ thống quyên góp, phân loại và tái chế quần áo thông minh, góp
            phần giảm thiểu rác thải thời trang và kiến tạo tương lai xanh bền vững.
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
              <circle cx="25" cy="25" r="4" fill="#a7f3d0" />
              <circle cx="75" cy="25" r="9" fill="var(--color-primary)" />
              <circle cx="75" cy="25" r="4" fill="#a7f3d0" />

              {/* Head */}
              <circle cx="50" cy="50" r="30" fill="var(--color-primary)" />

              {/* Cheeks */}
              <circle cx="29" cy="55" r="3" fill="#f43f5e" opacity="0.4" />
              <circle cx="71" cy="55" r="3" fill="#f43f5e" opacity="0.4" />

              {/* Face/Muzzle */}
              <ellipse cx="50" cy="62" rx="13" ry="9" fill="#a7f3d0" />

              {/* Nose */}
              <polygon points="47,59 53,59 50,63" fill="#0f172a" />

              {/* Mouth */}
              <path
                d="M47,66 Q50,68 53,66"
                stroke="#0f172a"
                strokeWidth="1.5"
                fill="none"
                strokeLinecap="round"
              />

              {/* Eyes White */}
              <circle cx="38" cy="46" r="7" fill="#ffffff" />
              <circle cx="62" cy="46" r="7" fill="#ffffff" />

              {/* Pupils */}
              <circle
                ref={leftPupilRef}
                className="mascot-pupil"
                cx="38"
                cy="46"
                r="3.5"
                fill="#0f172a"
              />
              <circle
                ref={rightPupilRef}
                className="mascot-pupil"
                cx="62"
                cy="46"
                r="3.5"
                fill="#0f172a"
              />

              {/* Hands */}
              <circle
                className="mascot-hand-left"
                cx="22"
                cy="80"
                r="8"
                fill="var(--color-primary-hover)"
                stroke="#ffffff"
                strokeWidth="2"
              />
              <circle
                className="mascot-hand-right"
                cx="78"
                cy="80"
                r="8"
                fill="var(--color-primary-hover)"
                stroke="#ffffff"
                strokeWidth="2"
              />
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

          {verification ? (
            <div className="auth-form-wrapper fade-in">
              <h3 className="login-title text-gradient">Xác nhận tài khoản</h3>
              <p className="login-subtitle">
                Nhập mã OTP 6 số đã gửi qua email. Mã có hiệu lực 5 phút.
              </p>
              <div className="login-form">
                <Input
                  label="Mã xác nhận email"
                  placeholder="000000"
                  value={emailCode}
                  maxLength={6}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    setEmailCode(value);
                  }}
                  icon={<Mail size={18} />}
                />
                <Button
                  type="button"
                  isLoading={loading}
                  disabled={emailCode.length !== 6}
                  onClick={verifyEmail}
                >
                  Xác nhận tài khoản
                </Button>
                <button type="button" className="auth-tab" onClick={resendCode}>
                  Gửi lại mã
                </button>
              </div>
            </div>
          ) : !isRegister ? (
            /* LOGIN FORM */
            <div className="auth-form-wrapper fade-in">
              <h3 className="login-title text-gradient">Cổng Thông Tin Hệ Thống</h3>
              <p className="login-subtitle">
                Đăng nhập để quản lý quyên góp, phân loại và xử lý quần áo
              </p>

              <form onSubmit={handleSubmitLogin(onLoginSubmit)} className="login-form">
                <Input
                  label="Tên đăng nhập"
                  placeholder="Nhập tên đăng nhập"
                  error={loginErrors.userName?.message}
                  icon={<User size={18} />}
                  {...registerLogin('userName', {
                    onBlur: () => setFocusedField(null),
                  })}
                  onFocus={() => setFocusedField('name')}
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

                <div style={{ textAlign: 'right', marginTop: -8 }}>
                  <Link to="/forgot-password" className="auth-tab">Quên mật khẩu?</Link>
                </div>

                <Button type="submit" isLoading={loading} className="login-submit">
                  Đăng nhập hệ thống
                </Button>
              </form>
            </div>
          ) : (
            /* REGISTER FORM */
            <div className="auth-form-wrapper fade-in">
              <h3 className="login-title text-gradient">{isOrganization ? 'Đăng Ký Tổ Chức' : 'Tạo Tài Khoản Thành Viên'}</h3>
              <p className="login-subtitle">
                Tham gia mạng lưới quyên góp và bảo vệ môi trường cùng ReThreads
              </p>

              <form onSubmit={handleSubmitSignUp(onRegisterSubmit)} className="login-form">
                <fieldset className="registration-account-type" disabled={loading}>
                  <legend>Đăng ký với tư cách</legend>
                  <div className="registration-type-options">
                    <button type="button" aria-pressed={!isOrganization} className={!isOrganization ? 'selected' : ''} onClick={() => { setRegisterValue('accountType', 'Donor'); setRegisterValue('representativeName', ''); setRegisterValue('taxCode', ''); setCertificateError(''); }}>Cá nhân</button>
                    <button type="button" aria-pressed={isOrganization} className={isOrganization ? 'selected' : ''} onClick={() => { if (!isOrganization) setRegisterValue('accountType', 'CharityOrganization'); }}>Tổ chức</button>
                  </div>
                </fieldset>
                {isOrganization && (
                  <div className="organization-registration-fields">
                    <label htmlFor="organization-type">Loại tổ chức</label>
                    <select id="organization-type" disabled={loading} {...registerSignUp('accountType')}>
                      <option value="CharityOrganization">Tổ chức từ thiện</option>
                      <option value="RecyclingOrganization">Tổ chức tái chế</option>
                      <option value="DisposalOrganization">Tổ chức tiêu hủy</option>
                    </select>
                    <p>Xác thực email để kích hoạt tài khoản và truy cập nghiệp vụ dành cho tổ chức.</p>
                  </div>
                )}
                <Input
                  label={isOrganization ? 'Tên tổ chức' : 'Họ và tên'}
                  placeholder={isOrganization ? 'Tên đầy đủ của tổ chức' : 'Nguyễn Văn A'}
                  error={registerErrors.fullName?.message}
                  icon={<User size={18} />}
                  {...registerSignUp('fullName', {
                    onBlur: () => setFocusedField(null),
                  })}
                  onFocus={() => setFocusedField('name')}
                />

                {isOrganization && <>
                  <Input label="Người đại diện" placeholder="Họ và tên người đại diện" error={registerErrors.representativeName?.message} {...registerSignUp('representativeName')} />
                  <Input label="Mã số thuế / Số đăng ký tổ chức" placeholder="Nhập mã số trên giấy chứng nhận" error={registerErrors.taxCode?.message} {...registerSignUp('taxCode')} />
                  <div className="organization-certificate">
                    <label htmlFor="organization-certificate">Ảnh giấy chứng nhận</label>
                    <input id="organization-certificate" type="file" accept="image/jpeg,image/png,image/webp" disabled={loading} aria-describedby="certificate-help certificate-error" aria-invalid={!!certificateError} onChange={(event) => void chooseCertificate(event.target.files?.[0])} />
                    <small id="certificate-help">Giấy đăng ký hoặc chứng nhận hoạt động. JPG, PNG, WebP; tối đa 5 MB.</small>
                    {certificatePreview && <img src={certificatePreview} alt="Ảnh chứng nhận đã chọn" />}
                    {certificateFile && <button type="button" className="auth-tab" disabled={loading} onClick={() => { void chooseCertificate(); const input = document.getElementById('organization-certificate') as HTMLInputElement | null; if (input) input.value = ''; }}>Xóa ảnh</button>}
                    <span id="certificate-error" role={certificateError ? 'alert' : undefined}>{certificateError}</span>
                  </div>
                </>}

                <Input
                  label="Tên đăng nhập"
                  placeholder="tendangnhap123"
                  error={registerErrors.userName?.message}
                  icon={<User size={18} />}
                  {...registerSignUp('userName', {
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
                  label="Số điện thoại"
                  placeholder="0901234567"
                  error={registerErrors.phoneNumber?.message}
                  icon={<Phone size={18} />}
                  {...registerSignUp('phoneNumber', {
                    onBlur: () => setFocusedField(null),
                  })}
                  onFocus={() => setFocusedField('name')}
                />

                <Input
                  label="Địa chỉ"
                  placeholder="Số nhà, tên đường, quận/huyện..."
                  error={registerErrors.address?.message}
                  icon={<MapPin size={18} />}
                  {...registerSignUp('address', {
                    onBlur: () => setFocusedField(null),
                  })}
                  onFocus={() => setFocusedField('name')}
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
                        <span>Tối thiểu 8 ký tự</span>
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
