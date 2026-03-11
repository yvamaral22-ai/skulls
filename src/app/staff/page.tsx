
"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { 
  Briefcase, Plus, TrendingUp, CalendarDays, Pencil, Loader2, Trash2
} from "lucide-react"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, doc, setDoc, serverTimestamp, deleteDoc } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { updateDocumentNonBlocking } from "@/firebase/non-blocking-updates"

export default function StaffPage() {
  const db = useFirestore()
  const { toast } = useToast()
  const [isAddOpen, setIsAddOpen] = React.useState(false)
  const [editingStaff, setEditingStaff] = React.useState<any | null>(null)
  
  const barberShopId = "master-barbershop";

  const staffQuery = useMemoFirebase(() => {
    return collection(db, "barberProfiles", barberShopId, "staff")
  }, [db, barberShopId])

  const appointmentsQuery = useMemoFirebase(() => {
    return collection(db, "barberProfiles", barberShopId, "appointments")
  }, [db, barberShopId])

  const { data: staff, isLoading: isStaffLoading } = useCollection(staffQuery)
  const { data: appointments, isLoading: isApptsLoading } = useCollection(appointmentsQuery)

  const todayStr = new Date().toISOString().split('T')[0]

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const formData = new FormData(e.currentTarget)
    const name = formData.get("name") as string
    const commissionRate = parseFloat(formData.get("commissionRate") as string) / 100

    const staffRef = doc(collection(db, "barberProfiles", barberShopId, "staff"))
    
    await setDoc(staffRef, {
      id: staffRef.id,
      barberProfileId: barberShopId,
      name,
      commissionRate,
      isActive: true,
      createdAt: serverTimestamp()
    })

    toast({
      title: "Equipe Skull Barber",
      description: `${name} foi adicionado à equipe com sucesso.`,
    })
    setIsAddOpen(false)
  }

  const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editingStaff) return

    const formData = new FormData(e.currentTarget)
    const name = formData.get("name") as string
    const commissionRate = parseFloat(formData.get("commissionRate") as string) / 100

    const staffRef = doc(db, "barberProfiles", barberShopId, "staff", editingStaff.id)
    
    updateDocumentNonBlocking(staffRef, {
      name,
      commissionRate
    })

    toast({
      title: "Perfil Atualizado",
      description: "As informações do profissional foram sincronizadas.",
    })
    setEditingStaff(null)
  }

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Deseja realmente remover ${name} da equipe?`)) {
      await deleteDoc(doc(db, "barberProfiles", barberShopId, "staff", id));
      toast({
        variant: "destructive",
        title: "Profissional Removido",
        description: `${name} não faz mais parte da equipe ativa.`,
      })
    }
  }

  if (isStaffLoading || isApptsLoading) {
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
          <h1 className="text-3xl font-bold font-headline text-primary">Equipe de Barbeiros</h1>
          <p className="text-muted-foreground">Gestão de profissionais e comissões.</p>
        </div>

        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20">
              <Plus className="mr-2 h-4 w-4" /> Novo Barbeiro
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border shadow-2xl">
            <DialogHeader>
              <DialogTitle className="font-headline text-2xl">Cadastrar Barbeiro</DialogTitle>
              <DialogDescription>Insira o nome artístico e a taxa de comissão.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nome Artístico</Label>
                <Input name="name" placeholder="Ex: Rick Navalha" required className="bg-background" />
              </div>
              <div className="space-y-2">
                <Label>Comissão (%)</Label>
                <Input name="commissionRate" type="number" placeholder="40" required className="bg-background" />
              </div>
              <DialogFooter className="pt-4">
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white font-bold">Salvar Barbeiro</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {staff?.map((member) => {
          const memberAppts = appointments?.filter(a => a.staffId === member.id) || []
          const todayAppts = memberAppts.filter(a => a.date === todayStr && a.status !== 'completed')
          const completedAppts = memberAppts.filter(a => a.status === 'completed')
          
          const uniqueDays = new Set(completedAppts.map(a => a.date)).size || 1
          const avgPerDay = (completedAppts.length / uniqueDays).toFixed(1)

          return (
            <Card key={member.id} className="border-none bg-card shadow-xl hover:shadow-primary/5 transition-all group overflow-hidden border-l-4 border-l-primary">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300">
                      <Briefcase className="h-7 w-7" />
                    </div>
                    <div>
                      <CardTitle className="font-headline text-2xl">{member.name}</CardTitle>
                      <Badge variant="outline" className="text-[10px] uppercase mt-1 border-primary/30 text-primary">
                        {member.isActive ? "Disponível" : "Indisponível"}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Comissão</p>
                    <p className="text-xl font-black text-primary">{(member.commissionRate * 100).toFixed(0)}%</p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-secondary/20 p-3 rounded-xl border border-border/50">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" /> Média/Dia
                    </p>
                    <p className="text-xl font-bold">{avgPerDay}</p>
                  </div>
                  <div className="bg-secondary/20 p-3 rounded-xl border border-border/50">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                      <CalendarDays className="h-3 w-3" /> Hoje
                    </p>
                    <p className="text-xl font-bold">{todayAppts.length} pendentes</p>
                  </div>
                </div>

                <div className="pt-2 flex gap-2">
                  <Dialog open={editingStaff?.id === member.id} onOpenChange={(open) => setEditingStaff(open ? member : null)}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="flex-1 border-primary/20 text-xs hover:bg-primary/10 h-11">
                        <Pencil className="mr-2 h-4 w-4" /> Editar Dados
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-card border-border shadow-2xl">
                      <DialogHeader>
                        <DialogTitle className="font-headline text-2xl">Editar Profissional</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleUpdate} className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Nome Artístico</Label>
                          <Input name="name" defaultValue={member.name} className="bg-background" required />
                        </div>
                        <div className="space-y-2">
                          <Label>Comissão (%)</Label>
                          <Input name="commissionRate" defaultValue={member.commissionRate * 100} type="number" className="bg-background" required />
                        </div>
                        <DialogFooter className="pt-4">
                          <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white font-bold">Salvar Alterações</Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                  
                  <Button variant="ghost" size="icon" className="h-11 w-11 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(member.id, member.name)}>
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
        {staff?.length === 0 && !isStaffLoading && (
          <div className="lg:col-span-2 text-center py-20 bg-card rounded-xl border border-dashed border-border">
            <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
            <p className="text-muted-foreground">Cadastre seu primeiro barbeiro para começar.</p>
          </div>
        )}
      </div>
    </div>
  )
}
