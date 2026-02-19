'use client';

import { Provider as ReduxProvider } from 'react-redux';
import { store } from '@/store';
import QueryProvider from '@/components/QueryProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ReduxProvider store={store}>
      <QueryProvider>
        {children}
      </QueryProvider>
    </ReduxProvider>
  );
}

