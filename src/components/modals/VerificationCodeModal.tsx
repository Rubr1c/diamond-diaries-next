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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

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
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onVerify(code);
      onClose();
    } catch (err) {
      console.log(err);
      setError('Invalid verification code');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#1E4959] text-white">
        <DialogHeader>
          <DialogTitle className="text-white">
            Enter Verification Code
          </DialogTitle>
          <DialogDescription className="text-gray-300">
            Please enter the verification code sent to your email
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <Input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="bg-[#1E4959] border-white text-white"
              placeholder="Enter code"
              maxLength={6}
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
          </div>

          <DialogFooter>
            <Button
              type="submit"
              className="bg-[#01C269] text-white hover:bg-[#01C269]/90"
            >
              Verify
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
