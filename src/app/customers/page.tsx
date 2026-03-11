
"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { User, Search, Plus, Phone, History, Info, Pencil } from "lucide-react"
import { CUSTOMERS } from "../lib/mock-data"
import { useToast } from "@/hooks/use-toast"

export default function CustomersPage() {
  const [searchTerm, setSearchTerm] = React.useState("")
  const [isAddOpen, setIsAddOpen] = React.useState(false)
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const { toast } = useToast()

  const filteredCustomers = CUSTOMERS.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.phone.includes(searchTerm)
  )

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    // Lógica de salvamento no Firestore viria aqui
    toast({
      title: "Cliente Cadastrado!",
      description: "O novo cliente foi adicionado à sua base de dados com sucesso.",
    })
    setIsAddOpen(false)
  }

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault()
    // Lógica de atualização no Firestore viria aqui
    toast({
      title: "Perfil Atualizado!",
      description: "As informações do cliente foram sincronizadas com sucesso.",
    })
    setEditingId(null)
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline text-primary">Skull Barber - Clientes</h1>
          <p className="text-muted-foreground">Seu banco de dados de clientes e preferências.</p>
        </div>
        
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20">
              <Plus className="mr-2 h-4 w-4" /> Novo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border shadow-2xl">
            <DialogHeader>
              <DialogTitle className="font-headline text-2xl">Cadastrar Novo Cliente</DialogTitle>
              <DialogDescription>Adicione um novo cliente à sua base de dados.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nome Completo</Label>
                <Input placeholder="Ex: João Silva" required className="bg-background" />
              </div>
              <div className="space-y-2">
                <Label>Telefone / WhatsApp</Label>
                <Input placeholder="(11) 99999-9999" required className="bg-background" />
              </div>
              <div className="space-y-2">
                <Label>Preferências Técnicas</Label>
                <Textarea placeholder="Ex: Gosta de degradê navalhado, usa pomada matte..." className="bg-background" />
              </div>
              <DialogFooter className="pt-4">
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white">Salvar Cliente</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Buscar cliente por nome ou telefone..." 
          className="pl-10 bg-card border-border" 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {filteredCustomers.map((customer) => (
          <Card key={customer.id} className="border-none bg-card shadow-lg hover:shadow-primary/5 transition-all group">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                    <User className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="font-headline text-lg">{customer.name}</CardTitle>
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
                <Dialog open={editingId === customer.id} onOpenChange={(open) => setEditingId(open ? customer.id : null)}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-primary">
                      <Pencil className="mr-2 h-3 w-3" /> Editar Perfil
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-card border-border shadow-2xl">
                    <DialogHeader>
                      <DialogTitle className="font-headline text-2xl">Editar Cliente</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleUpdate} className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Nome Completo</Label>
                        <Input defaultValue={customer.name} className="bg-background" required />
                      </div>
                      <div className="space-y-2">
                        <Label>Telefone</Label>
                        <Input defaultValue={customer.phone} className="bg-background" required />
                      </div>
                      <div className="space-y-2">
                        <Label>Preferências</Label>
                        <Textarea defaultValue={customer.preferences} className="bg-background" />
                      </div>
                      <DialogFooter className="pt-4">
                        <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white">Atualizar Informações</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
