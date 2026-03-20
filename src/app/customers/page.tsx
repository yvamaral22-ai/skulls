"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { User, Search, Plus, Phone, Info, Pencil, Trash2, Loader2 } from "lucide-react"
import { useFirestore, useCollection, useMemoFirebase, useUser } from "@/firebase"
import { collection, doc, setDoc, serverTimestamp } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates"

export default function CustomersPage() {
  const db = useFirestore()
  const { barberProfileId } = useUser();
  const [searchTerm, setSearchTerm] = React.useState("")
  const [isAddOpen, setIsAddOpen] = React.useState(false)
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const { toast } = useToast()

  const clientsQuery = useMemoFirebase(() => {
    if (!barberProfileId) return null;
    return collection(db, "barbers", barberProfileId, "clients")
  }, [db, barberProfileId])

  const { data: clients, isLoading: isDataLoading } = useCollection(clientsQuery)

  const filteredCustomers = React.useMemo(() => {
    if (!clients) return []
    return clients.filter(c => 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (c.phone && c.phone.includes(searchTerm))
    )
  }, [clients, searchTerm])

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!barberProfileId) return;

    const formData = new FormData(e.currentTarget)
    const name = formData.get("name") as string
    const phone = formData.get("phone") as string
    const preferences = formData.get("preferences") as string

    const clientRef = doc(collection(db, "barbers", barberProfileId, "clients"))
    
    await setDoc(clientRef, {
      id: clientRef.id,
      barberProfileId: barberProfileId,
      name,
      phone,
      preferences,
      createdAt: serverTimestamp(),
    })

    toast({
      title: "Cliente Cadastrado",
      description: `${name} foi adicionado à base de dados.`,
    })
    setIsAddOpen(false)
  }

  const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editingId || !barberProfileId) return

    const formData = new FormData(e.currentTarget)
    const name = formData.get("name") as string
    const phone = formData.get("phone") as string
    const preferences = formData.get("preferences") as string

    const clientRef = doc(db, "barbers", barberProfileId, "clients", editingId)
    
    updateDocumentNonBlocking(clientRef, {
      name,
      phone,
      preferences
    })

    toast({
      title: "Dados Atualizados",
      description: "As informações do cliente foram sincronizadas.",
    })
    setEditingId(null)
  }

  const handleDelete = (clientId: string, clientName: string) => {
    if (!barberProfileId) return;
    const clientRef = doc(db, "barbers", barberProfileId, "clients", clientId)
    deleteDocumentNonBlocking(clientRef)
    toast({
      variant: "destructive",
      title: "Cliente Removido",
      description: `${clientName} foi excluído do sistema.`,
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
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-headline text-primary">Clientes</h1>
          <p className="text-muted-foreground uppercase tracking-widest text-[10px]">Gestão de Clientes da Barbearia</p>
        </div>
        
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-black font-bold hover:bg-primary/90 shadow-lg shadow-primary/20">
              <Plus className="mr-2 h-4 w-4" /> Novo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-primary/20 shadow-2xl">
            <DialogHeader>
              <DialogTitle className="font-headline text-3xl text-primary">Cadastrar Cliente</DialogTitle>
              <DialogDescription className="uppercase tracking-tighter text-[10px]">Insira os dados para o banco de dados.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="uppercase text-[10px] font-bold tracking-widest">Nome Completo</Label>
                <Input name="name" placeholder="Ex: João Silva" required className="bg-background border-primary/20 focus:border-primary" />
              </div>
              <div className="space-y-2">
                <Label className="uppercase text-[10px] font-bold tracking-widest">Telefone / WhatsApp</Label>
                <Input name="phone" placeholder="(11) 99999-9999" className="bg-background border-primary/20 focus:border-primary" />
              </div>
              <div className="space-y-2">
                <Label className="uppercase text-[10px] font-bold tracking-widest">Preferências e Notas</Label>
                <Textarea name="preferences" placeholder="Ex: Gosta de degradê navalhado..." className="bg-background border-primary/20 focus:border-primary" />
              </div>
              <DialogFooter className="pt-4">
                <Button type="submit" className="w-full bg-primary text-black font-headline text-xl">Confirmar Cadastro</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
        <Input 
          placeholder="Pesquisar cliente por nome ou telefone..." 
          className="pl-10 bg-card border-primary/20 focus:border-primary placeholder:text-muted-foreground/30" 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {filteredCustomers.map((customer) => (
          <Card key={customer.id} className="border-border bg-card shadow-lg hover:border-primary/50 transition-all group overflow-hidden border-t-2 border-t-primary/20">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-secondary text-primary group-hover:bg-primary group-hover:text-black transition-all duration-300 transform -rotate-3">
                    <User className="h-7 w-7" />
                  </div>
                  <div>
                    <CardTitle className="font-headline text-2xl group-hover:text-primary transition-colors">{customer.name}</CardTitle>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">
                      <Phone className="h-3 w-3 text-primary" />
                      {customer.phone || 'N/A'}
                    </div>
                  </div>
                </div>
                <Badge variant="outline" className="border-primary/30 text-primary uppercase text-[8px] tracking-widest">Ativo</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase text-primary/60 flex items-center gap-2 tracking-widest">
                  <Info className="h-3 w-3" /> Notas e Preferências
                </p>
                <p className="text-sm italic text-muted-foreground bg-background p-3 rounded-lg border border-primary/10">
                  {customer.preferences || "Nenhuma nota registrada."}
                </p>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Dialog open={editingId === customer.id} onOpenChange={(open) => setEditingId(open ? customer.id : null)}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground hover:text-primary hover:bg-primary/5">
                      <Pencil className="mr-2 h-3 w-3" /> Editar
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-card border-primary/20 shadow-2xl">
                    <DialogHeader>
                      <DialogTitle className="font-headline text-3xl text-primary">Editar Cliente</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleUpdate} className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label className="uppercase text-[10px] font-bold tracking-widest">Nome</Label>
                        <Input name="name" defaultValue={customer.name} className="bg-background border-primary/20" required />
                      </div>
                      <div className="space-y-2">
                        <Label className="uppercase text-[10px] font-bold tracking-widest">Telefone</Label>
                        <Input name="phone" defaultValue={customer.phone} className="bg-background border-primary/20" />
                      </div>
                      <div className="space-y-2">
                        <Label className="uppercase text-[10px] font-bold tracking-widest">Preferências</Label>
                        <Textarea name="preferences" defaultValue={customer.preferences} className="bg-background border-primary/20" />
                      </div>
                      <DialogFooter className="pt-4">
                        <Button type="submit" className="w-full bg-primary text-black font-headline text-xl">Sincronizar Dados</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground hover:text-destructive hover:bg-destructive/5">
                      <Trash2 className="mr-2 h-3 w-3" /> Excluir
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-card border-destructive/20 shadow-2xl">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="font-headline text-2xl text-destructive">Excluir Cliente?</AlertDialogTitle>
                      <AlertDialogDescription className="uppercase tracking-tighter text-[10px]">
                        Esta operação é irreversível. Todos os dados de {customer.name} serão removidos.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="bg-secondary uppercase text-[10px] font-bold">Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(customer.id, customer.name)} className="bg-destructive text-white hover:bg-destructive/90 uppercase text-[10px] font-bold">
                        Confirmar Exclusão
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        ))}
        {filteredCustomers.length === 0 && !isDataLoading && (
          <div className="col-span-full py-24 text-center border-2 border-dashed border-primary/10 rounded-3xl opacity-60">
            <User className="h-16 w-16 mx-auto mb-4 text-primary opacity-20" />
            <p className="text-muted-foreground uppercase font-headline tracking-widest text-xl">Nenhum cliente encontrado</p>
          </div>
        )}
      </div>
    </div>
  )
}