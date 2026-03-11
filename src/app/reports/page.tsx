
"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from "recharts"
import { 
  TrendingUp, DollarSign, ArrowDownRight, 
  Calendar as CalendarIcon, Briefcase, Loader2, Play, FileBarChart, ListChecks, User
} from "lucide-react"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection } from "firebase/firestore"
import { format, startOfMonth, endOfMonth, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useToast } from "@/hooks/use-toast"

export default function ReportsPage() {
  const db = useFirestore()
  const { toast } = useToast()
  
  const [startDate, setStartDate] = React.useState("")
  const [endDate, setEndDate] = React.useState("")
  const [appliedStartDate, setAppliedStartDate] = React.useState("")
  const [appliedEndDate, setAppliedEndDate] = React.useState("")
  const [isGenerating, setIsGenerating] = React.useState(false)
  const [hasGenerated, setHasGenerated] = React.useState(false)

  const barberShopId = "master-barbershop";

  React.useEffect(() => {
    const now = new Date();
    const start = format(startOfMonth(now), 'yyyy-MM-dd');
    const end = format(endOfMonth(now), 'yyyy-MM-dd');
    setStartDate(start);
    setEndDate(end);
  }, []);

  const appointmentsQuery = useMemoFirebase(() => collection(db, "barberProfiles", barberShopId, "appointments"), [db]);
  const staffQuery = useMemoFirebase(() => collection(db, "barberProfiles", barberShopId, "staff"), [db]);
  const expensesQuery = useMemoFirebase(() => collection(db, "barberProfiles", barberShopId, "expenses"), [db]);
  const servicesQuery = useMemoFirebase(() => collection(db, "barberProfiles", barberShopId, "services"), [db]);
  const clientsQuery = useMemoFirebase(() => collection(db, "barberProfiles", barberShopId, "clients"), [db]);

  const { data: appointments, isLoading: isApptsLoading } = useCollection(appointmentsQuery)
  const { data: staff } = useCollection(staffQuery)
  const { data: expenses } = useCollection(expensesQuery)
  const { data: services } = useCollection(servicesQuery)
  const { data: clients } = useCollection(clientsQuery)

  const handleApplyFilters = () => {
    if (!startDate || !endDate) {
      toast({ variant: "destructive", title: "Período Inválido", description: "Verifique as datas." });
      return;
    }
    
    setIsGenerating(true);
    setAppliedStartDate(startDate);
    setAppliedEndDate(endDate);
    setHasGenerated(true);
    
    setTimeout(() => {
      setIsGenerating(false);
      toast({
        title: "Relatório Gerado",
        description: `Dados de ${format(parseISO(startDate), 'dd/MM/yy')} até ${format(parseISO(endDate), 'dd/MM/yy')} calculados.`,
      })
    }, 400);
  }

  const stats = React.useMemo(() => {
    if (!hasGenerated || !appointments || !appliedStartDate || !appliedEndDate) return null;

    const filteredAppts = appointments.filter(a => {
      const isCompleted = a.status === 'completed';
      const isWithinRange = a.date >= appliedStartDate && a.date <= appliedEndDate;
      return isCompleted && isWithinRange;
    }).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

    const filteredExps = (expenses || []).filter(e => e.date >= appliedStartDate && e.date <= appliedEndDate);

    const totalRevenue = filteredAppts.reduce((sum, a) => sum + (Number(a.priceAtAppointment) || 0), 0)
    const totalCommissions = filteredAppts.reduce((sum, a) => sum + (Number(a.commissionAtAppointment) || 0), 0)
    const totalExpenses = filteredExps.reduce((sum, e) => sum + (Number(e.amount) || 0), 0)
    const netProfit = totalRevenue - totalCommissions - totalExpenses

    const staffReport = (staff || []).map(member => {
      const memberAppts = filteredAppts.filter(a => a.staffId === member.id)
      const revenue = memberAppts.reduce((sum, a) => sum + (Number(a.priceAtAppointment) || 0), 0)
      const commission = memberAppts.reduce((sum, a) => sum + (Number(a.commissionAtAppointment) || 0), 0)
      
      return {
        name: member.name,
        count: memberAppts.length,
        revenue,
        commission
      }
    }).sort((a, b) => b.revenue - a.revenue)

    const paymentMethodsMap: Record<string, number> = { 'Cash': 0, 'PIX': 0, 'Credit': 0, 'Debit': 0 }
    filteredAppts.forEach(a => {
      if (a.paymentMethod && paymentMethodsMap[a.paymentMethod] !== undefined) {
        paymentMethodsMap[a.paymentMethod] += (Number(a.priceAtAppointment) || 0)
      }
    })

    return { totalRevenue, totalCommissions, totalExpenses, netProfit, staffReport, detailedAppts: filteredAppts, chartData: Object.entries(paymentMethodsMap).map(([name, valor]) => ({ name, valor })), count: filteredAppts.length }
  }, [appointments, staff, expenses, appliedStartDate, appliedEndDate, hasGenerated])

  if (isApptsLoading && !appointments) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black font-headline text-primary">Gestão Financeira</h1>
          <p className="text-muted-foreground">Visão geral do faturamento e produtividade.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 bg-card p-3 rounded-2xl border border-border shadow-xl">
          <div className="flex items-center gap-2 px-2 border-r border-border pr-4">
            <CalendarIcon className="h-4 w-4 text-primary" />
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-40 bg-background border-none focus-visible:ring-0 text-sm h-10" />
            <span className="text-muted-foreground font-bold">→</span>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-40 bg-background border-none focus-visible:ring-0 text-sm h-10" />
          </div>
          <Button onClick={handleApplyFilters} disabled={isGenerating} className="bg-primary hover:bg-primary/90 text-white h-10 px-6 ml-2 font-bold shadow-lg shadow-primary/20">
            {isGenerating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Play className="mr-2 h-4 w-4 fill-current" />}
            Gerar Relatório
          </Button>
        </div>
      </header>

      {!hasGenerated ? (
        <div className="flex flex-col items-center justify-center py-32 border-2 border-dashed border-border rounded-3xl opacity-60">
          <FileBarChart className="h-16 w-16 text-muted-foreground mb-4 opacity-20" />
          <h3 className="text-xl font-bold font-headline">Relatório pronto para consulta</h3>
          <p className="text-muted-foreground italic text-sm">Selecione o período e clique no botão para calcular.</p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 animate-in slide-in-from-bottom-2 duration-500">
            <Card className="border-none bg-card shadow-xl border-t-4 border-t-primary">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-bold uppercase text-muted-foreground">Faturamento</CardTitle>
                <DollarSign className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black">R$ {(stats?.totalRevenue ?? 0).toFixed(2)}</div>
                <p className="text-xs text-muted-foreground mt-1">{stats?.count ?? 0} finalizados</p>
              </CardContent>
            </Card>
            <Card className="border-none bg-card shadow-xl border-t-4 border-t-blue-500">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-bold uppercase text-muted-foreground">Comissões</CardTitle>
                <Briefcase className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black">R$ {(stats?.totalCommissions ?? 0).toFixed(2)}</div>
                <p className="text-xs text-muted-foreground mt-1">Custos com pessoal</p>
              </CardContent>
            </Card>
            <Card className="border-none bg-card shadow-xl border-t-4 border-t-red-500">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-bold uppercase text-muted-foreground">Despesas</CardTitle>
                <ArrowDownRight className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black">R$ {(stats?.totalExpenses ?? 0).toFixed(2)}</div>
                <p className="text-xs text-muted-foreground mt-1">Outras saídas</p>
              </CardContent>
            </Card>
            <Card className="border-none bg-card shadow-xl border-t-4 border-t-green-500">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-bold uppercase text-muted-foreground">Lucro Líquido</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black text-green-500">R$ {(stats?.netProfit ?? 0).toFixed(2)}</div>
                <p className="text-xs text-muted-foreground mt-1">Resultado final</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-none bg-card shadow-xl overflow-hidden">
              <CardHeader className="bg-secondary/20">
                <CardTitle className="font-headline text-lg">Produção por Barbeiro</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead className="pl-6 font-bold uppercase text-[10px]">Profissional</TableHead>
                      <TableHead className="font-bold uppercase text-[10px]">Qtd</TableHead>
                      <TableHead className="font-bold uppercase text-[10px]">Bruto</TableHead>
                      <TableHead className="text-right pr-6 font-bold uppercase text-[10px] text-blue-400">Comissão</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats?.staffReport && stats.staffReport.length > 0 ? (
                      stats.staffReport.map((s, idx) => (
                        <TableRow key={idx} className="border-border hover:bg-primary/5">
                          <TableCell className="font-bold pl-6">{s.name}</TableCell>
                          <TableCell>{s.count}</TableCell>
                          <TableCell>R$ {s.revenue.toFixed(2)}</TableCell>
                          <TableCell className="text-right pr-6 text-blue-400 font-black">R$ {s.commission.toFixed(2)}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow><TableCell colSpan={4} className="text-center py-10 text-muted-foreground italic">Sem registros.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card className="border-none bg-card shadow-xl">
              <CardHeader><CardTitle className="font-headline text-lg">Métodos de Pagamento</CardTitle></CardHeader>
              <CardContent className="h-[300px]">
                {stats && stats.count > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="name" fontSize={12} tick={{ fill: '#888' }} />
                      <YAxis fontSize={12} tick={{ fill: '#888' }} />
                      <Tooltip contentStyle={{ backgroundColor: '#130f1f', border: 'none', borderRadius: '12px' }} />
                      <Bar dataKey="valor" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <div className="h-full flex items-center justify-center text-muted-foreground italic">Sem dados.</div>}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
