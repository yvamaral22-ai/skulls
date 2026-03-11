
'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser } from '@/firebase';

export function BottomNav() {
  const pathname = usePathname();
  const { user, role, isUserLoading, logout } = useUser();

  // Só exibe para Clientes logados no mobile, exceto na tela de login
  if (isUserLoading || !user || role !== 'CLIENT' || pathname === '/login') return null;

  const navItems = [
    { label: 'Início', href: '/client', icon: Home },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 h-16 px-4">
      <div className="flex items-center justify-around h-full">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 transition-all",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5", isActive && "animate-pulse")} />
              <span className="text-[10px] font-bold uppercase">{item.label}</span>
            </Link>
          );
        })}
        <button 
          onClick={logout}
          className="flex flex-col items-center justify-center gap-1 text-muted-foreground"
        >
          <LogOut className="h-5 w-5" />
          <span className="text-[10px] font-bold uppercase">Sair</span>
        </button>
      </div>
    </nav>
  );
}
