import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Leaf } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { useToast } from '@/context/ToastContext';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const loginSchema = z.object({
  email: z.string().min(1, 'Email không được để trống').email('Định dạng email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu phải chứa ít nhất 6 ký tự'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'admin@rethreads.vn',
      password: 'password123',
    }
  });

  const onSubmit = (data: LoginFormValues) => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      console.log('[Login Submitted]', data);
      toast.success('Đăng nhập hệ thống quản lý thành công!');
      // Navigate to admin dashboard
      navigate('/admin');
    }, 1500);
  };

  return (
    <div className="login-page flex-center container">
      <div className="login-card glass">
        <div className="login-header flex-center">
          <Leaf className="login-logo-icon text-gradient" size={32} />
          <h2>ReThreads</h2>
        </div>
        
        <h3 className="login-title text-gradient">Cổng Thông Tin Nhân Viên</h3>
        <p className="login-subtitle">Đăng nhập để quản lý phân loại và xử lý quần áo quyên góp</p>

        <form onSubmit={handleSubmit(onSubmit)} className="login-form">
          <Input
            label="Tài khoản email"
            placeholder="admin@rethreads.vn"
            error={errors.email?.message}
            {...register('email')}
          />

          <Input
            label="Mật khẩu"
            type="password"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register('password')}
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
    </div>
  );
};

export default Login;
