import { LegalPage } from "@/components/LegalPage";

export default function TermosPage() {
  return (
    <LegalPage
      title="Termos de uso"
      updatedAt="15 de outubro de 2026"
      intro={
        <p>
          Estes termos valem para quem usa a ShadowPay: vendedores (sellers) que recebem pagamentos pela plataforma e
          compradores que pagam pelos checkouts gerados nela. Ao criar uma conta ou concluir um pagamento, você concorda
          com eles.
        </p>
      }
      sections={[
        {
          title: "O que a ShadowPay faz",
          body: (
            <p>
              A ShadowPay é uma plataforma de pagamentos que gera cobranças PIX, checkouts e links de pagamento para os
              produtos e serviços dos sellers, com o processamento feito por instituições parceiras (adquirentes). A
              ShadowPay não é a vendedora dos produtos oferecidos nos checkouts.
            </p>
          ),
        },
        {
          title: "Conta do seller",
          body: (
            <>
              <p>
                Para vender é preciso criar uma conta com dados verdadeiros e concluir a verificação de identidade
                (KYC). O seller é responsável por manter seus dados atualizados e por guardar com segurança a senha, o
                código de dois fatores e as chaves de API.
              </p>
              <p>
                Podemos suspender ou encerrar contas com dados falsos, uso indevido, suspeita de fraude ou por
                determinação legal.
              </p>
            </>
          ),
        },
        {
          title: "O que não é permitido",
          body: (
            <p>
              Vender produtos ou serviços ilegais, falsificados ou enganosos; usar a plataforma para lavagem de
              dinheiro, fraude ou golpes; desrespeitar o Código de Defesa do Consumidor; ou tentar burlar a segurança da
              plataforma. Nesses casos os valores podem ficar retidos enquanto a situação é analisada.
            </p>
          ),
        },
        {
          title: "Taxas, saldo e saques",
          body: (
            <p>
              As taxas de cada venda e de saque aparecem no painel do seller antes de serem cobradas. O valor líquido de
              cada venda aprovada entra no saldo do seller, que pode ser sacado para a chave PIX cadastrada. Saques e
              vendas podem ser bloqueados temporariamente em caso de contestação, estorno ou análise de segurança.
            </p>
          ),
        },
        {
          title: "Compradores",
          body: (
            <p>
              Dúvidas sobre o produto, entrega, garantia e reembolso devem ser tratadas com o seller que fez a venda (os
              contatos de suporte aparecem no checkout). A ShadowPay processa o pagamento e pode intermediar contestações
              quando necessário.
            </p>
          ),
        },
        {
          title: "Disponibilidade e responsabilidade",
          body: (
            <p>
              Trabalhamos para manter a plataforma no ar, mas ela pode ficar indisponível por manutenção ou falhas de
              terceiros (como bancos e adquirentes). A ShadowPay não responde pelos produtos vendidos pelos sellers nem
              por prejuízos causados pelo uso indevido da conta.
            </p>
          ),
        },
        {
          title: "Mudanças nestes termos",
          body: (
            <p>
              Estes termos podem ser atualizados. Quando a mudança for relevante, avisaremos os sellers pelo painel ou
              por e-mail. Continuar usando a plataforma depois do aviso significa concordar com a nova versão.
            </p>
          ),
        },
      ]}
    />
  );
}
