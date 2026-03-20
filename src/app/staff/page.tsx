"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger, 
  DialogDescription, 
  DialogFooter 
} from "@/components/ui/dialog"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Briefcase, Plus, TrendingUp, CalendarDays, Pencil, Loader2, Trash2, 
  Clock, Scissors, User, ChevronRight, Lock, Mail, ShieldCheck
} from "lucide-react"
import { useFirestore, useCollection, useMemoFirebase, useUser } from "@/firebase"
import { collection, doc, setDoc, serverTimestamp, deleteDoc, updateDoc } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { format, parseISO } from "date-fns"

const BarberPoleIcon = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={`${className} animate-barber-spin`}
  >
    <path d="M10 2h4M10 22h4" />
    <rect x="8" y="4" width="8" height="16" rx="1" />
    <path d="M8 7l8 3M8 11l8 3M8 15l8 3" />
  </svg>
);

export default function StaffPage() {
  const db = useFirestore()
  const { barberProfileId, role } = useUser();
  const { toast } = useToast()
  const [isAddOpen, setIsAddOpen] = React.useState(false)
  const [editingStaff, setEditingStaff] = React.useState<any | null>(null)
  const [selectedStaffPanel, setSelectedStaffPanel] = React.useState<any | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  
  const staffQuery = useMemoFirebase(() => {
    if (!barberProfileId) return null;
    return collection(db, "barbers", barberProfileId, "staff");
  }, [db, barberProfileId])

  const appointmentsQuery = useMemoFirebase(() => {
    if (!barberProfileId) return null;
    return collection(db, "barbers", barberProfileId, "appointments");
  }, [db, barberProfileId])

  const servicesQuery = useMemoFirebase(() => {
    if (!barberProfileId) return null;
    return collection(db, "barbers", barberProfileId, "services");
  }, [db, barberProfileId])

  const { data: staff, isLoading: isStaffLoading } = useCollection(staffQuery)
  const { data: appointments, isLoading: isApptsLoading } = useCollection(appointmentsQuery)
  const { data: services } = useCollection(servicesQuery)

  const todayStr = format(new Date(), 'yyyy-MM-dd')

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!barberProfileId) {
      toast({ variant: "destructive", title: "Erro", description: "Sessão inválida." })
      return;
    }

    setIsSubmitting(true)
    const formData = new FormData(e.currentTarget)
    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const role = formData.get("role") as string || 'STAFF'

    try {
      const staffRef = doc(collection(db, "barbers", barberProfileId, "staff"))
      await setDoc(staffRef, {
        id: staffRef.id,
        barberProfileId: barberProfileId,
        name,
        email: email.toLowerCase().trim(),
        role,
        isActive: true,
        createdAt: serverTimestamp()
      })

      toast({ title: "Equipe Skull's", description: `${name} foi cadastrado.` })
      setIsAddOpen(false)
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao salvar funcionário" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!barberProfileId || !editingStaff) return

    setIsSubmitting(true)
    const formData = new FormData(e.currentTarget)
    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const role = formData.get("role") as string

    try {
      const staffRef = doc(db, "barbers", barberProfileId, "staff", editingStaff.id)
      await updateDoc(staffRef, {
        name,
        email: email.toLowerCase().trim(),
        role
      })

      toast({ title: "Atualizado!", description: "Dados do profissional foram sincronizados." })
      setEditingStaff(null)
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao atualizar" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!barberProfileId) return;
    try {
      await deleteDoc(doc(db, "barbers", barberProfileId, "staff", id));
      toast({ variant: "destructive", title: "Removido", description: `${name} foi excluído.` })
    } catch (e) {
      toast({ variant: "destructive", title: "Erro ao excluir" })
    }
  }

  if (role !== 'ADMIN') {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center space-y-4">
        <Lock className="h-12 w-12 text-destructive opacity-40" />
        <h1 className="text-2xl font-headline text-primary uppercase">ACESSO RESTRITO</h1>
        <p className="text-muted-foreground uppercase text-[10px]">Apenas o administrador pode gerenciar a equipe.</p>
        <Button asChild variant="outline" className="mt-4"><a href="/">Voltar ao Início</a></Button>
      </div>
    );
  }

  if (isStaffLoading || isApptsLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary rounded-xl">
            <BarberPoleIcon className="h-6 w-6 text-black" />
          </div>
          <div>
            <h1 className="text-3xl font-bold font-headline text-primary uppercase">Equipe</h1>
            <p className="text-muted-foreground uppercase text-[9px] tracking-[0.2em]">Gestão de Profissionais</p>
          </div>
        </div>

        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-black font-bold h-12 shadow-xl shadow-primary/20">
              <Plus className="mr-2 h-5 w-5" /> Novo Profissional
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border shadow-2xl">
            <DialogHeader>
              <DialogTitle className="font-headline text-2xl text-primary">Novo Profissional</DialogTitle>
              <DialogDescription className="text-[10px] uppercase">Defina o nível de acesso e dados do profissional.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold text-primary/60">Nome</Label>
                <Input name="name" placeholder="Ex: Murilo" required className="h-12 bg-background border-primary/20" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold text-primary/60">E-mail de Acesso</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/40" />
                  <Input name="email" type="email" placeholder="email@exemplo.com" required className="h-12 bg-background border-primary/20 pl-10" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold text-primary/60">Nível de Permissão</Label>
                <Select name="role" defaultValue="STAFF">
                  <SelectTrigger className="h-12 bg-background border-primary/20">
                    <SelectValue placeholder="Selecione o papel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STAFF">Colaborador (Vê apenas sua agenda)</SelectItem>
                    <SelectItem value="ADMIN">Barbeiro (Acesso Total ao Painel)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter className="pt-4">
                <Button type="submit" disabled={isSubmitting} className="w-full h-14 bg-primary text-black font-headline text-2xl">
                  {isSubmitting ? <Loader2 className="h-6 w-6 animate-spin" /> : "Cadastrar Profissional"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {staff?.map((member) => {
          const memberAppts = appointments?.filter(a => a.staffId === member.id) || []
          const pendingToday = memberAppts.filter(a => a.date === todayStr && a.status === 'scheduled').length
          const completedCount = memberAppts.filter(a => a.status === 'completed').length

          return (
            <Card key={member.id} className="border-none bg-card shadow-xl hover:shadow-primary/5 transition-all group overflow-hidden border-t-4 border-t-primary">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary text-primary group-hover:bg-primary group-hover:text-black transition-all duration-300 transform -rotate-2">
                      {member.role === 'ADMIN' ? <ShieldCheck className="h-8 w-8" /> : <Briefcase className="h-8 w-8" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="font-headline text-2xl group-hover:text-primary transition-colors">{member.name}</CardTitle>
                        {member.role === 'ADMIN' && <Badge className="bg-primary/20 text-primary border-none text-[8px] font-bold">ADM</Badge>}
                      </div>
                      <p className="text-[10px] text-muted-foreground font-bold flex items-center gap-1">
                        <Mail className="h-3 w-3" /> {member.email}
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-green-500/20 text-green-400 border-none text-[8px] font-bold">ATIVO</Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-secondary/20 p-4 rounded-2xl border border-border/50">
                    <p className="text-[9px] uppercase font-bold text-muted-foreground flex items-center gap-2">
                      <TrendingUp className="h-3 w-3 text-primary" /> Total
                    </p>
                    <p className="text-2xl font-black font-headline mt-1">{completedCount}</p>
                    <p className="text-[8px] uppercase text-muted-foreground">Serviços feitos</p>
                  </div>
                  
                  <div 
                    onClick={() => setSelectedStaffPanel(member)}
                    className="bg-secondary/20 p-4 rounded-2xl border border-border/50 cursor-pointer hover:bg-primary/10 hover:border-primary/30 transition-all active:scale-95 group/pendente"
                  >
                    <p className="text-[9px] uppercase font-bold text-muted-foreground flex items-center justify-between gap-2 group-hover/pendente:text-primary">
                      <span className="flex items-center gap-2"><CalendarDays className="h-3 w-3 text-primary" /> Hoje</span>
                      <ChevronRight className="h-3 w-3 opacity-0 group-hover/pendente:opacity-100 transition-opacity" />
                    </p>
                    <p className="text-2xl font-black font-headline mt-1 group-hover/pendente:text-white">{pendingToday}</p>
                    <p className="text-[8px] uppercase text-muted-foreground font-bold">Agendados</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={() => setSelectedStaffPanel(member)}
                    className="flex-1 bg-secondary hover:bg-primary hover:text-black font-bold h-12 uppercase text-[10px] tracking-widest transition-all"
                  >
                    Painel Individual <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>

                  <div className="flex gap-2">
                    <Dialog open={editingStaff?.id === member.id} onOpenChange={(open) => setEditingStaff(open ? member : null)}>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-12 w-12 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10">
                          <Pencil className="h-5 w-5" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-card border-border shadow-2xl">
                        <DialogHeader>
                          <DialogTitle className="font-headline text-2xl text-primary">Editar Profissional</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleUpdate} className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-bold">Nome</Label>
                            <Input name="name" defaultValue={member.name} required className="h-12 bg-background border-primary/20" />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-bold">E-mail</Label>
                            <Input name="email" defaultValue={member.email} type="email" required className="h-12 bg-background border-primary/20" />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-bold">Papel / Permissão</Label>
                            <Select name="role" defaultValue={member.role || 'STAFF'}>
                              <SelectTrigger className="h-12 bg-background border-primary/20">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="STAFF">Colaborador (Restrito)</SelectItem>
                                <SelectItem value="ADMIN">Barbeiro (Acesso Total)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <DialogFooter className="pt-4">
                            <Button type="submit" disabled={isSubmitting} className="w-full h-14 bg-primary text-black font-headline text-2xl">
                              {isSubmitting ? <Loader2 className="h-6 w-6 animate-spin" /> : "Salvar Alterações"}
                            </Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-12 w-12 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-card border-destructive/20 shadow-2xl">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="font-headline text-2xl text-destructive uppercase">Remover Profissional?</AlertDialogTitle>
                          <AlertDialogDescription className="uppercase tracking-tighter text-[9px]">
                            Esta operação removerá {member.name} permanentemente.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="bg-secondary uppercase text-[10px] font-bold h-11">Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(member.id, member.name)} className="bg-destructive text-white hover:bg-destructive/90 uppercase text-[10px] font-bold h-11">Confirmar</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Dialog open={!!selectedStaffPanel} onOpenChange={(open) => !open && setSelectedStaffPanel(null)}>
        <DialogContent className="max-w-3xl h-[90vh] flex flex-col p-0 overflow-hidden bg-card border-none shadow-2xl">
          {selectedStaffPanel && (
            <>
              <DialogHeader className="p-6 pb-0">
                <DialogTitle className="font-headline text-3xl text-primary flex items-center gap-3 uppercase">
                  <User className="h-8 w-8 text-primary" /> {selectedStaffPanel.name}
                </DialogTitle>
                <DialogDescription className="uppercase text-[9px] tracking-[0.2em] opacity-60">Agenda de {selectedStaffPanel.email}</DialogDescription>
              </DialogHeader>

              <div className="flex-1 overflow-hidden flex flex-col px-6 pb-6 mt-4">
                <Tabs defaultValue="agenda" className="flex-1 flex flex-col overflow-hidden">
                  <TabsList className="bg-secondary/50 p-1 h-12 rounded-xl border border-border">
                    <TabsTrigger value="agenda" className="flex-1 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-black font-bold uppercase text-[10px]">Próximos Horários</TabsTrigger>
                    <TabsTrigger value="historico" className="flex-1 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-black font-bold uppercase text-[10px]">Histórico Concluído</TabsTrigger>
                  </TabsList>
                  
                  <div className="flex-1 overflow-y-auto mt-4 pr-2 scrollbar-thin">
                    <TabsContent value="agenda" className="space-y-3 m-0">
                      {appointments?.filter(a => a.staffId === selectedStaffPanel.id && a.status === 'scheduled')
                        .sort((a,b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
                        .map((appt) => {
                          const service = services?.find(s => s.id === appt.serviceId)
                          return (
                            <div key={appt.id} className="p-4 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-between group hover:bg-primary/10 transition-all">
                              <div className="space-y-1">
                                <p className="font-bold text-sm uppercase text-white">{appt.clientName}</p>
                                <div className="flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground font-bold">
                                  <span className="flex items-center gap-1"><Clock className="h-3 w-3 text-primary" /> {appt.time}</span>
                                  <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3 text-primary" /> {format(parseISO(appt.date), 'dd/MM/yyyy')}</span>
                                  <span className="flex items-center gap-1"><Scissors className="h-3 w-3 text-primary" /> {service?.name}</span>
                                </div>
                              </div>
                              <Badge className="bg-primary text-black font-bold uppercase text-[8px]">Pendente</Badge>
                            </div>
                          )
                        })}
                    </TabsContent>

                    <TabsContent value="historico" className="space-y-3 m-0">
                      {appointments?.filter(a => a.staffId === selectedStaffPanel.id && a.status === 'completed')
                        .sort((a,b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time))
                        .map((appt) => {
                          const service = services?.find(s => s.id === appt.serviceId)
                          return (
                            <div key={appt.id} className="p-4 rounded-2xl bg-green-500/5 border border-green-500/10 flex items-center justify-between group">
                              <div className="space-y-1">
                                <p className="font-bold text-sm uppercase text-white">{appt.clientName}</p>
                                <div className="flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground font-bold">
                                  <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3 text-green-500" /> {format(parseISO(appt.date), 'dd/MM/yyyy')}</span>
                                  <span className="flex items-center gap-1"><Scissors className="h-3 w-3 text-green-500" /> {service?.name}</span>
                                  <span className="text-green-400 font-black">R$ {Number(appt.priceAtAppointment).toFixed(2)}</span>
                                </div>
                              </div>
                              <Badge className="bg-green-500 text-white font-bold uppercase text-[8px]">Pago</Badge>
                            </div>
                          )
                        })}
                    </TabsContent>
                  </div>
                </Tabs>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
