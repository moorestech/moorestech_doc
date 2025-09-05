import React from 'react';
import { AuthProvider } from '@site/src/auth/contexts/AuthContext';
import { EditStateProvider } from '@site/src/contexts/EditStateContext';

export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <EditStateProvider>
        {children}
      </EditStateProvider>
    </AuthProvider>
  );
}