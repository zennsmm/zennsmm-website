'use client';

import React, { ReactNode, useMemo } from 'react';
import { initializeFirebase } from './index';
import { FirebaseProvider } from './provider';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export const FirebaseClientProvider: React.FC<FirebaseClientProviderProps> = ({ children }) => {
  const { app, auth, db, rtdb } = useMemo(() => initializeFirebase(), []);

  return (
    <FirebaseProvider app={app} auth={auth} firestore={db} database={rtdb}>
      {children}
    </FirebaseProvider>
  );
};
