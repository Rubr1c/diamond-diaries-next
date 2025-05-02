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
import {
  forgotPasswordSchema,
  resetPasswordSchema,
} from '@/schemas/auth-schemas';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [isVerificationLoading, setIsVerificationLoading] = useState(false);
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
      setIsVerificationLoading(true);
      setIsVerificationModalOpen(true);
      await forgotPassword(data.email);
      setEmail(data.email);
      setIsVerificationLoading(false);
    } catch (err) {
      console.error('Error requesting password reset:', err);
      setError('Failed to send verification code. Please try again.');
      setIsVerificationModalOpen(false);
      setIsVerificationLoading(false);
    }
  };

  const onVerifyCode = async (code: string) => {
    try {
      // The modal will handle its own loading state during verification
      // After successful verification, close the modal and move to reset step
      setStep('reset');
      setIsVerificationModalOpen(false);
      localStorage.setItem('resetCode', code);
    } catch (error) {
      console.error('Error verifying code:', error);
      setIsVerificationLoading(false);
    }
  };

  const onPasswordSubmit = async (
    data: z.infer<typeof resetPasswordSchema>
  ) => {
    try {
      setError('');
      const verificationCode = localStorage.getItem('resetCode');

      if (!verificationCode) {
        setError(
          'Verification code is missing. Please try again from the beginning.'
        );
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
    <div className="min-h-screen bg-gradient-to-b from-[#003243] to-[#002233] pt-20 pb-20 px-4">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center mb-8">
          <Image
            src="/Diamond_Diaries_Logo_Teal.png"
            alt="Diamond Diaries Logo"
            height={80}
            width={80}
            className="mx-auto"
          />
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            {step === 'email' ? 'Forgot Password' : 'Reset Password'}
          </h1>
          {step === 'email' && (
            <p className="text-sm text-gray-300">
              Enter your email address and we will send you a verification code
            </p>
          )}
          {step === 'reset' && (
            <p className="text-sm text-gray-300">
              Create a new password for your account
            </p>
          )}
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative transition-all duration-300 hover:bg-red-50 shadow-md">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg p-6 transform transition-all duration-200 hover:shadow-xl">
          {step === 'email' ? (
            <Form {...emailForm}>
              <form
                onSubmit={emailForm.handleSubmit(onEmailSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={emailForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#003243] font-medium">
                        Email
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="email@example.com"
                          type="email"
                          className="focus-visible:ring-[#01C269] focus-visible:ring-offset-0 cursor-text border-gray-300 focus:border-[#01C269] transition-all duration-200"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-red-500" />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full bg-[#01C269] hover:bg-[#01C269]/80 transition-colors duration-200 cursor-pointer shadow-sm hover:shadow-md hover:scale-105 transform"
                >
                  Send Reset Link
                </Button>
              </form>
            </Form>
          ) : (
            <Form {...passwordForm}>
              <form
                onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
                className="space-y-4"
                autoComplete="off"
                id="new-password-form"
              >
                {/* Hidden fake fields to trick browser autofill */}
                <input
                  type="text"
                  name="fakeusernameremembered"
                  style={{ display: 'none' }}
                />
                <input
                  type="password"
                  name="fakepasswordremembered"
                  style={{ display: 'none' }}
                />

                <FormField
                  control={passwordForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#003243] font-medium">
                        New Password
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="••••••••"
                          type="password"
                          autoComplete="off"
                          autoCorrect="off"
                          autoCapitalize="off"
                          spellCheck="false"
                          data-form-type="other"
                          className="focus-visible:ring-[#01C269] focus-visible:ring-offset-0 cursor-text border-gray-300 focus:border-[#01C269] transition-all duration-200"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-red-500" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={passwordForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#003243] font-medium">
                        Confirm New Password
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="••••••••"
                          type="password"
                          autoComplete="off"
                          autoCorrect="off"
                          autoCapitalize="off"
                          spellCheck="false"
                          data-form-type="other"
                          className="focus-visible:ring-[#01C269] focus-visible:ring-offset-0 cursor-text border-gray-300 focus:border-[#01C269] transition-all duration-200"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-red-500" />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full bg-[#01C269] hover:bg-[#01C269]/80 transition-colors duration-200 cursor-pointer shadow-sm hover:shadow-md hover:scale-105 transform"
                >
                  Reset Password
                </Button>
              </form>
            </Form>
          )}
        </div>

        <div className="px-8 text-center text-sm">
          <Link
            href="/login"
            className="text-[#01C269] hover:text-[#01C269]/80 hover:underline transition-colors duration-200 cursor-pointer font-medium"
          >
            Back to Login
          </Link>
        </div>
      </div>

      <VerificationCodeModal
        isOpen={isVerificationModalOpen}
        onClose={() => setIsVerificationModalOpen(false)}
        onVerify={onVerifyCode}
        isLoading={isVerificationLoading}
      />
    </div>
  );
}
