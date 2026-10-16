import { LegalPage } from "@/components/LegalPage";

export default function PrivacidadePage() {
  return (
    <LegalPage
      title="Política de privacidade"
      updatedAt="15 de outubro de 2026"
      intro={
        <p>
          Esta política explica quais dados pessoais a ShadowPay trata, para quê e quais são os seus direitos, de acordo
          com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD).
        </p>
      }
      sections={[
        {
          title: "Quais dados tratamos",
          body: (
            <>
              <p>
                <strong>Sellers:</strong> nome, e-mail, telefone, CPF/CNPJ, endereço, documentos e selfie enviados na
                verificação (KYC), chave PIX para saque e registros de acesso.
              </p>
              <p>
                <strong>Compradores:</strong> os dados digitados no checkout (como nome, e-mail, CPF e telefone), o
                valor e o status do pagamento, e informações técnicas da visita, como origem da campanha (UTMs) e
                endereço IP quando o seller usa integrações de rastreamento.
              </p>
            </>
          ),
        },
        {
          title: "Para que usamos",
          body: (
            <p>
              Para criar e confirmar pagamentos, creditar o saldo e processar saques; verificar a identidade dos
              sellers e prevenir fraudes; cumprir obrigações legais e regulatórias; dar suporte; e mostrar ao seller os
              relatórios das próprias vendas.
            </p>
          ),
        },
        {
          title: "Com quem compartilhamos",
          body: (
            <p>
              Com as instituições que processam os pagamentos (adquirentes e bancos); com o seller dono da venda; com
              ferramentas de rastreamento que o próprio seller conectar (por exemplo, pixels e UTMify), apenas com os
              dados necessários; e com autoridades, quando exigido por lei. Não vendemos dados pessoais.
            </p>
          ),
        },
        {
          title: "Segurança e guarda",
          body: (
            <p>
              Usamos conexão criptografada, senhas guardadas de forma irreversível, credenciais de integrações
              criptografadas e acesso restrito aos dados. Os dados são guardados pelo tempo necessário para as
              finalidades acima e para cumprir prazos legais.
            </p>
          ),
        },
        {
          title: "Seus direitos",
          body: (
            <p>
              Você pode pedir confirmação de tratamento, acesso, correção, anonimização ou exclusão dos seus dados,
              informações sobre compartilhamento e revogação de consentimento, nos limites da LGPD. Sellers podem
              atualizar os próprios dados em Minha conta; para os demais pedidos, use o suporte da plataforma.
            </p>
          ),
        },
        {
          title: "Cookies e armazenamento no navegador",
          body: (
            <p>
              Usamos armazenamento do navegador para manter você conectado, lembrar preferências e guardar a origem da
              campanha da compra. Ferramentas conectadas pelo seller podem usar seus próprios cookies.
            </p>
          ),
        },
        {
          title: "Mudanças nesta política",
          body: <p>Esta política pode ser atualizada. A data no topo indica a última versão.</p>,
        },
      ]}
    />
  );
}
