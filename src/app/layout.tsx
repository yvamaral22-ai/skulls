'use client';

import './globals.css';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { FirebaseClientProvider } from '@/firebase';
import { Toaster } from '@/components/ui/toaster';
import { BottomNav } from '@/components/bottom-nav';
import { Scissors } from 'lucide-react';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased bg-background pb-20 md:pb-0">
        <FirebaseClientProvider>
          <SidebarProvider defaultOpen={true}>
            <div className="flex min-h-screen w-full relative">
              <AppSidebar />
              <SidebarInset className="flex-1 overflow-auto">
                {/* Header Mobile */}
                <header className="md:hidden flex items-center justify-between p-4 border-b border-border bg-card sticky top-0 z-40">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-primary rounded-md">
                      <Scissors className="h-4 w-4 text-white" />
                    </div>
                    <span className="font-black text-primary text-sm uppercase tracking-tighter">Skull Barber</span>
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
