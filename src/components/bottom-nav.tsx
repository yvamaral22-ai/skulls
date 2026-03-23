'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, CalendarDays, Users, BarChart3, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser } from '@/firebase';

export function BottomNav() {
  const pathname = usePathname();
  const { user, isUserLoading, logout, auth } = useUser();

  // Exibe para usuários logados no mobile
  if (isUserLoading || !user || pathname === '/login') return null;

  const navItems = [
    { label: 'Início', href: '/', icon: LayoutDashboard },
    { label: 'Agenda', href: '/agenda', icon: CalendarDays },
    { label: 'Clientes', href: '/customers', icon: Users },
    { label: 'Relatórios', href: '/reports', icon: BarChart3 },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card/80 backdrop-blur-lg border-t border-border z-50 h-16 px-4 safe-area-bottom">
      <div className="flex items-center justify-around h-full max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 transition-all px-2",
                isActive ? "text-primary scale-110" : "text-muted-foreground opacity-60"
              )}
            >
              <Icon className={cn("h-5 w-5", isActive && "fill-primary/20")} />
              <span className="text-[9px] font-bold uppercase tracking-tighter">{item.label}</span>
            </Link>
          );
        })}
        <button 
          onClick={() => {
            if(confirm('Deseja sair do sistema?')) logout(auth!);
          }}
          className="flex flex-col items-center justify-center gap-1 text-muted-foreground opacity-60 px-2"
        >
          <LogOut className="h-5 w-5" />
          <span className="text-[9px] font-bold uppercase tracking-tighter">Sair</span>
        </button>
      </div>
    </nav>
  );
}