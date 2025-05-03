'use client';

import Image from 'next/image';
import { useUser } from '@/hooks/useUser';
import { useState, useEffect, useRef } from 'react';
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
import { Check, ZoomIn, ZoomOut, Move } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

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
  const [isVerificationLoading, setIsVerificationLoading] = useState(false);
  const [passwordChangeError, setPasswordChangeError] = useState('');

  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [imgSrc, setImgSrc] = useState('');
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isUploadingPfp, setIsUploadingPfp] = useState(false);
  const [pfpError, setPfpError] = useState('');
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

      await updateUser(changedFields);

      queryClient.invalidateQueries({ queryKey: ['user'] });

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

      setIsVerificationLoading(true);
      setIsVerificationModalOpen(true);
      await initiatePasswordChange(user.email);
      setIsVerificationLoading(false);
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
      setIsVerificationLoading(false);
      return;
    }

    try {
      const newPassword = localStorage.getItem('newPassword');
      if (!newPassword) {
        setPasswordChangeError('Password data not found. Please try again.');
        setIsVerificationLoading(false);
        return;
      }

      await changePassword(user.email, code, newPassword);

      localStorage.removeItem('newPassword');
      passwordForm.reset();

      toast.success('Password changed successfully!');
    } catch (err) {
      console.error('Error changing password:', err);
      setPasswordChangeError('Failed to change password. Please try again.');
      setIsVerificationLoading(false);
    } finally {
      setIsVerificationModalOpen(false);
      setIsVerificationLoading(false);
    }
  };

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImgSrc(reader.result?.toString() || '');
        setPosition({ x: 0, y: 0 });
        setZoom(1);
        setPfpError('');
        setIsCropModalOpen(true);
      });
      reader.readAsDataURL(e.target.files[0]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const initCrop = () => {
    if (imgRef.current && containerRef.current) {
      const img = imgRef.current;
      const container = containerRef.current;
      const rect = container.getBoundingClientRect();
      const cw = rect.width;
      const ch = rect.height;

      const iw = img.naturalWidth;
      const ih = img.naturalHeight;

      if (iw === 0 || ih === 0 || cw === 0 || ch === 0) {
        console.error('Image or container dimensions are zero during init.');
        setPfpError('Could not initialize image editor. Dimensions invalid.');
        return;
      }

      const scaleX = cw / iw;
      const scaleY = ch / ih;
      const initialZoom = Math.max(scaleX, scaleY);

      const clampedInitialZoom = Math.max(initialZoom, 0.1);

      setZoom(clampedInitialZoom);

      const scaledW = iw * clampedInitialZoom;
      const scaledH = ih * clampedInitialZoom;
      const initialX = (cw - scaledW) / 2;
      const initialY = (ch - scaledH) / 2;

      const minX = cw - scaledW;
      const minY = ch - scaledH;

      setPosition({
        x: Math.min(0, Math.max(minX, initialX)),
        y: Math.min(0, Math.max(minY, initialY)),
      });
    } else {
      console.error('Image ref or container ref not available for initCrop');
      setPfpError('Could not initialize image editor.');
    }
  };

  const handleCropConfirm = async () => {
    if (!imgRef.current || !containerRef.current) {
      setPfpError('Could not process the image. Refs missing.');
      return;
    }

    setIsUploadingPfp(true);
    setPfpError('');

    try {
      const img = imgRef.current;
      const container = containerRef.current;
      const containerRect = container.getBoundingClientRect();
      const canvas = document.createElement('canvas');

      const outputSize = containerRect.width;
      canvas.width = outputSize;
      canvas.height = outputSize;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Could not get canvas context');
      }

      ctx.beginPath();
      ctx.arc(
        canvas.width / 2,
        canvas.height / 2,
        canvas.width / 2,
        0,
        Math.PI * 2
      );
      ctx.closePath();
      ctx.clip();

      const sourceX = -position.x / zoom;
      const sourceY = -position.y / zoom;
      const sourceWidth = outputSize / zoom;
      const sourceHeight = outputSize / zoom;

      const destX = 0;
      const destY = 0;
      const destWidth = outputSize;
      const destHeight = outputSize;

      ctx.drawImage(
        img,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        destX,
        destY,
        destWidth,
        destHeight
      );

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((b) => resolve(b), 'image/png', 1);
      });

      if (!blob) {
        throw new Error('Failed to create image blob');
      }

      const file = new File([blob], 'profile_picture.png', {
        type: 'image/png',
      });

      try {
        await deleteProfilePicture();
      } catch (deleteError: unknown) {
        const errorResponse = deleteError as { response?: { status?: number } };
        if (
          errorResponse?.response?.status !== 404 &&
          errorResponse?.response?.status !== 204
        ) {
          console.warn(
            'Could not delete existing profile picture, proceeding with upload:',
            deleteError
          );
        }
      }
      await uploadProfilePicture(file);
      queryClient.invalidateQueries({ queryKey: ['user'] });

      setIsCropModalOpen(false);
      setImgSrc('');
      setZoom(1);
      setPosition({ x: 0, y: 0 });
      toast.success('Profile picture updated successfully!');
    } catch (error: unknown) {
      console.error('Failed to upload profile picture:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Please try again.';
      setPfpError(`Failed to upload profile picture: ${errorMessage}`);
    } finally {
      setIsUploadingPfp(false);
    }
  };

  const handleWheel = (e: WheelEvent | React.WheelEvent<HTMLDivElement>) => {
    if (e instanceof WheelEvent) {
      e.preventDefault();
    }
    if (!imgRef.current || !containerRef.current) return;

    const img = imgRef.current;
    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;

    const scaleAmount = e.deltaY > 0 ? -0.05 : 0.05;
    let newZoom = zoom + scaleAmount;

    const minZoomX = rect.width / iw;
    const minZoomY = rect.height / ih;
    const minZoom = Math.max(minZoomX, minZoomY, 0.1);
    newZoom = Math.min(2, Math.max(minZoom, newZoom));

    if (newZoom === zoom) return;

    const scaledW = iw * newZoom;
    const scaledH = ih * newZoom;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const dx = (mouseX - position.x) * (newZoom / zoom - 1);
    const dy = (mouseY - position.y) * (newZoom / zoom - 1);

    let newX = position.x - dx;
    let newY = position.y - dy;

    const minX = rect.width - scaledW;
    const minY = rect.height - scaledH;
    newX = Math.min(0, Math.max(minX, newX));
    newY = Math.min(0, Math.max(minY, newY));

    setZoom(newZoom);
    setPosition({ x: newX, y: newY });
  };

  useEffect(() => {
    const container = containerRef.current;

    const wheelHandler = (e: WheelEvent) => {
      handleWheel(e);
    };

    if (container) {
      container.addEventListener('wheel', wheelHandler, { passive: false });
    }

    return () => {
      if (container) {
        container.removeEventListener('wheel', wheelHandler);
      }
    };
  }, [handleWheel]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!imgRef.current) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    if (containerRef.current) {
      containerRef.current.style.cursor = 'grabbing';
    }
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      if (containerRef.current) {
        containerRef.current.style.cursor = 'grab';
      }
    }
  };

  const handleMouseLeave = () => {
    handleMouseUp();
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !imgRef.current || !containerRef.current) return;
    e.preventDefault();

    const img = imgRef.current;
    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;

    let newX = e.clientX - dragStart.x;
    let newY = e.clientY - dragStart.y;

    const scaledW = iw * zoom;
    const scaledH = ih * zoom;
    const minX = rect.width - scaledW;
    const minY = rect.height - scaledH;

    newX = Math.min(0, Math.max(minX, newX));
    newY = Math.min(0, Math.max(minY, newY));

    setPosition({ x: newX, y: newY });
  };

  const handleZoomChange = (value: number[]) => {
    if (!imgRef.current || !containerRef.current) return;
    let newZoom = value[0];

    const img = imgRef.current;
    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;

    const minZoomX = rect.width / iw;
    const minZoomY = rect.height / ih;
    const minZoom = Math.max(minZoomX, minZoomY, 0.1);
    newZoom = Math.min(2, Math.max(minZoom, newZoom));

    if (newZoom === zoom) return;

    const scaledW = iw * newZoom;
    const scaledH = ih * newZoom;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const dx = (centerX - position.x) * (newZoom / zoom - 1);
    const dy = (centerY - position.y) * (newZoom / zoom - 1);

    let newX = position.x - dx;
    let newY = position.y - dy;

    const minX = rect.width - scaledW;
    const minY = rect.height - scaledH;
    newX = Math.min(0, Math.max(minX, newX));
    newY = Math.min(0, Math.max(minY, newY));

    setZoom(newZoom);
    setPosition({ x: newX, y: newY });
  };

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
                <label htmlFor="username" className="text-gray-700">
                  Username
                </label>
                <Input
                  id="username"
                  type="text"
                  value={editedUser.username}
                  onChange={handleInputChange}
                  className="w-1/2 border-gray-300 rounded-md shadow-sm focus:border-[#00778a] focus:ring focus:ring-[#00778a] focus:ring-opacity-50"
                />
              </div>

              <div className="flex justify-between items-center">
                <label className="text-gray-700">Enable 2FA</label>
                <button
                  onClick={() => toggleSetting('enabled2fa')}
                  className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00778a] ${
                    editedUser.enabled2fa ? 'bg-[#01C269]' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-200 ease-in-out ${
                      editedUser.enabled2fa ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex justify-between items-center">
                <label className="text-gray-700">Allow AI Title Access</label>
                <button
                  onClick={() => toggleSetting('aiAllowTitleAccess')}
                  className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00778a] ${
                    editedUser.aiAllowTitleAccess
                      ? 'bg-[#01C269]'
                      : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-200 ease-in-out ${
                      editedUser.aiAllowTitleAccess
                        ? 'translate-x-6'
                        : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex justify-between items-center">
                <label className="text-gray-700">Allow AI Content Access</label>
                <button
                  onClick={() => toggleSetting('aiAllowContentAccess')}
                  className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00778a] ${
                    editedUser.aiAllowContentAccess
                      ? 'bg-[#01C269]'
                      : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-200 ease-in-out ${
                      editedUser.aiAllowContentAccess
                        ? 'translate-x-6'
                        : 'translate-x-1'
                    }`}
                  />
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
        isLoading={isVerificationLoading}
      />

      <Dialog open={isCropModalOpen} onOpenChange={setIsCropModalOpen}>
        <DialogContent
          className="sm:max-w-[450px] bg-white rounded-lg shadow-xl p-0"
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
        >
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-xl font-semibold text-[#003243]">
              Edit Profile Picture
            </DialogTitle>
          </DialogHeader>
          <div className="p-6 pt-2">
            <div
              ref={containerRef}
              className="relative w-[300px] h-[300px] mx-auto rounded-full overflow-hidden border-2 border-gray-300 shadow-inner bg-gray-100 cursor-grab hover:border-[#00778a] hover:shadow-md transition-all duration-200"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onWheel={handleWheel}
              style={{ touchAction: 'none' }}
            >
              {imgSrc && (
                <img
                  ref={imgRef}
                  alt="Crop preview"
                  src={imgSrc}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    transformOrigin: 'top left', // Correct origin
                    transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
                    pointerEvents: 'none',
                    userSelect: 'none',
                    width: 'auto', // Use natural dimensions scaled by transform
                    height: 'auto',
                    maxWidth: 'none',
                    maxHeight: 'none',
                  }}
                  onLoad={initCrop} // Initialize crop on load
                  draggable="false"
                />
              )}
              {!imgSrc && (
                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                  Loading image...
                </div>
              )}
            </div>

            {/* Zoom Slider */}
            <div className="mt-6 px-4">
              <div className="flex justify-between items-center mb-2 text-sm text-gray-600">
                <ZoomOut
                  size={18}
                  className="cursor-pointer hover:text-[#003243] transition-colors duration-200"
                />
                <span className="flex-grow text-center">
                  Zoom: {Math.round(zoom * 100)}%
                </span>
                <ZoomIn
                  size={18}
                  className="cursor-pointer hover:text-[#003243] transition-colors duration-200"
                />
              </div>
              <Slider
                value={[zoom]}
                onValueChange={handleZoomChange}
                min={0.1} // Keep min at 0.1
                max={2} // Max 200%
                step={0.05} // Reverted step to 5%
                className="w-full [&>span:first-child]:h-2 [&>span:first-child]:bg-gradient-to-r [&>span:first-child]:from-[#005f73] [&>span:first-child]:to-[#0a9396] hover:[&>span:nth-child(2)]:bg-[#003243] cursor-pointer"
                aria-label="Zoom slider"
              />
            </div>

            {/* Instructions */}
            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <p className="mt-4 text-center text-sm text-gray-500 flex items-center justify-center gap-1 cursor-pointer hover:text-[#003243] transition-colors duration-200">
                    <Move size={14} /> Click and drag to position, scroll or use
                    slider to zoom.
                  </p>
                </TooltipTrigger>
                <TooltipContent className="bg-gray-800 text-white text-xs rounded px-2 py-1 shadow-lg">
                  Adjust your profile picture.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {pfpError && (
              <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-sm shadow-md">
                {pfpError}
              </div>
            )}
          </div>

          <DialogFooter className="bg-gray-50 p-4 border-t border-gray-200 rounded-b-lg flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setIsCropModalOpen(false);
                setImgSrc(''); // Clear image src on cancel
              }}
              className="hover:bg-gray-100 transition-colors duration-200 border-gray-300 text-gray-700 hover:scale-[1.02] cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCropConfirm}
              disabled={isUploadingPfp || !imgSrc}
              className="bg-[#005f73] hover:bg-[#004c5a] text-white transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 hover:scale-[1.02] cursor-pointer"
            >
              {isUploadingPfp ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Saving...
                </>
              ) : (
                'Save Profile Picture'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
