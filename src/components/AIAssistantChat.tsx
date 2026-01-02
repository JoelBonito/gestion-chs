import { useState } from "react";
import { MessageSquare, X, Send, Loader2, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { useAIChat } from "@/hooks/useAIChat";
import { DataReportRenderer } from "@/components/chat/DataReportRenderer";

export function AIAssistantChat() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false); // Novo estado
  const { messages, isLoading, sendMessage, inputValue, setInputValue } = useAIChat();

  // Apenas mostrar para jbento1@gmail.com
  if (user?.email !== "jbento1@gmail.com") {
    return null;
  }

  const handleSend = () => {
    if (inputValue.trim() && !isLoading) {
      sendMessage(inputValue.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
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
          variant="gradient"
          className={cn("shadow-elegant fixed right-6 bottom-6 h-14 w-14 rounded-lg", "z-50 p-0")}
        >
          <MessageSquare className="h-6 w-6 text-primary-foreground" />
        </Button>
      )}

      {/* Chat expandido */}
      {isOpen && (
        <div
          className={cn(
            "bg-background/95 border-border/50 shadow-elegant fixed z-50 flex flex-col overflow-hidden border backdrop-blur-xl transition-all duration-300", // Classes base
            isFullScreen
              ? "inset-0 h-full w-full rounded-none" // Modo Full Screen
              : "animate-in slide-in-from-bottom-4 right-6 bottom-6 h-[600px] w-[400px] rounded-3xl" // Modo Normal
          )}
        >
          {/* Header */}
          <div className="border-border/50 bg-accent/20 flex shrink-0 items-center justify-between border-b p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--btn-gradient-from)] shadow-[var(--btn-shadow)] shadow-lg">
                <MessageSquare className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h3 className="text-foreground font-semibold">Assistente IA</h3>
                <p className="text-muted-foreground text-xs">Powered by Gemini 2.5 Flash</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* Botão Full Screen */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsFullScreen(!isFullScreen)}
                className="hover:bg-muted/50 text-muted-foreground hover:text-foreground h-8 w-8 rounded-lg"
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
                className="group h-8 w-8 rounded-full transition-all duration-300 hover:rotate-90 hover:bg-red-500/10 hover:text-red-500"
              >
                <X className="h-4 w-4 transition-transform" />
              </Button>
            </div>
          </div>

          {/* Mensagens */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.length === 0 && (
                <div className="text-muted-foreground py-8 text-center">
                  <p className="text-sm">Olá! Como posso ajudar você hoje?</p>
                  <p className="mt-2 text-xs">
                    Posso analisar dados, criar registros e muito mais.
                  </p>
                </div>
              )}

              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-4 py-3 shadow-sm", // Aumentei largura máx para 85% para caber tabela
                      msg.role === "user"
                        ? "bg-gradient-to-r from-[var(--btn-gradient-from)] to-[var(--btn-gradient-to)] text-primary-foreground"
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
                    <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="border-border/50 bg-background/50 border-t p-4">
            <div className="flex gap-2">
              <Textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Digite sua mensagem..."
                className="max-h-[120px] min-h-[44px] resize-none rounded-2xl"
                disabled={isLoading}
              />
              <Button
                onClick={handleSend}
                disabled={!inputValue.trim() || isLoading}
                size="icon"
                variant="gradient"
                className="h-11 w-11 shrink-0 rounded-lg"
              >
                <Send className="h-4 w-4 text-primary-foreground" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
