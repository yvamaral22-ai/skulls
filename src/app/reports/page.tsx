
"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell 
} from "recharts"
import { 
  BarChart3, TrendingUp, DollarSign, Users, ArrowUpRight, ArrowDownRight, 
  Calendar, FileText, Download, Briefcase, Wallet
} from "lucide-react"
import { APPOINTMENTS, SERVICES, STAFF, EXPENSES } from "../lib/mock-data"

export default function ReportsPage() {
  const [startDate, setStartDate] = React.useState("2025-03-01")
  const [endDate, setEndDate] = React.useState("2025-03-31")

  const filteredData = React.useMemo(() => {
    // Apenas atendimentos concluídos (checkouts realizados) entram no financeiro
    const appts = APPOINTMENTS.filter(a => a.date >= startDate && a.date <= endDate && a.status === 'completed')
    const exps = EXPENSES.filter(e => e.date >= startDate && e.date <= endDate)

    const totalRevenue = appts.reduce((sum, a) => sum + (a.priceAtAppointment || 0), 0)
    const totalStaffCommission = appts.reduce((sum, a) => sum + (a.commissionAtAppointment || 0), 0)
    const totalExpenses = exps.reduce((sum, e) => sum + e.amount, 0)
    const netProfit = totalRevenue - totalStaffCommission - totalExpenses

    // Agrupar por serviço
    const serviceCounts: Record<string, number> = {}
    appts.forEach(a => {
      const s = SERVICES.find(srv => srv.id === a.serviceId)
      if (s) serviceCounts[s.name] = (serviceCounts[s.name] || 0) + 1
    })

    const pieData = Object.entries(serviceCounts).map(([name, value]) => ({ name, value }))

    // Faturamento por forma de pagamento
    const paymentStats: Record<string, number> = {
      'Cash': 0, 'PIX': 0, 'Credit': 0, 'Debit': 0
    }
    appts.forEach(a => {
      if (a.paymentMethod) {
        paymentStats[a.paymentMethod] = (paymentStats[a.paymentMethod] || 0) + (a.priceAtAppointment || 0)
      }
    })

    const barData = Object.entries(paymentStats).map(([name, value]) => ({ name, value }))

    // Comissões por barbeiro
    const staffStats = STAFF.map(s => {
      const staffAppts = appts.filter(a => a.staffId === s.id)
      const revenue = staffAppts.reduce((sum, a) => sum + (a.priceAtAppointment || 0), 0)
      const commission = staffAppts.reduce((sum, a) => sum + (a.commissionAtAppointment || 0), 0)
      return { ...s, revenue, commission, count: staffAppts.length }
    })

    return { totalRevenue, totalStaffCommission, totalExpenses, netProfit, pieData, staffStats, apptsCount: appts.length, barData }
  }, [startDate, endDate])

  const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444']

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline">Relatórios de Caixa</h1>
          <p className="text-muted-foreground">Fechamento financeiro baseado em checkouts concluídos.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 bg-card p-2 rounded-xl border border-border">
          <div className="flex items-center gap-2 px-2">
            <Calendar className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Período:</span>
          </div>
          <Input 
            type="date" 
            value={startDate} 
            onChange={(e) => setStartDate(e.target.value)} 
            className="w-40 bg-background" 
          />
          <span className="text-muted-foreground">até</span>
          <Input 
            type="date" 
            value={endDate} 
            onChange={(e) => setEndDate(e.target.value)} 
            className="w-40 bg-background" 
          />
          <Button variant="outline" size="icon" className="ml-2">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-none bg-card shadow-lg border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Faturamento Real</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {filteredData.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Baseado em {filteredData.apptsCount} checkouts</p>
          </CardContent>
        </Card>
        <Card className="border-none bg-card shadow-lg border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total de Comissões</CardTitle>
            <Briefcase className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {filteredData.totalStaffCommission.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">A pagar aos profissionais</p>
          </CardContent>
        </Card>
        <Card className="border-none bg-card shadow-lg border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Despesas Operacionais</CardTitle>
            <ArrowDownRight className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {filteredData.totalExpenses.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Custos do período</p>
          </CardContent>
        </Card>
        <Card className="border-none bg-card shadow-lg border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Lucro Líquido</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {filteredData.netProfit.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Resultado após comissões e despesas</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-none bg-card shadow-xl">
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              Entradas por Forma de Pagamento
            </CardTitle>
            <CardDescription>Volume financeiro por canal.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={filteredData.barData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: '#1f1631', border: 'none', borderRadius: '8px' }}
                />
                <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-none bg-card shadow-xl">
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" />
              Produção por Barbeiro
            </CardTitle>
            <CardDescription>Resumo de comissões calculadas.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead>Barbeiro</TableHead>
                  <TableHead>Qtd</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead className="text-right text-blue-400">Comissão</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.staffStats.map((s) => (
                  <TableRow key={s.id} className="border-border">
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell>{s.count}</TableCell>
                    <TableCell>R$ {s.revenue.toFixed(2)}</TableCell>
                    <TableCell className="text-right text-blue-400 font-bold">
                      R$ {s.commission.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
