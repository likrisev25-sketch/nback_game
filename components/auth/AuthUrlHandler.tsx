'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

interface AuthUrlHandlerProps {
  onLoginRequired: () => void;
}

function AuthUrlHandlerInner({ onLoginRequired }: AuthUrlHandlerProps) {
  const searchParams = useSearchParams();

  useEffect(() => {
    const loginRequired = searchParams.get('login') === 'required';
    if (loginRequired) {
      onLoginRequired();
    }
  }, [searchParams, onLoginRequired]);

  return null;
}

export function AuthUrlHandler(props: AuthUrlHandlerProps) {
  return (
    <Suspense fallback={null}>
      <AuthUrlHandlerInner {...props} />
    </Suspense>
  );
}
