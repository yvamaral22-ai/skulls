"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts"
import { BarChart3, TrendingUp, DollarSign, Users, ArrowUpRight, ArrowDownRight } from "lucide-react"

const monthlyData = [
  { name: 'Jan', revenue: 4200, appointments: 85 },
  { name: 'Fev', revenue: 3800, appointments: 70 },
  { name: 'Mar', revenue: 5100, appointments: 110 },
  { name: 'Abr', revenue: 4800, appointments: 95 },
  { name: 'Mai', revenue: 6200, appointments: 125 },
  { name: 'Jun', revenue: 5500, appointments: 115 },
]

export default function ReportsPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div>
        <h1 className="text-3xl font-bold font-headline">Relatórios de Desempenho</h1>
        <p className="text-muted-foreground">Acompanhe seu crescimento e lucro.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-none bg-card shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Receita Mensal</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ 6.200,00</div>
            <div className="flex items-center text-xs text-green-500 mt-1">
              <ArrowUpRight className="mr-1 h-3 w-3" />
              +20% desde o último mês
            </div>
          </CardContent>
        </Card>
        <Card className="border-none bg-card shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ 55,00</div>
            <div className="flex items-center text-xs text-green-500 mt-1">
              <ArrowUpRight className="mr-1 h-3 w-3" />
              +5% este mês
            </div>
          </CardContent>
        </Card>
        <Card className="border-none bg-card shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total de Atendimentos</CardTitle>
            <BarChart3 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">125</div>
            <div className="flex items-center text-xs text-green-500 mt-1">
              <ArrowUpRight className="mr-1 h-3 w-3" />
              Recorde batido!
            </div>
          </CardContent>
        </Card>
        <Card className="border-none bg-card shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Novos Clientes</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">18</div>
            <div className="flex items-center text-xs text-red-500 mt-1">
              <ArrowDownRight className="mr-1 h-3 w-3" />
              -2% vs meta
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none bg-card shadow-xl overflow-hidden">
        <CardHeader>
          <CardTitle className="font-headline">Faturamento Semestral</CardTitle>
          <CardDescription>Visão geral do progresso financeiro em 2025.</CardDescription>
        </CardHeader>
        <CardContent className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `R$${v}`} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                itemStyle={{ color: 'hsl(var(--primary))' }}
              />
              <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
