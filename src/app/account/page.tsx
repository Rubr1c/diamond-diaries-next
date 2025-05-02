'use client';

import Image from 'next/image';
import { useUser } from '@/hooks/useUser';
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  updateUser,
  initiatePasswordChange,
  changePassword,
  deleteProfilePicture,
  uploadProfilePicture,
} from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { VerificationCodeModal } from '@/components/modals/VerificationCodeModal';
import ReactCrop, { type Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
import { toast } from 'sonner';
import { Check } from 'lucide-react';

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

  // --- State for Profile Picture Cropping ---
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [imgSrc, setImgSrc] = useState('');
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [isUploadingPfp, setIsUploadingPfp] = useState(false);
  const [pfpError, setPfpError] = useState('');
  const imgRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // --- End State for Profile Picture Cropping ---

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
      toast.success('Settings updated successfully!');
    } catch (error) {
      console.error('Failed to update user settings:', error);
      toast.error('Failed to update settings. Please try again.');
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

      toast.success('Password changed successfully!');
    } catch (err) {
      console.error('Error changing password:', err);
      setPasswordChangeError('Failed to change password. Please try again.');
    } finally {
      setIsVerificationModalOpen(false);
    }
  };

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setCrop(undefined);
      const reader = new FileReader();
      reader.addEventListener('load', () =>
        setImgSrc(reader.result?.toString() || '')
      );
      reader.readAsDataURL(e.target.files[0]);
      setIsCropModalOpen(true);
      setPfpError('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const getCroppedImg = useCallback(
    async (
      image: HTMLImageElement,
      cropData: PixelCrop
    ): Promise<File | null> => {
      const canvas = document.createElement('canvas');
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;
      canvas.width = cropData.width;
      canvas.height = cropData.height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        return null;
      }

      const pixelRatio = window.devicePixelRatio;
      canvas.width = cropData.width * pixelRatio;
      canvas.height = cropData.height * pixelRatio;
      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      ctx.imageSmoothingQuality = 'high';

      ctx.drawImage(
        image,
        cropData.x * scaleX,
        cropData.y * scaleY,
        cropData.width * scaleX,
        cropData.height * scaleY,
        0,
        0,
        cropData.width,
        cropData.height
      );

      return new Promise((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Canvas is empty'));
              return;
            }
            // Ensure the blob has a type, default to png if needed
            const fileType = blob.type || 'image/png';
            const fileName = `profile_picture.${
              fileType.split('/')[1] || 'png'
            }`;
            resolve(new File([blob], fileName, { type: fileType }));
          },
          'image/png', // Specify PNG format, can be changed to jpeg etc.
          1 // Quality argument (0 to 1)
        );
      });
    },
    []
  );

  const handleCropConfirm = async () => {
    if (!completedCrop || !imgRef.current) {
      setPfpError('Could not process the image crop.');
      return;
    }

    setIsUploadingPfp(true);
    setPfpError('');

    try {
      const croppedImageFile = await getCroppedImg(
        imgRef.current,
        completedCrop
      );
      if (!croppedImageFile) {
        throw new Error('Failed to create cropped image file.');
      }

      try {
        await deleteProfilePicture();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (deleteError: any) {
        if (
          deleteError?.response?.status !== 404 &&
          deleteError?.response?.status !== 204
        ) {
          console.warn(
            'Could not delete existing profile picture, proceeding with upload:',
            deleteError
          );
        }
      }

      await uploadProfilePicture(croppedImageFile);

      queryClient.invalidateQueries({ queryKey: ['user'] });

      setIsCropModalOpen(false);
      setImgSrc('');
      setCrop(undefined);
      setCompletedCrop(undefined);
      toast.success('Profile picture updated successfully!');
    } catch (error) {
      console.error('Failed to upload profile picture:', error);
      setPfpError('Failed to upload profile picture. Please try again.');
    } finally {
      setIsUploadingPfp(false);
    }
  };

  // --- End Profile Picture Handling Functions ---

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#003243] to-[#002233] pt-16">
      <div className="container mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md p-6 max-w-xl mx-auto">
          <div className="flex flex-col items-center mb-8">
            <div className="relative">
              <Image
                src={user?.profilePicture || '/default-profile.png'}
                alt="Profile Picture"
                width={120}
                height={120}
                className="rounded-full border-4 border-white shadow-md cursor-pointer hover:opacity-80 transition-all duration-200 hover:shadow-lg"
                onClick={() => fileInputRef.current?.click()}
              />
              {user?.enabled2fa && (
                <div className="absolute bottom-1 right-1 bg-[#01C269] rounded-full p-1 border-2 border-white">
                  <Check size={16} className="text-white" />
                </div>
              )}
            </div>
            <h2 className="text-xl font-bold mt-3 text-[#003243]">
              {user?.username || 'User'}
            </h2>
            <div className="bg-gray-100 rounded-full px-4 py-1 mt-1 text-sm">
              <span className="text-[#003243]">Journaling Streak</span>
              <span className="font-bold ml-2">{user?.streak} Days 🔥</span>
            </div>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={onSelectFile}
              style={{ display: 'none' }}
            />
          </div>

          <div className="bg-gray-50 rounded-lg p-5 mb-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4 text-[#003243]">
              Settings
            </h3>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label htmlFor="username" className="text-gray-700 font-medium">
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  className="w-2/3 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#003243] focus:border-[#003243] transition-all duration-200 cursor-text"
                  value={editedUser.username}
                  onChange={handleInputChange}
                />
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-700 font-medium">Email</span>
                <span className="text-gray-600 w-2/3 px-3 py-2">
                  {user?.email}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-700 font-medium">Enable 2FA</span>
                <button
                  className={`w-24 px-3 py-2 rounded-full transition-all duration-200 ${
                    editedUser.enabled2fa
                      ? 'bg-[#01C269] text-white hover:bg-[#01A050]'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  } hover:shadow-md cursor-pointer`}
                  onClick={() => toggleSetting('enabled2fa')}
                >
                  {editedUser.enabled2fa ? 'Enabled' : 'Disabled'}
                </button>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-700 font-medium">
                  Allow AI title access
                </span>
                <button
                  className={`w-24 px-3 py-2 rounded-full transition-all duration-200 ${
                    editedUser.aiAllowTitleAccess
                      ? 'bg-[#01C269] text-white hover:bg-[#01A050]'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  } hover:shadow-md cursor-pointer`}
                  onClick={() => toggleSetting('aiAllowTitleAccess')}
                >
                  {editedUser.aiAllowTitleAccess ? 'Enabled' : 'Disabled'}
                </button>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-700 font-medium">
                  Allow AI content access
                </span>
                <button
                  className={`w-24 px-3 py-2 rounded-full transition-all duration-200 ${
                    editedUser.aiAllowContentAccess
                      ? 'bg-[#01C269] text-white hover:bg-[#01A050]'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  } hover:shadow-md cursor-pointer`}
                  onClick={() => toggleSetting('aiAllowContentAccess')}
                >
                  {editedUser.aiAllowContentAccess ? 'Enabled' : 'Disabled'}
                </button>
              </div>
            </div>

            {hasChanges && (
              <button
                className="w-full mt-6 bg-[#003243] hover:bg-[#004d6b] text-white font-medium py-2 px-4 rounded-md transition-all duration-200 hover:shadow-md hover:scale-[1.02] cursor-pointer"
                onClick={handleSaveChanges}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            )}
          </div>

          {/* Password Change Section */}
          <div className="bg-gray-50 rounded-lg p-5 shadow-sm">
            <h3 className="text-lg font-semibold mb-4 text-[#003243]">
              Change Password
            </h3>

            {passwordChangeError && (
              <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {passwordChangeError}
              </div>
            )}

            <Form {...passwordForm}>
              <form
                onSubmit={passwordForm.handleSubmit(onPasswordChangeSubmit)}
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
                      <FormLabel className="text-gray-700">
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
                          className="focus:ring-[#003243] focus:border-[#003243] transition-all duration-200"
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
                      <FormLabel className="text-gray-700">
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
                          className="focus:ring-[#003243] focus:border-[#003243] transition-all duration-200"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full bg-[#01C269] hover:bg-[#01A050] transition-all duration-200 hover:shadow-md hover:scale-[1.02] cursor-pointer"
                >
                  Change Password
                </Button>
              </form>
            </Form>
          </div>

          <div className="mt-6 flex justify-center">
            <button
              className="bg-[#003243] text-white px-6 py-2 rounded-md hover:bg-[#004d6b] transition-all duration-200 hover:shadow-md hover:scale-[1.02] cursor-pointer"
              onClick={() => window.history.back()}
            >
              Back to Journal
            </button>
          </div>
        </div>
      </div>

      <VerificationCodeModal
        isOpen={isVerificationModalOpen}
        onClose={() => setIsVerificationModalOpen(false)}
        onVerify={onVerifyCode}
      />

      {/* --- Profile Picture Crop Modal --- */}
      <Dialog open={isCropModalOpen} onOpenChange={setIsCropModalOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Crop Profile Picture</DialogTitle>
          </DialogHeader>
          {pfpError && (
            <div className="my-2 bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded">
              {pfpError}
            </div>
          )}
          {imgSrc && (
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={1} // Enforce square aspect ratio
              minWidth={50} // Minimum crop size
              minHeight={50}
              circularCrop // Optional: for circular preview
            >
              <img
                ref={imgRef}
                alt="Crop me"
                src={imgSrc}
                style={{ maxHeight: '70vh' }}
              />
            </ReactCrop>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCropModalOpen(false)}
              disabled={isUploadingPfp}
              className="hover:bg-gray-100 transition-all duration-200 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCropConfirm}
              disabled={!completedCrop || isUploadingPfp}
              className="bg-[#003243] hover:bg-[#004d6b] transition-all duration-200 cursor-pointer"
            >
              {isUploadingPfp ? 'Uploading...' : 'Confirm Crop'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
