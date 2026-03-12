'use client';

import './globals.css';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { FirebaseClientProvider } from '@/firebase';
import { Toaster } from '@/components/ui/toaster';
import { BottomNav } from '@/components/bottom-nav';
import React from 'react';

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

/**
 * Ícone Barber Pole otimizado para iOS.
 * Utilizando um amarelo ligeiramente diferente para forçar a quebra de cache do iPhone.
 */
const BARBER_POLE_APP_ICON = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Crect width='24' height='24' rx='6' fill='%23ffc107'/%3E%3Cg fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M10 5h4M10 19h4'/%3E%3Crect x='8' y='7' width='8' height='10' rx='1'/%3E%3Cpath d='M8 9l8 3M8 12l8 3M8 15l8 3'/%3E%3C/g%3E%3C/svg%3E";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  React.useEffect(() => {
    document.title = "Barbearia Skull's | Gestão Profissional";
  }, []);

  return (
    <html lang="pt-BR" className="dark">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0, viewport-fit=cover" />
        
        {/* APPLE PWA - PRIORIDADE MÁXIMA PARA O ÍCONE */}
        <link rel="apple-touch-icon" href={BARBER_POLE_APP_ICON} />
        <link rel="apple-touch-icon-precomposed" href={BARBER_POLE_APP_ICON} />
        <link rel="icon" type="image/svg+xml" href={BARBER_POLE_APP_ICON} />
        <link rel="shortcut icon" href={BARBER_POLE_APP_ICON} />
        
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Skull's" />
        <meta name="theme-color" content="#ffc107" />
        
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Metal+Mania&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased bg-background pb-20 md:pb-0">
        <FirebaseClientProvider>
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
                
                <main className="p-4 md:p-8">
                  {children}
                </main>
              </SidebarInset>
            </div>
          </SidebarProvider>
          <BottomNav />
          <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}