'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { VerificationCodeModal } from '@/components/modals/VerificationCodeModal';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { forgotPassword, resetPassword } from '@/lib/api';
import Image from 'next/image';
import Link from 'next/link';
import { forgotPasswordSchema, resetPasswordSchema } from '@/schemas/auth-schemas';


export default function ForgotPasswordPage() {
  const router = useRouter();
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<'email' | 'reset'>('email');
  const [error, setError] = useState('');
  
  const emailForm = useForm<z.infer<typeof forgotPasswordSchema>>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const passwordForm = useForm<z.infer<typeof resetPasswordSchema>>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const onEmailSubmit = async (data: z.infer<typeof forgotPasswordSchema>) => {
    try {
      setError('');
      await forgotPassword(data.email);
      setEmail(data.email);
      setIsVerificationModalOpen(true);
    } catch (err) {
      console.error('Error requesting password reset:', err);
      setError('Failed to send verification code. Please try again.');
    }
  };

  const onVerifyCode = async (code: string) => {
    setStep('reset');
    setIsVerificationModalOpen(false);
    localStorage.setItem('resetCode', code);
  };

  const onPasswordSubmit = async (data: z.infer<typeof resetPasswordSchema>) => {
    try {
      setError('');
      const verificationCode = localStorage.getItem('resetCode');
      
      if (!verificationCode) {
        setError('Verification code is missing. Please try again from the beginning.');
        return;
      }

      await resetPassword(email, verificationCode, data.password);
      
      localStorage.removeItem('resetCode');
      
      router.push('/login');
    } catch (err) {
      console.error('Error resetting password:', err);
      setError('Failed to reset password. Please try again.');
    }
  };

  return (
    <div className="container relative flex flex-col items-center justify-center min-h-screen">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center mb-8">
          <Image
            src="/Diamond_Diaries_Logo_Teal.png"
            alt="Diamond Diaries Logo"
            height={80}
            width={80}
            className="mx-auto"
          />
          <h1 className="text-2xl font-semibold tracking-tight">
            {step === 'email' ? 'Forgot Password' : 'Reset Password'}
          </h1>
          {step === 'email' && (
            <p className="text-sm text-muted-foreground">
              Enter your email address and we will send you a verification code
            </p>
          )}
          {step === 'reset' && (
            <p className="text-sm text-muted-foreground">
              Create a new password for your account
            </p>
          )}
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {step === 'email' ? (
          <Form {...emailForm}>
            <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4">
              <FormField
                control={emailForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="email@example.com"
                        type="email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button type="submit" className="w-full bg-[#01C269] hover:bg-[#01C269]/90">
                Send Reset Link
              </Button>
            </form>
          </Form>
        ) : (
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4" autoComplete="off" id="new-password-form">
              {/* Hidden fake fields to trick browser autofill */}
              <input type="text" name="fakeusernameremembered" style={{ display: 'none' }} />
              <input type="password" name="fakepasswordremembered" style={{ display: 'none' }} />
              
              <FormField
                control={passwordForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="••••••••"
                        type="password"
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck="false"
                        data-form-type="other"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={passwordForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm New Password</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="••••••••"
                        type="password"
                        autoComplete="off"
                        autoCorrect="off" 
                        autoCapitalize="off"
                        spellCheck="false"
                        data-form-type="other"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button type="submit" className="w-full bg-[#01C269] hover:bg-[#01C269]/90">
                Reset Password
              </Button>
            </form>
          </Form>
        )}
        
        <div className="px-8 text-center text-sm">
          <Link href="/login" className="hover:underline">
            Back to Login
          </Link>
        </div>
      </div>

      <VerificationCodeModal
        isOpen={isVerificationModalOpen}
        onClose={() => setIsVerificationModalOpen(false)}
        onVerify={onVerifyCode}
      />
    </div>
  );
}