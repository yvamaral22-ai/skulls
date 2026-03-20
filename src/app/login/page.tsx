'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Lock, Chrome, Loader2 } from 'lucide-react';
import { useAuth, useUser } from '@/firebase';
import { initiateEmailSignIn, initiateEmailSignUp, initiateGoogleSignIn } from '@/firebase/non-blocking-login';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

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

export default function LoginPage() {
  const auth = useAuth();
  const { user, role, isUserLoading } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  const [isSignUp, setIsSignUp] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    if (!isUserLoading && user) {
      if (role === 'CLIENT') router.push('/client');
      else router.push('/');
    }
  }, [user, role, isUserLoading, router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!auth) {
      toast({ variant: "destructive", title: "Erro", description: "O serviço de autenticação ainda não está pronto." });
      return;
    }

    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      if (isSignUp) {
        await initiateEmailSignUp(auth, email, password);
        toast({ title: "Cadastro Realizado", description: "Bem-vindo à Barbearia Skull's!" });
      } else {
        await initiateEmailSignIn(auth, email, password);
      }
      // O redirecionamento será feito pelo useEffect após a mudança do estado de auth
    } catch (error: any) {
      console.error(error);
      setIsLoading(false);
      let message = "Verifique suas credenciais.";
      if (error.code === 'auth/email-already-in-use') message = "Este e-mail já está em uso.";
      if (error.code === 'auth/weak-password') message = "A senha deve ter pelo menos 6 caracteres.";
      if (error.code === 'auth/invalid-email') message = "E-mail inválido.";
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') message = "E-mail ou senha incorretos.";
      
      toast({ variant: "destructive", title: "Erro no Acesso", description: message });
    }
  };

  const handleGoogleSignIn = async () => {
    if (!auth) return;
    setIsLoading(true);
    try {
      await initiateGoogleSignIn(auth);
    } catch (error: any) {
      console.error(error);
      setIsLoading(false);
      toast({ variant: "destructive", title: "Erro no Google", description: "Não foi possível completar o acesso." });
    }
  };

  if (isUserLoading && !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background">
      <Card className="w-full max-w-[400px] border-border shadow-2xl bg-card/50 backdrop-blur-xl border-t-4 border-t-primary">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-primary shadow-2xl shadow-primary/20 transform -rotate-6">
            <BarberPoleIcon className="h-10 w-10 text-black" />
          </div>
          <div>
            <CardTitle className="text-4xl font-headline text-primary">Barbearia Skull's</CardTitle>
            <CardDescription className="text-muted-foreground uppercase tracking-widest text-[10px]">
              {isSignUp ? 'Criar Cadastro' : 'Acesso ao Sistema'}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="email" name="email" type="email" placeholder="nome@exemplo.com" className="pl-10 h-12 bg-background/50 border-primary/20" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="password" name="password" type="password" placeholder="••••••••" className="pl-10 h-12 bg-background/50 border-primary/20" required />
              </div>
            </div>
            <Button type="submit" className="w-full h-12 font-bold bg-primary text-black hover:bg-primary/90" disabled={isLoading}>
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : (isSignUp ? 'Criar Cadastro' : 'Entrar no Sistema')}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-tighter">
              <span className="bg-card px-2 text-muted-foreground">Ou continue com</span>
            </div>
          </div>

          <Button 
            variant="outline" 
            type="button"
            className="w-full h-12 border-primary/20 hover:bg-primary/5 hover:text-primary" 
            onClick={handleGoogleSignIn} 
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
              <>
                <Chrome className="mr-2 h-5 w-5" /> Google
              </>
            )}
          </Button>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <button 
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-xs text-primary hover:underline font-medium uppercase tracking-widest"
          >
            {isSignUp ? 'Já tem uma conta? Entre aqui' : 'Não tem conta? Cadastre-se agora'}
          </button>
        </CardFooter>
      </Card>
    </div>
  );
}
