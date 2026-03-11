# Skull Barber - SaaS de Gestão para Barbearias

Este é um sistema robusto de gestão e agendamento para barbearias de elite, construído com Next.js 15, Firebase e Genkit AI.

## 🚀 Arquitetura Técnica

O projeto segue uma estrutura modular para garantir escalabilidade:

- **`src/app`**: Utiliza o App Router do Next.js. As páginas são divididas por domínios de negócio (Agenda, Clientes, Financeiro).
- **`src/firebase`**: Centraliza toda a comunicação com o Firestore e Auth. Utilizamos Hooks Customizados para garantir reatividade em tempo real.
- **`src/ai`**: Integração com Google Genkit para insights de negócios e sugestões personalizadas para clientes.
- **`src/components`**: Divididos em componentes atômicos (UI) e componentes de negócio (Dashboard/Forms).
- **`docs/backend.json`**: Definição da estrutura de dados Multi-tenant.

## 🛠 Stack Tecnológica

- **Frontend**: Next.js 15, TypeScript, TailwindCSS.
- **UI Components**: Shadcn UI, Lucide Icons.
- **Backend**: Firebase Firestore (NoSQL), Firebase Auth.
- **Inteligência Artificial**: Google Genkit (Gemini 2.5 Flash).

## 📊 Regras de Negócio (SaaS)

- **Multi-tenancy**: Cada barbearia é um `barberProfile` isolado.
- **Comissões**: Cálculo automático baseado na produtividade individual de cada barbeiro.
- **Agendamento**: Gestão de conflitos de horários em tempo real.
