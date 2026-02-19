/**
 * useAuthSync Hook
 * 
 * Syncs server session (from cookie) to Redux on mount
 * Server session is the source of truth
 */

import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setUser, clearUser } from '@/store/slices/auth/authSlice';
import { selectUser } from '@/store/slices/auth/authSelectors';

interface UseAuthSyncProps {
  serverUser: { id?: string; email?: string } | null;
}

export function useAuthSync({ serverUser }: UseAuthSyncProps) {
  const dispatch = useAppDispatch();
  const reduxUser = useAppSelector(selectUser);

  useEffect(() => {
    // Server has user → Sync to Redux (if different or missing)
    if (serverUser?.email && (!reduxUser || reduxUser.email !== serverUser.email)) {
      dispatch(setUser({
        id: serverUser.id || '1',
        email: serverUser.email,
        name: serverUser.email.split('@')[0],
      }));
    }
    
    // Server has no user, but Redux has → Clear Redux (session expired)
    if (!serverUser && reduxUser) {
      dispatch(clearUser());
    }
  }, [serverUser, reduxUser, dispatch]);
}

