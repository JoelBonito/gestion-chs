import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { TrendingDown, Plus, Eye, Download, Paperclip } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import PagamentoForm from "@/components/PagamentoForm";
import { FinancialAttachmentButton } from "@/components/FinancialAttachmentButton";
import { AttachmentManager } from "@/components/AttachmentManager";
import { OrderItemsView } from "@/components/OrderItemsView";
import { useLocale } from "@/contexts/LocaleContext";

interface EncomendaFinanceira {
  id: string;
  numero_encomenda: string;
  cliente_nome: string;
  valor_total: number;
  valor_pago: number;
  saldo_devedor: number;
  valor_frete: number;
  total_pagamentos: number;
  data_producao_estimada?: string;
}

interface EncomendasFinanceiroProps {
  onRefreshNeeded?: () => void;
  showCompleted?: boolean;
}

export default function EncomendasFinanceiro({ onRefreshNeeded, showCompleted = false }: EncomendasFinanceiroProps) {
  const [encomendas, setEncomendas] = useState<EncomendaFinanceira[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEncomenda, setSelectedEncomenda] = useState<EncomendaFinanceira | null>(null);
  const [showPagamentoForm, setShowPagamentoForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [localShowCompleted, setLocalShowCompleted] = useState(showCompleted);
  const { toast } = useToast();
  const { isRestrictedFR } = useLocale();

  // --- i18n helper (mínimas mudanças) ---
  type Lang = "pt" | "fr";
  const lang: Lang = isRestrictedFR ? "fr" : "pt";
  const dict: Record<string, { pt: string; fr: string }> = {
    // Títulos / descrições
    "Contas a Receber - Clientes": { pt: "Contas a Receber - Clientes", fr: "Comptes à Recevoir - Clients" },
    "Encomendas com saldo devedor de clientes": {
      pt: "Encomendas com saldo devedor de clientes",
      fr: "Commandes avec solde débiteur des clients"
    },
    "Mostrar Concluídos": { pt: "Mostrar Concluídos", fr: "Afficher terminés" },

    // Tabela (headers)
    "Nº Encomenda": { pt: "Nº Encomenda", fr: "N° de commande" },
    "Cliente": { pt: "Cliente", fr: "Client" },
    "Data Produção": { pt: "Data Produção", fr: "Date de production" },
    "Total a Receber": { pt: "Total a Receber", fr: "Total à recevoir" },
    "Recebido": { pt: "Recebido", fr: "Reçu" },
    "Saldo a Receber": { pt: "Saldo a Receber", fr: "Solde à recevoir" },
    "Pagamentos": { pt: "Pagamentos", fr: "Paiements" },
    "Ações": { pt: "Ações", fr: "Actions" },

    // Estados/mensagens
    "Carregando encomendas...": { pt: "Carregando encomendas...", fr: "Chargement des commandes..." },
    "Nenhuma conta a receber encontrada": {
      pt: "Nenhuma conta a receber encontrada",
      fr: "Aucun compte à recevoir trouvé"
    },
    "pag.":
