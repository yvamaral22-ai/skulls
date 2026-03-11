
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
  Calendar, Download, Briefcase, Wallet, Loader2
} from "lucide-react"
import { useFirestore, useCollection, useMemoFirebase, useUser } from "@/firebase"
import { collection } from "firebase/firestore"

export default function ReportsPage() {
  const db = useFirestore()
  const { user } = useUser()
  
  // Inicialização segura para evitar erros de hidratação
  const [startDate, setStartDate] = React.useState("")
  const [endDate, setEndDate] = React.useState("")

  React.useEffect(() => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
    setStartDate(firstDay);
    setEndDate(lastDay);
  }, []);

  const barberProfileId = user?.uid || "loading"

  // Buscar Agendamentos (para Receita e Comissões)
  const appointmentsQuery = useMemoFirebase(() => {
    if (barberProfileId === "loading") return null;
    return collection(db, "barberProfiles", barberProfileId, "appointments")
  }, [db, barberProfileId])

  // Buscar Equipe (para nomes e taxas)
  const staffQuery = useMemoFirebase(() => {
    if (barberProfileId === "loading") return null;
    return collection(db, "barberProfiles", barberProfileId, "staff")
  }, [db, barberProfileId])

  // Buscar Despesas
  const expensesQuery = useMemoFirebase(() => {
    if (barberProfileId === "loading") return null;
    return collection(db, "barberProfiles", barberProfileId, "expenses")
  }, [db, barberProfileId])

  const { data: appointments, isLoading: isApptsLoading } = useCollection(appointmentsQuery)
  const { data: staff, isLoading: isStaffLoading } = useCollection(staffQuery)
  const { data: expenses, isLoading: isExpensesLoading } = useCollection(expensesQuery)

  const stats = React.useMemo(() => {
    if (!appointments || !startDate || !endDate) return null;

    const filteredAppts = appointments.filter(a => 
      a.date >= startDate && 
      a.date <= endDate && 
      a.status === 'completed'
    )

    const filteredExps = expenses?.filter(e => 
      e.date >= startDate && 
      e.date <= endDate
    ) || []

    const totalRevenue = filteredAppts.reduce((sum, a) => sum + (Number(a.priceAtAppointment) || 0), 0)
    const totalCommissions = filteredAppts.reduce((sum, a) => sum + (Number(a.commissionAtAppointment) || 0), 0)
    const totalExpenses = filteredExps.reduce((sum, e) => sum + (Number(e.amount) || 0), 0)
    const netProfit = totalRevenue - totalCommissions - totalExpenses

    // Agrupamento por Barbeiro
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

    // Agrupamento por Forma de Pagamento
    const paymentMethods: Record<string, number> = {
      'Cash': 0, 'PIX': 0, 'Credit': 0, 'Debit': 0
    }
    filteredAppts.forEach(a => {
      if (a.paymentMethod && paymentMethods[a.paymentMethod] !== undefined) {
        paymentMethods[a.paymentMethod] += (Number(a.priceAtAppointment) || 0)
      }
    })

    const chartData = Object.entries(paymentMethods).map(([name, value]) => ({
      name: name === 'Cash' ? 'Dinheiro' : name,
      valor: value
    }))

    return { totalRevenue, totalCommissions, totalExpenses, netProfit, staffReport, chartData, count: filteredAppts.length }
  }, [appointments, staff, expenses, startDate, endDate])

  if (isApptsLoading || isStaffLoading || isExpensesLoading || !startDate || !endDate) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline text-primary">Relatórios EstiloCerto</h1>
          <p className="text-muted-foreground">Visão detalhada de faturamento e comissões.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 bg-card p-2 rounded-xl border border-border">
          <Calendar className="h-4 w-4 text-primary ml-2" />
          <Input 
            type="date" 
            value={startDate} 
            onChange={(e) => setStartDate(e.target.value)} 
            className="w-40 bg-background border-none focus-visible:ring-0" 
          />
          <span className="text-muted-foreground">até</span>
          <Input 
            type="date" 
            value={endDate} 
            onChange={(e) => setEndDate(e.target.value)} 
            className="w-40 bg-background border-none focus-visible:ring-0" 
          />
          <Button variant="ghost" size="icon">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-none bg-card shadow-lg border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Faturamento Bruto</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {stats?.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{stats?.count} atendimentos concluídos</p>
          </CardContent>
        </Card>
        <Card className="border-none bg-card shadow-lg border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Comissões</CardTitle>
            <Briefcase className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {stats?.totalCommissions.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Valor total para equipe</p>
          </CardContent>
        </Card>
        <Card className="border-none bg-card shadow-lg border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Despesas</CardTitle>
            <ArrowDownRight className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {stats?.totalExpenses.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Custos do período</p>
          </CardContent>
        </Card>
        <Card className="border-none bg-card shadow-lg border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Lucro Líquido</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {stats?.netProfit.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Resultado após comissões e despesas</p>
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
                  <TableHead className="pl-6">Barbeiro</TableHead>
                  <TableHead>Qtd. Cortes</TableHead>
                  <TableHead>Faturamento</TableHead>
                  <TableHead className="text-right pr-6 text-blue-400">Comissão</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats?.staffReport.map((s, idx) => (
                  <TableRow key={idx} className="border-border">
                    <TableCell className="font-bold pl-6">{s.name}</TableCell>
                    <TableCell>{s.count} atendimentos</TableCell>
                    <TableCell>R$ {s.revenue.toFixed(2)}</TableCell>
                    <TableCell className="text-right pr-6 text-blue-400 font-black">
                      R$ {s.commission.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
                {(!stats || stats.staffReport.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-10 text-muted-foreground italic">
                      Nenhum atendimento finalizado neste período.
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
              Entradas por Pagamento
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} tick={{ fill: '#888' }} />
                <YAxis axisLine={false} tickLine={false} fontSize={12} tick={{ fill: '#888' }} />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: '#130f1f', border: '1px solid #2d2445', borderRadius: '12px' }}
                />
                <Bar dataKey="valor" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
