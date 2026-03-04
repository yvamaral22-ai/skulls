'use server';
/**
 * @fileOverview This file implements a Genkit flow for suggesting personalized additional services or products to a client.
 *
 * - suggestClientUpsellOpportunities - A function that handles the suggestion process.
 * - SuggestClientUpsellOpportunitiesInput - The input type for the suggestClientUpsellOpportunities function.
 * - SuggestClientUpsellOpportunitiesOutput - The return type for the suggestClientUpsellOpportunities function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SuggestClientUpsellOpportunitiesInputSchema = z.object({
  clientHistory: z
    .array(z.string())
    .describe('A list of services previously booked by the client.'),
  clientPreferences: z
    .string()
    .optional()
    .describe('Any known preferences or notes about the client.'),
  currentServices: z
    .array(z.string())
    .describe("Services already scheduled for the client's current appointment."),
  availableServices: z
    .array(z.string())
    .describe('All services offered by the barbershop.'),
  availableProducts: z
    .array(z.string())
    .describe('All products available for sale at the barbershop.'),
  trendingServices: z
    .array(z.string())
    .optional()
    .describe('Services that are currently popular or trending.'),
  trendingProducts: z
    .array(z.string())
    .optional()
    .describe('Products that are currently popular or trending.'),
});
export type SuggestClientUpsellOpportunitiesInput = z.infer<
  typeof SuggestClientUpsellOpportunitiesInputSchema
>;

const SuggestClientUpsellOpportunitiesOutputSchema = z.object({
  suggestedServices: z
    .array(z.string())
    .describe('List of suggested additional services for the client.'),
  suggestedProducts: z
    .array(z.string())
    .describe('List of suggested additional products for the client.'),
  reasoning: z
    .string()
    .describe('Explanation for the suggested services and products.'),
});
export type SuggestClientUpsellOpportunitiesOutput = z.infer<
  typeof SuggestClientUpsellOpportunitiesOutputSchema
>;

export async function suggestClientUpsellOpportunities(
  input: SuggestClientUpsellOpportunitiesInput
): Promise<SuggestClientUpsellOpportunitiesOutput> {
  return suggestClientUpsellOpportunitiesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestClientUpsellOpportunitiesPrompt',
  input: { schema: SuggestClientUpsellOpportunitiesInputSchema },
  output: { schema: SuggestClientUpsellOpportunitiesOutputSchema },
  prompt: `Você é um assistente de IA para um barbeiro experiente. Sua tarefa é sugerir serviços e produtos adicionais para um cliente, com o objetivo de aumentar o valor do atendimento e oferecer uma experiência personalizada.

Considere as seguintes informações:

Histórico de serviços do cliente: {{#if clientHistory}}{{#each clientHistory}}- {{this}}
{{/each}}{{else}}Nenhum histórico disponível.{{/if}}

Preferências conhecidas do cliente: {{#if clientPreferences}}{{{clientPreferences}}}{{else}}Nenhuma preferência específica.{{/if}}

Serviços já agendados para este atendimento: {{#if currentServices}}{{#each currentServices}}- {{this}}
{{/each}}{{else}}Nenhum serviço agendado.{{/if}}

Todos os serviços disponíveis na barbearia: {{#each availableServices}}- {{this}}
{{/each}}

Todos os produtos disponíveis na barbearia: {{#each availableProducts}}- {{this}}
{{/each}}

{{#if trendingServices}}Serviços em alta (tendências): {{#each trendingServices}}- {{this}}
{{/each}}{{/if}}

{{#if trendingProducts}}Produtos em alta (tendências): {{#each trendingProducts}}- {{this}}
{{/each}}{{/if}}

Com base nessas informações, sugira até 3 serviços adicionais e até 3 produtos relevantes para o cliente. As sugestões devem fazer sentido com o perfil do cliente, serem produtos e serviços que a barbearia realmente oferece e que não estejam já agendados. Inclua uma breve explicação para suas sugestões.

Priorize sugestões que complementem os serviços já agendados e o histórico do cliente. Se não houver sugestões relevantes, retorne listas vazias.`,
});

const suggestClientUpsellOpportunitiesFlow = ai.defineFlow(
  {
    name: 'suggestClientUpsellOpportunitiesFlow',
    inputSchema: SuggestClientUpsellOpportunitiesInputSchema,
    outputSchema: SuggestClientUpsellOpportunitiesOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
