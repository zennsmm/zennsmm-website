'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore } from 'firebase/firestore';
import { Auth } from 'firebase/auth';
import { Database } from 'firebase/database';

interface FirebaseContextType {
  app: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
  database: Database | null;
}

const FirebaseContext = createContext<FirebaseContextType>({
  app: null,
  firestore: null,
  auth: null,
  database: null,
});

export const useFirebase = () => useContext(FirebaseContext);
export const useFirebaseApp = () => {
  const context = useFirebase();
  return context.app;
};
export const useFirestore = () => {
  const context = useFirebase();
  return context.firestore;
};
export const useAuth = () => {
  const context = useFirebase();
  return context.auth;
};
export const useDatabase = () => {
  const context = useFirebase();
  return context.database;
};

interface FirebaseProviderProps {
  app: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
  database: Database;
  children: ReactNode;
}

export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({
  app,
  firestore,
  auth,
  database,
  children,
}) => {
  return (
    <FirebaseContext.Provider value={{ app, firestore, auth, database }}>
      {children}
    </FirebaseContext.Provider>
  );
};
