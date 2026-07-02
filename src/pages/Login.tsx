import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { useToast } from '@/context/ToastContext';
import './Login.css';

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: LoginFormValues) => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      console.log('[Login Submitted]', data);
      toast.success('Logged in successfully (Mock API)!');
    }, 1500);
  };

  return (
    <div className="login-page flex-center container">
      <div className="login-card glass">
        <h2 className="login-title text-gradient">Welcome Back</h2>
        <p className="login-subtitle">Access your eco-wardrobe</p>

        <form onSubmit={handleSubmit(onSubmit)} className="login-form">
          <Input
            label="Email Address"
            placeholder="name@example.com"
            error={errors.email?.message}
            {...register('email')}
          />

          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register('password')}
          />

          <Button type="submit" isLoading={loading} className="login-submit">
            Sign In
          </Button>
        </form>
      </div>
    </div>
  );
};
export default Login;
