"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Scissors, Plus, Pencil, Trash2, Clock, DollarSign } from "lucide-react"
import { SERVICES } from "../lib/mock-data"

export default function ServicesPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline">Serviços e Preços</h1>
          <p className="text-muted-foreground">Configure os serviços que você oferece na EstiloCerto.</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 text-white">
          <Plus className="mr-2 h-4 w-4" /> Novo Serviço
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-none bg-card shadow-xl">
          <CardHeader>
            <CardTitle className="font-headline">Serviços Ativos</CardTitle>
            <CardDescription>Gerencie seus itens do menu e ajuste conforme necessário.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead>Nome do Serviço</TableHead>
                  <TableHead>Duração</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {SERVICES.map((service) => (
                  <TableRow key={service.id} className="border-border hover:bg-secondary/20">
                    <TableCell className="font-semibold">{service.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        {service.duration} min
                      </div>
                    </TableCell>
                    <TableCell className="text-accent font-bold">R$ {service.price.toFixed(2)}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-none bg-card shadow-xl">
            <CardHeader className="bg-primary/10">
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                Dica Financeira
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Revisar seus preços trimestralmente pode ajudar a manter sua margem de lucro. Considere pacotes mensais para fidelizar clientes.
              </p>
            </CardContent>
          </Card>

          <Card className="border-none bg-card shadow-xl overflow-hidden">
             <div className="relative h-40 w-full">
                <img 
                  src="https://picsum.photos/seed/barber-style/600/400" 
                  alt="Barbershop interior"
                  className="object-cover w-full h-full opacity-60"
                  data-ai-hint="barber shop"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
                <div className="absolute bottom-4 left-4">
                  <h3 className="text-xl font-bold font-headline">Ambiente Premium</h3>
                  <p className="text-xs text-muted-foreground">Valorize seu trabalho.</p>
                </div>
             </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
