"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Scissors, Plus, Pencil, Trash2, Clock, DollarSign, Loader2 } from "lucide-react"
import { useFirestore, useCollection, useMemoFirebase, useUser } from "@/firebase"
import { collection, doc, setDoc, deleteDoc } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates"

export default function ServicesPage() {
  const db = useFirestore()
  const { user, isUserLoading: isAuthLoading } = useUser()
  const { toast } = useToast()
  const [isAddOpen, setIsAddOpen] = React.useState(false)
  const [editingService, setEditingService] = React.useState<any | null>(null)
  
  const barberProfileId = user?.uid || "loading"

  const servicesQuery = useMemoFirebase(() => {
    if (barberProfileId === "loading") return null;
    return collection(db, "barberProfiles", barberProfileId, "services")
  }, [db, barberProfileId])

  const { data: services, isLoading: isDataLoading } = useCollection(servicesQuery)

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!user) return;

    const formData = new FormData(e.currentTarget)
    const name = formData.get("name") as string
    const price = parseFloat(formData.get("price") as string)
    const durationMinutes = parseInt(formData.get("duration") as string)

    const serviceRef = doc(collection(db, "barberProfiles", user.uid, "services"))
    
    setDoc(serviceRef, {
      id: serviceRef.id,
      barberProfileId: user.uid,
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
    if (!editingService || !user) return

    const formData = new FormData(e.currentTarget)
    const name = formData.get("name") as string
    const price = parseFloat(formData.get("price") as string)
    const durationMinutes = parseInt(formData.get("duration") as string)

    const serviceRef = doc(db, "barberProfiles", user.uid, "services", editingService.id)
    
    updateDocumentNonBlocking(serviceRef, {
      name,
      price,
      durationMinutes
    })

    toast({
      title: "Serviço Atualizado!",
      description: "As alterações foram salvas no Firestore.",
    })
    setEditingService(null)
  }

  const handleDelete = (id: string, name: string) => {
    if (!user) return;
    const serviceRef = doc(db, "barberProfiles", user.uid, "services", id)
    deleteDocumentNonBlocking(serviceRef)
    toast({
      variant: "destructive",
      title: "Serviço Removido",
      description: `O serviço "${name}" foi excluído.`,
    })
  }

  if (isAuthLoading || isDataLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
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
            <Button className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20">
              <Plus className="mr-2 h-4 w-4" /> Novo Serviço
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
                <Input name="name" placeholder="Ex: Platinado" required className="bg-background" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Preço (R$)</Label>
                  <Input name="price" type="number" step="0.01" placeholder="50.00" required className="bg-background" />
                </div>
                <div className="space-y-2">
                  <Label>Duração (min)</Label>
                  <Input name="duration" type="number" placeholder="40" required className="bg-background" />
                </div>
              </div>
              <DialogFooter className="pt-4">
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white">Cadastrar Serviço</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-none bg-card shadow-xl">
          <CardHeader>
            <CardTitle className="font-headline">Serviços Ativos</CardTitle>
            <CardDescription>Gerencie seus itens do menu.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead>Nome</TableHead>
                  <TableHead>Duração</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services?.map((service) => (
                  <TableRow key={service.id} className="border-border">
                    <TableCell className="font-semibold">{service.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        {service.durationMinutes} min
                      </div>
                    </TableCell>
                    <TableCell className="text-accent font-bold">R$ {service.price.toFixed(2)}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Dialog open={editingService?.id === service.id} onOpenChange={(open) => setEditingService(open ? service : null)}>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
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
                              <Input name="name" defaultValue={service.name} className="bg-background" required />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Preço (R$)</Label>
                                <Input name="price" defaultValue={service.price} type="number" step="0.01" className="bg-background" required />
                              </div>
                              <div className="space-y-2">
                                <Label>Duração (min)</Label>
                                <Input name="duration" defaultValue={service.durationMinutes} type="number" className="bg-background" required />
                              </div>
                            </div>
                            <DialogFooter className="pt-4">
                              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white">Salvar Alterações</Button>
                            </DialogFooter>
                          </form>
                        </DialogContent>
                      </Dialog>
                      
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(service.id, service.name)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}