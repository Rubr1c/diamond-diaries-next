'use client';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { registerSchema } from '@/schemas/auth-schemas';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { register, verifyEmail } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { VerificationCodeModal } from '@/components/modals/VerificationCodeModal';
import { GoogleSignInButton } from '@/components/ui/google-sign-in-button';

export default function Login() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [email, setEmail] = useState('');
  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      username: '',
      password: '',
    },
  });

  useEffect(() => {
    if (localStorage.getItem('token')) {
      router.push('/');
    }
  }, [router]);

  async function onSubmit(values: z.infer<typeof registerSchema>) {
    try {
      if (values.password !== values.confirmPassword) {
        form.setError('confirmPassword', {
          message: 'Passwords do not match',
        });
        return;
      }
      await register(values.email, values.username, values.password);
      setEmail(values.email);
      setIsModalOpen(true);
    } catch (error) {
      console.log(error);
    }
  }

  const handleVerify = async (code: string) => {
    try {
      await verifyEmail(email, code);
      router.push('/login');
    } catch (error) {
      throw error;
    }
  };

  return (
    <>
      <div className="flex justify-center mt-20">
        <h1 className="text-5xl text-white">Welcome back</h1>
      </div>
      <div className="flex items-center justify-center min-h-full mt-20">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="mt-5 text-white foc">
                  <FormLabel>Email</FormLabel>
                  <FormControl className="bg-[#1E4959] border-0 w-72">
                    <Input placeholder="user@example.com" {...field} />
                  </FormControl>
                  <FormMessage className="text-red-500" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem className="mt-5 text-white">
                  <FormLabel>Username</FormLabel>
                  <FormControl className="bg-[#1E4959] border-0 w-72">
                    <Input placeholder="username" {...field} />
                  </FormControl>
                  <FormMessage className="text-red-500" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem className="mt-5 text-white">
                  <FormLabel>Password</FormLabel>
                  <FormControl className="bg-[#1E4959] border-0 w-72">
                    <Input type="password" placeholder="●●●●●●●●" {...field} />
                  </FormControl>
                  <FormMessage className="text-red-500" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem className="mt-5 text-white">
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl className="bg-[#1E4959] border-0 w-72">
                    <Input type="password" placeholder="●●●●●●●●" {...field} />
                  </FormControl>
                  <FormMessage className="text-red-500" />
                </FormItem>
              )}
            />
            <div className="flex justify-center">
              <Button
                type="submit"
                className="mt-5 hover:cursor-pointer bg-[#01C269] text-white w-52 font-bold"
              >
                SIGN UP
              </Button>
            </div>
            <div className="flex mt-2 justify-center">
              <p className="text-center text-white text-sm">
                Already have an account?
              </p>
              <Link
                href="/login"
                className="text-sm hover:underline text-[#01C269] ml-1"
              >
                Login
              </Link>
            </div>
            <div className='flex justify-center mt-3'>
              <GoogleSignInButton />
            </div>
          </form>
        </Form>
      </div>
      <VerificationCodeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onVerify={handleVerify}
      />
    </>
  );
}
