/* ══════════════════════════════════════════════════════════════
   taxas.js — ÚNICO lugar para atualizar os números de mercado.
   Mexa aqui e o site inteiro (painel, simulador, imóvel, mitos)
   se atualiza sozinho.
   ══════════════════════════════════════════════════════════════ */
window.TAXAS = {
  atualizado: '17/08/2026',

  selic: 14.00,     // % a.a. — Copom de 05/08/2026
  copomUltimo: '05/08/2026',
  copomProximo: '2026-09-16',   // AAAA-MM-DD — vira contagem regressiva no hero
  cdi: 13.90,       // % a.a.
  ipca12: 4.44,     // % — IPCA acumulado em 12 meses
  poupanca: 6.17,   // % a.a. — 0,5%/mês enquanto a Selic > 8,5% (+ TR, aqui ignorada)

  aluguelYield: 6.14,      // % a.a. bruto — yield residencial FipeZap, jul/2026
  aluguelYield1q: 6.78,    // % a.a. — imóveis de 1 quarto (melhor faixa)
  aluguelYield4q: 4.84,    // % a.a. — imóveis de 4+ quartos (pior faixa)
  aluguelAlta12: 9.28,     // % — alta dos aluguéis em 12 meses

  // percentual do CDI que cada produto costuma pagar
  cdbPctCdi: 100,
  lciPctCdi: 90,

  // custos que comem o aluguel (usados no simulador e na calculadora do imóvel)
  imovelCustoAdm: 10,      // % do aluguel (imobiliária)
  imovelVacancia: 8.3,     // % (≈ 1 mês vago por ano)

  /* ── EMPRÉSTIMO: o teto que a lei impõe ──────────────────────────
     Art. 406 do Código Civil (redação da Lei 14.905/2024): a taxa legal
     é a Selic MENOS o IPCA — e, se der negativo, vale zero.
     Lei da Usura (Decreto 22.626/1933, art. 1º): é vedado estipular juros
     acima do DOBRO da taxa legal. A Lei 14.905/2024 tirou desse teto as
     obrigações entre pessoas jurídicas, as representadas por títulos de
     crédito/valores mobiliários e as do mercado financeiro e de capitais.
     Na prática: se tem pessoa física na operação, o teto vale. */
  usuraDobro: 2,           // multiplicador da taxa legal (art. 1º da Lei da Usura)
  agiotagemLei: 'Lei 1.521/51, art. 4º',

  /* ── ALUGUEL DE VEÍCULO: o que come a diária ── */
  carroDepreciacao: 12,    // % a.a. do valor do veículo (média de mercado)
  carroManutencao: 4,      // % a.a. do valor — revisão, pneu, freio
  carroSeguro: 6,          // % a.a. do valor — seguro + rastreador
  carroIpva: 4,            // % a.a. do valor — IPVA + licenciamento
  carroOciosidade: 25,     // % dos dias do mês sem locar (média conservadora)

  /* ── cobrança e atraso (padrão do mercado brasileiro) ── */
  multaAtrasoPct: 2,     // % de multa sobre a parcela (limite do CDC para consumidor)
  jurosMoraMes: 1,       // % ao mês de juros de mora, cobrados por dia (pro rata die)
  correcaoIndice: 'IPCA',

  /* ── leilão de veículos: o que ninguém soma antes de dar o lance ── */
  leilaoComissao: 5,     // % de comissão do leiloeiro sobre o lance
  leilaoTaxas: 1200,     // R$ — pátio, remoção, documentação e despachante (estimativa)

  /* ── sucessão: custo de deixar as coisas sem organizar ── */
  itcmdMin: 2,          // % — piso da tabela progressiva (LC 227/2026)
  itcmdMax: 8,          // % — teto (Resolução do Senado 9/1992)
  itcmdPadrao: 4,       // % — o que a maioria paga na faixa intermediária
  honorExtra: 6,        // % do monte-mor — mínimo recomendado (OAB/RJ) no extrajudicial
  honorJudicial: 10,    // % — inventário judicial/litigioso costuma custar mais
  emolumentos: 1.5,     // % — custas de cartório e registros (varia por estado)
  custasJudiciais: 2,   // % — custas do processo
  multaAtraso: 10,      // % do ITCMD se o inventário não abrir no prazo (regra de vários estados)

  fontes: [
    ['Taxa legal e teto de juros', 'Art. 406 do Código Civil (Lei 14.905/2024) e art. 1º do Decreto 22.626/1933'],
    ['Selic e CDI', 'Banco Central / Copom de 05/08/2026'],
    ['IPCA 12 meses', 'IBGE'],
    ['Yield de aluguel', 'Índice FipeZap de locação residencial, julho/2026'],
    ['ITCMD', 'LC 227/2026 (progressividade obrigatória) e Resolução do Senado 9/1992'],
    ['Honorários de inventário', 'Tabelas de honorários da OAB (5% a 20%; mínimo de 6% no extrajudicial)'],
  ],
};
