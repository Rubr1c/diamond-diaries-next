'use client';

import { useState, useEffect } from 'react';
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
import { Loader2 } from 'lucide-react';

interface VerificationCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerify: (code: string) => Promise<void>;
  isLoading?: boolean; // Add optional isLoading prop that parent components can control
}

export function VerificationCodeModal({
  isOpen,
  onClose,
  onVerify,
  isLoading: externalLoading, // Accept external loading state from parent
}: VerificationCodeModalProps) {
  const form = useForm<z.infer<typeof verifySchema>>({
    resolver: zodResolver(verifySchema),
    defaultValues: {
      code: '',
    },
  });
  const [error, setError] = useState('');
  const [internalLoading, setInternalLoading] = useState(false);

  // Use either external loading state (if provided) or internal loading state
  const isLoading =
    externalLoading !== undefined ? externalLoading : internalLoading;

  // Reset form and error when modal opens
  useEffect(() => {
    if (isOpen) {
      form.reset();
      setError('');
    }
  }, [isOpen, form]);

  async function onSubmit(data: z.infer<typeof verifySchema>) {
    try {
      setInternalLoading(true);
      setError('');
      await onVerify(data.code);
      // Don't close the modal here - let the parent component decide when to close it
      // The parent component should set isOpen to false when it's ready
    } catch (err) {
      console.error(err);
      setError('Invalid verification code');
      setInternalLoading(false); // Only reset loading state on error
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={`bg-gradient-to-b from-[#003243] to-[#002233] text-white flex flex-col rounded-lg shadow-lg ${
          isLoading
            ? 'border-2 border-[#01C269] animate-pulse'
            : 'border border-[#004d6b]/30'
        }`}
      >
        <DialogHeader className="items-start">
          <DialogTitle className="text-white text-xl font-bold">
            Enter Verification Code
          </DialogTitle>
          <DialogDescription className="text-gray-300">
            {isLoading
              ? 'Sending verification code to your email...'
              : 'Please enter the verification code sent to your email'}
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
                    <InputOTP
                      maxLength={6}
                      {...field}
                      autoComplete="off"
                      className="gap-2"
                      disabled={isLoading}
                    >
                      <InputOTPGroup className="gap-2">
                        <InputOTPSlot
                          index={0}
                          className="bg-white/10 border-[#004d6b] focus:border-[#01C269] focus:bg-white/20 transition-all duration-200 cursor-text h-12 w-12"
                        />
                        <InputOTPSlot
                          index={1}
                          className="bg-white/10 border-[#004d6b] focus:border-[#01C269] focus:bg-white/20 transition-all duration-200 cursor-text h-12 w-12"
                        />
                        <InputOTPSlot
                          index={2}
                          className="bg-white/10 border-[#004d6b] focus:border-[#01C269] focus:bg-white/20 transition-all duration-200 cursor-text h-12 w-12"
                        />
                        <InputOTPSlot
                          index={3}
                          className="bg-white/10 border-[#004d6b] focus:border-[#01C269] focus:bg-white/20 transition-all duration-200 cursor-text h-12 w-12"
                        />
                        <InputOTPSlot
                          index={4}
                          className="bg-white/10 border-[#004d6b] focus:border-[#01C269] focus:bg-white/20 transition-all duration-200 cursor-text h-12 w-12"
                        />
                        <InputOTPSlot
                          index={5}
                          className="bg-white/10 border-[#004d6b] focus:border-[#01C269] focus:bg-white/20 transition-all duration-200 cursor-text h-12 w-12"
                        />
                      </InputOTPGroup>
                    </InputOTP>
                  </FormControl>
                  {error && (
                    <FormMessage className="text-center mt-2 text-red-400 bg-red-900/20 px-3 py-1 rounded-md">
                      {error}
                    </FormMessage>
                  )}
                </FormItem>
              )}
            />

            <DialogFooter className="w-full flex justify-center">
              <Button
                type="submit"
                className="bg-[#01C269] text-white hover:bg-[#01A050] transition-all duration-200 hover:shadow-md hover:scale-105 cursor-pointer px-8 py-2 rounded-md font-medium"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {externalLoading ? 'Sending Code...' : 'Verifying...'}
                  </>
                ) : (
                  'Verify'
                )}
              </Button>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
