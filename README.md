# Reis Factory — site (landing)

Landing do **Reis Factory**: app de **gestão do dinheiro com inteligência de investimento** —
mostra quanto o dinheiro rende hoje, onde renderia mais, se imóvel para aluguel compensa e
o que só *parece* investimento. O app operacional vive em `~/dos-reis-finance`.

Site estático: HTML + CSS + JS puro, **sem build, sem dependência, sem imagem de terceiro**.
O único ativo de marca é o nosso logotipo.

## As seis ferramentas que funcionam de verdade no site

1. **Painel "quanto rende hoje"** — conta corrente, poupança, aluguel, Tesouro Selic, CDB e
   LCI/LCA, cada um com a taxa anual e **quanto R$ 10 mil rendem por mês**.
2. **Simulador "onde colocar esse dinheiro"** — valor + prazo → ranking do valor líquido final,
   com IR regressivo (22,5/20/17,5/15%), isenção de LCI/LCA/poupança e o aluguel já descontado
   de administração, vacância e imposto. Fecha com a frase que dói: "escolher X em vez de Y
   muda R$ N".
3. **Calculadora "casa para alugar compensa?"** — preço, aluguel, IPTU/condomínio, manutenção,
   meses vagos e valorização esperada → yield líquido, comparação com o CDI líquido e **veredito**
   (fecha / empata / não fecha).

4. **Calculadora de custo de inventário** (seção Documentos) — patrimônio + alíquota de ITCMD →
   dois cenários lado a lado: **organizado** (extrajudicial: ITCMD + 6% de advogado + 1,5% de
   cartório) x **sem organizar** (judicial: + multa de 10% do imposto por perder o prazo + 10% de
   advogado + 2% de custas). Fecha dizendo quanto a desorganização custa e a quantos meses de
   rendimento no CDI aquilo equivale.

5. **Calculadora de juros de atraso** (seção Cobrança) — parcela, dias de atraso, multa e juros
   de mora → valor a cobrar hoje, **quanto vale cada dia a mais** e a mensagem de cobrança pronta
   para enviar, com a memória de cálculo.
6. **Calculadora de leilão de veículo** (seção Leilões) — lance, comissão do leiloeiro, pátio,
   reparos e débitos → **custo real na rua**, desconto contra a tabela, payback em meses, retorno
   anual e veredito (vale o lance / sem folga / lance alto), sempre contra o CDI.

Mais o bloco **mitos de retorno** (piscina, imóvel grande, reforma de luxo, terreno parado), com
a conta feita em cima das taxas do dia — inclusive o custo de oportunidade.

## Seções com destaque próprio

- **Locação, frota e renda recorrente** (`#locacao`): abre com **cercas e alarme de evasão** —
  o mock reproduz a tela real `Rastreamento / Cercas` do app (nome da área, raio em metros,
  velocidade máxima dentro da área, "avisar quando sair", áreas cadastradas e mapa com a cerca
  tracejada, o carro cruzando a linha e a faixa de alarme). Abaixo, grade com **8 alarmes**
  (saiu da área, zona proibida, excesso dentro da cerca, parado demais, fora de horário, sem
  sinal, voltou à base, km acima do contratado). Depois: rastreador ao vivo e playback,
  cadastro de veículos, **checklist com fotos** de entrega/devolução, contrato de locação gerado
  do cadastro (caução e multa calculadas), **meus aluguéis** (inquilino, vencimento, reajuste,
  atraso) e **salário / renda fixa** com quanto do custo de vida já está coberto.
- **Testamento, procuração e contratos** (`#documentos`): as três frentes + biblioteca de 16
  modelos + aviso legal explícito (o app prepara a minuta; não substitui advogado nem tabelião —
  testamento e procuração têm forma exigida por lei e inventário exige advogado, CPC 610 §2º).

- **Cobrança automática** (`#cobranca`): régua de 6 etapas (de 3 dias antes até 30 dias de atraso),
  trilha espelhada de **bom pagador** (agradecimento, selo, desconto, prioridade) e 8 alertas
  (parcela atrasada, aluguel que não caiu, boleto devolvido, reincidente, acordo quebrado,
  contrato vencendo, caução a devolver, bom pagador).
- **Calendário de leilões** (`#leiloes`): calculadora do lance + radar de 8 fontes de edital
  (Detran, seguradoras, bancos, judicial, frotas, órgãos públicos, leiloeiros, Receita). O app
  monitora, avisa e guarda o **teto de lance** definido a frio.

Todas aparecem no **rodapé** em colunas próprias ("Locação e frota" e "Documentos") e no menu.

## Atualizar as taxas

Tudo vem de **`assets/js/taxas.js`** — um arquivo, um objeto. Mexa lá e o site inteiro
(painel, simulador, imóvel, mitos, ticker do hero e textos) se atualiza.

Valores atuais (17/08/2026): Selic **14,00%** (Copom 05/08/2026) · CDI **13,90%** ·
IPCA 12m **4,44%** · poupança **6,17%** · yield de aluguel residencial **6,14%**
(FipeZap jul/2026; 1 quarto 6,78%, 4+ quartos 4,84%).

