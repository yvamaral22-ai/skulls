"use client"

import * as React from "react"
import { CalendarDays, LayoutDashboard, Users, Scissors, BarChart3, Briefcase, LogOut } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useUser } from "@/firebase"

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

export function AppSidebar() {
  const pathname = usePathname()
  const { role, isUserLoading, logout, auth } = useUser();

  const menuItems = [
    { title: "Painel Geral", url: "/", icon: LayoutDashboard, roles: ['ADMIN', 'STAFF'] },
    { title: "Agenda", url: "/agenda", icon: CalendarDays, roles: ['ADMIN', 'STAFF'] },
    { title: "Clientes", url: "/customers", icon: Users, roles: ['ADMIN'] },
    { title: "Serviços", url: "/services", icon: Scissors, roles: ['ADMIN'] },
    { title: "Equipe", url: "/staff", icon: Briefcase, roles: ['ADMIN'] },
    { title: "Relatórios", url: "/reports", icon: BarChart3, roles: ['ADMIN'] },
  ];

  if (isUserLoading) return null;

  const effectiveRole = role || 'CLIENT';

  const filteredItems = menuItems.filter(item => 
    item.roles.includes(effectiveRole)
  );

  return (
    <Sidebar collapsible="none" className="border-r border-border bg-card w-64 hidden md:flex">
      <SidebarHeader className="p-6">
        <div className="flex items-center gap-3">
          <div className="flex aspect-square size-10 items-center justify-center rounded-xl bg-primary text-black shadow-lg shadow-primary/20">
            <BarberPoleIcon className="size-6" />
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="font-headline text-primary text-xl leading-none uppercase tracking-tighter">Barbearia Skull's</span>
            <span className="text-[9px] uppercase font-bold tracking-[0.2em] opacity-50">Gestão de Elite</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="px-4 py-4">
        <SidebarMenu className="gap-2">
          {filteredItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.url}
                className={`hover:bg-primary/10 hover:text-primary transition-all h-12 px-4 rounded-xl ${pathname === item.url ? 'bg-primary/10 text-primary font-bold border-l-4 border-primary' : ''}`}
              >
                <Link href={item.url} className="flex items-center gap-3">
                  <item.icon className="size-5" />
                  <span className="uppercase text-[10px] font-bold tracking-widest">{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-4 mt-auto border-t border-border/50">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={() => { if(confirm('Deseja sair?')) logout(auth!); }}
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors h-12 px-4 rounded-xl"
            >
              <LogOut className="size-5" />
              <span className="uppercase text-[10px] font-bold tracking-widest">Sair do Sistema</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
