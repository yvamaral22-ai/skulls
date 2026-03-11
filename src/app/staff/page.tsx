
"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { 
  Briefcase, Plus, Mail, Phone, TrendingUp, Scissors, CalendarDays, Users, BarChart2, Clock, Pencil, Loader2
} from "lucide-react"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, doc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { updateDocumentNonBlocking, addDocumentNonBlocking } from "@/firebase/non-blocking-updates"

export default function StaffPage() {
  const db = useFirestore()
  const { toast } = useToast()
  const [isAddOpen, setIsAddOpen] = React.useState(false)
  const [editingStaff, setEditingStaff] = React.useState<any | null>(null)
  
  // No mundo real, barberProfileId viria do contexto do usuário logado.
  const barberProfileId = "skull-barber-admin"

  const staffQuery = useMemoFirebase(() => {
    return collection(db, "barberProfiles", barberProfileId, "staff")
  }, [db, barberProfileId])

  const { data: staff, isLoading } = useCollection(staffQuery)

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const commissionRate = parseFloat(formData.get("commissionRate") as string) / 100

    const staffRef = doc(collection(db, "barberProfiles", barberProfileId, "staff"))
    
    setDoc(staffRef, {
      id: staffRef.id,
      barberProfileId,
      name,
      email,
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

    const staffRef = doc(db, "barberProfiles", barberProfileId, "staff", editingStaff.id)
    
    updateDocumentNonBlocking(staffRef, {
      name,
      commissionRate
    })

    toast({
      title: "Perfil Atualizado",
      description: "As informações do profissional foram sincronizadas no Firestore.",
    })
    setEditingStaff(null)
  }

  if (isLoading) {
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
          <h1 className="text-3xl font-bold font-headline text-primary">Skull Barber - Equipe</h1>
          <p className="text-muted-foreground">Analise o desempenho e a agenda individual dos barbeiros.</p>
        </div>

        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20">
              <Plus className="mr-2 h-4 w-4" /> Adicionar Barbeiro
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border shadow-2xl">
            <DialogHeader>
              <DialogTitle className="font-headline text-2xl">Novo Profissional</DialogTitle>
              <DialogDescription>Cadastre um novo barbeiro e defina sua comissão.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nome Artístico</Label>
                <Input name="name" placeholder="Ex: Rick Navalha" required className="bg-background" />
              </div>
              <div className="space-y-2">
                <Label>E-mail</Label>
                <Input name="email" type="email" placeholder="barbeiro@skullbarber.com" required className="bg-background" />
              </div>
              <div className="space-y-2">
                <Label>Taxa de Comissão (%)</Label>
                <Input name="commissionRate" type="number" placeholder="40" required className="bg-background" />
              </div>
              <DialogFooter className="pt-4">
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white">Cadastrar Profissional</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {staff?.map((member) => (
          <Card key={member.id} className="border-none bg-card shadow-xl hover:shadow-primary/5 transition-all group overflow-hidden border-l-4 border-l-primary">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300">
                    <Briefcase className="h-7 w-7" />
                  </div>
                  <div>
                    <CardTitle className="font-headline text-2xl">{member.name}</CardTitle>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="secondary" className="bg-primary/10 text-primary uppercase text-[10px]">Senior</Badge>
                      <Badge variant="outline" className={cn("text-[10px] uppercase", member.isActive ? "border-green-500/30 text-green-500" : "border-red-500/30 text-red-500")}>
                        {member.isActive ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">Comissão</p>
                  <p className="text-xl font-black text-primary">{(member.commissionRate * 100).toFixed(0)}%</p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="pt-4 flex flex-col gap-2">
                <div className="flex gap-2">
                  <Dialog open={editingStaff?.id === member.id} onOpenChange={(open) => setEditingStaff(open ? member : null)}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="flex-1 border-primary/20 text-xs hover:bg-primary/10">
                        <Pencil className="mr-2 h-3 w-3" /> Editar Perfil
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
                          <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white">Salvar Alterações</Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {staff?.length === 0 && (
          <div className="lg:col-span-2 text-center py-20 bg-card rounded-xl border border-dashed border-border">
            <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
            <p className="text-muted-foreground">Nenhum barbeiro cadastrado no momento.</p>
          </div>
        )}
      </div>
    </div>
  )
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
