
import { supabase } from "@/integrations/supabase/client";

export const createTestUsers = async () => {
  try {
    console.log("Criando usuários de teste...");

    // Usuário 1: Joel (Admin)
    const { data: joelAuth, error: joelAuthError } = await supabase.auth.signUp({
      email: 'joel@admin.com',
      password: '123456',
      options: {
        data: {
          full_name: 'Joel Administrador'
        }
      }
    });

    if (joelAuthError) {
      console.error("Erro ao criar Joel:", joelAuthError);
    } else if (joelAuth.user) {
      const { error: joelRoleError } = await supabase
        .from('user_roles')
        .insert([
          { user_id: joelAuth.user.id, role: 'admin' as const }
        ]);
      
      if (joelRoleError) {
        console.error("Erro ao definir role do Joel:", joelRoleError);
      } else {
        console.log("Joel criado com sucesso!");
      }
    }

    // Usuário 2: Felipe (Factory)
    const { data: felipeAuth, error: felipeAuthError } = await supabase.auth.signUp({
      email: 'felipe@factory.com',
      password: '123456',
      options: {
        data: {
          full_name: 'Felipe Fornecedor'
        }
      }
    });

    if (felipeAuthError) {
      console.error("Erro ao criar Felipe:", felipeAuthError);
    } else if (felipeAuth.user) {
      const { error: felipeRoleError } = await supabase
        .from('user_roles')
        .insert([
          { user_id: felipeAuth.user.id, role: 'factory' as const }
        ]);
      
      if (felipeRoleError) {
        console.error("Erro ao definir role do Felipe:", felipeRoleError);
      } else {
        console.log("Felipe criado com sucesso!");
      }
    }

    // Usuário 3: Illyass (Client)
    const { data: illyassAuth, error: illyassAuthError } = await supabase.auth.signUp({
      email: 'illyass@client.com',
      password: '123456',
      options: {
        data: {
          full_name: 'Illyass Cliente'
        }
      }
    });

    if (illyassAuthError) {
      console.error("Erro ao criar Illyass:", illyassAuthError);
    } else if (illyassAuth.user) {
      const { error: illyassRoleError } = await supabase
        .from('user_roles')
        .insert([
          { user_id: illyassAuth.user.id, role: 'client' as const }
        ]);
      
      if (illyassRoleError) {
        console.error("Erro ao definir role do Illyass:", illyassRoleError);
      } else {
        console.log("Illyass criado com sucesso!");
      }
    }

    console.log("Processo de criação de usuários concluído!");
    console.log("Usuários criados:");
    console.log("1. Joel (Admin): joel@admin.com / 123456");
    console.log("2. Felipe (Factory): felipe@factory.com / 123456");
    console.log("3. Illyass (Client): illyass@client.com / 123456");
    
  } catch (error) {
    console.error("Erro geral:", error);
  }
};

// Para executar no console do navegador:
// window.createTestUsers = createTestUsers;
(window as any).createTestUsers = createTestUsers;
