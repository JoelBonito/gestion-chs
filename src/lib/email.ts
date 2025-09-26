import { Resend } from "resend";

const resend = new Resend("re_b9ZQKG3T_4WD9vHsNgBjXqn7eG32R77is"); // ⚠️ CHAVE EMBUTIDA

export async function sendEmail(to: string[], subject: string, html: string) {
  try {
    await resend.emails.send({
      from: "notificacoes@gestionchs.app",
      to,
      subject,
      html,
    });
    console.log(`✅ Email enviado para: ${to.join(", ")}`);
  } catch (error) {
    console.error("❌ Erro ao enviar e-mail:", error);
  }
}

// Templates de email
export const emailTemplates = {
  novaEncomenda: (pedido: string, etiqueta: string, cliente: string, fornecedor: string, produtos: Array<{nome: string, quantidade: number}>) => `
    <h2>📦 Nova encomenda registrada</h2>
    <p><b>Pedido:</b> ${pedido}</p>
    <p><b>Etiqueta:</b> ${etiqueta}</p>
    <p><b>Cliente:</b> ${cliente}</p>
    <p><b>Fornecedor:</b> ${fornecedor}</p>
    <h3>Produtos</h3>
    <ul>
      ${produtos.map(p => `<li>${p.nome} — Qtd: ${p.quantidade}</li>`).join("")}
    </ul>
  `,

  mudancaStatus: (pedido: string, etiqueta: string, status: string) => `
    <h2>🔄 Status atualizado</h2>
    <p><b>Pedido:</b> ${pedido}</p>
    <p><b>Etiqueta:</b> ${etiqueta}</p>
    <p><b>Novo status:</b> ${status}</p>
  `,

  novoTransporte: (referencia: string, tracking?: string, anexoUrl?: string) => `
    <h2>🚚 Novo transporte</h2>
    <p><b>Tracking:</b> ${tracking || 'Não informado'}</p>
    <p><b>Referência:</b> ${referencia}</p>
    ${
      anexoUrl
        ? `<p><a href="${anexoUrl}">📎 Baixar anexo</a></p>`
        : "<p>Nenhum anexo enviado.</p>"
    }
  `,

  observacaoJoel: (pedido: string, etiqueta: string, observacao: string) => `
    <h2>📝 Nova observação adicionada</h2>
    <p><b>Pedido:</b> ${pedido}</p>
    <p><b>Etiqueta:</b> ${etiqueta}</p>
    <blockquote style="border-left: 4px solid #ccc; padding-left: 16px; margin: 16px 0;">${observacao}</blockquote>
  `,

  observacaoFelipe: (pedido: string, etiqueta: string, observacao: string) => `
    <h2>📝 Nova observação adicionada</h2>
    <p><b>Pedido:</b> ${pedido}</p>
    <p><b>Etiqueta:</b> ${etiqueta}</p>
    <blockquote style="border-left: 4px solid #ccc; padding-left: 16px; margin: 16px 0;">${observacao}</blockquote>
  `,

  novoAnexoProduto: (nomeProduto: string, anexoUrl: string) => `
    <h2>📎 Anexo adicionado ao produto</h2>
    <p><b>Produto:</b> ${nomeProduto}</p>
    <p><a href="${anexoUrl}">📎 Baixar anexo</a></p>
  `,

  pagamentoFornecedor: (pedido: string, etiqueta: string, valorPago: string) => `
    <h2>💳 Pagamento efetuado</h2>
    <p><b>Pedido:</b> ${pedido}</p>
    <p><b>Etiqueta:</b> ${etiqueta}</p>
    <p><b>Valor pago:</b> ${valorPago}</p>
  `
};

// Destinatários por tipo de notificação
export const emailRecipients = {
  geral: ["jbento1@gmail.com", "hamamlian13@gmail.com", "msilva.lipe@gmail.com"],
  lipe: ["msilva.lipe@gmail.com"],
  felipe: ["jbento1@gmail.com"]
};