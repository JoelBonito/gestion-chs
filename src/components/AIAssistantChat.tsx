import { useState } from 'react';
import { MessageSquare, X, Send, Loader2, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { useAIChat } from '@/hooks/useAIChat';
import { DataReportRenderer } from '@/components/chat/DataReportRenderer';

export function AIAssistantChat() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false); // Novo estado
  const { messages, isLoading, sendMessage, inputValue, setInputValue } = useAIChat();

  // Apenas mostrar para jbento1@gmail.com
  if (user?.email !== 'jbento1@gmail.com') {
    return null;
  }

  const handleSend = () => {
    if (inputValue.trim() && !isLoading) {
      sendMessage(inputValue.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Botão flutuante */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className={cn(
            "fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-elegant",
            "bg-gradient-to-br from-blue-500 to-purple-600",
            "hover:shadow-glow hover:scale-110",
            "transition-all duration-300",
            "z-50 p-0"
          )}
        >
          <MessageSquare className="h-6 w-6 text-white" />
        </Button>
      )}

      {/* Chat expandido */}
      {isOpen && (
        <div
          className={cn(
            "fixed bg-background/95 backdrop-blur-xl border border-border/50 shadow-elegant flex flex-col overflow-hidden z-50 transition-all duration-300", // Classes base
            isFullScreen
              ? "inset-0 rounded-none w-full h-full" // Modo Full Screen
              : "bottom-6 right-6 w-[400px] h-[600px] rounded-3xl animate-in slide-in-from-bottom-4" // Modo Normal
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border/50 bg-gradient-to-r from-blue-500/10 to-purple-600/10 shrink-0">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-glow">
                <MessageSquare className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Assistente IA</h3>
                <p className="text-xs text-muted-foreground">Powered by Gemini 2.5 Flash</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* Botão Full Screen */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsFullScreen(!isFullScreen)}
                className="h-8 w-8 rounded-full hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                title={isFullScreen ? "Restaurar" : "Tela Cheia"}
              >
                {isFullScreen ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </Button>

              {/* Botão Fechar */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setIsOpen(false);
                  setIsFullScreen(false); // Reseta full screen ao fechar
                }}
                className="h-8 w-8 rounded-full hover:bg-muted/50 hover:bg-red-500/10 hover:text-red-500"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Mensagens */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  <p className="text-sm">Olá! Como posso ajudar você hoje?</p>
                  <p className="text-xs mt-2">Posso analisar dados, criar registros e muito mais.</p>
                </div>
              )}

              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "flex",
                    msg.role === 'user' ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-4 py-3 shadow-sm", // Aumentei largura máx para 85% para caber tabela
                      msg.role === 'user'
                        ? "bg-gradient-to-br from-blue-500 to-purple-600 text-white"
                        : "bg-muted text-foreground overflow-hidden" // overflow-hidden para tabelas
                    )}
                  >
                    {/* Renderizador Inteligente (Texto ou Tabela) */}
                    <DataReportRenderer content={msg.content} />
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-2xl px-4 py-2 shadow-sm">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t border-border/50 bg-background/50">
            <div className="flex gap-2">
              <Textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Digite sua mensagem..."
                className="min-h-[44px] max-h-[120px] resize-none rounded-2xl"
                disabled={isLoading}
              />
              <Button
                onClick={handleSend}
                disabled={!inputValue.trim() || isLoading}
                size="icon"
                className={cn(
                  "h-11 w-11 rounded-full shrink-0",
                  "bg-gradient-to-br from-blue-500 to-purple-600",
                  "hover:shadow-glow hover:scale-105",
                  "transition-all duration-200"
                )}
              >
                <Send className="h-4 w-4 text-white" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
