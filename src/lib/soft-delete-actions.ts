import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Specific functions for clientes
export const archiveCliente = async (id: string, reason: string = 'Inativado pelo usuário') => {
  try {
    const { data, error } = await supabase
      .from('clientes')
      .update({
        active: false,
        deactivated_at: new Date().toISOString(),
        deactivated_reason: reason
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    
    toast.success('Cliente arquivado com sucesso');
    return data;
  } catch (error) {
    console.error('Erro ao arquivar cliente:', error);
    toast.error('Erro ao arquivar cliente');
    throw error;
  }
};

export const reactivateCliente = async (id: string) => {
  try {
    const { data, error } = await supabase
      .from('clientes')
      .update({
        active: true,
        deactivated_at: null,
        deactivated_reason: null
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    
    toast.success('Cliente reativado com sucesso');
    return data;
  } catch (error) {
    console.error('Erro ao reativar cliente:', error);
    toast.error('Erro ao reativar cliente');
    throw error;
  }
};

// Specific functions for fornecedores  
export const archiveFornecedor = async (id: string, reason: string = 'Inativado pelo usuário') => {
  try {
    const { data, error } = await supabase
      .from('fornecedores')
      .update({
        active: false,
        deactivated_at: new Date().toISOString(),
        deactivated_reason: reason
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    
    toast.success('Fornecedor arquivado com sucesso');
    return data;
  } catch (error) {
    console.error('Erro ao arquivar fornecedor:', error);
    toast.error('Erro ao arquivar fornecedor');
    throw error;
  }
};

export const reactivateFornecedor = async (id: string) => {
  try {
    const { data, error } = await supabase
      .from('fornecedores')
      .update({
        active: true,
        deactivated_at: null,
        deactivated_reason: null
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    
    toast.success('Fornecedor reativado com sucesso');
    return data;
  } catch (error) {
    console.error('Erro ao reativar fornecedor:', error);
    toast.error('Erro ao reativar fornecedor');
    throw error;
  }
};

// Specific function for produtos (uses 'ativo' instead of 'active')
export const archiveProduto = async (id: string, reason: string = 'Inativado pelo usuário') => {
  try {
    const { data, error } = await supabase
      .from('produtos')
      .update({
        ativo: false,
        deactivated_at: new Date().toISOString(),
        deactivated_reason: reason
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    
    toast.success('Produto arquivado com sucesso');
    return data;
  } catch (error) {
    console.error('Erro ao arquivar produto:', error);
    toast.error('Erro ao arquivar produto');
    throw error;
  }
};

// Specific function for produtos reactivation
export const reactivateProduto = async (id: string) => {
  try {
    const { data, error } = await supabase
      .from('produtos')
      .update({
        ativo: true,
        deactivated_at: null,
        deactivated_reason: null
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    
    toast.success('Produto reativado com sucesso');
    return data;
  } catch (error) {
    console.error('Erro ao reativar produto:', error);
    toast.error('Erro ao reativar produto');
    throw error;
  }
};

// Specific functions for transportes
export const archiveTransporte = async (id: string, reason: string = 'Inativado pelo usuário') => {
  try {
    const { data, error } = await supabase
      .from('transportes')
      .update({
        archived: true,
        archived_at: new Date().toISOString(),
        archived_reason: reason
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    
    toast.success('Transporte arquivado com sucesso');
    return data;
  } catch (error) {
    console.error('Erro ao arquivar transporte:', error);
    toast.error('Erro ao arquivar transporte');
    throw error;
  }
};

export const reactivateTransporte = async (id: string) => {
  try {
    const { data, error } = await supabase
      .from('transportes')
      .update({
        archived: false,
        archived_at: null,
        archived_reason: null
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    
    toast.success('Transporte reativado com sucesso');
    return data;
  } catch (error) {
    console.error('Erro ao reativar transporte:', error);
    toast.error('Erro ao reativar transporte');
    throw error;
  }
};

// Function to handle 403 errors with helpful messages
export const handleEntityInactiveError = (entityType: string, error: any) => {
  if (error?.code === '42501' || error?.status === 403) {
    toast.error(`${entityType} inativo — selecione um registro ativo`);
    return true;
  }
  return false;
};