
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Briefcase, Plus, TrendingUp, CalendarDays, Pencil, Loader2, Trash2, 
  Filter, Clock, Scissors, User, Search, ChevronRight
} from "lucide-react"
import { useFirestore, useCollection, useMemoFirebase, deleteDocumentNonBlocking } from "@/firebase"
import { collection, doc, setDoc, serverTimestamp } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { updateDocumentNonBlocking } from "@/firebase/non-blocking-updates"
import { format, parseISO } from "date-fns"
import { cn } from "@/lib/utils"

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
  const { toast } = useToast()
  const [isAddOpen, setIsAddOpen] = React.useState(false)
  const [editingStaff, setEditingStaff] = React.useState<any | null>(null)
  const [selectedStaffPanel, setSelectedStaffPanel] = React.useState<any | null>(null)
  
  const [filterDate, setFilterDate] = React.useState(format(new Date(), 'yyyy-MM-dd'))
  const [filterTime, setFilterTime] = React.useState("")

  const barberShopId = "master-barbershop";

  const staffQuery = useMemoFirebase(() => collection(db, "barberProfiles", barberShopId, "staff"), [db, barberShopId])
  const appointmentsQuery = useMemoFirebase(() => collection(db, "barberProfiles", barberShopId, "appointments"), [db, barberShopId])
  const servicesQuery = useMemoFirebase(() => collection(db, "barberProfiles", barberShopId, "services"), [db, barberShopId])

  const { data: staff, isLoading: isStaffLoading } = useCollection(staffQuery)
  const { data: appointments, isLoading: isApptsLoading } = useCollection(appointmentsQuery)
  const { data: services } = useCollection(servicesQuery)

  const todayStr = format(new Date(), 'yyyy-MM-dd')

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

    toast({ title: "Equipe Skull Barber", description: `${name} foi adicionado à equipe.` })
    setIsAddOpen(false)
  }

  const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editingStaff) return
    const formData = new FormData(e.currentTarget)
    const name = formData.get("name") as string
    const commissionRate = parseFloat(formData.get("commissionRate") as string) / 100

    const staffRef = doc(db, "barberProfiles", barberShopId, "staff", editingStaff.id)
    updateDocumentNonBlocking(staffRef, { name, commissionRate })
    toast({ title: "Perfil Atualizado", description: "As informações foram sincronizadas." })
    setEditingStaff(null)
  }

  const handleDelete = (id: string, name: string) => {
    const staffRef = doc(db, "barberProfiles", barberShopId, "staff", id);
    deleteDocumentNonBlocking(staffRef);
    toast({ variant: "destructive", title: "Profissional Removido", description: `${name} foi excluído.` })
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
            <h1 className="text-3xl font-bold font-headline text-primary">Nossa Tropa</h1>
            <p className="text-muted-foreground uppercase text-[9px] tracking-[0.2em]">Gestão Tática de Barbeiros</p>
          </div>
        </div>

        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-black font-bold h-12 shadow-xl shadow-primary/20">
              <Plus className="mr-2 h-5 w-5" /> Recrutar Barbeiro
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border shadow-2xl">
            <DialogHeader>
              <DialogTitle className="font-headline text-2xl text-primary">Novo Recruta</DialogTitle>
              <DialogDescription className="uppercase text-[9px] tracking-widest">Defina o nome e a taxa de comissão.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold text-primary/60">Nome de Guerra</Label>
                <Input name="name" placeholder="Ex: Tony Navalha" required className="h-12 bg-background border-primary/20" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold text-primary/60">Comissão (%)</Label>
                <Input name="commissionRate" type="number" placeholder="40" required className="h-12 bg-background border-primary/20" />
              </div>
              <DialogFooter className="pt-4">
                <Button type="submit" className="w-full h-14 bg-primary text-black font-headline text-2xl">Salvar Barbeiro</Button>
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
                      <Briefcase className="h-8 w-8" />
                    </div>
                    <div>
                      <CardTitle className="font-headline text-2xl group-hover:text-primary transition-colors">{member.name}</CardTitle>
                      <Badge variant="outline" className="text-[9px] uppercase mt-1 border-primary/30 text-primary font-bold">
                        Comissão: {(member.commissionRate * 100).toFixed(0)}%
                      </Badge>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 items-end">
                    <Badge className="bg-green-500/20 text-green-400 border-none text-[8px] font-bold">ATIVO</Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-secondary/20 p-4 rounded-2xl border border-border/50">
                    <p className="text-[9px] uppercase font-bold text-muted-foreground flex items-center gap-2">
                      <TrendingUp className="h-3 w-3 text-primary" /> Histórico
                    </p>
                    <p className="text-2xl font-black font-headline mt-1">{completedCount}</p>
                    <p className="text-[8px] uppercase text-muted-foreground">Serviços feitos</p>
                  </div>
                  
                  <div 
                    onClick={() => {
                      setFilterDate(todayStr);
                      setSelectedStaffPanel(member);
                    }}
                    className="bg-secondary/20 p-4 rounded-2xl border border-border/50 cursor-pointer hover:bg-primary/10 hover:border-primary/30 transition-all active:scale-95 group/pendente"
                  >
                    <p className="text-[9px] uppercase font-bold text-muted-foreground flex items-center justify-between gap-2 group-hover/pendente:text-primary">
                      <span className="flex items-center gap-2"><CalendarDays className="h-3 w-3 text-primary" /> Hoje</span>
                      <ChevronRight className="h-3 w-3 opacity-0 group-hover/pendente:opacity-100 transition-opacity" />
                    </p>
                    <p className="text-2xl font-black font-headline mt-1 group-hover/pendente:text-white">{pendingToday}</p>
                    <p className="text-[8px] uppercase text-muted-foreground font-bold">Pendentes</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={() => setSelectedStaffPanel(member)}
                    className="flex-1 bg-secondary hover:bg-primary hover:text-black font-bold h-12 uppercase text-[10px] tracking-widest transition-all"
                  >
                    Painel Pessoal <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>

                  <Dialog open={editingStaff?.id === member.id} onOpenChange={(open) => setEditingStaff(open ? member : null)}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-12 w-12 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10">
                        <Pencil className="h-5 w-5" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-card border-border shadow-2xl">
                      <DialogHeader>
                        <DialogTitle className="font-headline text-2xl">Editar Profissional</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleUpdate} className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Nome Artístico</Label>
                          <Input name="name" defaultValue={member.name} className="h-12 bg-background" required />
                        </div>
                        <div className="space-y-2">
                          <Label>Comissão (%)</Label>
                          <Input name="commissionRate" defaultValue={member.commissionRate * 100} type="number" className="h-12 bg-background" required />
                        </div>
                        <DialogFooter className="pt-4">
                          <Button type="submit" className="w-full h-14 bg-primary text-black font-bold">Salvar Alterações</Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-12 w-12 rounded-xl text-muted-foreground hover:text-primary hover:bg-destructive/10">
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-card border-destructive/20 shadow-2xl">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="font-headline text-2xl text-destructive uppercase">Excluir Profissional?</AlertDialogTitle>
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
              </CardContent>
            </Card>
          )
        })}
        {staff?.length === 0 && !isStaffLoading && (
          <div className="col-span-full py-32 text-center bg-card rounded-3xl border-2 border-dashed border-border opacity-60">
            <Briefcase className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-20" />
            <p className="text-muted-foreground uppercase font-headline tracking-widest text-xl">Nenhum barbeiro recrutado</p>
          </div>
        )}
      </div>

      <Dialog open={!!selectedStaffPanel} onOpenChange={(open) => !open && setSelectedStaffPanel(null)}>
        <DialogContent className="max-w-3xl h-[90vh] flex flex-col p-0 overflow-hidden bg-card border-none shadow-2xl">
          {selectedStaffPanel && (
            <>
              <DialogHeader className="p-6 pb-0">
                <DialogTitle className="font-headline text-3xl text-primary flex items-center gap-3">
                  <User className="h-8 w-8 text-primary" /> {selectedStaffPanel.name}
                </DialogTitle>
                <DialogDescription className="uppercase text-[9px] tracking-[0.2em] opacity-60">Agenda e Histórico Detalhado</DialogDescription>
              </DialogHeader>

              <div className="flex-1 overflow-hidden flex flex-col px-6 pb-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-6 bg-background/50 p-4 rounded-2xl border border-border">
                  <div className="space-y-1">
                    <Label className="text-[9px] uppercase font-bold text-muted-foreground">Filtrar por Data</Label>
                    <Input 
                      type="date" 
                      value={filterDate} 
                      onChange={(e) => setFilterDate(e.target.value)} 
                      className="h-10 bg-card border-primary/10"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[9px] uppercase font-bold text-muted-foreground">Filtrar por Hora</Label>
                    <Input 
                      type="time" 
                      value={filterTime} 
                      onChange={(e) => setFilterTime(e.target.value)} 
                      className="h-10 bg-card border-primary/10"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button 
                      variant="outline" 
                      onClick={() => { setFilterDate(""); setFilterTime(""); }}
                      className="w-full h-10 text-[9px] uppercase font-bold"
                    >
                      Limpar Filtros
                    </Button>
                  </div>
                </div>

                <Tabs defaultValue="agenda" className="flex-1 flex flex-col overflow-hidden">
                  <TabsList className="bg-secondary/50 p-1 h-12 rounded-xl border border-border">
                    <TabsTrigger value="agenda" className="flex-1 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-black font-bold uppercase text-[10px]">Agenda</TabsTrigger>
                    <TabsTrigger value="historico" className="flex-1 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-black font-bold uppercase text-[10px]">Histórico</TabsTrigger>
                  </TabsList>
                  
                  <div className="flex-1 overflow-y-auto mt-4 pr-2 scrollbar-thin">
                    <TabsContent value="agenda" className="space-y-3 m-0">
                      {appointments?.filter(a => a.staffId === selectedStaffPanel.id && a.status === 'scheduled')
                        .filter(a => !filterDate || a.date === filterDate)
                        .filter(a => !filterTime || a.time.startsWith(filterTime))
                        .sort((a,b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
                        .map((appt) => {
                          const service = services?.find(s => s.id === appt.serviceId)
                          return (
                            <div key={appt.id} className="p-4 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-between group hover:bg-primary/10 transition-all">
                              <div className="space-y-1">
                                <p className="font-bold text-sm uppercase text-white">{appt.clientName}</p>
                                <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-bold">
                                  <span className="flex items-center gap-1"><Clock className="h-3 w-3 text-primary" /> {appt.time}</span>
                                  <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3 text-primary" /> {format(parseISO(appt.date), 'dd/MM/yyyy')}</span>
                                  <span className="flex items-center gap-1"><Scissors className="h-3 w-3 text-primary" /> {service?.name}</span>
                                </div>
                              </div>
                              <Badge className="bg-primary text-black font-bold uppercase text-[8px]">Agendado</Badge>
                            </div>
                          )
                        })}
                      {appointments?.filter(a => a.staffId === selectedStaffPanel.id && a.status === 'scheduled').length === 0 && (
                        <p className="text-center py-12 text-muted-foreground italic text-xs uppercase tracking-widest opacity-40">Nenhum agendamento na agenda</p>
                      )}
                    </TabsContent>

                    <TabsContent value="historico" className="space-y-3 m-0">
                      {appointments?.filter(a => a.staffId === selectedStaffPanel.id && a.status === 'completed')
                        .filter(a => !filterDate || a.date === filterDate)
                        .filter(a => !filterTime || a.time.startsWith(filterTime))
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
                                  <span className="text-green-400">R$ {Number(appt.priceAtAppointment).toFixed(2)}</span>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-[8px] uppercase font-bold text-muted-foreground">Comissão</p>
                                <p className="text-sm font-black text-green-400">R$ {Number(appt.commissionAtAppointment).toFixed(2)}</p>
                              </div>
                            </div>
                          )
                        })}
                      {appointments?.filter(a => a.staffId === selectedStaffPanel.id && a.status === 'completed').length === 0 && (
                        <p className="text-center py-12 text-muted-foreground italic text-xs uppercase tracking-widest opacity-40">Nenhum registro no histórico</p>
                      )}
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
