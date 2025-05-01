'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import { Button } from '@/components/ui/button';
import { verifySchema } from '@/schemas/auth-schemas';
import { useForm, FormProvider } from 'react-hook-form';
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

interface VerificationCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerify: (code: string) => Promise<void>;
}

export function VerificationCodeModal({
  isOpen,
  onClose,
  onVerify,
}: VerificationCodeModalProps) {
  const form = useForm<z.infer<typeof verifySchema>>({
    resolver: zodResolver(verifySchema),
    defaultValues: {
      code: '',
    },
  });
  const [error, setError] = useState('');

  async function onSubmit(data: z.infer<typeof verifySchema>) {
    try {
      await onVerify(data.code);
      onClose();
    } catch (err) {
      console.error(err);
      setError('Invalid verification code');
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#1E4959] text-white flex flex-col">
        <DialogHeader className="items-start">
          <DialogTitle className="text-white">
            Enter Verification Code
          </DialogTitle>
          <DialogDescription className="text-gray-300">
            Please enter the verification code sent to your email
          </DialogDescription>
        </DialogHeader>

        <FormProvider {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6 flex flex-col items-center w-full"
          >
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem className="flex flex-col items-center mt-5">
                  <FormControl>
                    <InputOTP maxLength={6} {...field} autoComplete="off">
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </FormControl>
                  {error && <FormMessage className="text-center mt-2 text-red-500">{error}</FormMessage>}
                </FormItem>
              )}
            />

            <DialogFooter className="w-full flex justify-center">
              <Button
                type="submit"
                className="bg-[#01C269] text-white hover:bg-[#01C269]/90 hover:cursor-pointer"
              >
                Verify
              </Button>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
