import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Projeto } from "@/types/projeto";

export function useProjetos() {
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjetos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("projetos")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProjetos(data || []);
    } catch (error) {
      console.error("Error fetching projetos:", error);
      toast.error("Erro ao carregar projetos");
    } finally {
      setLoading(false);
    }
  };

  const createProjeto = async (
    projeto: Omit<Projeto, "id" | "created_at" | "updated_at" | "created_by">
  ) => {
    try {
      const { data, error } = await supabase.from("projetos").insert([projeto]).select().single();

      if (error) throw error;

      setProjetos((prev) => [data, ...prev]);
      toast.success("Projeto criado com sucesso!");
      return data;
    } catch (error) {
      console.error("Error creating projeto:", error);
      toast.error("Erro ao criar projeto");
      throw error;
    }
  };

  const updateProjeto = async (id: string, updates: Partial<Projeto>) => {
    try {
      const { data, error } = await supabase
        .from("projetos")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      setProjetos((prev) => prev.map((p) => (p.id === id ? data : p)));
      toast.success("Projeto atualizado com sucesso!");
      return data;
    } catch (error) {
      console.error("Error updating projeto:", error);
      toast.error("Erro ao atualizar projeto");
      throw error;
    }
  };

  const deleteProjeto = async (id: string) => {
    try {
      const { error } = await supabase.from("projetos").delete().eq("id", id);

      if (error) throw error;

      setProjetos((prev) => prev.filter((p) => p.id !== id));
      toast.success("Projeto deletado com sucesso!");
    } catch (error) {
      console.error("Error deleting projeto:", error);
      toast.error("Erro ao deletar projeto");
      throw error;
    }
  };

  useEffect(() => {
    fetchProjetos();
  }, []);

  return {
    projetos,
    loading,
    fetchProjetos,
    createProjeto,
    updateProjeto,
    deleteProjeto,
  };
}
