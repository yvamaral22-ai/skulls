
'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Scissors, Clock, User, Star } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection } from 'firebase/firestore';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function ClientPage() {
  const { user } = useUser();
  const db = useFirestore();

  // Para um cliente real, ele veria apenas os agendamentos dele.
  // Como é um SaaS, precisamos saber de qual barbearia estamos falando.
  // Neste protótipo, vamos mostrar uma visão geral amigável.
  
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-black font-headline text-primary">Olá, Bem-vindo!</h1>
        <p className="text-muted-foreground">Aqui você pode acompanhar seus agendamentos e ver nossos serviços.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-none bg-card shadow-2xl overflow-hidden border-t-4 border-t-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              Meus Próximos Horários
            </CardTitle>
            <CardDescription>Acompanhe o status do seu corte.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-xl bg-secondary/30 border border-border italic text-center text-sm text-muted-foreground py-10">
              Você ainda não possui agendamentos ativos. 
              <br />
              Entre em contato com a barbearia para marcar seu horário!
            </div>
          </CardContent>
        </Card>

        <Card className="border-none bg-card shadow-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-accent" />
              Destaques do Mês
            </CardTitle>
            <CardDescription>O que está em alta na barbearia.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 p-3 rounded-lg bg-secondary/20">
              <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">1</div>
              <div>
                <p className="font-bold text-sm">Degradê Americano</p>
                <p className="text-xs text-muted-foreground">O preferido da galera.</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-3 rounded-lg bg-secondary/20">
              <div className="h-10 w-10 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold">2</div>
              <div>
                <p className="font-bold text-sm">Barba Terapia</p>
                <p className="text-xs text-muted-foreground">Relaxamento e estilo.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="bg-primary/5 p-8 rounded-3xl border border-primary/10 text-center space-y-4">
        <Scissors className="h-12 w-12 text-primary mx-auto mb-4" />
        <h2 className="text-2xl font-bold font-headline">Pronto para dar um tapa no visual?</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Nossos barbeiros estão prontos para te atender com o melhor da cutelaria clássica e moderna.
        </p>
        <Button size="lg" className="bg-primary hover:bg-primary/90 text-white px-8 h-12 rounded-full font-bold shadow-xl shadow-primary/20">
          Ver Catálogo de Preços
        </Button>
      </div>
    </div>
  );
}
