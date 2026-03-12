"use client"

import * as React from "react"
import { CalendarDays, LayoutDashboard, Users, Scissors, BarChart3, Briefcase } from "lucide-react"
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

  const items = [
    { title: "Dashboard", url: "/", icon: LayoutDashboard },
    { title: "Agenda", url: "/agenda", icon: CalendarDays },
    { title: "Clientes", url: "/customers", icon: Users },
    { title: "Serviços", url: "/services", icon: Scissors },
    { title: "Equipe", url: "/staff", icon: Briefcase },
    { title: "Relatórios", url: "/reports", icon: BarChart3 },
  ]

  return (
    <Sidebar collapsible="icon" className="border-r border-border bg-card">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2 px-2">
          <div className="flex aspect-square size-10 items-center justify-center rounded-lg bg-primary text-black">
            <BarberPoleIcon className="size-6" />
          </div>
          <div className="flex flex-col gap-0.5 leading-none">
            <span className="font-headline text-primary text-xl leading-none">Barbearia Skull's</span>
            <span className="text-[10px] uppercase tracking-widest opacity-60">Gestão de Barbearia</span>
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
                className="hover:bg-primary/10 hover:text-primary transition-all h-12"
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
      
      {/* Footer com Frase 3D Flutuante - Efeito Kamui */}
      <SidebarFooter className="p-8 mt-auto flex items-center justify-center overflow-hidden min-h-[180px]">
        <div className="relative group select-none">
          <span className="dimension-text font-headline text-primary text-3xl text-center leading-tight tracking-[0.2em] px-4 block">
            O Baiano tem o molho
          </span>
        </div>
      </SidebarFooter>
      
      <SidebarRail />
    </Sidebar>
  )
}