/* ══════════════════════════════════════════════════════════════
   main.js — reveal, nav, tabs, FAQ, painel de taxas, simulador de
   alocação, calculadora de imóvel, contas dos mitos e mocks.
   Todos os números vêm de window.TAXAS (assets/js/taxas.js).
   ══════════════════════════════════════════════════════════════ */
(() => {
  const T = window.TAXAS || {};
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  /* ─────────── formatação e matemática financeira ─────────── */
  const brl = n => 'R$ ' + Math.round(n).toLocaleString('pt-BR');
  const brlS = n => (n < 0 ? '− ' : '+ ') + 'R$ ' + Math.round(Math.abs(n)).toLocaleString('pt-BR');
  const brl2 = n => 'R$ ' + n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const pct = n => n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%';
  const num = s => parseFloat(String(s).replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, '')) || 0;

  const aoMes = aa => Math.pow(1 + aa / 100, 1 / 12) - 1;      // taxa anual → mensal equivalente
  const irFaixa = dias => dias <= 180 ? 0.225 : dias <= 360 ? 0.20 : dias <= 720 ? 0.175 : 0.15;

  /* ─────────── ano e disclaimer ─────────── */
  const y = $('#year');
  if (y) y.textContent = String(new Date().getFullYear());

  /* taxas espalhadas no texto: <span data-t="cdi"></span> */
  $$('[data-t]').forEach(el => {
    const v = T[el.dataset.t];
    if (typeof v === 'number') el.textContent = v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  });

  /* ─────────── nav ─────────── */
  const nav = $('#nav');
  const onScroll = () => nav.classList.toggle('is-stuck', window.scrollY > 40);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  const burger = $('#burger'), drawer = $('#drawer');
  if (burger && drawer) {
    burger.addEventListener('click', () => {
      const open = burger.getAttribute('aria-expanded') === 'true';
      burger.setAttribute('aria-expanded', String(!open));
      drawer.hidden = open;
    });
    $$('a', drawer).forEach(a => a.addEventListener('click', () => {
      burger.setAttribute('aria-expanded', 'false');
      drawer.hidden = true;
    }));
  }

  /* ─────────── ticker do hero ─────────── */
  const ticker = $('#ticker');
  if (ticker) {
    const itens = [
      `Selic ${pct(T.selic)} a.a.`,
      `CDI ${pct(T.cdi)} a.a.`,
      `IPCA ${pct(T.ipca12)} em 12 meses`,
      `Poupança ${pct(T.poupanca)} a.a.`,
      `Aluguel residencial ${pct(T.aluguelYield)} a.a.`,
      'Dinheiro parado rende zero',
      'Cobrança automática no WhatsApp',
      'Juros de atraso calculados sozinhos',
      'Calendário de leilões monitorado',
      'Bom pagador reconhecido',
    ];
    const bloco = itens.map(t => `<span>${t}</span><i></i>`).join('');
    ticker.innerHTML = bloco + bloco;
  }

  /* ══════════════════ PAINEL: QUANTO RENDE HOJE ══════════════════ */
  const grid = $('#rates-grid');
  if (grid) {
    const BASE = 10000;
    const linhas = [
      { nome: 'Conta corrente', aa: 0, nota: 'O lugar mais caro para guardar dinheiro', tom: 'bad' },
      { nome: 'Poupança', aa: T.poupanca, nota: 'Travada em 0,5% ao mês, isenta de IR' },
      { nome: 'Aluguel de imóvel', aa: T.aluguelYield, nota: 'Média nacional bruta, antes de IPTU e vacância' },
      { nome: 'Tesouro Selic', aa: T.selic, nota: 'Liquidez diária, IR regressivo', },
      { nome: `CDB ${T.cdbPctCdi}% do CDI`, aa: T.cdi * T.cdbPctCdi / 100, nota: 'Com FGC até R$ 250 mil, IR regressivo', tom: 'good' },
      { nome: `LCI/LCA ${T.lciPctCdi}% do CDI`, aa: T.cdi * T.lciPctCdi / 100, nota: 'Isenta de IR — rende menos e entrega mais', tom: 'good' },
    ];

    grid.innerHTML = linhas.map(l => {
      const mes = BASE * aoMes(l.aa);
      return `
      <article class="rate ${l.tom ? 'rate--' + l.tom : ''}">
        <p class="rate__name">${l.nome}</p>
        <p class="rate__aa">${l.aa ? pct(l.aa) : '0%'}<span>a.a.</span></p>
        <p class="rate__mes">${mes ? brl2(mes) : 'R$ 0,00'}<span>por mês, com R$ 10 mil</span></p>
        <p class="rate__nota">${l.nota}</p>
      </article>`;
    }).join('');

    const src = $('#rates-src');
    if (src) {
      src.innerHTML = `Atualizado em ${T.atualizado} · ` +
        (T.fontes || []).map(([k, v]) => `<b>${k}:</b> ${v}`).join(' · ') +
        ` · IPCA de ${pct(T.ipca12)} em 12 meses é a régua: render menos que isso é perder poder de compra.`;
    }
  }

  /* ══════════════════ SIMULADOR: ONDE INVESTIR ══════════════════ */
  const sVal = $('#s-valor'), sValR = $('#s-valor-r');
  const sMes = $('#s-meses'), sMesR = $('#s-meses-r');
  const sList = $('#sim-list');

  function simular() {
    if (!sList) return;
    const P = num(sVal.value);
    const m = Math.max(1, Math.round(num(sMes.value)));
    const dias = m * 30;
    const ir = irFaixa(dias);

    const rendeBruto = aa => P * (Math.pow(1 + aoMes(aa), m) - 1);

    // aluguel: tira administração, vacância e IR de 15% sobre o líquido
    const aluguelLiqAA = T.aluguelYield * (1 - T.imovelCustoAdm / 100) * (1 - T.imovelVacancia / 100) * 0.85;

    const ops = [
      { nome: 'Conta corrente', bruto: 0, ir: 0, obs: 'Nada. Zero. Todo mês.' },
      { nome: 'Poupança', bruto: rendeBruto(T.poupanca), ir: 0, obs: 'Isenta de IR' },
      { nome: 'Imóvel alugado', bruto: rendeBruto(aluguelLiqAA), ir: 0, obs: 'Só o aluguel, líquido de custos e IR — sem contar valorização' },
      { nome: 'Tesouro Selic', bruto: rendeBruto(T.selic), ir, obs: `IR de ${(ir * 100).toFixed(1).replace('.', ',')}% no ganho` },
      { nome: `CDB ${T.cdbPctCdi}% CDI`, bruto: rendeBruto(T.cdi * T.cdbPctCdi / 100), ir, obs: `IR de ${(ir * 100).toFixed(1).replace('.', ',')}% no ganho` },
      { nome: `LCI/LCA ${T.lciPctCdi}% CDI`, bruto: rendeBruto(T.cdi * T.lciPctCdi / 100), ir: 0, obs: 'Isenta de IR, sem liquidez diária' },
    ].map(o => {
      const liq = o.bruto * (1 - o.ir);
      return { ...o, ganho: liq, final: P + liq };
    }).sort((a, b) => b.final - a.final);

    const topo = ops[0], fundo = ops[ops.length - 1];

    sList.innerHTML = ops.map((o, i) => `
      <li class="${i === 0 ? 'is-top' : ''}">
        <span class="sim__rank">${String(i + 1).padStart(2, '0')}</span>
        <span class="sim__nome">${o.nome}<em>${o.obs}</em></span>
        <span class="sim__vals"><b>${brl(o.final)}</b><em>+${brl(o.ganho)}</em></span>
      </li>`).join('');

    const dif = topo.ganho - fundo.ganho;
    const anos = (m / 12).toLocaleString('pt-BR', { maximumFractionDigits: 1 });
    $('#sim-delta').innerHTML =
      `Escolher <b>${topo.nome}</b> em vez de <b>${fundo.nome}</b> muda <b class="hl">${brl(dif)}</b> ` +
      `em ${m} meses (${anos} ${m >= 12 ? 'anos' : 'ano'}). É a mesma poupança, o mesmo esforço — só a decisão é diferente.`;

    atualizaMitos(P);
  }

  const bindPair = (input, range, fmt) => {
    if (!input) return;
    if (range) {
      range.addEventListener('input', () => {
        input.value = fmt ? Number(range.value).toLocaleString('pt-BR') : range.value;
        simular();
      });
    }
    input.addEventListener('input', () => {
      if (range) range.value = String(num(input.value));
      simular();
    });
    input.addEventListener('blur', () => {
      const v = num(input.value);
      input.value = fmt ? v.toLocaleString('pt-BR') : String(v);
    });
  };
  bindPair(sVal, sValR, true);
  bindPair(sMes, sMesR, false);
  simular();

  /* ══════════════════ IMÓVEL PARA ALUGAR ══════════════════ */
  const iCampos = ['i-preco', 'i-aluguel', 'i-custos', 'i-manut', 'i-vago', 'i-valoriza'].map(id => $('#' + id));

  function imovel() {
    if (!iCampos[0]) return;
    const preco = num(iCampos[0].value);
    const aluguel = num(iCampos[1].value);
    const custos = num(iCampos[2].value);
    const manut = num(iCampos[3].value);
    const vago = Math.min(11, Math.max(0, num(iCampos[4].value)));
    const valoriza = num(iCampos[5].value);
    if (!preco) return;

    const mesesPagos = 12 - vago;
    const bruto = aluguel * 12;
    const perdaVac = aluguel * vago;
    const adm = aluguel * mesesPagos * (T.imovelCustoAdm / 100);
    const fixos = custos * 12;
    const antesIR = bruto - perdaVac - adm - fixos - manut;
    const imposto = Math.max(0, antesIR) * 0.15;
    const liquido = antesIR - imposto;

    const yieldLiq = liquido / preco * 100;
    const total = yieldLiq + valoriza;
    const cdiLiq = T.cdi * (1 - 0.15);

    $('#i-bruto').textContent = brl(bruto);
    $('#i-desc').textContent = '− ' + brl(perdaVac + adm + fixos + manut + imposto);
    $('#i-liq').textContent = brl(liquido);
    $('#i-yield').textContent = pct(yieldLiq) + ' a.a.';
    $('#i-total').textContent = pct(total) + ' a.a.';
    $('#i-cdi').textContent = pct(cdiLiq) + ' a.a. · ' + brl(preco * cdiLiq / 100) + '/ano';

    const tag = $('#i-tag'), txt = $('#i-txt'), box = $('#i-verdict');
    box.classList.remove('is-good', 'is-mid', 'is-bad');

    const rendaMes = liquido / 12;
    if (total >= cdiLiq + 2) {
      box.classList.add('is-good');
      tag.textContent = 'A conta fecha';
      txt.innerHTML = `Com essa valorização, o imóvel entrega <b>${pct(total)} ao ano</b> contra
        <b>${pct(cdiLiq)}</b> do CDI líquido. Só lembre: ${pct(yieldLiq)} disso é dinheiro no bolso
        (${brl(rendaMes)}/mês) e o resto só existe no dia da venda.`;
    } else if (total >= cdiLiq - 2) {
      box.classList.add('is-mid');
      tag.textContent = 'Empata — com mais trabalho';
      txt.innerHTML = `Dá praticamente o mesmo que o CDI (<b>${pct(total)}</b> contra
        <b>${pct(cdiLiq)}</b>), mas com inquilino, obra, IPTU e dinheiro preso. Aqui a escolha é de
        estilo de vida, não de rentabilidade.`;
    } else {
      box.classList.add('is-bad');
      tag.textContent = 'Não fecha só na conta';
      txt.innerHTML = `O imóvel rende <b>${pct(total)} ao ano</b> e o CDI líquido paga
        <b>${pct(cdiLiq)}</b> sem trabalho nenhum. Para virar o jogo, você precisaria de
        valorização de <b>${pct(Math.max(0, cdiLiq - yieldLiq))} ao ano</b> — ou comprar mais barato.`;
    }
  }
  iCampos.forEach(c => c && c.addEventListener('input', imovel));
  iCampos.forEach(c => c && c.addEventListener('blur', () => { c.value = num(c.value).toLocaleString('pt-BR'); }));
  imovel();

  /* ══════════════════ JUROS DE ATRASO ══════════════════ */
  const jVal = $('#j-valor'), jDias = $('#j-dias'), jDiasR = $('#j-dias-r');
  const jMulta = $('#j-multa'), jJuros = $('#j-juros');

  function atraso() {
    if (!jVal || !$('#j-lines')) return;
    const V = num(jVal.value);
    const d = Math.max(0, Math.round(num(jDias.value)));
    const mPct = num(jMulta.value), jPct = num(jJuros.value);
    if (!V) return;

    const multa = V * mPct / 100;
    const jurosDia = V * (jPct / 100) / 30;
    const juros = jurosDia * d;
    const total = V + multa + juros;

    const li = (a, b, tom) => `<li class="${tom || ''}"><span>${a}</span><b>${b}</b></li>`;
    $('#j-lines').innerHTML =
      li('Valor original', brl(V)) +
      li(`Multa de ${pct(mPct)}`, '+ ' + brl(multa)) +
      li(`Juros de ${pct(jPct)} ao mês · ${d} ${d === 1 ? 'dia' : 'dias'}`, '+ ' + brl(juros)) +
      li('Cada dia a mais de atraso vale', brl2(jurosDia), 'is-ref');

    $('#j-total').textContent = brl(total);

    $('#j-delta').innerHTML =
      `São <b>${brl(multa + juros)}</b> que a maioria simplesmente não cobra — por vergonha, ` +
      `esquecimento ou falta de conta na hora. Em 12 cobranças atrasadas como essa no ano, ` +
      `isso é <b class="hl">${brl((multa + juros) * 12)}</b> que ficaram com quem não pagou em dia.`;

    $('#j-msg').innerHTML =
      `“Oi! Sobre o vencimento do dia ${new Date().getDate()}: o valor de <b>${brl(V)}</b> está com ` +
      `${d} ${d === 1 ? 'dia' : 'dias'} de atraso. Com multa de ${pct(mPct)} e juros de ${pct(jPct)} ` +
      `ao mês, hoje fecha em <b>${brl(total)}</b>. Te manda o Pix pra resolver agora?”`;
  }
  [jVal, jDias, jMulta, jJuros].forEach(c => c && c.addEventListener('input', atraso));
  if (jDiasR) jDiasR.addEventListener('input', () => { jDias.value = jDiasR.value; atraso(); });
  if (jVal) jVal.addEventListener('blur', () => { jVal.value = num(jVal.value).toLocaleString('pt-BR'); });
  atraso();

  /* ══════════════════ LEILÃO DE VEÍCULOS ══════════════════ */
  const lCampos = ['l-lance', 'l-fipe', 'l-comissao', 'l-taxas', 'l-reparos', 'l-debitos', 'l-aluguel', 'l-ocioso']
    .map(id => $('#' + id));

  function leilao() {
    if (!lCampos[0] || !$('#l-lines')) return;
    const [lance, fipe, comPct, taxas, reparos, debitos, aluguel, ocioso] = lCampos.map(c => num(c.value));
    if (!lance) return;

    const comissao = lance * comPct / 100;
    const custo = lance + comissao + taxas + reparos + debitos;
    const desconto = fipe ? (1 - custo / fipe) * 100 : 0;

    const mesesPagos = Math.max(1, 12 - Math.min(11, ocioso));
    const receitaAno = aluguel * mesesPagos;
    const payback = receitaAno ? custo / (receitaAno / 12) : 0;
    const retornoAA = custo ? receitaAno / custo * 100 : 0;
    const cdiLiq = T.cdi * (1 - 0.15);

    const li = (a, b, tom) => `<li class="${tom || ''}"><span>${a}</span><b>${b}</b></li>`;
    $('#l-lines').innerHTML =
      li('Lance', brl(lance)) +
      li(`Comissão do leiloeiro (${pct(comPct)})`, '+ ' + brl(comissao)) +
      li('Pátio, remoção e documentação', '+ ' + brl(taxas)) +
      li('Reparos para rodar', '+ ' + brl(reparos)) +
      li('Débitos do veículo', '+ ' + brl(debitos)) +
      li('Custo real do carro na rua', brl(custo), 'is-ref') +
      li('Contra o valor de tabela', (desconto >= 0 ? '−' : '+') + pct(Math.abs(desconto)) + (desconto >= 0 ? ' abaixo' : ' acima')) +
      li(`Renda em ${mesesPagos} meses alugados por ano`, brl(receitaAno) + '/ano') +
      li('Se paga em', payback.toFixed(1).replace('.', ',') + ' meses') +
      li('Retorno sobre o investido', pct(retornoAA) + ' a.a.', 'is-ref');

    const tag = $('#l-tag'), txt = $('#l-txt'), box = $('#l-verdict');
    box.classList.remove('is-good', 'is-mid', 'is-bad');

    if (payback && payback <= 24 && retornoAA >= cdiLiq * 2) {
      box.classList.add('is-good');
      tag.textContent = 'Vale o lance';
      txt.innerHTML = `Custo real de <b>${brl(custo)}</b> (${pct(Math.abs(desconto))} ${desconto >= 0 ? 'abaixo' : 'acima'} da tabela)
        que se paga em <b>${payback.toFixed(1).replace('.', ',')} meses</b> e rende <b>${pct(retornoAA)} ao ano</b> —
        contra ${pct(cdiLiq)} do CDI. Defina esse lance como teto e não suba nem R$ 500 no calor da hora.`;
    } else if (payback && payback <= 30 && retornoAA > cdiLiq) {
      box.classList.add('is-mid');
      tag.textContent = 'Dá, mas sem folga';
      txt.innerHTML = `Se paga em <b>${payback.toFixed(1).replace('.', ',')} meses</b> e rende
        <b>${pct(retornoAA)} ao ano</b>. Funciona, mas uma batida, um mês parado a mais ou um reparo
        maior que o previsto derrubam a conta. Baixe o lance ou negocie o reparo antes.`;
    } else {
      box.classList.add('is-bad');
      tag.textContent = 'Esse lance é alto';
      txt.innerHTML = `O carro sai por <b>${brl(custo)}</b> e rende <b>${pct(retornoAA)} ao ano</b>,
        com retorno em ${payback.toFixed(1).replace('.', ',')} meses — o CDI paga ${pct(cdiLiq)} sem
        oficina e sem cliente. Para fazer sentido, o lance precisa cair.`;
    }
  }
  lCampos.forEach(c => c && c.addEventListener('input', leilao));
  lCampos.forEach(c => c && c.addEventListener('blur', () => { c.value = num(c.value).toLocaleString('pt-BR'); }));
  leilao();

  /* ══════════════════ CUSTO DE INVENTÁRIO (SUCESSÃO) ══════════════════ */
  const hPat = $('#h-patrimonio'), hItcmd = $('#h-itcmd');

  function sucessao() {
    if (!hPat || !$('#cen-org')) return;
    const P = num(hPat.value);
    const aliq = Math.min(T.itcmdMax, Math.max(0, num(hItcmd.value)));
    if (!P) return;

    const itcmd = P * aliq / 100;
    const li = (a, b, tom) => `<li class="${tom || ''}"><span>${a}</span><b>${b}</b></li>`;

    // cenário organizado: extrajudicial
    const honO = P * T.honorExtra / 100;
    const emoO = P * T.emolumentos / 100;
    const totO = itcmd + honO + emoO;

    $('#cen-org').innerHTML =
      li(`ITCMD (${pct(aliq)})`, brl(itcmd)) +
      li(`Advogado (${pct(T.honorExtra)}, mínimo da OAB)`, brl(honO)) +
      li(`Cartório e registros (~${pct(T.emolumentos)})`, brl(emoO)) +
      li('Custo total para a família', brl(totO), 'is-ref');

    // cenário caos: judicial + multa por atraso
    const honJ = P * T.honorJudicial / 100;
    const cusJ = P * T.custasJudiciais / 100;
    const multa = itcmd * T.multaAtraso / 100;
    const totJ = itcmd + multa + honJ + cusJ + emoO;

    $('#cen-caos').innerHTML =
      li(`ITCMD (${pct(aliq)})`, brl(itcmd)) +
      li(`Multa por perder o prazo (${pct(T.multaAtraso)} do imposto)`, brl(multa)) +
      li(`Advogado em processo (${pct(T.honorJudicial)})`, brl(honJ)) +
      li(`Custas judiciais (~${pct(T.custasJudiciais)}) + cartório`, brl(cusJ + emoO)) +
      li('Custo total para a família', brl(totJ), 'is-ref');

    const dif = totJ - totO;
    const mesesCDI = totO / (P * aoMes(T.cdi));
    $('#suc-delta').innerHTML =
      `A desorganização custa <b class="hl">${brl(dif)}</b> a mais — dinheiro que sai do bolso de ` +
      `quem você quis proteger. E mesmo no melhor cenário, a conta é de <b>${brl(totO)}</b>: ` +
      `o equivalente a <b>${mesesCDI.toFixed(1).replace('.', ',')} meses</b> de rendimento desse ` +
      `patrimônio no CDI. Dá para reservar isso em vida — desde que alguém faça a conta antes.`;
  }
  [hPat, hItcmd].forEach(c => c && c.addEventListener('input', sucessao));
  if (hPat) hPat.addEventListener('blur', () => { hPat.value = num(hPat.value).toLocaleString('pt-BR'); });
  sucessao();

  /* ══════════════════ CONTAS DOS MITOS ══════════════════ */
  function atualizaMitos() {
    const cdiLiq = T.cdi * (1 - 0.15);
    const linha = (a, b, tom) => `<div class="mito__line ${tom || ''}"><span>${a}</span><b>${b}</b></div>`;

    // 01 piscina: R$ 60 mil numa casa de R$ 600 mil
    const pisc = 60000, casa = 600000, manutMes = 300, anos = 10;
    const valorizaPiscina = casa * 0.06;                       // 6% do valor do imóvel
    const manut10 = manutMes * 12 * anos;
    const cdi10 = pisc * (Math.pow(1 + cdiLiq / 100, anos) - 1);
    const p1 = $('#mito-piscina');
    if (p1) p1.innerHTML =
      linha('Construir (piscina média)', '− ' + brl(pisc), 'is-bad') +
      linha('Valoriza a casa de R$ 600 mil em ~6%', '+ ' + brl(valorizaPiscina)) +
      linha(`Manutenção em ${anos} anos (R$ ${manutMes}/mês)`, '− ' + brl(manut10), 'is-bad') +
      linha('Resultado da piscina', brlS(valorizaPiscina - pisc - manut10), 'is-bad') +
      linha(`Alternativa: R$ 60 mil no CDI por ${anos} anos`, '+ ' + brl(cdi10), 'is-good') +
      linha('Escolher a piscina custou', brlS(valorizaPiscina - pisc - manut10 - cdi10), 'is-total');

    // 02 imóvel x CDI, no valor que a pessoa digitou no simulador
    const preco = num(($('#i-preco') || {}).value || 450000) || 450000;
    const alugLiqAA = T.aluguelYield * (1 - T.imovelCustoAdm / 100) * (1 - T.imovelVacancia / 100) * 0.85;
    const p2 = $('#mito-imovel');
    if (p2) p2.innerHTML =
      linha(`Aluguel líquido de um imóvel de ${brl(preco)}`, brl(preco * alugLiqAA / 100) + '/ano') +
      linha('O mesmo valor no CDI, líquido de IR', brl(preco * cdiLiq / 100) + '/ano', 'is-good') +
      linha('Diferença por ano, sem contar valorização', brl(preco * (cdiLiq - alugLiqAA) / 100), 'is-total');

    // 03 reforma de luxo
    const ref = 80000;
    const p3 = $('#mito-reforma');
    if (p3) p3.innerHTML =
      linha('Reforma de alto padrão', '− ' + brl(ref), 'is-bad') +
      linha('O que o mercado costuma devolver (30–50%)', '+ ' + brl(ref * 0.4)) +
      linha('Perdeu no acabamento', brlS(ref * 0.4 - ref), 'is-bad') +
      linha('Alternativa: R$ 80 mil no CDI por 3 anos', '+ ' + brl(ref * (Math.pow(1 + cdiLiq / 100, 3) - 1)), 'is-good') +
      linha('Escolher o luxo custou', brlS(ref * 0.4 - ref - ref * (Math.pow(1 + cdiLiq / 100, 3) - 1)), 'is-total');

    // 04 terreno parado
    const ter = 200000, iptu = 2400, a5 = 5;
    const p4 = $('#mito-terreno');
    if (p4) p4.innerHTML =
      linha(`IPTU e conservação em ${a5} anos`, '− ' + brl(iptu * a5), 'is-bad') +
      linha('Renda que o terreno gera nesse tempo', 'R$ 0', 'is-bad') +
      linha(`O mesmo valor no CDI em ${a5} anos`, '+ ' + brl(ter * (Math.pow(1 + cdiLiq / 100, a5) - 1)), 'is-good') +
      linha('Valorização necessária só para empatar', pct(cdiLiq + iptu / ter * 100) + ' a.a.', 'is-total');
  }
  atualizaMitos();

  /* ─────────── reveal com stagger ─────────── */
  const revs = $$('.reveal');
  document.documentElement.classList.add('js-anim');
  if (reduced) {
    revs.forEach(el => el.classList.add('is-in'));
  } else {
    const io = new IntersectionObserver((entries, obs) => {
      entries.filter(e => e.isIntersecting).forEach((e, i) => {
        e.target.style.transitionDelay = `${Math.min(i, 5) * 70}ms`;
        e.target.classList.add('is-in');
        obs.unobserve(e.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    revs.forEach(el => io.observe(el));
  }

  /* ─────────── tabs de módulos ─────────── */
  $$('.mods__tab').forEach(tab => tab.addEventListener('click', () => {
    $$('.mods__tab').forEach(t => { t.classList.remove('is-active'); t.setAttribute('aria-selected', 'false'); });
    tab.classList.add('is-active');
    tab.setAttribute('aria-selected', 'true');
    $$('.mods__panel').forEach(p => p.classList.toggle('is-active', p.dataset.panel === tab.dataset.tab));
  }));

  /* ─────────── tabs do FAQ ─────────── */
  $$('.faq__tab').forEach(tab => tab.addEventListener('click', () => {
    $$('.faq__tab').forEach(t => t.classList.remove('is-active'));
    tab.classList.add('is-active');
    $$('.faq__group').forEach(g => g.classList.toggle('is-active', g.dataset.fgroup === tab.dataset.ftab));
  }));

  $$('.faq__group details').forEach(d => d.addEventListener('toggle', () => {
    if (!d.open) return;
    $$('details', d.parentElement).forEach(o => { if (o !== d) o.open = false; });
  }));

  /* ─────────── form → WhatsApp com a mensagem montada ─────────── */
  const WHATS = '5519988013439';
  const form = $('#form');
  if (form) form.addEventListener('submit', e => {
    e.preventDefault();
    const nome = form.nome.value.trim(), whats = form.whats.value.trim();
    if (!nome || !whats) { (nome ? form.whats : form.nome).focus(); return; }

    const linhas = [
      `Oi! Sou ${nome}${form.empresa.value.trim() ? `, de ${form.empresa.value.trim()}` : ''}.`,
      `Quero organizar meu dinheiro com o Reis Factory.`,
      ``,
      `Minha dúvida hoje: ${form.dor.value}`,
      `Meu WhatsApp: ${whats}`,
      form.email.value.trim() ? `Meu e-mail: ${form.email.value.trim()}` : '',
      sVal ? `Simulei ${brl(num(sVal.value))} por ${Math.round(num(sMes.value))} meses no site.` : '',
    ].filter(Boolean);

    window.open(`https://wa.me/${WHATS}?text=${encodeURIComponent(linhas.join('\n'))}`, '_blank', 'noopener');
    form.querySelector('button[type=submit]').textContent = 'WhatsApp aberto';
    $('#form-ok').hidden = false;
  });

  /* ══════════════════ MOCKS DE PRODUTO ══════════════════ */
  const cdiMes = aoMes(T.cdi) * 100;
  const MOCK = {
    parado: `
      <div class="mk mk--pad">
        <div class="mk__row"><span class="mk__lab">Conta corrente</span><span class="mk__up mk__up--bad">rendendo 0%</span></div>
        <div class="mk__bars">
          ${[40, 40, 40, 40, 40, 40, 40].map(h => `<i style="--h:${h}%"></i>`).join('')}
        </div>
        <div class="mk__foot"><span>Deixou de render em 5 meses</span><b class="mk__q">!</b></div>
      </div>`,
    versus: `
      <div class="mk mk--pad mk--split">
        <div class="mk__line"><span>“Imóvel rende mais”</span><b>${pct(T.aluguelYield)}</b></div>
        <div class="mk__line"><span>CDI de hoje</span><b>${pct(T.cdi)}</b></div>
        <div class="mk__line"><span>Poupança</span><b>${pct(T.poupanca)}</b></div>
        <div class="mk__neq">?</div>
      </div>`,
    piscina: `
      <div class="mk mk--pad mk--leak">
        <div class="mk__leak"><span>Custou construir</span><b>− R$ 60.000</b><i style="--w:100%"></i></div>
        <div class="mk__leak"><span>Valorizou na venda</span><b>+ R$ 36.000</b><i style="--w:60%"></i></div>
        <div class="mk__leak"><span>Manutenção em 10 anos</span><b>− R$ 36.000</b><i style="--w:60%"></i></div>
      </div>`,
    dash: `
      <div class="mk mk--app">
        <div class="mk__top"><i></i><i></i><i></i><span>Meu dinheiro hoje</span></div>
        <div class="mk__kpis">
          <div class="mk__kpi"><span>Em conta</span><b>R$ 12.480</b></div>
          <div class="mk__kpi"><span>Investido</span><b>R$ 96.200</b></div>
          <div class="mk__kpi mk__kpi--lime"><span>Sobra do mês</span><b>R$ 3.140</b></div>
          <div class="mk__kpi"><span>Patrimônio</span><b>R$ 738.900</b></div>
        </div>
        <div class="mk__chart">
          ${[38, 44, 41, 52, 58, 55, 64, 71, 78, 88].map(h => `<i style="--h:${h}%"></i>`).join('')}
        </div>
        <div class="mk__meta"><span>Rendendo acima do CDI</span><div class="mk__prog"><i style="--w:68%"></i></div><b>68%</b></div>
      </div>`,
    alerta: `
      <div class="mk mk--app mk--alerts">
        <div class="mk__top"><i></i><i></i><i></i><span>O que precisa da sua decisão</span></div>
        <div class="mk__al"><b>Dinheiro parado</b><span>R$ 38.000 na conta há 47 dias — no CDI seriam <em>R$ ${Math.round(38000 * (Math.pow(1 + cdiMes / 100, 1.5) - 1)).toLocaleString('pt-BR')}</em></span></div>
        <div class="mk__al"><b>CDB vencendo</b><span>Em 12 dias. Resgatar agora paga 17,5% de IR; esperar 40 dias cai para 15%</span></div>
        <div class="mk__al"><b>Aluguel abaixo do mercado</b><span>Seu imóvel rende 4,1% a.a.; a média da região é ${pct(T.aluguelYield)}</span></div>
      </div>`,
    sim: `
      <div class="mk mk--app">
        <div class="mk__top"><i></i><i></i><i></i><span>Simulação · R$ 50 mil / 24 meses</span></div>
        <div class="mk__sim">
          <div class="mk__simrow is-top"><span>LCI 90% CDI</span><b>${brl(50000 * Math.pow(1 + aoMes(T.cdi * 0.9), 24))}</b></div>
          <div class="mk__simrow"><span>CDB 100% CDI</span><b>${brl(50000 + 50000 * (Math.pow(1 + aoMes(T.cdi), 24) - 1) * 0.825)}</b></div>
          <div class="mk__simrow"><span>Poupança</span><b>${brl(50000 * Math.pow(1 + aoMes(T.poupanca), 24))}</b></div>
          <div class="mk__simrow is-bad"><span>Conta corrente</span><b>${brl(50000)}</b></div>
        </div>
        <div class="mk__meta"><span>Diferença entre a melhor e a pior escolha</span><b>${brl(50000 * Math.pow(1 + aoMes(T.cdi * 0.9), 24) - 50000)}</b></div>
      </div>`,
    mapa: `
      <div class="mk mk--app mk--cercas">
        <div class="mk__top"><i></i><i></i><i></i><span>Rastreamento / Cercas</span></div>

        <div class="mk__cercas">
          <div class="mk__panel">
            <p class="mk__panel-h">Nova área</p>
            <p class="mk__panel-sub">Clique no mapa para marcar o centro e ajuste o raio</p>
            <label>Nome<span>Base Dos Reis</span></label>
            <label>Raio (metros)<span>500</span></label>
            <label>Velocidade máxima dentro da área<span>20 km/h</span></label>
            <p class="mk__check"><i></i>Avisar quando o veículo sair desta área</p>
            <p class="mk__btn">+ Criar área</p>
            <p class="mk__panel-h mk__panel-h--2">Áreas cadastradas</p>
            <p class="mk__area">Campo Belo<span>raio 1000 m · avisa na saída · máx 20 km/h</span></p>
          </div>

          <div class="mk__osm">
            <span class="mk__road mk__road--h"></span>
            <span class="mk__road mk__road--v"></span>
            <span class="mk__road mk__road--d"></span>
            <span class="mk__green"></span>
            <span class="mk__geo"></span>
            <span class="mk__center"></span>
            <span class="mk__car"></span>
            <span class="mk__trail"></span>
          </div>
        </div>

        <div class="mk__al mk__al--alarm">
          <b>Alarme · FQR-2E18 saiu da cerca "Base Dos Reis"</b>
          <span>14:07 · 62 km/h · travessia na Av. Brasil · WhatsApp enviado para você e para o gestor</span>
        </div>
      </div>`,
    checklist: `
      <div class="mk mk--app">
        <div class="mk__top"><i></i><i></i><i></i><span>Checklist de entrega · Onix 2023</span></div>
        <div class="mk__shots">
          <span>Frente</span><span>Traseira</span><span>Lateral E</span>
          <span>Lateral D</span><span class="is-flag">Avaria</span><span>Painel</span>
        </div>
        <div class="mk__chk">
          <div class="mk__chkrow"><span>KM de saída</span><b>48.209</b></div>
          <div class="mk__chkrow"><span>Combustível</span><b>7/8</b></div>
          <div class="mk__chkrow is-lime"><span>Contrato de locação</span><b>assinado</b></div>
          <div class="mk__chkrow is-lime"><span>Caução</span><b>R$ 1.500</b></div>
        </div>
      </div>`,
    recorrente: `
      <div class="mk mk--app">
        <div class="mk__top"><i></i><i></i><i></i><span>Entra todo mês</span></div>
        <div class="mk__rec">
          <div class="mk__recrow"><span>Salário · dia 5</span><b>R$ 7.800</b></div>
          <div class="mk__recrow"><span>Aluguel · Apto 32 · dia 10</span><b>R$ 2.300</b></div>
          <div class="mk__recrow is-late"><span>Aluguel · Sala 4 · dia 10</span><b>atrasado 6 dias</b></div>
          <div class="mk__recrow"><span>Locação · Onix 2023 · dia 15</span><b>R$ 2.900</b></div>
          <div class="mk__recrow is-lime"><span>Renda fixa do mês</span><b>R$ 13.000</b></div>
        </div>
        <div class="mk__meta"><span>Do seu custo de vida já coberto</span><div class="mk__prog"><i style="--w:82%"></i></div><b>82%</b></div>
      </div>`,
    meta: `
      <div class="mk mk--app mk--steps">
        <div class="mk__top"><i></i><i></i><i></i><span>Metas</span></div>
        <div class="mk__step is-done"><b>Reserva</b><span>6 meses de custo · 100% · concluída</span></div>
        <div class="mk__step is-live"><b>Entrada</b><span>R$ 90 mil até 2028 · R$ 2.100/mês · em dia</span></div>
        <div class="mk__step"><b>Carro</b><span>R$ 45 mil até 2029 · atrasado 2 meses</span></div>
        <div class="mk__step"><b>Viagem</b><span>R$ 18 mil até dez/2027 · adiantada</span></div>
      </div>`,
  };

  $$('[data-viz]').forEach(el => {
    const tpl = MOCK[el.dataset.viz];
    if (tpl) el.innerHTML = tpl;
  });

  const ioV = new IntersectionObserver((es, obs) => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('is-live'); obs.unobserve(e.target); }
  }), { threshold: 0.25 });
  $$('[data-viz]').forEach(el => ioV.observe(el));
})();
