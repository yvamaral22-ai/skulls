
"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Briefcase, Plus, Mail, Phone, TrendingUp, Scissors } from "lucide-react"
import { STAFF } from "../lib/mock-data"

export default function StaffPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline">Gestão da Equipe</h1>
          <p className="text-muted-foreground">Gerencie seus barbeiros e suas configurações de comissão.</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 text-white">
          <Plus className="mr-2 h-4 w-4" /> Adicionar Barbeiro
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {STAFF.map((member) => (
          <Card key={member.id} className="border-none bg-card shadow-lg hover:shadow-primary/10 transition-all group overflow-hidden">
            <div className="h-2 bg-primary w-full" />
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-secondary text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300">
                    <Briefcase className="h-7 w-7" />
                  </div>
                  <div>
                    <CardTitle className="font-headline text-xl">{member.name}</CardTitle>
                    <Badge variant="secondary" className="mt-1 bg-primary/10 text-primary uppercase text-[10px]">
                      Barbeiro Senior
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-0">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-secondary/20 p-3 rounded-xl border border-border/50">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" /> Comissão
                  </p>
                  <p className="text-lg font-bold text-primary">{(member.commissionRate * 100)}%</p>
                </div>
                <div className="bg-secondary/20 p-3 rounded-xl border border-border/50">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                    <Scissors className="h-3 w-3" /> Status
                  </p>
                  <p className="text-lg font-bold text-green-500">Ativo</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4 text-primary" />
                  carlos@skullbarber.com
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4 text-primary" />
                  (11) 98888-7777
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <Button variant="outline" className="w-full text-xs hover:bg-primary hover:text-white border-primary/20">
                  Ver Agenda Individual
                </Button>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" className="flex-1 text-xs">Editar Perfil</Button>
                  <Button variant="ghost" size="sm" className="flex-1 text-xs text-destructive hover:bg-destructive/10">Inativar</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
