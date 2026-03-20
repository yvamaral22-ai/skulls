'use client';

import './globals.css';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { FirebaseClientProvider, useUser } from '@/firebase';
import { Toaster } from '@/components/ui/toaster';
import { BottomNav } from '@/components/bottom-nav';
import { usePathname, useRouter } from 'next/navigation';
import React from 'react';
import { Loader2 } from 'lucide-react';

const BarberPoleIcon = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={`${className} animate-barber-spin`}
  >
    <path d="M10 2h4M10 22h4" />
    <rect x="8" y="4" width="8" height="16" rx="1" />
    <path d="M8 7l8 3M8 11l8 3M8 15l8 3" />
  </svg>
);

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (mounted && !isUserLoading && !user && pathname !== '/login') {
      router.push('/login');
    }
  }, [user, isUserLoading, pathname, router, mounted]);

  if (!mounted) return null;

  if (isUserLoading) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-6">
          <div className="h-20 w-20 rounded-2xl bg-primary flex items-center justify-center shadow-2xl shadow-primary/20">
            <BarberPoleIcon className="h-10 w-10 text-black" />
          </div>
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Barbearia Skull's</p>
          </div>
        </div>
      </div>
    );
  }

  if (pathname === '/login' || user) {
    return <>{children}</>;
  }

  return null;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  return (
    <html lang="pt-BR" className="dark">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0, viewport-fit=cover" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png.png?v=3" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Barbearia Skull's" />
        <meta name="theme-color" content="#000000" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Metal+Mania&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased bg-background">
        <FirebaseClientProvider>
          <AuthGuard>
            {isLoginPage ? (
              <main>{children}</main>
            ) : (
              <SidebarProvider defaultOpen={true}>
                <div className="flex min-h-screen w-full relative">
                  <AppSidebar />
                  <SidebarInset className="flex-1 overflow-auto">
                    <header className="md:hidden flex items-center justify-between p-4 border-b border-border bg-card sticky top-0 z-40">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-primary rounded-md">
                          <BarberPoleIcon className="h-4 w-4 text-black" />
                        </div>
                        <span className="font-headline text-primary text-sm uppercase tracking-tighter">Barbearia Skull's</span>
                      </div>
                      <SidebarTrigger />
                    </header>
                    <main className="p-4 md:p-8 pb-24 md:pb-8">
                      {children}
                    </main>
                  </SidebarInset>
                </div>
              </SidebarProvider>
            )}
            {!isLoginPage && <BottomNav />}
          </AuthGuard>
          <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
