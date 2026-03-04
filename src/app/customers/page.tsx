"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { User, Search, Plus, Phone, History, Info } from "lucide-react"
import { CUSTOMERS } from "../lib/mock-data"

export default function CustomersPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline">Gerenciamento de Clientes</h1>
          <p className="text-muted-foreground">Seu banco de dados de clientes e preferências.</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 text-white">
          <Plus className="mr-2 h-4 w-4" /> Novo Cliente
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar cliente por nome ou telefone..." className="pl-10 bg-card border-border" />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {CUSTOMERS.map((customer) => (
          <Card key={customer.id} className="border-none bg-card shadow-lg hover:shadow-primary/5 transition-all group">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                    <User className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="font-headline">{customer.name}</CardTitle>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      {customer.phone}
                    </div>
                  </div>
                </div>
                <Badge variant="outline" className="border-accent text-accent">Vip</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
                  <Info className="h-3 w-3" /> Preferências
                </p>
                <p className="text-sm italic text-muted-foreground bg-secondary/30 p-2 rounded-md border border-border/50">
                  "{customer.preferences}"
                </p>
              </div>
              
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
                  <History className="h-3 w-3" /> Últimos Serviços
                </p>
                <div className="flex flex-wrap gap-2">
                  {customer.history.slice(0, 3).map((h, i) => (
                    <Badge key={i} variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                      {h}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button variant="ghost" size="sm" className="text-xs">Ver Perfil Completo</Button>
                <Button size="sm" className="text-xs bg-accent text-accent-foreground hover:bg-accent/80">Novo Agendamento</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
