import React from 'react';
import { AuthProvider } from '@site/src/auth/contexts/AuthContext';

export default function Root({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}