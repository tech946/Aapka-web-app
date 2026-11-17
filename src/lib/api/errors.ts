import type { PostgrestError } from '@supabase/supabase-js';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const badRequest = (message: string) => new ApiError(400, message);
export const unauthorized = (message = 'Please sign in again.') => new ApiError(401, message);
export const forbidden = (message = 'You do not have access to this.') => new ApiError(403, message);
export const notFound = (message = 'Not found.') => new ApiError(404, message);
export const conflict = (message: string) => new ApiError(409, message);

const UNIQUE_VIOLATION = '23505';
const FOREIGN_KEY_VIOLATION = '23503';

export function fromDbError(error: PostgrestError, conflictMessage = 'That already exists.'): ApiError {
  if (error.code === UNIQUE_VIOLATION) return conflict(conflictMessage);
  if (error.code === FOREIGN_KEY_VIOLATION) return badRequest('A linked record does not exist.');
  console.error('[db]', error);
  return new ApiError(500, 'Database error. Please try again.');
}
