/* ══════════════════════════════════════════════════════════════
   leiloes.js — ÚNICO lugar para mexer no calendário de leilões.
   Acrescente um objeto em `eventos` e o site se atualiza sozinho:
   o card, o filtro, a contagem regressiva e o arquivo de agenda
   saem daqui.

   Campos de cada evento
   ─────────────────────
   data        'AAAA-MM-DDTHH:MM'  quando o pregão/1º leilão acontece
   abertura    'AAAA-MM-DDTHH:MM'  quando começam os lances (opcional)
   titulo      o que está sendo vendido, em uma linha
   comitente   quem está vendendo
   cidade      onde o bem está
   modalidade  'online' | 'presencial' | 'hibrido'
   tipo        'veiculos' | 'imoveis' | 'diversos'
   casa        leiloeiro / plataforma
   link        página oficial do leilão (sempre a fonte, nunca nós)
   obs         detalhe que muda a decisão (visitação, praça, condição)

   Datas passadas somem do site sozinhas — não precisa apagar.
   ══════════════════════════════════════════════════════════════ */
window.LEILOES = {
  atualizado: '19/08/2026',
  regiao: 'Região Metropolitana de Campinas',

  eventos: [
    {
      data: '2026-08-26T10:00',
      titulo: 'Bens móveis inservíveis da prefeitura',
      comitente: 'Prefeitura Municipal de Monte Mor',
      cidade: 'Monte Mor',
      modalidade: 'online',
      tipo: 'diversos',
      casa: 'Rico Leilões',
      link: 'https://www.ricoleiloes.com.br/leilao/2086/lotes',
      obs: 'Pregão a partir das 10h, primeiro lote no horário. Leilão público administrativo.',
    },
    {
      data: '2026-10-01T10:00',
      abertura: '2026-09-17T10:00',
      titulo: 'Veículos apreendidos nos pátios do Detran',
      comitente: 'Detran-SP — Valinhos e Vinhedo',
      cidade: 'Valinhos e Vinhedo',
      modalidade: 'online',
      tipo: 'veiculos',
      casa: 'Sumaré Leilões · José Luis Teixeira Quenca',
      link: 'https://www.sumareleiloes.com.br/leiloes/3303',
      obs: 'Lances abertos de 17/09 a 01/10. Confira no edital quais lotes têm documentação e quais são sucata aproveitável.',
    },
    {
      data: '2026-09-30T10:00',
      abertura: '2026-09-21T10:00',
      titulo: 'Imóvel em loteamento — leilão judicial, 1ª praça',
      comitente: '8ª Vara Cível de Campinas',
      cidade: 'Campinas',
      modalidade: 'online',
      tipo: 'imoveis',
      casa: 'Sumaré Leilões · Gustavo Moretto',
      link: 'https://www.sumareleiloes.com.br/leiloes/5442',
      obs: 'Processo 1042402-33.2020.8.26.0114. Em 1ª praça o lance mínimo costuma ser a avaliação — a 2ª praça aceita menos.',
    },
    {
      data: '2026-10-19T14:00',
      abertura: '2026-10-09T14:00',
      titulo: 'Leilão judicial — 1ª praça',
      comitente: '8ª Vara Cível de Campinas',
      cidade: 'Campinas',
      modalidade: 'online',
      tipo: 'imoveis',
      casa: 'Sumaré Leilões · Gustavo Moretto',
      link: 'https://www.sumareleiloes.com.br/leiloes/5317',
      obs: 'Processo 0043764-58.2018.8.26.0114. Leia o edital: débito de IPTU e condomínio nem sempre ficam com o arrematante.',
    },
  ],

  /* Onde os leilões da região nascem. O calendário acima é curado à mão;
     estes links levam à agenda ao vivo de cada casa. */
  fontes: [
    {
      nome: 'Pátio Municipal de Campinas (Emdec)',
      oque: 'Carros, motos, sucata aproveitável e material de reciclagem apreendidos no pátio',
      link: 'https://www.ricoleiloes.com.br/',
      nota: 'Costuma abrir pré-lances cerca de 45 dias antes, com visitação presencial na semana do pregão',
    },
    {
      nome: 'Detran-SP — pátios da região',
      oque: 'Veículos removidos em Campinas, Valinhos, Vinhedo, Indaiatuba, Hortolândia, Sumaré, Monte Mor e Nova Odessa',
      link: 'https://www.sumareleiloes.com.br/',
      nota: 'Lotes com documentação e lotes de sucata saem no mesmo edital — confira antes de dar lance',
    },
    {
      nome: 'Leilões judiciais das varas de Campinas',
      oque: 'Imóveis, veículos e maquinário penhorados em processo',
      link: 'https://www.sumareleiloes.com.br/',
      nota: 'Tem 1ª e 2ª praça: a segunda aceita lance abaixo da avaliação, mas o risco de dívida no bem é maior',
    },
    {
      nome: 'RMC Leilões',
      oque: 'Judicial e extrajudicial de veículos, imóveis, máquinas e bens diversos na região',
      link: 'https://www.rmcleiloes.com.br/',
      nota: 'Casa da própria região metropolitana',
    },
    {
      nome: 'Franklin Leilões — praça de Campinas',
      oque: 'Veículos de frota, financeiras e recuperados',
      link: 'https://www.franklinleiloes.com.br/leilao/campinas-sp/984/',
      nota: 'Página fixa da praça de Campinas',
    },
    {
      nome: 'Sodré Santoro',
      oque: 'Frota de locadoras, seguradoras, bancos e imóveis retomados',
      link: 'https://www.sodresantoro.com.br/',
      nota: 'Maior volume de veículos do país; filtra por praça e por estado',
    },
    {
      nome: 'Prefeituras da região',
      oque: 'Veículos e bens inservíveis de Campinas, Monte Mor, Indaiatuba, Hortolândia e vizinhas',
      link: 'https://www.ricoleiloes.com.br/',
      nota: 'Leilão público administrativo, quase sempre online',
    },
    {
      nome: 'Copart e Superbid',
      oque: 'Sinistrados e recuperáveis de seguradoras, com pátios no interior de SP',
      link: 'https://www.copart.com.br/',
      nota: 'Bom preço, mas exige leitura de laudo — sinistro de grande monta não volta a rodar',
    },
  ],
};
