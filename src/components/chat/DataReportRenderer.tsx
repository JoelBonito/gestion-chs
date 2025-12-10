import React from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, BarChart3, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface DataReportProps {
    content: string;
}

interface ReportData {
    type: 'data_report' | 'error';
    summary?: string;
    message?: string;
    data?: any[];
    visualization?: 'table' | 'list' | 'bar_chart';
}

export function DataReportRenderer({ content }: DataReportProps) {
    // Tenta extrair o JSON do bloco de código markdown
    const extractJson = (text: string): ReportData | null => {
        try {
            // 1. Tenta limpar backticks primeiro
            let cleanText = text.replace(/```json\n?|```/g, '').trim();

            // 2. Busca o primeiro '{' e o último '}' para isolar o JSON
            const firstBrace = cleanText.indexOf('{');
            const lastBrace = cleanText.lastIndexOf('}');

            if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
                cleanText = cleanText.substring(firstBrace, lastBrace + 1);
            }

            const parsed = JSON.parse(cleanText);

            // Valida se tem a estrutura mínima
            if (parsed.type === 'data_report' || parsed.type === 'error') {
                return parsed;
            }
            return null;
        } catch (e) {
            // Se falhar o parse, retorna null para renderizar como texto
            return null;
        }
    };

    const report = extractJson(content);

    // Se não for um relatório JSON válido, renderiza texto normal
    if (!report) {
        return <p className="text-sm whitespace-pre-wrap">{content}</p>;
    }

    // Renderiza erro estruturado
    if (report.type === 'error') {
        return (
            <Alert variant="destructive" className="bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Não foi possível gerar o relatório</AlertTitle>
                <AlertDescription>{report.message || 'Nenhum dado encontrado.'}</AlertDescription>
            </Alert>
        );
    }

    // Renderiza tabela de dados
    if (report.type === 'data_report' && report.data && report.data.length > 0) {
        const columns = Object.keys(report.data[0]);

        return (
            <Card className="w-full bg-background/50 border-border/50 shadow-sm overflow-hidden mt-2">
                <CardHeader className="bg-muted/30 pb-2">
                    <div className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-primary" />
                        <CardTitle className="text-sm font-medium text-foreground">
                            {report.summary || 'Relatório de Dados'}
                        </CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto max-w-full">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent">
                                    {columns.map((col) => (
                                        <TableHead key={col} className="text-xs uppercase font-bold text-muted-foreground whitespace-nowrap px-4 py-2">
                                            {col.replace(/_/g, ' ')}
                                        </TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {report.data.map((row, idx) => (
                                    <TableRow key={idx} className="hover:bg-muted/50 transition-colors">
                                        {columns.map((col) => (
                                            <TableCell key={`${idx}-${col}`} className="text-sm px-4 py-2 whitespace-nowrap">
                                                {/* Formatação básica de valores */}
                                                {typeof row[col] === 'number'
                                                    ? row[col].toLocaleString('pt-BR')
                                                    : String(row[col])}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                    <div className="p-2 border-t border-border/50 bg-muted/20 text-[10px] text-muted-foreground text-center">
                        📊 Dados exatos do banco de dados (Gestion CHS)
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Fallback para lista vazia mas sem erro explícito
    return (
        <Alert className="bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400">
            <Info className="h-4 w-4" />
            <AlertTitle>Relatório Vazio</AlertTitle>
            <AlertDescription>A consulta foi executada com sucesso, mas não retornou registros.</AlertDescription>
        </Alert>
    );
}
