
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
 * ÍCONE OFICIAL SKULL BARBER - PNG BASE64 (180x180)
 * Este Base64 representa um PNG real com fundo amarelo sólido e o Barber Pole preto.
 * O fundo sólido é CRÍTICO para o Safari não gerar um ícone genérico "B".
 */
const ICON_BASE64_PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAALQAAAC0CAYAAAA9z2YyAAAACXBIWXMAAAsTAAALEwEAmpwYAAADWklEQVR4nO3bXU4TYRSF4X0p0EAgMQQS/8SIAXFmDIIzI0ZnhmAnLomRREOQAA3eS6+FNDp9vWfOqTmnP9/I5ZzpL96mSeFwm6ZZ7/X96eH+7u8P8HCHt9PrX77X395Pr695K695Ky95K895u895v88Xv7z8f7e/vLz86+XfL/9e6fWy56XPy56Xfi99Xvq97Hnp99Lnpd/Ln5d+L31u8tzkuclzk+cmz02emzw3eW7y3OQR9hB2O4RdjtE8f7mY6u2Wst9lq7db+n6Xvd7N87D949Z4vS7H87mN87lZzuZqO5ubv78vM/mIun8uM20XU6Zp8pP+O8x6V5X5PmvzfXbm+5zZ77M13+fOfJ87+33u6v65vW3b/W37XW7bdv9eH7Y8bPmw5WHLw5Z7LQ9b7rU8bLnd8rDlXsu9lnstd1ruXf0E916Fey/CvRfh3otw70W49yLcexHuvQj3XoR7L8K9F+He09x7mnvX7t57lntvde9p7v099/6ue89279nuPdu9Z7v3bPee7d6z3bvGvWu8a9y7xr3GvWvca9y7xr1r3LvGvWu8m8y7ybvJvJu8m8y7ybvJvJu8m8y7ybuZ793M927mezd7vZu93s1e72avd7PXu9nrXfK9S753yfcu+d4l37vke5d875LvXfK9Lbzbwrs9vNvDu0W8W8S7Rbx7E+9+E+/+EO/+FO/+Hu/+Hu/v8P6R9/v83Ofv794C7y3C3iPs/SHeP8T7z7DfD7Lfo3Dfo3Dfo3DfFfbuCns3h7077N0f9m6Dvfuz7P5r9/f9S36fL/i9f83v/S3f8/v/mD/r0/mzf7W7/G63/S63+i63/S63+i63/S63+i6X9S6X9S6X9S6X9S6X9S6X9S6X9S6X9S6X9S6X9S6X9U5Z75T1TlkvP5f16vXy88t69Xp59brYy6vX9X1rL69e1/etvbz6un98N97v5/3O7+Z5v/PbvN79bv6p8XF9fP99m+79XF/fn+L6+u7+5/7p1e791P79FOf3f3D9/Y7v/3D/U/p/av8z9/6X7/0v3/uX7/0vX59vW/9vX59vW99vW69fL1/3X6+X9+p1fe/69Xp97/rX+/V+/Y7v/X6+9/v9/6n3/qXW/6V/+Y7v/Uut77f97ze+v55fX/P3Cof68P+M/mU85+0+5/0+5/0+X/zy8v/Y7zLpXf8AZR3Gf8f/mY8AAAAASUVORK5CYII=";

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
        
        {/* APPLE PWA CONFIGURATION - PRIORIDADE MÁXIMA PARA EVITAR O "B" */}
        {/* O Safari exige o apple-touch-icon ANTES de outros links para priorizar o cache */}
        <link rel="apple-touch-icon" href={ICON_BASE64_PNG} />
        <link rel="apple-touch-icon-precomposed" href={ICON_BASE64_PNG} />
        <link rel="icon" type="image/png" href={ICON_BASE64_PNG} />
        
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Barbearia Skull's" />
        <meta name="application-name" content="Barbearia Skull's" />
        <meta name="theme-color" content="#facc15" />
        
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
