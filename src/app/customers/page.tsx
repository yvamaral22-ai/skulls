"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { User, Search, Plus, Phone, History, Info, Pencil, Loader2 } from "lucide-react"
import { useFirestore, useCollection, useMemoFirebase, useUser } from "@/firebase"
import { collection, doc, setDoc, serverTimestamp } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { updateDocumentNonBlocking } from "@/firebase/non-blocking-updates"

export default function CustomersPage() {
  const { user, isUserLoading: isAuthLoading } = useUser()
  const db = useFirestore()
  const [searchTerm, setSearchTerm] = React.useState("")
  const [isAddOpen, setIsAddOpen] = React.useState(false)
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const { toast } = useToast()

  const barberProfileId = user?.uid

  const clientsQuery = useMemoFirebase(() => {
    if (!barberProfileId) return null;
    return collection(db, "barberProfiles", barberProfileId, "clients")
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
    if (!user) return

    const formData = new FormData(e.currentTarget)
    const name = formData.get("name") as string
    const phone = formData.get("phone") as string
    const preferences = formData.get("preferences") as string

    const clientRef = doc(collection(db, "barberProfiles", user.uid, "clients"))
    
    await setDoc(clientRef, {
      id: clientRef.id,
      barberProfileId: user.uid,
      name,
      phone,
      preferences,
      createdAt: serverTimestamp(),
    })

    toast({
      title: "Cliente Cadastrado!",
      description: `${name} foi adicionado à sua base de dados.`,
    })
    setIsAddOpen(false)
  }

  const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editingId || !user) return

    const formData = new FormData(e.currentTarget)
    const name = formData.get("name") as string
    const phone = formData.get("phone") as string
    const preferences = formData.get("preferences") as string

    const clientRef = doc(db, "barberProfiles", user.uid, "clients", editingId)
    
    updateDocumentNonBlocking(clientRef, {
      name,
      phone,
      preferences
    })

    toast({
      title: "Perfil Atualizado!",
      description: "As informações do cliente foram sincronizadas.",
    })
    setEditingId(null)
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
          <h1 className="text-3xl font-bold font-headline text-primary">EstiloCerto - Clientes</h1>
          <p className="text-muted-foreground">Seu banco de dados real de clientes.</p>
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
                <Input name="name" placeholder="Ex: João Silva" required className="bg-background" />
              </div>
              <div className="space-y-2">
                <Label>Telefone / WhatsApp</Label>
                <Input name="phone" placeholder="(11) 99999-9999" className="bg-background" />
              </div>
              <div className="space-y-2">
                <Label>Preferências Técnicas</Label>
                <Textarea name="preferences" placeholder="Ex: Gosta de degradê navalhado..." className="bg-background" />
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
                      {customer.phone || 'N/A'}
                    </div>
                  </div>
                </div>
                <Badge variant="outline" className="border-primary/30 text-primary">Real</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
                  <Info className="h-3 w-3" /> Preferências
                </p>
                <p className="text-sm italic text-muted-foreground bg-secondary/30 p-2 rounded-md border border-border/50">
                  {customer.preferences || "Nenhuma nota técnica cadastrada."}
                </p>
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
                        <Input name="name" defaultValue={customer.name} className="bg-background" required />
                      </div>
                      <div className="space-y-2">
                        <Label>Telefone</Label>
                        <Input name="phone" defaultValue={customer.phone} className="bg-background" />
                      </div>
                      <div className="space-y-2">
                        <Label>Preferências</Label>
                        <Textarea name="preferences" defaultValue={customer.preferences} className="bg-background" />
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
        {filteredCustomers.length === 0 && !isDataLoading && (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-border rounded-3xl opacity-60">
            <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-20" />
            <p className="text-muted-foreground italic">Nenhum cliente encontrado na sua base de dados.</p>
          </div>
        )}
      </div>
    </div>
  )
}