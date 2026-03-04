"use client"

import * as React from "react"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Sparkles, Loader2, Scissors, ShoppingBag, Lightbulb } from "lucide-react"
import { suggestClientUpsellOpportunities, type SuggestClientUpsellOpportunitiesOutput } from "@/ai/flows/suggest-client-upsell-opportunities-flow"
import { Badge } from "@/components/ui/badge"

interface AiUpsellDialogProps {
  clientHistory: string[]
  clientPreferences: string
  currentServices: string[]
  availableServices: string[]
  availableProducts: string[]
  trendingServices?: string[]
  trendingProducts?: string[]
}

export function AiUpsellDialog(props: AiUpsellDialogProps) {
  const [loading, setLoading] = React.useState(false)
  const [suggestion, setSuggestion] = React.useState<SuggestClientUpsellOpportunitiesOutput | null>(null)

  const handleSuggest = async () => {
    setLoading(true)
    try {
      const result = await suggestClientUpsellOpportunities(props)
      setSuggestion(result)
    } catch (error) {
      console.error("AI flow failed", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="border-accent/30 text-accent hover:bg-accent/10 transition-colors"
          onClick={handleSuggest}
        >
          <Sparkles className="mr-2 h-4 w-4" /> Sugestões IA
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md bg-card border-none shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-headline">
            <Sparkles className="h-5 w-5 text-accent animate-pulse" />
            Insights Inteligentes
          </DialogTitle>
          <DialogDescription>
            Sugestões personalizadas para aumentar o valor deste atendimento.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground animate-pulse">Analisando histórico e tendências...</p>
          </div>
        ) : suggestion ? (
          <div className="space-y-6 mt-4">
            <div className="space-y-3">
              <h4 className="text-sm font-bold flex items-center gap-2 text-primary">
                <Scissors className="h-4 w-4" /> Serviços Adicionais
              </h4>
              <div className="flex flex-wrap gap-2">
                {suggestion.suggestedServices.length > 0 ? (
                  suggestion.suggestedServices.map((s, i) => (
                    <Badge key={i} variant="secondary" className="bg-primary/10 text-primary border-primary/20">{s}</Badge>
                  ))
                ) : <span className="text-xs text-muted-foreground">Nenhuma sugestão de serviço no momento.</span>}
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-bold flex items-center gap-2 text-accent">
                <ShoppingBag className="h-4 w-4" /> Produtos Recomendados
              </h4>
              <div className="flex flex-wrap gap-2">
                {suggestion.suggestedProducts.length > 0 ? (
                  suggestion.suggestedProducts.map((p, i) => (
                    <Badge key={i} variant="secondary" className="bg-accent/10 text-accent border-accent/20">{p}</Badge>
                  ))
                ) : <span className="text-xs text-muted-foreground">Nenhuma sugestão de produto no momento.</span>}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-secondary/30 border border-border space-y-2">
              <h4 className="text-sm font-bold flex items-center gap-2 text-muted-foreground">
                <Lightbulb className="h-4 w-4" /> Por que oferecer?
              </h4>
              <p className="text-sm leading-relaxed text-muted-foreground italic">
                "{suggestion.reasoning}"
              </p>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            Ocorreu um problema ao gerar sugestões.
          </div>
        )}

        <DialogFooter className="mt-6">
          <Button onClick={handleSuggest} variant="ghost" size="sm" className="text-xs">Gerar Novas</Button>
          <Button className="bg-primary text-white" asChild>
            <DialogTrigger>Fechar</DialogTrigger>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
