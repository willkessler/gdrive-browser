import { Metadata } from 'next';
import { ColorSchemeScript } from '@mantine/core';
import Providers from '@/components/Providers';

// Import Mantine core styles
import '@mantine/core/styles.css';

export const metadata: Metadata = {
  title: 'Google Drive Preview App',
  description: 'Preview your Google Drive files',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <ColorSchemeScript />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
