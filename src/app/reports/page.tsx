
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
  Calendar as CalendarIcon, Briefcase, Wallet, Loader2, Play
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

  React.useEffect(() => {
    const now = new Date();
    const start = format(startOfMonth(now), 'yyyy-MM-dd');
    const end = format(endOfMonth(now), 'yyyy-MM-dd');
    setStartDate(start);
    setEndDate(end);
    setAppliedStartDate(start);
    setAppliedEndDate(end);
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
    setAppliedStartDate(startDate);
    setAppliedEndDate(endDate);
  }

  const stats = React.useMemo(() => {
    if (!appointments || !appliedStartDate || !appliedEndDate) return null;

    const filteredAppts = appointments.filter(a => 
      a.date >= appliedStartDate && 
      a.date <= appliedEndDate && 
      a.status === 'completed'
    )

    const filteredExps = expenses?.filter(e => 
      e.date >= appliedStartDate && 
      e.date <= appliedEndDate
    ) || []

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

    const paymentMethodsMap: Record<string, number> = {
      'Cash': 0, 'PIX': 0, 'Credit': 0, 'Debit': 0
    }
    filteredAppts.forEach(a => {
      if (a.paymentMethod && paymentMethodsMap[a.paymentMethod] !== undefined) {
        paymentMethodsMap[a.paymentMethod] += (Number(a.priceAtAppointment) || 0)
      }
    })

    const chartData = Object.entries(paymentMethodsMap).map(([name, value]) => ({
      name: name === 'Cash' ? 'Dinheiro' : name,
      valor: value
    }))

    return { totalRevenue, totalCommissions, totalExpenses, netProfit, staffReport, chartData, count: filteredAppts.length }
  }, [appointments, staff, expenses, appliedStartDate, appliedEndDate])

  if (isApptsLoading || isStaffLoading || isExpensesLoading || !startDate) {
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
          <h1 className="text-3xl font-bold font-headline text-primary">Relatórios Skull Barber</h1>
          <p className="text-muted-foreground">Visão financeira de faturamento e lucro.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 bg-card p-3 rounded-2xl border border-border shadow-xl">
          <div className="flex items-center gap-2 px-2 border-r border-border pr-4">
            <CalendarIcon className="h-4 w-4 text-primary" />
            <Input 
              type="date" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)} 
              className="w-36 bg-background border-none focus-visible:ring-0 text-xs h-8" 
            />
            <span className="text-muted-foreground font-bold">→</span>
            <Input 
              type="date" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)} 
              className="w-36 bg-background border-none focus-visible:ring-0 text-xs h-8" 
            />
          </div>
          <Button 
            onClick={handleApplyFilters} 
            className="bg-primary hover:bg-primary/90 text-white h-9 px-4 ml-2"
          >
            <Play className="mr-2 h-4 w-4 fill-current" /> Gerar Relatório
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-none bg-card shadow-xl border-t-4 border-t-primary">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold uppercase text-muted-foreground">Faturamento</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black">R$ {stats?.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">{stats?.count} cortes finalizados</p>
          </CardContent>
        </Card>
        
        <Card className="border-none bg-card shadow-xl border-t-4 border-t-blue-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold uppercase text-muted-foreground">Comissões</CardTitle>
            <Briefcase className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black">R$ {stats?.totalCommissions.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">Total pago à equipe</p>
          </CardContent>
        </Card>

        <Card className="border-none bg-card shadow-xl border-t-4 border-t-red-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold uppercase text-muted-foreground">Despesas</CardTitle>
            <ArrowDownRight className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black">R$ {stats?.totalExpenses.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">Custos operacionais</p>
          </CardContent>
        </Card>

        <Card className="border-none bg-card shadow-xl border-t-4 border-t-green-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold uppercase text-muted-foreground">Lucro Líquido</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-green-500">R$ {stats?.netProfit.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">Resultado no período</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-none bg-card shadow-xl overflow-hidden">
          <CardHeader className="bg-secondary/20">
            <CardTitle className="font-headline text-lg flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" />
              Ranking de Produção
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="pl-6 font-bold">Barbeiro</TableHead>
                  <TableHead className="font-bold">Atendimentos</TableHead>
                  <TableHead className="font-bold">Faturamento</TableHead>
                  <TableHead className="text-right pr-6 text-blue-400 font-bold">Comissão</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats?.staffReport.map((s, idx) => (
                  <TableRow key={idx} className="border-border hover:bg-primary/5 transition-colors">
                    <TableCell className="font-bold pl-6">{s.name}</TableCell>
                    <TableCell>{s.count} serviços</TableCell>
                    <TableCell>R$ {s.revenue.toFixed(2)}</TableCell>
                    <TableCell className="text-right pr-6 text-blue-400 font-black">
                      R$ {s.commission.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
                {(!stats || stats.staffReport.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-16 text-muted-foreground italic">
                      Clique em "Gerar Relatório" para visualizar os dados.
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
              Fontes de Pagamento
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[350px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.chartData}>
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
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
