
"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Scissors, Plus, Pencil, Trash2, Clock, DollarSign, Loader2 } from "lucide-react"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, doc, setDoc } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates"

export default function ServicesPage() {
  const db = useFirestore()
  const { toast } = useToast()
  const [isAddOpen, setIsAddOpen] = React.useState(false)
  const [editingService, setEditingService] = React.useState<any | null>(null)
  
  const barberShopId = "master-barbershop";

  const servicesQuery = useMemoFirebase(() => {
    return collection(db, "barberProfiles", barberShopId, "services")
  }, [db, barberShopId])

  const { data: services, isLoading: isDataLoading } = useCollection(servicesQuery)

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const formData = new FormData(e.currentTarget)
    const name = formData.get("name") as string
    const price = parseFloat(formData.get("price") as string)
    const durationMinutes = parseInt(formData.get("duration") as string)

    const serviceRef = doc(collection(db, "barberProfiles", barberShopId, "services"))
    
    setDoc(serviceRef, {
      id: serviceRef.id,
      barberProfileId: barberShopId,
      name,
      price,
      durationMinutes
    })

    toast({
      title: "Serviço Adicionado!",
      description: `${name} foi incluído no seu catálogo.`,
    })
    setIsAddOpen(false)
  }

  const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editingService) return

    const formData = new FormData(e.currentTarget)
    const name = formData.get("name") as string
    const price = parseFloat(formData.get("price") as string)
    const durationMinutes = parseInt(formData.get("duration") as string)

    const serviceRef = doc(db, "barberProfiles", barberShopId, "services", editingService.id)
    
    updateDocumentNonBlocking(serviceRef, {
      name,
      price,
      durationMinutes
    })

    toast({
      title: "Serviço Atualizado!",
      description: "As alterações foram salvas com sucesso.",
    })
    setEditingService(null)
  }

  const handleDelete = (id: string, name: string) => {
    const serviceRef = doc(db, "barberProfiles", barberShopId, "services", id)
    deleteDocumentNonBlocking(serviceRef)
    toast({
      variant: "destructive",
      title: "Serviço Removido",
      description: `O serviço "${name}" foi excluído.`,
    })
  }

  if (isDataLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black font-headline text-primary">Serviços</h1>
          <p className="text-muted-foreground">Configure os serviços que você oferece.</p>
        </div>
        
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="h-11 font-bold bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20">
              <Plus className="mr-2 h-5 w-5" /> Novo Serviço
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border shadow-2xl">
            <DialogHeader>
              <DialogTitle className="font-headline text-2xl">Novo Serviço</DialogTitle>
              <DialogDescription>Defina o nome, preço e tempo médio.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nome do Serviço</Label>
                <Input name="name" placeholder="Ex: Corte Degradê" required className="h-12 bg-background border-2" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Preço (R$)</Label>
                  <Input name="price" type="number" step="0.01" placeholder="50.00" required className="h-12 bg-background border-2" />
                </div>
                <div className="space-y-2">
                  <Label>Duração (min)</Label>
                  <Input name="duration" type="number" placeholder="40" required className="h-12 bg-background border-2" />
                </div>
              </div>
              <DialogFooter className="pt-4">
                <Button type="submit" className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-bold">Cadastrar Serviço</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-none bg-card shadow-xl overflow-hidden">
        <CardHeader className="bg-secondary/10">
          <CardTitle className="font-headline text-lg flex items-center gap-2">
            <Scissors className="h-5 w-5 text-primary" />
            Menu de Serviços
          </CardTitle>
          <CardDescription>Gerencie seus itens do catálogo.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-secondary/20">
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="pl-6 font-bold uppercase text-xs">Nome</TableHead>
                <TableHead className="font-bold uppercase text-xs">Duração</TableHead>
                <TableHead className="font-bold uppercase text-xs text-primary">Preço</TableHead>
                <TableHead className="text-right pr-6 font-bold uppercase text-xs">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services && services.length > 0 ? (
                services.map((service) => (
                  <TableRow key={service.id} className="border-border hover:bg-primary/5 transition-colors">
                    <TableCell className="pl-6 font-bold">{service.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {service.durationMinutes} min
                      </div>
                    </TableCell>
                    <TableCell className="text-primary font-black text-lg">R$ {Number(service.price).toFixed(2)}</TableCell>
                    <TableCell className="text-right pr-6 space-x-2">
                      <Dialog open={editingService?.id === service.id} onOpenChange={(open) => setEditingService(open ? service : null)}>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-primary">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-card border-border shadow-2xl">
                          <DialogHeader>
                            <DialogTitle className="font-headline text-2xl">Editar {service.name}</DialogTitle>
                          </DialogHeader>
                          <form onSubmit={handleUpdate} className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label>Nome do Serviço</Label>
                              <Input name="name" defaultValue={service.name} className="h-12 bg-background border-2" required />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Preço (R$)</Label>
                                <Input name="price" defaultValue={service.price} type="number" step="0.01" className="h-12 bg-background border-2" required />
                              </div>
                              <div className="space-y-2">
                                <Label>Duração (min)</Label>
                                <Input name="duration" defaultValue={service.durationMinutes} type="number" className="h-12 bg-background border-2" required />
                              </div>
                            </div>
                            <DialogFooter className="pt-4">
                              <Button type="submit" className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-bold">Salvar Alterações</Button>
                            </DialogFooter>
                          </form>
                        </DialogContent>
                      </Dialog>
                      
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(service.id, service.name)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-20 text-muted-foreground italic">
                    Nenhum serviço cadastrado ainda.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
