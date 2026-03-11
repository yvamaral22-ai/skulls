import type { Metadata } from 'next';
import './globals.css';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { FirebaseClientProvider } from '@/firebase';

export const metadata: Metadata = {
  title: 'Skull Barber Agenda',
  description: 'Gestão moderna e eficiente para barbeiros.',
};

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
      <body className="font-body antialiased">
        <FirebaseClientProvider>
          <SidebarProvider>
            <div className="flex min-h-screen w-full bg-background">
              <AppSidebar />
              <SidebarInset className="flex-1 overflow-auto bg-background p-4 md:p-8">
                {children}
              </SidebarInset>
            </div>
          </SidebarProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
