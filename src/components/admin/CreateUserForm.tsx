'use client';

import { useState, FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import toast from 'react-hot-toast';
import { Loader2, Eye, EyeOff } from 'lucide-react';

interface Role {
  id: number;
  name: string;
  display_name: string;
}

interface CreateUserFormProps {
  roles: Role[];
  onSuccess?: () => void;
}

export function CreateUserForm({ roles, onSuccess }: CreateUserFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phone: '',
    roleId: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.roleId) {
      newErrors.roleId = 'Please select a role';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/admin/users/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          roleId: parseInt(formData.roleId),
          fullName: formData.fullName,
          phone: formData.phone,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create user');
      }

      toast.success('User created successfully! They can now login with the provided credentials.');

      setFormData({
        email: '',
        password: '',
        confirmPassword: '',
        fullName: '',
        phone: '',
        roleId: '',
      });
      setShowPassword(false);
      setShowConfirmPassword(false);

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: unknown) {
      toast.error((error as Error).message || 'Failed to create user');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className='space-y-4'>
      <div className='space-y-2'>
        <Label htmlFor='email'>Email *</Label>
        <Input
          id='email'
          type='email'
          value={formData.email}
          onChange={(e) => handleInputChange('email', e.target.value)}
          placeholder='user@example.com'
          disabled={isLoading}
          className={errors.email ? 'border-red-500' : ''}
        />
        {errors.email && <p className='text-sm text-red-500'>{errors.email}</p>}
      </div>

      <div className='space-y-2'>
        <Label htmlFor='password'>Password *</Label>
        <div className='relative'>
          <Input
            id='password'
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            placeholder='Enter password (min 6 characters)'
            disabled={isLoading}
            className={`pr-10 ${errors.password ? 'border-red-500' : ''}`}
          />
          <button
            type='button'
            onClick={() => setShowPassword(!showPassword)}
            className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none'
            disabled={isLoading}
          >
            {showPassword ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
          </button>
        </div>
        {errors.password && <p className='text-sm text-red-500'>{errors.password}</p>}
      </div>

      <div className='space-y-2'>
        <Label htmlFor='confirmPassword'>Confirm Password *</Label>
        <div className='relative'>
          <Input
            id='confirmPassword'
            type={showConfirmPassword ? 'text' : 'password'}
            value={formData.confirmPassword}
            onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
            placeholder='Confirm password'
            disabled={isLoading}
            className={`pr-10 ${errors.confirmPassword ? 'border-red-500' : ''}`}
          />
          <button
            type='button'
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none'
            disabled={isLoading}
          >
            {showConfirmPassword ? (
              <EyeOff className='h-4 w-4' />
            ) : (
              <Eye className='h-4 w-4' />
            )}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className='text-sm text-red-500'>{errors.confirmPassword}</p>
        )}
      </div>

      <div className='space-y-2'>
        <Label htmlFor='fullName'>Full Name</Label>
        <Input
          id='fullName'
          type='text'
          value={formData.fullName}
          onChange={(e) => handleInputChange('fullName', e.target.value)}
          placeholder='John Doe'
          disabled={isLoading}
        />
      </div>

      <div className='space-y-2'>
        <Label htmlFor='phone'>Phone</Label>
        <Input
          id='phone'
          type='tel'
          value={formData.phone}
          onChange={(e) => handleInputChange('phone', e.target.value)}
          placeholder='+1234567890'
          disabled={isLoading}
        />
      </div>

      <div className='space-y-2'>
        <Label htmlFor='roleId'>Role *</Label>
        <Select
          options={roles.map((role) => ({
            value: role.id.toString(),
            label: role.display_name,
          }))}
          value={formData.roleId}
          onChange={(value) => handleInputChange('roleId', value)}
          placeholder='Select a role'
          disabled={isLoading}
        />
        {errors.roleId && <p className='text-sm text-red-500'>{errors.roleId}</p>}
      </div>

      <Button type='submit' disabled={isLoading} className='w-full'>
        {isLoading ? (
          <>
            <Loader2 className='mr-2 h-4 w-4 animate-spin' />
            Creating User...
          </>
        ) : (
          'Create User'
        )}
      </Button>
    </form>
  );
}
