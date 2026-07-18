'use client';

import { useState, useEffect, useRef } from 'react';
import { DocumentReference, onSnapshot, DocumentData, DocumentSnapshot, refEqual } from 'firebase/firestore';

export function useDoc<T = DocumentData>(docRef: DocumentReference<T> | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const activeDocRef = useRef<DocumentReference<T> | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (docRef && activeDocRef.current && refEqual(docRef, activeDocRef.current)) {
      return;
    }

    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    activeDocRef.current = docRef;

    if (!docRef) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubscribe = onSnapshot(
      docRef,
      (snapshot: DocumentSnapshot<T>) => {
        setData(snapshot.exists() ? ({ ...snapshot.data()!, id: snapshot.id } as any) : null);
        setLoading(false);
        setError(null);
      },
      (serverError) => {
        console.error("[useDoc] Permission Error:", serverError.message);
        setError(serverError);
        setData(null);
        setLoading(false);
      }
    );

    unsubscribeRef.current = unsubscribe;

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [docRef]);

  return { data, loading, error };
}