import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono, Space_Grotesk } from 'next/font/google';

import { QueryProvider } from '@/components/providers/query-provider';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { Toaster } from '@/components/ui/sonner';

import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
});

/**
 * Space Grotesk is our headline face: geometric, confident, slightly
 * technical — the exact register we want for a data-driven betting app.
 * It pairs with Geist body the way IBM Plex pairs with Inter in fintech.
 */
const spaceGrotesk = Space_Grotesk({
  variable: '--font-heading-sans',
  subsets: ['latin'],
  display: 'swap',
  weight: ['500', '600', '700'],
});

export const metadata: Metadata = {
  title: {
    default: 'Smart Bet — Estratégia e análise de apostas',
    template: '%s · Smart Bet',
  },
  description:
    'Smart Bet é o painel de controle para apostadores profissionais. Cadastre estratégias, registre apostas e acompanhe ROI, yield e drawdown em tempo real.',
  applicationName: 'Smart Bet',
  authors: [{ name: 'Smart Bet' }],
  keywords: [
    'apostas',
    'estratégia',
    'bankroll',
    'ROI',
    'yield',
    'EV+',
    'betting tracker',
  ],
  icons: {
    icon: '/favicon.ico',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fafbfa' },
    { media: '(prefers-color-scheme: dark)', color: '#1a1d24' },
  ],
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} h-full`}
    >
      <body className="bg-background text-foreground flex min-h-full flex-col antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            {children}
            <Toaster richColors position="top-right" />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
