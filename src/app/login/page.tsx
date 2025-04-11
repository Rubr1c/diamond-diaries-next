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
import { loginSchema } from '@/schemas/auth-schemas';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { login } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { GoogleSignInButton } from '@/components/ui/google-sign-in-button';
import { VerificationCodeModal } from '@/components/modals/VerificationCodeModal';
import { verify2fa } from '@/lib/api';

export default function Login() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [email, setEmail] = useState('');
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  useEffect(() => {
    if (localStorage.getItem('token')) {
      router.push('/');
    }
  }, [router]);

  async function handleVerify(code: string) {
    try {
      const user = await verify2fa(email, code);
      if (user) {
        router.push('/');
      } else {
        setIsModalOpen(true);
      }
    } catch (error) {
      console.log(error);
    }
  }

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    try {
      const user = await login(values.email, values.password);
      if (!user) {
        setEmail(values.email);
        setIsModalOpen(true);
        return;
      }

      router.push('/');
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <>
      <div className="flex justify-center mt-12 md:mt-24 px-4">
        <h1 className="text-4xl md:text-7xl text-white text-center">
          Welcome back
        </h1>
      </div>
      <div className="flex items-center justify-center min-h-full mt-8 md:mt-18 px-4">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="w-full max-w-sm"
          >
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="mt-4 md:mt-6 text-white foc">
                  <FormLabel className="text-base md:text-lg">Email</FormLabel>
                  <FormControl className="bg-[#1E4959] border-0 w-full">
                    <Input
                      className="text-base h-11"
                      placeholder="user@example.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-red-500" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem className="mt-4 md:mt-6 text-white">
                  <FormLabel className="text-base md:text-lg">
                    Password
                  </FormLabel>
                  <FormControl className="bg-[#1E4959] border-0 w-full">
                    <Input
                      className="text-base h-11"
                      placeholder="●●●●●●●●"
                      type="password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-red-500" />
                </FormItem>
              )}
            />
            <div className="mt-2">
              <Link
                href="/forgot-password"
                className="text-sm md:text-base hover:underline text-[#01C269]"
              >
                Forgot Password?
              </Link>
            </div>
            <div className="flex justify-center">
              <Button
                type="submit"
                className="mt-4 md:mt-6 hover:cursor-pointer bg-[#01C269] text-white w-full md:w-60 h-12 text-base md:text-lg font-bold"
              >
                LOG IN
              </Button>
            </div>
            <div className="flex mt-3 md:mt-4 justify-center">
              <p className="text-center text-white text-sm md:text-base">
                Don&apos;t have an account?
              </p>
              <Link
                href="/signup"
                className="text-sm md:text-base hover:underline text-[#01C269] ml-1"
              >
                Signup
              </Link>
            </div>
            <div className="flex justify-center mt-3 md:mt-4">
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
