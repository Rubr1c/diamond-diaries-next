'use client';

import Image from 'next/image';
import { useUser } from '@/hooks/useUser';
import { useState, useEffect, useRef, useCallback } from 'react'; // Added useRef, useCallback
import {
  updateUser,
  initiatePasswordChange,
  changePassword,
  deleteProfilePicture, // Added import
  uploadProfilePicture, // Added import
} from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { VerificationCodeModal } from '@/components/modals/VerificationCodeModal';
import ReactCrop, { type Crop, PixelCrop } from 'react-image-crop'; // Added import
import 'react-image-crop/dist/ReactCrop.css'; // Added import
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'; // Added Dialog imports
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
      alert('Profile picture updated successfully!');
    } catch (error) {
      console.error('Failed to upload profile picture:', error);
      setPfpError('Failed to upload profile picture. Please try again.');
    } finally {
      setIsUploadingPfp(false);
    }
  };

  // --- End Profile Picture Handling Functions ---

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold">Account</h1>
      <div className="mt-4">
        <Image
          src={user?.profilePicture || '/default-profile.png'}
          alt="Profile Picture"
          width={96}
          height={96}
          className="rounded-full cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => fileInputRef.current?.click()} // Trigger file input
        />
        {/* Hidden file input */}
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={onSelectFile}
          style={{ display: 'none' }}
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
                style={{ maxHeight: '70vh' }} // Limit image display height
              />
            </ReactCrop>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCropModalOpen(false)}
              disabled={isUploadingPfp}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCropConfirm}
              disabled={!completedCrop || isUploadingPfp}
            >
              {isUploadingPfp ? 'Uploading...' : 'Confirm Crop'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