> Próxima reunião do Copom: **16/09/2026** — revisar `taxas.js` depois dela.

## Rodar

```bash
cd ~/reis-factory-site
python -m http.server 8560
# http://127.0.0.1:8560
```

## Estrutura

```
index.html                    hero → quanto rende → história → simulador → imóvel → mitos →
                              locação/frota → documentos e sucessão → cobrança → leilões →
                              para quem é → o app → módulos → citação → começo → contato →
                              FAQ → CTA final + footer
assets/css/styles.css         layout, tipografia, componentes
assets/css/mocks.css          as "telas de produto" (painel, alertas, simulação, metas)
assets/css/money.css          painel de taxas, simulador, calculadora do imóvel, mitos
assets/js/taxas.js            ÚNICO lugar para atualizar Selic, CDI, IPCA e yield
assets/js/hero.js             skyline 3D de dados em canvas 2D puro (sem three.js)
assets/js/main.js             reveal, tabs, FAQ, contadores, calculadora, mocks
assets/img/logo-lockup.png    logo horizontal (símbolo + wordmark) — nav e footer
assets/img/logo-reis-factory.png  logo original empilhado, fundo transparente
assets/img/logo-mark.png      só o símbolo (favicon)
```

## Referência de design — valores extraídos do site original

Tudo abaixo foi lido do `terminal-industries.com` rodando (computed styles), não estimado:

| Item | Valor real do original | Aqui |
|---|---|---|
| Verde (accent) | `rgb(171,255,2)` = **#ABFF02** | igual |
| Tinta / texto | `rgb(5,36,36)` = **#052424** | igual |
| Corpo de texto | `rgba(5,36,36,.7)` | igual |
| Seção clara | **#FFFFFF** (branco puro, não off-white) | igual |
| Card | **#F0F0F0**, raio **24px**, padding **40px** | igual |
| Botão | raio **8px** (não pílula), fundo `rgba(5,36,36,.05)` | igual |
| Headline | **peso 400**, 70px, line-height 1.0, tracking **-3.6px (-0.051em)** | igual |
| Hero | 82.5px, line-height 0.95, tracking -0.018em | igual |
| Título de card | 22.5px / 1.46, peso 400 | igual |
| Eyebrow / botão | mono **13px**, tracking **0.18em**, uppercase, cinza `#7F7F7F` | igual |
| Mono | **Geist Mono** | igual (Google Fonts) |
| Sans | SuisseIntl (licença paga) | **Inter Tight** — substituto mais próximo grátis |

Estrutura espelhada: hero escuro cinematográfico → parede de segmentos em grade com `+` nas
interseções (no original é grade de logos de clientes) → 3 cards numerados → calculadora →
4 benefícios com tela ao lado e canto cortado → plataforma modular em tabs → citação → 3 portas
de entrada → contato → FAQ em tabs → **cúpula** (`border-radius: 50% 50% 0 0 / 100% 100% 0 0`)
entrando na seção escura → footer em colunas.

## Storytelling e gatilhos aplicados

| Bloco | Gatilho |
|---|---|
| Hero | novidade + promessa concreta ("da venda ao dinheiro na conta") |
| História 01/02/03 | narrativa em 3 atos (sensação → ruído → conta), aversão à perda |
| Números | prova numérica + medo do escuro ("decide com medo") |
| Calculadora | dor quantificada com os números **dele** — âncora do preço |
| Benefícios | antes/depois com tela de produto ao lado (prova visual) |
| Módulos | escolha sem risco: "liga só o que precisa hoje" |
| Como começa | 3 portas de entrada por nível de maturidade (baixa fricção) |
| FAQ | quebra de objeção (preço, planilha, implantação, dados) |
| CTA final | reciprocidade + urgência leve ("já tem os números, falta ver") |

## Contato do site

- WhatsApp **(19) 98801-3439** → `https://wa.me/5519988013439`
- E-mail **renandosreis52@gmail.com**

Aparecem em três lugares: bloco "Ou fale direto" (contato), coluna do footer e o formulário.
**O formulário não usa backend**: ele monta a mensagem (nome, empresa, dor escolhida, WhatsApp,
e-mail e o valor que a calculadora apontou) e abre o `wa.me` numa aba nova — o lead só dá enviar.

## Pendências

0. **O app ainda não tem o módulo de investimentos.** O site vende a visão (painel de taxas,
   comparador, alerta de dinheiro parado, carteira, mitos). Em `~/dos-reis-finance` existem
   caixa, contas, Pix, CRM, metas, locação e rastreamento — não existe nada de investimento
   ainda. Ou construímos essas telas, ou a landing precisa marcar o que é roadmap.
1. **Citação do bloco "princípio de operação"** está marcada com `TODO` no HTML — trocar por
   depoimento real de cliente quando houver.
2. Se um dia quiser lead salvo no banco em vez de WhatsApp, é trocar o `window.open` do `main.js`
   por um POST para edge function do Factory ou webhook n8n.
3. Publicação: nada foi para o ar. Quando quiser, isso vira Cloudflare Pages / GitHub Pages
   (é estático, sobe direto) ou a home do app em `src/routes/index.tsx`.
