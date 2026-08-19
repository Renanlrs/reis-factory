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
      `Teto legal de juros ${pct(Math.max(0, T.selic - T.ipca12) * (T.usuraDobro || 2))} a.a.`,
      'Contrato de mútuo pronto para assinar',
      'Diária mínima do veículo calculada',
      'Dinheiro parado rende zero',
      'Cobrança automática no WhatsApp',
      'Juros de atraso calculados sozinhos',
      'Calendário de leilões monitorado',
      'Bom pagador reconhecido',
    ];
    const bloco = itens.map(t => `<span>${t}</span><i></i>`).join('');
    ticker.innerHTML = bloco + bloco;
  }

  /* ══════════════════ PRÓXIMO COPOM ══════════════════
     A Selic vale até a próxima reunião — é urgência de calendário,
     não promoção. Se a data passar, o aviso some sozinho. */
  const elCopom = $('#copom');
  if (elCopom && T.copomProximo) {
    const alvo = new Date(T.copomProximo + 'T12:00:00');
    const hoje = new Date();
    const dias = Math.ceil((alvo - hoje) / 86400000);
    if (dias >= 0) {
      const quando = alvo.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' });
      elCopom.innerHTML = dias === 0
        ? `Selic <b>${pct(T.selic)}</b> — o Copom se reúne <b>hoje</b>`
        : `Selic <b>${pct(T.selic)}</b> até ${quando} — <b>${dias} dia${dias > 1 ? 's' : ''}</b> até a próxima decisão do Copom`;
      elCopom.hidden = false;
    }
  }

  /* ══════════════════ PAINEL: QUANTO RENDE HOJE ══════════════════ */
  const grid = $('#rates-grid');
  const pInput = $('#p-valor');
  /* o painel nasce com R$ 10 mil e passa a usar o número que a pessoa digita */
  let BASE = 10000;

  const linhasPainel = () => ([
    { nome: 'Conta corrente', aa: 0, nota: 'O lugar mais caro para guardar dinheiro', tom: 'bad' },
    { nome: 'Poupança', aa: T.poupanca, nota: 'Travada em 0,5% ao mês, isenta de IR' },
    { nome: 'Aluguel de imóvel', aa: T.aluguelYield, nota: 'Média nacional bruta, antes de IPTU e vacância' },
    { nome: 'Tesouro Selic', aa: T.selic, nota: 'Liquidez diária, IR regressivo' },
    { nome: `CDB ${T.cdbPctCdi}% do CDI`, aa: T.cdi * T.cdbPctCdi / 100, nota: 'Com FGC até R$ 250 mil, IR regressivo', tom: 'good' },
    { nome: `LCI/LCA ${T.lciPctCdi}% do CDI`, aa: T.cdi * T.lciPctCdi / 100, nota: 'Isenta de IR — rende menos e entrega mais', tom: 'good' },
  ]);

  function pintarPainel() {
    if (!grid) return;
    const ref = BASE >= 1000
      ? 'R$ ' + Math.round(BASE / 1000).toLocaleString('pt-BR') + ' mil'
      : brl(BASE);
    grid.innerHTML = linhasPainel().map(l => {
      const mes = BASE * aoMes(l.aa);
      return `
      <article class="rate ${l.tom ? 'rate--' + l.tom : ''}">
        <p class="rate__name">${l.nome}</p>
        <p class="rate__aa">${l.aa ? pct(l.aa) : '0%'}<span>a.a.</span></p>
        <p class="rate__mes">${mes ? brl2(mes) : 'R$ 0,00'}<span>por mês, com ${ref}</span></p>
        <p class="rate__nota">${l.nota}</p>
      </article>`;
    }).join('');
  }

  if (grid) {
    pintarPainel();
    const src = $('#rates-src');
    if (src) {
      src.innerHTML = `Atualizado em ${T.atualizado} · ` +
        (T.fontes || []).map(([k, v]) => `<b>${k}:</b> ${v}`).join(' · ') +
        ` · IPCA de ${pct(T.ipca12)} em 12 meses é a régua: render menos que isso é perder poder de compra.`;
    }
  }

  /* ══════════════════ O RELÓGIO DO DINHEIRO PARADO ══════════════════
     Número de exemplo não dói; o número da própria conta dói. A conta é
     a diferença entre a conta corrente (zero) e um CDB de 100% do CDI
     já com o IR da faixa mais pesada — o cenário conservador. */
  const IR_CURTO = 0.225;
  const pDia = $('#p-dia'), pMes = $('#p-mes'), pAno = $('#p-ano'), pLive = $('#p-live');
  const dockNum = $('#dock-num');
  const pCdiPct = $('#p-cdi-pct');
  if (pCdiPct) pCdiPct.textContent = String(T.cdbPctCdi);
  let porSegundo = 0;

  function parado() {
    const valor = Math.max(0, num(pInput ? pInput.value : 0));
    const aa = T.cdi * T.cdbPctCdi / 100;
    const liq = 1 - IR_CURTO;

    const ano = valor * (aa / 100) * liq;
    const mes = valor * aoMes(aa) * liq;
    const dia = valor * (Math.pow(1 + aa / 100, 1 / 365) - 1) * liq;
    porSegundo = dia / 86400;

    if (pDia) pDia.textContent = brl2(dia);
    if (pMes) pMes.textContent = brl2(mes);
    if (pAno) pAno.textContent = brl(ano);
    if (dockNum) dockNum.textContent = brl(ano);
    const dockSub = $('#dock-sub');
    if (dockSub) dockSub.textContent = `é o que ${brl(valor || 10000)} parados deixam na mesa em 12 meses`;

    BASE = valor > 0 ? valor : 10000;
    pintarPainel();
    tique();
  }

  /* "hoje, até agora": o dia já correu, o dinheiro parado já custou. */
  function tique() {
    if (!pLive) return;
    const agora = new Date();
    const inicioDoDia = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
    pLive.textContent = brl2(porSegundo * ((agora - inicioDoDia) / 1000));
  }

  if (pInput) {
    pInput.addEventListener('input', parado);
    pInput.addEventListener('blur', () => { pInput.value = num(pInput.value).toLocaleString('pt-BR'); });
    parado();
    if (!reduced) setInterval(tique, 1000);
  }

  /* ══════════════════ CTA QUE ACOMPANHA A LEITURA ══════════════════
     A página é longa: sem isto o botão só existe nas duas pontas. */
  const dock = $('#dock');
  if (dock) {
    const contato = $('#contato');
    const atualizarDock = () => {
      const passouDoHero = window.scrollY > window.innerHeight * 1.2;
      const chegouNoFim = contato && contato.getBoundingClientRect().top < window.innerHeight;
      const mostrar = passouDoHero && !chegouNoFim;
      if (mostrar && dock.hidden) dock.hidden = false;
      dock.classList.toggle('is-on', mostrar);
    };
    atualizarDock();
    window.addEventListener('scroll', atualizarDock, { passive: true });
  }

  /* ══════════════════ EMPRESTAR DINHEIRO ══════════════════
     Três contas na mesma tela: quanto volta, até onde a lei deixa cobrar e
     quanto de calote a operação aguenta antes de virar prejuízo. */
  const eValor = $('#e-valor'), eMeses = $('#e-meses'), eTaxa = $('#e-taxa'), eTaxaR = $('#e-taxa-r');
  const eModo = $('#e-modo'), eCredor = $('#e-credor'), eDevedor = $('#e-devedor');
  const eLines = $('#e-lines');

  /* Art. 406 do CC (Lei 14.905/2024): taxa legal = Selic − IPCA, e nunca negativa. */
  const taxaLegalAA = Math.max(0, (T.selic || 0) - (T.ipca12 || 0));
  const tetoAA = taxaLegalAA * (T.usuraDobro || 2);
  const tetoAM = (Math.pow(1 + tetoAA / 100, 1 / 12) - 1) * 100;

  function emprestimo() {
    if (!eLines) return;
    const P = num(eValor.value);
    const m = Math.max(1, Math.round(num(eMeses.value)));
    const iAM = num(eTaxa.value) / 100;
    const modo = eModo.value;

    /* quanto volta, conforme o combinado de pagamento */
    let parcela = 0, total = 0, rotulo = 'Parcela por mês';
    if (modo === 'price') {
      parcela = iAM > 0 ? P * iAM / (1 - Math.pow(1 + iAM, -m)) : P / m;
      total = parcela * m;
    } else if (modo === 'juros') {
      parcela = P * iAM;
      total = P + parcela * m;
      rotulo = 'Juros por mês';
    } else {
      total = P * Math.pow(1 + iAM, m);
      parcela = total;
      rotulo = 'Uma parcela só, no fim';
    }
    const lucro = total - P;
    const taxaAA = (Math.pow(1 + iAM, 12) - 1) * 100;

    /* O mesmo dinheiro sem risco nenhum. A comparação é entre TAXAS, não entre
       reais: no Price o principal volta aos poucos e some do bolso do devedor,
       então comparar o total ganho puniria o Price sem motivo. */
    const dias = m * 30;
    const ir = irFaixa(dias);
    const ganhoCDB = P * (Math.pow(1 + aoMes(T.cdi * T.cdbPctCdi / 100), m) - 1) * (1 - ir);
    const cdiLiqAA = T.cdi * T.cdbPctCdi / 100 * (1 - ir);

    /* Lei da Usura: o teto caiu para operação entre empresas, não para quem
       tem pessoa física na ponta. */
    const entreEmpresas = eCredor.value === 'pj' && eDevedor.value === 'pj';
    const acimaDoTeto = !entreEmpresas && taxaAA > tetoAA + 0.0001;

    /* quanto do que você tem a receber pode virar pó antes de o seu próprio
       dinheiro começar a sumir */
    const margem = total > 0 ? lucro / total : 0;
    const umACada = margem > 0 ? Math.max(1, Math.round(1 / margem)) : 0;

    $('#e-total').textContent = brl(total);
    $('#e-parcela').textContent = brl(parcela);
    $('#e-parcela-label').textContent = rotulo;

    eLines.innerHTML = [
      ['Você tira do bolso', '− ' + brl(P)],
      ['Juros no período', brl(lucro)],
      ['Taxa equivalente ao ano', pct(taxaAA) + ' a.a.'],
      [entreEmpresas ? 'Teto legal (não se aplica entre empresas)' : 'Teto legal hoje',
        entreEmpresas ? 'sem limite' : pct(tetoAA) + ' a.a. · ' + pct(tetoAM) + ' a.m.'],
      ['O mesmo dinheiro num CDB', pct(cdiLiqAA) + ' a.a. · ' + brl(ganhoCDB) + ' no período'],
    ].map(([k, v]) => `<li><span>${k}</span><b>${v}</b></li>`).join('');

    const vd = $('#e-veredito');
    vd.classList.remove('is-bad', 'is-good', 'is-warn');
    if (acimaDoTeto) {
      vd.classList.add('is-bad');
      vd.innerHTML = `Acima do teto legal — ${pct(taxaAA)} a.a. contra ${pct(tetoAA)} permitidos`;
    } else if (taxaAA <= cdiLiqAA) {
      vd.classList.add('is-warn');
      vd.innerHTML = `${pct(taxaAA)} ao ano rende menos que o CDB (${pct(cdiLiqAA)}) — e com risco de não voltar`;
    } else {
      vd.classList.add('is-good');
      vd.innerHTML = `${(taxaAA / (cdiLiqAA || 1)).toFixed(1).replace('.', ',')}× o CDB${entreEmpresas ? '' : ' e dentro do teto legal'}`;
    }

    const risco = $('#e-risco');
    if (margem <= 0) {
      risco.innerHTML = `Sem juros não há colchão: o primeiro que não pagar leva embora o seu
        dinheiro, não o seu lucro.`;
    } else {
      risco.innerHTML = `Você aguenta perder <b>${pct(margem * 100)}</b> do que tem a receber
        antes de o seu próprio dinheiro começar a sumir — algo como <b>1 calote a cada
        ${umACada}</b> empréstimos iguais a este. É o seu colchão de risco, e ele encolhe a cada
        prazo maior.`;
    }

    const legal = $('#e-legal');
    legal.innerHTML = entreEmpresas
      ? `Operação entre empresas: desde a <b>Lei 14.905/2024</b>, empréstimo entre pessoas
         jurídicas não financeiras não tem teto de juros. O limite passa a ser o contrato e o
         risco — não a lei.`
      : `Com pessoa física na operação, vale o teto da <b>Lei da Usura</b>: no máximo o dobro da
         taxa legal (Selic − IPCA), hoje <b>${pct(tetoAA)} ao ano</b>, ou <b>${pct(tetoAM)} ao
         mês</b>. Cobrar acima disso torna a cláusula contestável e é o que caracteriza
         agiotagem (${T.agiotagemLei}). O app não deixa você passar disso sem saber.`;
  }

  [eValor, eMeses, eTaxa, eModo, eCredor, eDevedor].forEach(c => c && c.addEventListener('input', emprestimo));
  [eValor, eMeses].forEach(c => c && c.addEventListener('blur', () => { c.value = num(c.value).toLocaleString('pt-BR'); }));
  if (eTaxaR) eTaxaR.addEventListener('input', () => { eTaxa.value = eTaxaR.value.replace('.', ','); emprestimo(); });
  if (eTaxa) eTaxa.addEventListener('input', () => { eTaxaR.value = String(num(eTaxa.value)); });
  emprestimo();

  /* ══════════════════ PRECIFICAR O ALUGUEL DO CARRO ══════════════════
     A diária só é lucro depois de pagar depreciação, IPVA, seguro,
     manutenção e os dias em que o carro fica na garagem. */
  const cValor = $('#c-valor'), cDiaria = $('#c-diaria'), cDias = $('#c-dias'), cDiasR = $('#c-dias-r');
  const cDep = $('#c-dep'), cSeg = $('#c-seg'), cMan = $('#c-man'), cIpva = $('#c-ipva');
  const cLines = $('#c-lines');

  function precificar() {
    if (!cLines) return;
    const V = num(cValor.value);
    const D = num(cDiaria.value);
    const dias = Math.max(1, Math.round(num(cDias.value)));

    const dep = V * num(cDep.value) / 100 / 12;
    const seg = V * num(cSeg.value) / 100 / 12;
    const man = V * num(cMan.value) / 100 / 12;
    const ipva = V * num(cIpva.value) / 100 / 12;
    const custo = dep + seg + man + ipva;

    const receita = D * dias;
    const sobra = receita - custo;
    const retornoAA = V > 0 ? (sobra * 12 / V) * 100 : 0;

    /* o piso: o mesmo dinheiro num CDB de longo prazo, líquido de IR */
    const cdiLiqAA = T.cdi * T.cdbPctCdi / 100 * 0.85;
    const alvoMes = V * cdiLiqAA / 100 / 12;
    const minima = dias > 0 ? (custo + alvoMes) / dias : 0;
    const payback = sobra > 0 ? V / sobra : 0;

    $('#c-sobra').textContent = brl(sobra);
    $('#c-minima').textContent = brl2(minima);

    cLines.innerHTML = [
      ['Receita no mês', brl(receita)],
      ['Depreciação', '− ' + brl(dep)],
      ['Seguro e rastreador', '− ' + brl(seg)],
      ['Manutenção', '− ' + brl(man)],
      ['IPVA e licenciamento', '− ' + brl(ipva)],
      ['Retorno sobre o valor do carro', pct(retornoAA) + ' a.a.'],
      ['O mesmo dinheiro num CDB', pct(cdiLiqAA) + ' a.a.'],
    ].map(([k, v]) => `<li><span>${k}</span><b>${v}</b></li>`).join('');

    const vd = $('#c-veredito');
    vd.classList.remove('is-bad', 'is-good', 'is-warn');
    if (sobra <= 0) {
      vd.classList.add('is-bad');
      vd.textContent = 'No vermelho: a diária não cobre nem o custo do carro';
    } else if (retornoAA < cdiLiqAA) {
      vd.classList.add('is-warn');
      vd.textContent = 'Dá lucro, mas rende menos que o banco — e dá muito mais trabalho';
    } else {
      vd.classList.add('is-good');
      vd.textContent = `Fecha: ${pct(retornoAA)} ao ano, ${(retornoAA / cdiLiqAA).toFixed(1).replace('.', ',')}× o CDB`;
    }

    const nota = $('#c-nota');
    nota.innerHTML = payback > 0
      ? `Neste ritmo o carro se paga em <b>${Math.ceil(payback)} meses</b> de locação. Cada dia
         parado custa <b>${brl2(custo / 30)}</b> — o custo corre mesmo com o carro na garagem.`
      : `Sem sobra não há payback: o carro está sendo financiado por você, não pelo cliente.`;
  }

  [cValor, cDiaria, cDias, cDep, cSeg, cMan, cIpva].forEach(c => c && c.addEventListener('input', precificar));
  [cValor, cDiaria].forEach(c => c && c.addEventListener('blur', () => { c.value = num(c.value).toLocaleString('pt-BR'); }));
  if (cDiasR) cDiasR.addEventListener('input', () => { cDias.value = cDiasR.value; precificar(); });
  if (cDias) cDias.addEventListener('input', () => { cDiasR.value = String(num(cDias.value)); });
  precificar();

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

  /* ══════════════════ ALERTA DE NOVO LEILÃO ══════════════════
     Sem backend: os filtros viram a mensagem que a pessoa manda no WhatsApp. */
  const chips = $$('#alerta-chips .chip');
  const alCta = $('#al-cta');
  if (chips.length && alCta) {
    const montar = () => {
      const tipos = chips.filter(c => c.classList.contains('is-on')).map(c => c.dataset.chip);
      const regiao = ($('#al-regiao') || {}).value || '';
      const teto = num(($('#al-teto') || {}).value || 0);
      const texto =
        `Oi! Quero receber alerta de leilão pelo Reis Factory.
` +
        `O que me interessa: ${tipos.length ? tipos.join(', ') : 'qualquer lote'}.
` +
        (regiao ? `Região: ${regiao}.
` : '') +
        (teto ? `Arremato até ${brl(teto)}.` : '');
      alCta.href = `https://wa.me/5519988013439?text=${encodeURIComponent(texto)}`;
      alCta.target = '_blank';
      alCta.rel = 'noopener';
    };
    chips.forEach(c => c.addEventListener('click', () => { c.classList.toggle('is-on'); montar(); }));
    ['#al-regiao', '#al-teto'].forEach(sel => { const e = $(sel); if (e) e.addEventListener('input', montar); });
    const alTeto = $('#al-teto');
    if (alTeto) alTeto.addEventListener('blur', () => { alTeto.value = num(alTeto.value).toLocaleString('pt-BR'); });
    montar();
  }

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
