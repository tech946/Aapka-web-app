'use client';

import { useState, useEffect } from 'react';
import { CreateUserForm } from './CreateUserForm';
import { X } from 'lucide-react';

interface Role {
  id: number;
  name: string;
  display_name: string;
}

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateUserModal({ isOpen, onClose }: CreateUserModalProps) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchRoles();
    }
  }, [isOpen]);

  const fetchRoles = async () => {
    try {
      setLoadingRoles(true);
      const response = await fetch('/api/admin/roles');
      if (response.ok) {
        const data = await response.json();
        // Filter out Super Admin (ID: 1) - only Content Editor can be created
        const filteredRoles = (data.roles || []).filter((role: Role) => role.id !== 1);
        setRoles(filteredRoles);
      }
    } catch {
      setRoles([]);
    } finally {
      setLoadingRoles(false);
    }
  };

  if (!isOpen) return null;

  const handleSuccess = () => {
    onClose();
  };

  return (
    <div className='modal_overlay' onClick={onClose}>
      <div
        className='modal'
        onClick={(e) => e.stopPropagation()}
        style={{ width: '600px', maxWidth: '95vw' }}
      >
        <div className='modal_header'>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600, color: 'var(--text)' }}>
            Create New Team Member
          </h2>
          <button
            onClick={onClose}
            className='modal_close'
            aria-label='Close modal'
          >
            <X className='w-5 h-5' />
          </button>
        </div>

        <div className='modal_body' style={{ overflowY: 'auto', maxHeight: 'calc(85vh - 60px)' }}>
          {loadingRoles ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '3rem 0',
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  border: '3px solid var(--border)',
                  borderTopColor: 'var(--accent)',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                }}
              />
            </div>
          ) : (
            <CreateUserForm roles={roles} onSuccess={handleSuccess} />
          )}
        </div>
      </div>
    </div>
  );
}
