
import { supabase } from "@/integrations/supabase/client";

export const createTestUsers = async () => {
  const users = [
    {
      email: "joel@sistema.com",
      password: "123456",
      full_name: "Joel",
      role: "admin"
    },
    {
      email: "felipe@sistema.com", 
      password: "123456",
      full_name: "Felipe",
      role: "factory"
    },
    {
      email: "illyass@sistema.com",
      password: "123456", 
      full_name: "Illyass",
      role: "client"
    }
  ];

  console.log("Criando usuários de teste...");
  console.log("Usuários que serão criados:");
  console.log("1. Joel (joel@sistema.com) - Administrador");
  console.log("2. Felipe (felipe@sistema.com) - Fornecedor");
  console.log("3. Illyass (illyass@sistema.com) - Cliente");
  console.log("");
  console.log("Senha para todos: 123456");
  console.log("");
  console.log("IMPORTANTE: Após criar os usuários, eles precisam confirmar o email.");
  console.log("Para facilitar os testes, desative a confirmação de email em:");
  console.log("Supabase Dashboard > Authentication > Settings > Email Confirmation");

  for (const user of users) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: user.email,
        password: user.password,
        options: {
          data: {
            full_name: user.full_name,
          }
        }
      });

      if (error) {
        console.error(`Erro ao criar usuário ${user.full_name}:`, error.message);
        continue;
      }

      if (data.user) {
        // Tentar inserir o role (pode falhar se o usuário ainda não foi confirmado)
        try {
          const { error: roleError } = await supabase
            .from('user_roles')
            .insert({
              user_id: data.user.id,
              role: user.role
            });

          if (roleError) {
            console.log(`Role para ${user.full_name} será atribuído após confirmação do email`);
          } else {
            console.log(`✓ Usuário ${user.full_name} criado com sucesso!`);
          }
        } catch (roleErr) {
          console.log(`Role para ${user.full_name} será atribuído após confirmação do email`);
        }
      }
    } catch (err: any) {
      console.error(`Erro ao criar usuário ${user.full_name}:`, err.message);
    }
  }
};

// Função para ser executada no console do navegador
(window as any).createTestUsers = createTestUsers;
