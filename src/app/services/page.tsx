"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Scissors, Plus, Pencil, Trash2, Clock, Loader2, Lock } from "lucide-react"
import { useFirestore, useCollection, useMemoFirebase, useUser } from "@/firebase"
import { collection, doc, setDoc } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates"

export default function ServicesPage() {
  const db = useFirestore()
  const { barberProfileId, role } = useUser();
  const { toast } = useToast()
  const [isAddOpen, setIsAddOpen] = React.useState(false)
  const [editingService, setEditingService] = React.useState<any | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const servicesQuery = useMemoFirebase(() => {
    if (!barberProfileId) return null;
    return collection(db, "barbers", barberProfileId, "services")
  }, [db, barberProfileId])

  const { data: services, isLoading: isDataLoading } = useCollection(servicesQuery)

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!barberProfileId) {
      toast({ variant: "destructive", title: "Erro", description: "Sessão inválida. Tente logar novamente." })
      return;
    }

    setIsSubmitting(true)
    const formData = new FormData(e.currentTarget)
    const name = formData.get("name") as string
    const price = parseFloat(formData.get("price") as string)
    const durationMinutes = parseInt(formData.get("duration") as string)

    try {
      const serviceRef = doc(collection(db, "barbers", barberProfileId, "services"))
      await setDoc(serviceRef, {
        id: serviceRef.id,
        barberProfileId: barberProfileId,
        name,
        price,
        durationMinutes
      })

      toast({
        title: "Serviço Adicionado",
        description: `O serviço "${name}" foi incluído no catálogo.`,
      })
      setIsAddOpen(false)
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao salvar", description: "Verifique sua conexão." })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editingService || !barberProfileId) return

    setIsSubmitting(true)
    const formData = new FormData(e.currentTarget)
    const name = formData.get("name") as string
    const price = parseFloat(formData.get("price") as string)
    const durationMinutes = parseInt(formData.get("duration") as string)

    try {
      const serviceRef = doc(db, "barbers", barberProfileId, "services", editingService.id)
      await setDoc(serviceRef, { name, price, durationMinutes }, { merge: true })

      toast({
        title: "Serviço Atualizado",
        description: "As informações do serviço foram sincronizadas.",
      })
      setEditingService(null)
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao atualizar" })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (role === 'STAFF') {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center space-y-4">
        <Lock className="h-12 w-12 text-destructive opacity-40" />
        <h1 className="text-2xl font-headline text-primary">Acesso Restrito</h1>
        <p className="text-muted-foreground">Apenas o administrador pode gerenciar serviços.</p>
        <Button asChild variant="outline" className="mt-4"><a href="/">Voltar</a></Button>
      </div>
    );
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
          <h1 className="text-4xl font-headline text-primary">Serviços</h1>
          <p className="text-muted-foreground uppercase tracking-widest text-[10px]">Catálogo de Serviços Barbearia Skull's</p>
        </div>
        
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="h-12 bg-primary text-black font-bold hover:bg-primary/90 shadow-lg shadow-primary/20">
              <Plus className="mr-2 h-5 w-5" /> Novo Serviço
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-primary/20 shadow-2xl">
            <DialogHeader>
              <DialogTitle className="font-headline text-3xl text-primary">Novo Serviço</DialogTitle>
              <DialogDescription className="uppercase tracking-widest text-[10px]">Defina as regras do novo serviço.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="uppercase text-[10px] font-bold tracking-widest">Nome do Serviço</Label>
                <Input name="name" placeholder="Ex: Corte Navalhado" required className="h-12 bg-background border-primary/20" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="uppercase text-[10px] font-bold tracking-widest">Preço (R$)</Label>
                  <Input name="price" type="number" step="0.01" placeholder="50.00" required className="h-12 bg-background border-primary/20" />
                </div>
                <div className="space-y-2">
                  <Label className="uppercase text-[10px] font-bold tracking-widest">Tempo (min)</Label>
                  <Input name="duration" type="number" placeholder="40" required className="h-12 bg-background border-primary/20" />
                </div>
              </div>
              <DialogFooter className="pt-4">
                <Button type="submit" disabled={isSubmitting} className="w-full h-14 bg-primary text-black font-headline text-2xl">
                  {isSubmitting ? <Loader2 className="h-6 w-6 animate-spin" /> : "Salvar Serviço"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border border-primary/10 bg-card shadow-xl overflow-hidden">
        <CardHeader className="bg-primary/5 border-b border-primary/10">
          <CardTitle className="font-headline text-2xl flex items-center gap-3 text-primary">
            <Scissors className="h-6 w-6" />
            Catálogo de Serviços
          </CardTitle>
          <CardDescription className="uppercase tracking-tighter text-[10px]">Gerenciamento de serviços e preços.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-primary/5">
              <TableRow className="border-primary/10 hover:bg-transparent">
                <TableHead className="pl-6 font-bold uppercase text-[10px] tracking-widest">Serviço</TableHead>
                <TableHead className="font-bold uppercase text-[10px] tracking-widest">Duração</TableHead>
                <TableHead className="font-bold uppercase text-[10px] tracking-widest text-primary">Preço</TableHead>
                <TableHead className="text-right pr-6 font-bold uppercase text-[10px] tracking-widest">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services && services.length > 0 ? (
                services.map((service) => (
                  <TableRow key={service.id} className="border-primary/10 hover:bg-primary/5 transition-colors">
                    <TableCell className="pl-6 font-bold uppercase text-sm">{service.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-muted-foreground uppercase text-[10px] font-bold">
                        <Clock className="h-3 w-3 text-primary" />
                        {service.durationMinutes} min
                      </div>
                    </TableCell>
                    <TableCell className="text-primary font-headline text-2xl tracking-tighter">R$ {Number(service.price).toFixed(2)}</TableCell>
                    <TableCell className="text-right pr-6 space-x-2">
                      <Dialog open={editingService?.id === service.id} onOpenChange={(open) => setEditingService(open ? service : null)}>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-primary hover:bg-primary/5">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-card border-primary/20 shadow-2xl">
                          <DialogHeader>
                            <DialogTitle className="font-headline text-3xl text-primary">Editar Serviço</DialogTitle>
                          </DialogHeader>
                          <form onSubmit={handleUpdate} className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label className="uppercase text-[10px] font-bold tracking-widest">Nome</Label>
                              <Input name="name" defaultValue={service.name} className="h-12 bg-background border-primary/20" required />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label className="uppercase text-[10px] font-bold tracking-widest">Preço (R$)</Label>
                                <Input name="price" defaultValue={service.price} type="number" step="0.01" className="h-12 bg-background border-primary/20" required />
                              </div>
                              <div className="space-y-2">
                                <Label className="uppercase text-[10px] font-bold tracking-widest">Duração (min)</Label>
                                <Input name="duration" defaultValue={service.durationMinutes} type="number" className="h-12 bg-background border-primary/20" required />
                              </div>
                            </div>
                            <DialogFooter className="pt-4">
                              <Button type="submit" disabled={isSubmitting} className="w-full h-14 bg-primary text-black font-headline text-2xl">
                                {isSubmitting ? <Loader2 className="h-6 w-6 animate-spin" /> : "Salvar Ajustes"}
                              </Button>
                            </DialogFooter>
                          </form>
                        </DialogContent>
                      </Dialog>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/5">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-card border-destructive/20 shadow-2xl">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="font-headline text-2xl text-destructive uppercase">Excluir Serviço?</AlertDialogTitle>
                            <AlertDialogDescription className="uppercase tracking-tighter text-[10px]">
                              Esta ação removerá "{service.name}" do catálogo permanentemente.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="bg-secondary uppercase text-[10px] font-bold">Cancelar</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDelete(service.id, service.name)} 
                              className="bg-destructive text-white hover:bg-destructive/90 uppercase text-[10px] font-bold"
                            >
                              Confirmar Exclusão
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-24 text-muted-foreground italic uppercase font-headline tracking-widest text-xl opacity-20">
                    Nenhum serviço cadastrado
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
