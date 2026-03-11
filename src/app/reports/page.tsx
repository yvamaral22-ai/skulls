
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
  Calendar as CalendarIcon, Briefcase, Wallet, Loader2, Play, FileBarChart, RefreshCw
} from "lucide-react"
import { useFirestore, useCollection, useMemoFirebase, useUser } from "@/firebase"
import { collection } from "firebase/firestore"
import { format, startOfMonth, endOfMonth } from "date-fns"

export default function ReportsPage() {
  const db = useFirestore()
  const { user } = useUser()
  
  const [startDate, setStartDate] = React.useState("")
  const [endDate, setEndDate] = React.useState("")
  const [appliedStartDate, setAppliedStartDate] = React.useState("")
  const [appliedEndDate, setAppliedEndDate] = React.useState("")
  const [isGenerating, setIsGenerating] = React.useState(false)
  const [hasGenerated, setHasGenerated] = React.useState(false)

  // Inicializa as datas com o mês atual na carga inicial
  React.useEffect(() => {
    const now = new Date();
    const start = format(startOfMonth(now), 'yyyy-MM-dd');
    const end = format(endOfMonth(now), 'yyyy-MM-dd');
    setStartDate(start);
    setEndDate(end);
  }, []);

  const barberProfileId = user?.uid

  const appointmentsQuery = useMemoFirebase(() => {
    if (!barberProfileId) return null;
    return collection(db, "barberProfiles", barberProfileId, "appointments")
  }, [db, barberProfileId])

  const staffQuery = useMemoFirebase(() => {
    if (!barberProfileId) return null;
    return collection(db, "barberProfiles", barberProfileId, "staff")
  }, [db, barberProfileId])

  const expensesQuery = useMemoFirebase(() => {
    if (!barberProfileId) return null;
    return collection(db, "barberProfiles", barberProfileId, "expenses")
  }, [db, barberProfileId])

  const { data: appointments, isLoading: isApptsLoading } = useCollection(appointmentsQuery)
  const { data: staff, isLoading: isStaffLoading } = useCollection(staffQuery)
  const { data: expenses, isLoading: isExpensesLoading } = useCollection(expensesQuery)

  const handleApplyFilters = () => {
    setIsGenerating(true);
    setAppliedStartDate(startDate);
    setAppliedEndDate(endDate);
    setHasGenerated(true);
    
    // Feedback visual de processamento
    setTimeout(() => {
      setIsGenerating(false);
    }, 800);
  }

  const stats = React.useMemo(() => {
    // Só calcula se houver datas aplicadas e dados carregados
    if (!appointments || !appliedStartDate || !appliedEndDate) return null;

    // Filtro rigoroso por data e status concluído
    const filteredAppts = appointments.filter(a => {
      const apptDate = (a.date || "").trim(); 
      const status = (a.status || "").toLowerCase();
      const isCompleted = status === 'completed';
      const isWithinRange = apptDate >= appliedStartDate && apptDate <= appliedEndDate;
      return isCompleted && isWithinRange;
    })

    const filteredExps = (expenses || []).filter(e => {
      const expDate = (e.date || "").trim();
      return expDate >= appliedStartDate && expDate <= appliedEndDate;
    })

    // Somas forçadas para Number para evitar erros de tipagem
    const totalRevenue = filteredAppts.reduce((sum, a) => sum + (Number(a.priceAtAppointment) || 0), 0)
    const totalCommissions = filteredAppts.reduce((sum, a) => sum + (Number(a.commissionAtAppointment) || 0), 0)
    const totalExpenses = filteredExps.reduce((sum, e) => sum + (Number(e.amount) || 0), 0)
    const netProfit = totalRevenue - totalCommissions - totalExpenses

    // Relatório de equipe (inclui até quem não produziu se estiver no período)
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

    const paymentMethodsMap: Record<string, number> = {
      'Cash': 0, 'PIX': 0, 'Credit': 0, 'Debit': 0
    }
    filteredAppts.forEach(a => {
      const method = a.paymentMethod;
      if (method && paymentMethodsMap[method] !== undefined) {
        paymentMethodsMap[method] += (Number(a.priceAtAppointment) || 0)
      }
    })

    const chartData = Object.entries(paymentMethodsMap).map(([name, value]) => ({
      name: name === 'Cash' ? 'Dinheiro' : name,
      valor: value
    }))

    return { 
      totalRevenue, 
      totalCommissions, 
      totalExpenses, 
      netProfit, 
      staffReport, 
      chartData, 
      count: filteredAppts.length 
    }
  }, [appointments, staff, expenses, appliedStartDate, appliedEndDate])

  const isInitialLoading = isApptsLoading && !appointments;

  if (isInitialLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold font-headline text-primary">Relatórios Skull Barber</h1>
            {isApptsLoading && <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />}
          </div>
          <p className="text-muted-foreground">Consolidação financeira em tempo real.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 bg-card p-3 rounded-2xl border border-border shadow-xl">
          <div className="flex items-center gap-2 px-2 border-r border-border pr-4">
            <CalendarIcon className="h-4 w-4 text-primary" />
            <Input 
              type="date" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)} 
              className="w-40 bg-background border-none focus-visible:ring-0 text-sm h-10" 
            />
            <span className="text-muted-foreground font-bold">→</span>
            <Input 
              type="date" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)} 
              className="w-40 bg-background border-none focus-visible:ring-0 text-sm h-10" 
            />
          </div>
          <Button 
            onClick={handleApplyFilters} 
            disabled={isGenerating || !startDate || !endDate}
            className="bg-primary hover:bg-primary/90 text-white h-10 px-6 ml-2 font-bold shadow-lg shadow-primary/20"
          >
            {isGenerating ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <Play className="mr-2 h-4 w-4 fill-current" />
                Gerar Relatório
              </>
            )}
          </Button>
        </div>
      </div>

      {!hasGenerated ? (
        <div className="flex flex-col items-center justify-center py-32 border-2 border-dashed border-border rounded-3xl opacity-60">
          <FileBarChart className="h-16 w-16 text-muted-foreground mb-4 opacity-20" />
          <h3 className="text-xl font-bold">Aguardando Período</h3>
          <p className="text-muted-foreground italic text-sm">Selecione o intervalo de datas e clique em Gerar.</p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 animate-in slide-in-from-bottom-2 duration-500">
            <Card className="border-none bg-card shadow-xl border-t-4 border-t-primary">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-bold uppercase text-muted-foreground">Faturamento</CardTitle>
                <DollarSign className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black">R$ {(stats?.totalRevenue ?? 0).toFixed(2)}</div>
                <p className="text-xs text-muted-foreground mt-1">{stats?.count ?? 0} atendimentos finalizados</p>
              </CardContent>
            </Card>
            
            <Card className="border-none bg-card shadow-xl border-t-4 border-t-blue-500">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-bold uppercase text-muted-foreground">Comissões</CardTitle>
                <Briefcase className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black">R$ {(stats?.totalCommissions ?? 0).toFixed(2)}</div>
                <p className="text-xs text-muted-foreground mt-1">Total para equipe</p>
              </CardContent>
            </Card>

            <Card className="border-none bg-card shadow-xl border-t-4 border-t-red-500">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-bold uppercase text-muted-foreground">Despesas</CardTitle>
                <ArrowDownRight className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black">R$ {(stats?.totalExpenses ?? 0).toFixed(2)}</div>
                <p className="text-xs text-muted-foreground mt-1">Custos operacionais</p>
              </CardContent>
            </Card>

            <Card className="border-none bg-card shadow-xl border-t-4 border-t-green-500">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-bold uppercase text-muted-foreground">Lucro Líquido</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black text-green-500">R$ {(stats?.netProfit ?? 0).toFixed(2)}</div>
                <p className="text-xs text-muted-foreground mt-1">Resultado final</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2 border-none bg-card shadow-xl overflow-hidden">
              <CardHeader className="bg-secondary/20">
                <CardTitle className="font-headline text-lg flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-primary" />
                  Produção por Barbeiro
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="pl-6 font-bold">Profissional</TableHead>
                      <TableHead className="font-bold">Serviços</TableHead>
                      <TableHead className="font-bold">Bruto</TableHead>
                      <TableHead className="text-right pr-6 text-blue-400 font-bold">Comissão</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats?.staffReport && stats.staffReport.some(s => s.count > 0) ? (
                      stats.staffReport.filter(s => s.count > 0).map((s, idx) => (
                        <TableRow key={idx} className="border-border hover:bg-primary/5 transition-colors">
                          <TableCell className="font-bold pl-6">{s.name}</TableCell>
                          <TableCell>{s.count} atendimentos</TableCell>
                          <TableCell>R$ {s.revenue.toFixed(2)}</TableCell>
                          <TableCell className="text-right pr-6 text-blue-400 font-black">
                            R$ {s.commission.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-16 text-muted-foreground italic">
                          Nenhum dado financeiro para o período e profissionais selecionados.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card className="border-none bg-card shadow-xl">
              <CardHeader>
                <CardTitle className="font-headline text-lg flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-accent" />
                  Meios de Recebimento
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[350px] mt-4">
                {stats && stats.count > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} tick={{ fill: '#888' }} />
                      <YAxis axisLine={false} tickLine={false} fontSize={12} tick={{ fill: '#888' }} />
                      <Tooltip 
                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                        contentStyle={{ backgroundColor: '#130f1f', border: '1px solid #2d2445', borderRadius: '12px' }}
                      />
                      <Bar dataKey="valor" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-sm italic border border-dashed border-border/50 rounded-xl">
                    <p>Sem dados gráficos disponíveis</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
