'use client';

import { MantineProvider } from '@mantine/core';
import { SessionProvider } from 'next-auth/react';

// Import Mantine core styles
import '@mantine/core/styles.css';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <MantineProvider>
        {children}
      </MantineProvider>
    </SessionProvider>
  );
}
