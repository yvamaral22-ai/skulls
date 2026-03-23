'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Lock, Chrome, Loader2, UserPlus, LogIn } from 'lucide-react';
import { useAuth, useUser } from '@/firebase';
import { initiateEmailSignIn, initiateEmailSignUp, initiateGoogleSignIn, initiatePasswordReset } from '@/firebase/non-blocking-login';
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
  
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');

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

    if (isSignUp && password !== confirmPassword) {
      toast({ variant: "destructive", title: "Erro no Cadastro", description: "As senhas digitadas não conferem." });
      return;
    }

    setIsLoading(true);

    try {
      if (isSignUp) {
        await initiateEmailSignUp(auth, email, password);
        toast({ title: "Bem-vindo!", description: "Seu cadastro na Barbearia Skull's foi realizado." });
      } else {
        await initiateEmailSignIn(auth, email, password);
      }
    } catch (error: any) {
      console.error("Auth Error:", error);
      let message = "Verifique suas credenciais.";
      if (error.code === 'auth/email-already-in-use') message = "Este e-mail já está em uso.";
      if (error.code === 'auth/weak-password') message = "A senha deve ter pelo menos 6 caracteres.";
      if (error.code === 'auth/invalid-email') message = "E-mail inválido.";
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        message = "E-mail ou senha incorretos.";
      }
      
      toast({ variant: "destructive", title: "Falha no Acesso", description: message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!auth) return;
    setIsLoading(true);
    try {
      await initiateGoogleSignIn(auth);
    } catch (error: any) {
      console.error("Google Auth Error:", error);
      toast({ variant: "destructive", title: "Erro no Google", description: "Não foi possível completar o acesso via Google." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!auth) return;
    if (!email) {
      toast({ variant: "destructive", title: "Atenção", description: "Digite seu e-mail acima para receber o link de recuperação." });
      return;
    }

    setIsLoading(true);
    try {
      await initiatePasswordReset(auth, email);
      toast({ title: "E-mail enviado", description: "Verifique sua caixa de entrada para redefinir sua senha." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro", description: "Não conseguimos enviar o e-mail de recuperação." });
    } finally {
      setIsLoading(false);
    }
  };

  if (isUserLoading && !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-[10px] font-bold uppercase tracking-widest animate-pulse">Sincronizando Perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background">
      <Card className="w-full max-w-[420px] border-border shadow-2xl bg-card/50 backdrop-blur-xl border-t-4 border-t-primary animate-in fade-in zoom-in duration-500">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-primary shadow-2xl shadow-primary/20 transform -rotate-6">
            <BarberPoleIcon className="h-10 w-10 text-black" />
          </div>
          <div>
            <CardTitle className="text-4xl font-headline text-primary">Barbearia Skull's</CardTitle>
            <CardDescription className="text-muted-foreground uppercase tracking-widest text-[10px] mt-2">
              {isSignUp ? 'Crie sua conta profissional' : 'Acesse o painel de gestão'}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[10px] uppercase font-bold text-muted-foreground">E-mail</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="email" 
                  name="email" 
                  type="email" 
                  placeholder="seu@email.com" 
                  className="pl-10 h-12 bg-background/50 border-primary/20" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" title="Senha deve ter no mínimo 6 caracteres" className="text-[10px] uppercase font-bold text-muted-foreground">Senha</Label>
                {!isSignUp && (
                  <button 
                    type="button" 
                    onClick={handleForgotPassword}
                    className="text-[10px] text-primary hover:underline font-bold uppercase tracking-tighter"
                  >
                    Esqueceu a senha?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="password" 
                  name="password" 
                  type="password" 
                  placeholder="••••••••" 
                  className="pl-10 h-12 bg-background/50 border-primary/20" 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {isSignUp && (
              <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                <Label htmlFor="confirmPassword" title="Repita a mesma senha" className="text-[10px] uppercase font-bold text-muted-foreground">Confirmar Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="confirmPassword" 
                    name="confirmPassword" 
                    type="password" 
                    placeholder="••••••••" 
                    className="pl-10 h-12 bg-background/50 border-primary/20" 
                    required 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>
            )}

            <Button type="submit" className="w-full h-14 font-black bg-primary text-black hover:bg-primary/90 rounded-xl mt-6 shadow-lg shadow-primary/10 transition-all uppercase tracking-widest text-xs" disabled={isLoading}>
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>PROCESSANDO...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  {isSignUp ? <UserPlus className="h-5 w-5" /> : <LogIn className="h-5 w-5" />}
                  <span>{isSignUp ? 'CADASTRAR AGORA' : 'ENTRAR NO SISTEMA'}</span>
                </div>
              )}
            </Button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-tighter">
              <span className="bg-card px-3 text-muted-foreground font-bold">Acesso Rápido</span>
            </div>
          </div>

          <Button 
            variant="outline" 
            type="button"
            className="w-full h-12 border-primary/20 hover:bg-primary/5 hover:text-primary rounded-xl font-bold uppercase text-[10px] tracking-widest" 
            onClick={handleGoogleSignIn} 
            disabled={isLoading}
          >
            <Chrome className="mr-2 h-5 w-5" /> Entrar com Google
          </Button>
        </CardContent>
        <CardFooter className="flex flex-col border-t border-border/50 pt-6">
          <button 
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setPassword('');
              setConfirmPassword('');
            }}
            className="text-[10px] text-primary hover:underline font-black uppercase tracking-[0.2em]"
          >
            {isSignUp ? 'Já tem conta? Entrar aqui' : 'Não tem conta? Crie uma agora'}
          </button>
        </CardFooter>
      </Card>
    </div>
  );
}