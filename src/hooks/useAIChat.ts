import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function useAIChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const sendMessage = async (content: string) => {
    // Adicionar mensagem do usuário
    const userMessage: Message = { role: 'user', content };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Chamar edge function
      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: {
          messages: [...messages, userMessage]
        }
      });

      if (error) throw error;

      // Adicionar resposta do assistente
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.message || 'Desculpe, ocorreu um erro ao processar sua mensagem.'
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Se houve uso de tool, mostrar toast
      if (data.toolUsed) {
        toast.success(`Ação executada: ${data.toolUsed}`);
      }

    } catch (error: any) {
      console.error('Error sending message:', error);
      
      let errorMessage = 'Desculpe, ocorreu um erro ao processar sua mensagem.';
      
      if (error.message?.includes('403') || error.message?.includes('Acesso negado')) {
        errorMessage = 'Acesso negado. Esta funcionalidade está disponível apenas para administradores.';
      }

      toast.error(errorMessage);

      // Adicionar mensagem de erro
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: errorMessage
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    messages,
    isLoading,
    sendMessage,
    inputValue,
    setInputValue
  };
}
