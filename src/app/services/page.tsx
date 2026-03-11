
"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Scissors, Plus, Pencil, Trash2, Clock, DollarSign } from "lucide-react"
import { SERVICES } from "../lib/mock-data"
import { toast } from "@/hooks/use-toast"

export default function ServicesPage() {
  const [isAddOpen, setIsAddOpen] = React.useState(false)

  const handleAction = (msg: string) => {
    toast({
      title: "Serviço Atualizado",
      description: msg,
    })
    setIsAddOpen(false)
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline text-primary">Skull Barber - Serviços</h1>
          <p className="text-muted-foreground">Configure os serviços que você oferece.</p>
        </div>
        
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-white">
              <Plus className="mr-2 h-4 w-4" /> Novo Serviço
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle>Novo Serviço no Menu</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); handleAction("Novo serviço adicionado com sucesso."); }} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nome do Serviço</Label>
                <Input placeholder="Ex: Platinado" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Preço (R$)</Label>
                  <Input type="number" placeholder="50.00" required />
                </div>
                <div className="space-y-2">
                  <Label>Duração (min)</Label>
                  <Input type="number" placeholder="40" required />
                </div>
              </div>
              <Button type="submit" className="w-full">Cadastrar Serviço</Button>
            </form>
          </DialogContent>
        </Dialog>
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
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-card border-border">
                          <DialogHeader>
                            <DialogTitle>Editar {service.name}</DialogTitle>
                          </DialogHeader>
                          <form onSubmit={(e) => { e.preventDefault(); handleAction("Serviço editado com sucesso."); }} className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label>Nome</Label>
                              <Input defaultValue={service.name} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Preço</Label>
                                <Input defaultValue={service.price} type="number" />
                              </div>
                              <div className="space-y-2">
                                <Label>Duração</Label>
                                <Input defaultValue={service.duration} type="number" />
                              </div>
                            </div>
                            <Button type="submit" className="w-full">Salvar Alterações</Button>
                          </form>
                        </DialogContent>
                      </Dialog>
                      
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleAction("Serviço removido.")}
                      >
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
        </div>
      </div>
    </div>
  )
}
