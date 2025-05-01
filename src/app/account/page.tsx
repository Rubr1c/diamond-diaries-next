'use client';

import Image from 'next/image';
import { useUser } from '@/hooks/useUser';
import { useState, useEffect } from 'react';
import { updateUser, initiatePasswordChange, changePassword } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { VerificationCodeModal } from '@/components/modals/VerificationCodeModal';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { resetPasswordSchema } from '@/schemas/auth-schemas';

export default function Account() {
  const { data: user } = useUser();
  const queryClient = useQueryClient();

  const [editedUser, setEditedUser] = useState({
    username: '',
    enabled2fa: false,
    aiAllowTitleAccess: false,
    aiAllowContentAccess: false,
  });

  const [hasChanges, setHasChanges] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [passwordChangeError, setPasswordChangeError] = useState('');

  const passwordForm = useForm<z.infer<typeof resetPasswordSchema>>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    if (user) {
      setEditedUser({
        username: user.username,
        enabled2fa: user.enabled2fa,
        aiAllowTitleAccess: user.aiAllowTitleAccess,
        aiAllowContentAccess: user.aiAllowContentAccess,
      });
    }
  }, [user]);

  // Check if there are any changes
  useEffect(() => {
    if (user) {
      const changed =
        editedUser.username !== user.username ||
        editedUser.enabled2fa !== user.enabled2fa ||
        editedUser.aiAllowTitleAccess !== user.aiAllowTitleAccess ||
        editedUser.aiAllowContentAccess !== user.aiAllowContentAccess;

      setHasChanges(changed);
    }
  }, [editedUser, user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditedUser({
      ...editedUser,
      username: e.target.value,
    });
  };

  const toggleSetting = (
    setting: 'enabled2fa' | 'aiAllowTitleAccess' | 'aiAllowContentAccess'
  ) => {
    setEditedUser({
      ...editedUser,
      [setting]: !editedUser[setting],
    });
  };

  const handleSaveChanges = async () => {
    if (!hasChanges || !user) return;

    setIsSubmitting(true);
    try {
      // Create an object only containing fields that were changed
      const changedFields: Record<string, string | boolean> = {};

      if (editedUser.username !== user.username) {
        changedFields.username = editedUser.username;
      }

      if (editedUser.enabled2fa !== user.enabled2fa) {
        changedFields.enabled2fa = editedUser.enabled2fa;
      }

      if (editedUser.aiAllowTitleAccess !== user.aiAllowTitleAccess) {
        changedFields.aiAllowTitleAccess = editedUser.aiAllowTitleAccess;
      }

      if (editedUser.aiAllowContentAccess !== user.aiAllowContentAccess) {
        changedFields.aiAllowContentAccess = editedUser.aiAllowContentAccess;
      }

      console.log('Sending only changed fields:', changedFields);

      // Send only the changed fields to the backend
      await updateUser(changedFields);

      // Refresh user data
      queryClient.invalidateQueries({ queryKey: ['user'] });

      // Show success feedback
      alert('Settings updated successfully!');
    } catch (error) {
      console.error('Failed to update user settings:', error);
      alert('Failed to update settings. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onPasswordChangeSubmit = async (
    data: z.infer<typeof resetPasswordSchema>
  ) => {
    if (!user?.email) {
      setPasswordChangeError('User email not found. Please try again later.');
      return;
    }

    setPasswordChangeError('');
    try {
      localStorage.setItem('newPassword', data.password);

      await initiatePasswordChange(user.email);

      setIsVerificationModalOpen(true);
    } catch (err) {
      console.error('Error initiating password change:', err);
      setPasswordChangeError(
        'Failed to send verification code. Please try again.'
      );
    }
  };

  const onVerifyCode = async (code: string) => {
    if (!user?.email) {
      setPasswordChangeError('User email not found. Please try again later.');
      return;
    }

    try {
      const newPassword = localStorage.getItem('newPassword');
      if (!newPassword) {
        setPasswordChangeError('Password data not found. Please try again.');
        return;
      }

      await changePassword(user.email, code, newPassword);

      localStorage.removeItem('newPassword');
      passwordForm.reset();

      alert('Password changed successfully!');
    } catch (err) {
      console.error('Error changing password:', err);
      setPasswordChangeError('Failed to change password. Please try again.');
    } finally {
      setIsVerificationModalOpen(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold">Account</h1>
      <div className="mt-4">
        <Image
          src={user?.profilePicture || '/default-profile.png'}
          alt="Profile Picture"
          width={96}
          height={96}
          className="rounded-full"
        />
        <div className="mt-4">
          <label htmlFor="username" className="block text-sm font-medium">
            Username:
          </label>
          <input
            id="username"
            type="text"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            value={editedUser.username}
            onChange={handleInputChange}
          />
        </div>

        <div className="mt-4">
          <p className="text-lg">Email: {user?.email}</p>
          <p className="text-xs text-gray-500">(Email cannot be changed)</p>
        </div>

        <div className="text-lg flex items-center mt-4">
          <span>Enable 2FA: </span>
          <button
            className={`ml-2 px-4 py-2 rounded ${
              editedUser.enabled2fa
                ? 'bg-green-500 text-white'
                : 'bg-gray-300 text-black'
            }`}
            onClick={() => toggleSetting('enabled2fa')}
          >
            {editedUser.enabled2fa ? 'Enabled' : 'Disabled'}
          </button>
        </div>

        <div className="text-lg flex items-center mt-4">
          <span>Allow AI Title Access: </span>
          <button
            className={`ml-2 px-4 py-2 rounded ${
              editedUser.aiAllowTitleAccess
                ? 'bg-green-500 text-white'
                : 'bg-gray-300 text-black'
            }`}
            onClick={() => toggleSetting('aiAllowTitleAccess')}
          >
            {editedUser.aiAllowTitleAccess ? 'Enabled' : 'Disabled'}
          </button>
        </div>

        <div className="text-lg flex items-center mt-4">
          <span>Allow AI Content Access: </span>
          <button
            className={`ml-2 px-4 py-2 rounded ${
              editedUser.aiAllowContentAccess
                ? 'bg-green-500 text-white'
                : 'bg-gray-300 text-black'
            }`}
            onClick={() => toggleSetting('aiAllowContentAccess')}
          >
            {editedUser.aiAllowContentAccess ? 'Enabled' : 'Disabled'}
          </button>
        </div>

        {hasChanges && (
          <div className="mt-6">
            <button
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              onClick={handleSaveChanges}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}

        {/* Password Change Section */}
        <div className="mt-10 border-t pt-6">
          <h2 className="text-xl font-semibold">Change Password</h2>

          {passwordChangeError && (
            <div className="mt-3 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {passwordChangeError}
            </div>
          )}

          <Form {...passwordForm}>
            <form
              onSubmit={passwordForm.handleSubmit(onPasswordChangeSubmit)}
              className="space-y-4 mt-4"
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

              <Button
                type="submit"
                className="w-full bg-[#01C269] hover:bg-[#01C269]/90"
              >
                Change Password
              </Button>
            </form>
          </Form>
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
