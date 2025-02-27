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

export default function Login() {
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  function onSubmit(values: z.infer<typeof loginSchema>) {
    console.log(values);
  }

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
                  <FormMessage />
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
                    <Input placeholder="●●●●●●●●" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div>
              <Link
                href="/forgot-password"
                className="text-sm hover:underline text-[#01C269]"
              >
                Forgot Password?
              </Link>
            </div>
            <div className="flex justify-center">
              <Button
                type="submit"
                className="mt-5 hover:cursor-pointer bg-[#01C269] text-white w-52 font-bold"
              >
                LOG IN
              </Button>
            </div>
            <div className='flex mt-2 justify-center'>
              <p className="text-center text-white text-sm">
                Don&apos;t have an account?
              </p>
              <Link
                href="/signup"
                className="text-sm hover:underline text-[#01C269] ml-1"
              >
                Signup 
              </Link>
            </div>
          </form>
        </Form>
      </div>
    </>
  );
}
