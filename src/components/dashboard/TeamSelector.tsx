'use client';

import { useState, useRef, useEffect } from 'react';
import { useUserRoles } from '@/hooks/use-roles';
import { useHasRoleId } from '@/hooks/use-roles';
import { RoleId } from '@/types/roles';
import { CreateUserModal } from '@/components/admin/CreateUserModal';

interface TeamSelectorProps {
  className?: string;
}

export function TeamSelector({ className = '' }: TeamSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, loading } = useUserRoles();
  const { hasAccess: isSuperAdmin, loading: roleCheckLoading } = useHasRoleId(
    RoleId.SUPER_ADMIN
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleNewTeamClick = () => {
    setIsModalOpen(true);
    setIsOpen(false);
  };

  const roleName =
    user?.primary_role?.role?.display_name ||
    user?.primary_role?.role?.name ||
    null;
  const roleInitial = roleName ? roleName.charAt(0).toUpperCase() : 'A';
  const displayName = roleName || (loading ? 'Loading...' : 'Admin');

  return (
    <>
      <div className={`team-selector ${className}`} ref={dropdownRef}>
        <button onClick={toggleDropdown} className='team-selector-button'>
          <div className='team-icon'>{roleInitial}</div>
          <span className='team-name'>{displayName}</span>
          <svg
            className={`dropdown-arrow ${isOpen ? 'open' : ''}`}
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M19 9l-7 7-7-7'
            />
          </svg>
        </button>

        {isOpen && (
          <div className='team-dropdown'>
            <div className='dropdown-header'>
              <div className='dropdown-title'>
                <h3>Teams</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className='dropdown-close'
                >
                  <svg
                    className='w-4 h-4'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M6 18L18 6M6 6l12 12'
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div className='dropdown-options'>
              <div className='team-option active'>
                <div className='inner'>
                  <div className='option-icon primary'>{roleInitial}</div>
                  <div className='option-content primary'>
                    <span className='option-text primary'>{displayName}</span>
                    <div className='active-indicator' />
                  </div>
                </div>
              </div>

              {!roleCheckLoading && isSuperAdmin && (
                <button className='team-option' onClick={handleNewTeamClick}>
                  <div className='option-icon secondary'>
                    <svg fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z'
                      />
                    </svg>
                  </div>
                  <div className='option-content'>
                    <span className='option-text'>Add Team Member</span>
                  </div>
                </button>
              )}

              <button className='team-option'>
                <div className='option-icon secondary'>
                  <svg fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z'
                    />
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M15 12a3 3 0 11-6 0 3 3 0 016 0z'
                    />
                  </svg>
                </div>
                <div className='option-content'>
                  <span className='option-text'>Team Settings</span>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>

      <CreateUserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
