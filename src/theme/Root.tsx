import React from 'react';
import { AuthProvider } from '@site/src/auth/contexts/AuthContext';
import { EditStateProvider } from '@site/src/contexts/EditStateContext';
import { FileSystemProvider } from '@site/src/contexts/FileSystemContext';

export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <EditStateProvider>
        <FileSystemProvider>
          {children}
        </FileSystemProvider>
      </EditStateProvider>
    </AuthProvider>
  );
}