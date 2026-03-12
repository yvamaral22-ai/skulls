
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Scissors, TrendingUp, Calendar, Plus, Loader2, Briefcase, Clock, User, Scissors as ScissorsIcon } from "lucide-react"
import Link from "next/link"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, doc, deleteDoc } from "firebase/firestore"
import * as React from "react"
import { format, parseISO } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { BookingForm } from "@/components/booking-form"
import { CheckoutDialog } from "@/components/checkout-dialog"
import { useToast } from "@/hooks/use-toast"

export default function DashboardPage() {
  const db = useFirestore()
  const { toast } = useToast()
  const today = format(new Date(), 'yyyy-MM-dd')
  const barberShopId = "master-barbershop";

  const [editingAppointment, setEditingAppointment] = React.useState<any | null>(null);

  const appointmentsQuery = useMemoFirebase(() => collection(db, 'barberProfiles', barberShopId, 'appointments'), [db]);
  const servicesQuery = useMemoFirebase(() => collection(db, 'barberProfiles', barberShopId, 'services'), [db]);

  const { data: appointments, isLoading: isApptsLoading } = useCollection(appointmentsQuery);
  const { data: services, isLoading: isServicesLoading } = useCollection(servicesQuery);

  const todayAppointments = React.useMemo(() => {
    if (!appointments) return [];
    return appointments
      .filter(a => a.date === today)
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [appointments, today]);

  const totalRevenueToday = React.useMemo(() => {
    return todayAppointments
      .filter(a => a.status === 'completed')
      .reduce((acc, appt) => acc + (Number(appt.priceAtAppointment) || 0), 0);
  }, [todayAppointments]);

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'barberProfiles', barberShopId, 'appointments', id));
      setEditingAppointment(null);
      toast({
        variant: "destructive",
        title: "Agendamento Excluído",
        description: "O horário foi removido do sistema.",
      });
    } catch (e) {
      toast({ variant: "destructive", title: "Erro ao excluir" });
    }
  };

  if (isApptsLoading || isServicesLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-headline text-primary">Barbearia Skull's</h1>
          <p className="text-muted-foreground text-[9px] md:text-[10px] uppercase tracking-[0.2em]">Visão Geral do Sistema</p>
        </div>
        <Button className="h-12 w-full sm:w-auto font-bold bg-primary text-black shadow-xl shadow-primary/20" asChild>
          <Link href="/agenda">
            <Plus className="mr-2 h-5 w-5" /> Novo Agendamento
          </Link>
        </Button>
      </div>

      <div className="grid gap-3 md:gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="border-none bg-card shadow-lg border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-4 md:px-6">
            <CardTitle className="text-[9px] md:text-[10px] font-bold uppercase opacity-60 tracking-[0.15em]">Agenda Hoje</CardTitle>
            <Calendar className="h-4 w-4 text-primary shrink-0" />
          </CardHeader>
          <CardContent className="px-4 md:px-6">
            <div className="text-2xl md:text-3xl font-bold font-headline tracking-widest">{todayAppointments.length}</div>
          </CardContent>
        </Card>
        <Card className="border-none bg-card shadow-lg border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-4 md:px-6">
            <CardTitle className="text-[9px] md:text-[10px] font-bold uppercase opacity-60 tracking-[0.15em]">Bruto Hoje</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary shrink-0" />
          </CardHeader>
          <CardContent className="px-4 md:px-6">
            <div className="text-2xl md:text-3xl font-bold font-headline text-primary tracking-widest">R$ {totalRevenueToday.toFixed(0)}</div>
          </CardContent>
        </Card>
        <Card className="border-none bg-card shadow-lg border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-4 md:px-6">
            <CardTitle className="text-[9px] md:text-[10px] font-bold uppercase opacity-60 tracking-[0.15em]">Serviços</CardTitle>
            <Scissors className="h-4 w-4 text-primary shrink-0" />
          </CardHeader>
          <CardContent className="px-4 md:px-6">
            <div className="text-2xl md:text-3xl font-bold font-headline tracking-widest">{services?.length || 0}</div>
          </CardContent>
        </Card>
        <Card className="border-none bg-card shadow-lg border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-4 md:px-6">
            <CardTitle className="text-[9px] md:text-[10px] font-bold uppercase opacity-60 tracking-[0.15em]">Status</CardTitle>
            <Briefcase className="h-4 w-4 text-primary shrink-0" />
          </CardHeader>
          <CardContent className="px-4 md:px-6">
            <div className="text-2xl md:text-3xl font-bold font-headline text-green-500 tracking-widest">ABERTO</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border border-primary/10 bg-card shadow-lg overflow-hidden">
          <CardHeader className="bg-primary/5 border-b border-primary/10 px-4 md:px-6 py-4">
            <CardTitle className="text-lg md:text-xl font-headline text-primary">Próximos Clientes</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/50 max-h-[400px] overflow-y-auto scrollbar-thin">
              {todayAppointments.length > 0 ? (
                todayAppointments.map((appt) => {
                  const service = services?.find(s => s.id === appt.serviceId)
                  return (
                    <div 
                      key={appt.id} 
                      onClick={() => setEditingAppointment(appt)}
                      className="flex items-center gap-3 md:gap-4 p-3 md:p-4 hover:bg-primary/5 transition-colors cursor-pointer group"
                    >
                      <div className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-xl bg-primary text-black font-headline text-base md:text-lg tracking-normal shrink-0">
                        {appt.time}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold truncate text-xs md:text-sm uppercase tracking-wide group-hover:text-primary transition-colors">{appt.clientName}</p>
                        <p className="text-[9px] md:text-[10px] text-muted-foreground truncate uppercase tracking-[0.1em]">{service?.name || 'Serviço'}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <Badge variant={appt.status === 'completed' ? 'default' : 'outline'} className={cn(
                          "text-[8px] md:text-[9px]",
                          appt.status === 'completed' ? 'bg-primary text-black' : 'border-primary/30 text-primary'
                        )}>
                          {appt.status === 'completed' ? 'PAGO' : 'PENDENTE'}
                        </Badge>
                      </div>
                    </div>
                  )
                })
              ) : (
                <p className="text-center py-12 text-muted-foreground italic text-sm">Nenhum agendamento para hoje.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border border-primary/10 bg-card shadow-lg">
          <CardHeader className="bg-primary/5 border-b border-primary/10 px-4 md:px-6 py-4">
            <CardTitle className="text-lg md:text-xl font-headline text-primary">Acesso Rápido</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 md:gap-4 pt-6 px-4 md:px-6 pb-6">
            <Button variant="outline" className="h-16 justify-start gap-3 md:gap-4 border-2 border-primary/20 hover:border-primary hover:bg-primary/5 transition-all text-left" asChild>
              <Link href="/agenda">
                <Calendar className="h-6 w-6 text-primary shrink-0" /> 
                <div className="min-w-0">
                  <p className="font-headline text-base truncate">Agenda Semanal</p>
                  <p className="text-[9px] md:text-[10px] uppercase opacity-50 tracking-[0.1em] truncate">Gestão de horários</p>
                </div>
              </Link>
            </Button>
            <Button variant="outline" className="h-16 justify-start gap-3 md:gap-4 border-2 border-primary/20 hover:border-primary hover:bg-primary/5 transition-all text-left" asChild>
              <Link href="/reports">
                <TrendingUp className="h-6 w-6 text-primary shrink-0" /> 
                <div className="min-w-0">
                  <p className="font-headline text-base truncate">Relatório Financeiro</p>
                  <p className="text-[9px] md:text-[10px] uppercase opacity-50 tracking-[0.1em] truncate">Resumo de faturamento</p>
                </div>
              </Link>
            </Button>
            <Button variant="outline" className="h-16 justify-start gap-3 md:gap-4 border-2 border-primary/20 hover:border-primary hover:bg-primary/5 transition-all text-left" asChild>
              <Link href="/services">
                <Scissors className="h-6 w-6 text-primary shrink-0" /> 
                <div className="min-w-0">
                  <p className="font-headline text-base truncate">Serviços</p>
                  <p className="text-[9px] md:text-[10px] uppercase opacity-50 tracking-[0.1em] truncate">Gestão do catálogo</p>
                </div>
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Modal de Edição no Dashboard */}
      <Dialog open={!!editingAppointment} onOpenChange={(open) => !open && setEditingAppointment(null)}>
        <DialogContent className="w-[95vw] max-w-[450px] bg-card border-border rounded-xl">
          <DialogHeader>
            <DialogTitle className="font-headline text-xl md:text-2xl text-primary">Detalhes do Atendimento</DialogTitle>
            <DialogDescription className="font-body text-[10px] uppercase opacity-60">Gestão de horário e checkout direto do início.</DialogDescription>
          </DialogHeader>
          {editingAppointment && (
            <div className="space-y-4">
              <div className="bg-primary/5 p-4 md:p-5 rounded-xl border border-primary/20 space-y-3 md:space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <h4 className="text-[9px] md:text-[10px] uppercase font-bold text-primary/60 tracking-widest">Cliente</h4>
                    <p className="font-headline text-xl md:text-2xl text-white leading-none tracking-tight">{editingAppointment.clientName}</p>
                  </div>
                  <Badge variant="outline" className={cn(
                    "uppercase text-[8px] md:text-[9px] font-bold tracking-widest border-2",
                    editingAppointment.status === 'completed' ? "border-green-500/40 text-green-400" : "border-primary/20 text-primary"
                  )}>
                    {editingAppointment.status === 'completed' ? 'Pago' : 'Pendente'}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-3 md:gap-4 pt-3 md:pt-4 border-t border-primary/10">
                  <div className="space-y-1">
                    <h4 className="text-[9px] md:text-[10px] uppercase font-bold text-primary/60 tracking-widest flex items-center gap-1">
                      <ScissorsIcon className="h-3 w-3" /> Serviço
                    </h4>
                    <p className="text-xs md:text-sm font-black text-white truncate">
                      {services?.find(s => s.id === editingAppointment.serviceId)?.name || 'N/A'}
                    </p>
                    <p className="text-[9px] md:text-[10px] text-muted-foreground font-bold">
                      {services?.find(s => s.id === editingAppointment.serviceId)?.durationMinutes || 0} min
                    </p>
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-[9px] md:text-[10px] uppercase font-bold text-primary/60 tracking-widest flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Horário
                    </h4>
                    <p className="text-xs md:text-sm font-black text-white">{editingAppointment.time}</p>
                    <p className="text-[9px] md:text-[10px] text-muted-foreground font-bold">
                      {format(parseISO(editingAppointment.date), 'dd/MM/yyyy')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="max-h-[40vh] md:max-h-[50vh] overflow-y-auto px-1">
                <BookingForm 
                  initialData={editingAppointment} 
                  onSuccess={() => setEditingAppointment(null)} 
                />
              </div>
              
              <div className="flex gap-2 md:gap-3 pt-4 md:pt-6 border-t border-border/50">
                {editingAppointment.status !== 'completed' && (
                  <CheckoutDialog 
                    appointmentId={editingAppointment.id}
                    customerName={editingAppointment.clientName}
                    serviceName={services?.find(s => s.id === editingAppointment.serviceId)?.name || 'Serviço'}
                    price={editingAppointment.priceAtAppointment || 0}
                    staffId={editingAppointment.staffId}
                    onSuccess={() => setEditingAppointment(null)}
                  />
                )}
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="ghost" 
                      className="flex-1 text-destructive hover:bg-destructive/10 font-bold uppercase text-[9px] md:text-[10px]"
                    >
                      Excluir
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-card border-destructive/20 shadow-2xl w-[90vw] max-w-md rounded-xl">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="font-headline text-xl md:text-2xl text-destructive uppercase">Excluir Agendamento?</AlertDialogTitle>
                      <AlertDialogDescription className="font-body text-xs md:text-sm text-muted-foreground">
                        O horário de {editingAppointment.clientName} será removido permanentemente.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2">
                      <AlertDialogCancel className="bg-secondary font-bold">Cancelar</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => handleDelete(editingAppointment.id)} 
                        className="bg-destructive text-white hover:bg-destructive/90 font-bold"
                      >
                        Confirmar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
