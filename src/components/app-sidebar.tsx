
"use client"

import * as React from "react"
import { CalendarDays, LayoutDashboard, Users, Scissors, BarChart3, Briefcase, Home, LogOut } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarFooter,
} from "@/components/ui/sidebar"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useUser } from "@/firebase"

export function AppSidebar() {
  const pathname = usePathname()
  const { user, role, isUserLoading, logout } = useUser()

  // Não renderiza nada se estiver carregando, se não houver usuário ou se estiver na tela de login
  if (isUserLoading || !user || pathname === '/login') return null;

  const isAdmin = role === 'BARBER' || role === 'ADMIN'

  const items = [
    ...(isAdmin ? [
      { title: "Dashboard", url: "/", icon: LayoutDashboard },
      { title: "Agenda", url: "/agenda", icon: CalendarDays },
      { title: "Clientes", url: "/customers", icon: Users },
      { title: "Serviços", url: "/services", icon: Scissors },
      { title: "Equipe", url: "/staff", icon: Briefcase },
      { title: "Relatórios", url: "/reports", icon: BarChart3 },
    ] : [
      { title: "Início", url: "/client", icon: Home },
    ]),
  ]

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2 px-2">
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Scissors className="size-5" />
          </div>
          <div className="flex flex-col gap-0.5 leading-none text-sidebar-foreground">
            <span className="font-semibold text-primary font-headline text-lg">Skull Barber</span>
            <span className="text-xs opacity-60">{isAdmin ? 'Gestão Master' : 'Área do Cliente'}</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="px-2">
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.url}
                tooltip={item.title}
                className="hover:bg-primary/10 hover:text-primary transition-all text-sidebar-foreground h-11"
              >
                <Link href={item.url}>
                  <item.icon className="size-5" />
                  <span className="font-medium">{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={logout}
              tooltip="Sair do sistema"
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-11"
            >
              <LogOut className="size-5" />
              <span className="font-medium">Sair</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
