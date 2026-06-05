/* ============================================================
   Domus · SGC — Assistente ao vivo (v2)
   • Respostas abertas via IA (window.claude.complete), ancoradas
     nos dados do condomínio.
   • Foto ao vivo (câmera) ou arrastar/anexar documento → lança
     contas a pagar com aprovação.
   • Ações com governança (demissão, admissão, assembleia, aviso).
   • Sempre dá pra continuar: sugestões persistentes + "nova conversa".
   Reaproveita o engine: DATA, aprovarPagar, addEvent, nav, render…
   ============================================================ */
(function(){
  const PG = '<svg class="portal" viewBox="0 0 100 100"><path d="M18 92 L18 46 A32 32 0 0 1 82 46 L82 92" stroke-width="10"></path><path d="M38 92 L38 56 A12 12 0 0 1 62 56 L62 92" stroke-width="10"></path></svg>';
  const $ = id => document.getElementById(id);
  const node = html => { const d=document.createElement('div'); d.innerHTML=html.trim(); return d.firstChild; };
  const scrollDown = () => { const b=$('chat-body'); if(b) b.scrollTop=b.scrollHeight; };
  const esc = s => String(s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
  const formatAI = s => esc(s.trim()).replace(/\*\*(.+?)\*\*/g,'<b>$1</b>').replace(/\n{2,}/g,'<br><br>').replace(/\n/g,'<br>');
  const sync = () => { try{ if(typeof atualizarTopbar==='function') atualizarTopbar(); if(typeof render==='function' && typeof SEC!=='undefined' && (SEC==='pagar'||SEC==='visao'||SEC==='dp')) render(); }catch(e){} };

  function addUser(text){ const m=node('<div class="msg user"><div class="bubble"></div></div>'); m.querySelector('.bubble').textContent=text; $('chat-body').appendChild(m); scrollDown(); }
  function addBot(html){ const m=node('<div class="msg"><span class="av">'+PG+'</span><div class="bubble">'+html+'</div></div>'); $('chat-body').appendChild(m); scrollDown(); return m; }
  function typingNode(){ const t=node('<div class="msg"><span class="av">'+PG+'</span><div class="bubble"><div class="typing"><i></i><i></i><i></i></div></div></div>'); $('chat-body').appendChild(t); scrollDown(); return t; }
  function botAfter(delay, html){ const t=typingNode(); return new Promise(res=>setTimeout(()=>{ t.remove(); res(addBot(html)); }, delay)); }
  function chips(items){ const s=$('chat-suggest'); if(!s) return; s.innerHTML=items.map(it=>'<button class="chat-chip">'+it.label+'</button>').join(''); [...s.children].forEach((b,i)=>b.onclick=items[i].onClick); }
  function clearChips(){ const s=$('chat-suggest'); if(s) s.innerHTML=''; }
  function defaultChips(){ chips([
    {label:'Resumo do mês', onClick:()=>handle('Me dê um resumo da situação do condomínio este mês')},
    {label:'📎 Lançar uma conta', onClick:()=>{ addUser('Lançar uma conta'); clearChips(); intentLancar(); }},
    {label:'Inadimplência', onClick:()=>handle('Como está a inadimplência?')},
    {label:'Contas a aprovar', onClick:()=>handle('Contas a aprovar')},
    {label:'Despesas do mês', onClick:()=>handle('Quanto gastamos este mês?')},
    {label:'Folha', onClick:()=>handle('Qual a folha de pagamento?')},
    {label:'Buscar unidade', onClick:()=>{ addUser('Buscar uma unidade'); clearChips(); intentBuscaPrompt(); }}
  ]); }

  /* ---------- abrir / fechar / reset ---------- */
  window.chatToggle = function(open){
    const c=$('chat'), s=$('chat-scrim'), fab=$('chat-fab');
    const willOpen = (open===undefined) ? !c.classList.contains('open') : open;
    c.classList.toggle('open', willOpen); s.classList.toggle('open', willOpen); fab.classList.toggle('hide', willOpen);
    hideMenu();
    if(willOpen && !c.dataset.init){ c.dataset.init='1'; greet(); }
    if(willOpen) setTimeout(()=>{ try{$('chat-input').focus();}catch(e){} }, 220);
  };
  window.chatReset = function(){ $('chat-body').innerHTML=''; clearChips(); greet(); try{$('chat-input').focus();}catch(e){} };

  function greet(){
    addBot('Olá, Helena 👋 Sou o <b>assistente Domus</b>. Posso te dar o <b>panorama do mês</b>, consultar <b>inadimplência, despesas, folha e contas a aprovar</b>, abrir o <b>resumo de qualquer unidade ou morador</b>, <b>lançar contas</b> a partir de foto/documento e <b>abrir processos</b> (demissão, admissão, assembleia, avisos) — sempre seguindo a governança.');
    defaultChips();
  }

  /* ---------- entrada ---------- */
  window.chatSend = function(e){ e.preventDefault(); const inp=$('chat-input'); const t=inp.value.trim(); if(!t) return false; inp.value=''; hideMenu(); handle(t); return false; };
  function handle(text){ addUser(text); clearChips(); route(text.toLowerCase(), text); }

  function route(low, raw){
    if(/demit|deslig|demiss/.test(low)) return intentDemitir(raw);
    if(/admit|contrat|admiss|nova vaga/.test(low)) return intentAdmitir();
    if(/assembl|convoc/.test(low)) return intentAssembleia();
    if(/aviso|comunic|avisar/.test(low)) return intentAviso();
    if(/r[ée]gua|configurar cobran/.test(low)) return intentRegua();
    if(/(lan[çc]ar|anexar).*(conta|boleto|nota|document|despesa)|(conta|boleto|nota fiscal|despesa).*(lan[çc]|anexar)|^lan[çc]ar|anexar (um|o )?document/.test(low)) return intentLancar();
    if(/relat[óo]rio|emitir pdf|gerar pdf|exportar/.test(low)) return intentRelatorio();
    if(/resumo|situa[çc][aã]o|panorama|como est[aá]( o| tudo| o m[êe]s)?/.test(low)) return intentResumo();
    if(/despesa|gasto|or[çc]ament|term[ôo]metro/.test(low)) return intentDespesas();
    if(/resultado|d\.?r\.?e\.?|super[áa]vit|d[ée]ficit|balan[çc]o|fluxo de caixa|contábil/.test(low)) return intentResultado();
    if(/previs[aã]o|proje[çc][aã]o/.test(low)) return intentPrevisao();
    if(/folha|funcion[áa]ri|equipe|colaborador|sal[áa]rio|departamento pessoal|\bdp\b/.test(low)) return intentFolha();
    if(/fornecedor/.test(low)) return intentFornecedores();
    if(/quantas? unidade|quantos? morador|quantas? pessoa|quantos? funcion/.test(low)) return intentContagens();
    if(/quantas? cota|inadimpl|atras|cobran|a pagar|pendente|aprovar|pagamento/.test(low)) return fin(low, raw);
    if(/saldo|caixa/.test(low)) { return botAfter(650,'O <b>saldo em caixa</b> do '+DATA.condominio.nome+' é <b>'+brl(saldoAtual())+'</b>.').then(defaultChips); }
    return aiAnswer(raw);
  }

  function _navChip(label, sec){ return {label:label, onClick:function(){ try{ if(typeof nav==='function') nav(sec); window.chatToggle(false); }catch(e){} }}; }
  function intentResumo(){
    var i=inadimplencia(), ap=aPagarAberto(), t=termometro();
    var pend=DATA.contasPagar.filter(function(c){return c.status==='pendente';}).length;
    var folha=sum(DATA.funcionarios.filter(function(f){return f.status==='ativo';}),function(x){return x.salario;});
    var prox=DATA.assembleias.find(function(a){return a.status==='convocada';});
    var card='<div class="chat-card"><div class="ttl">'+PG+' Panorama · '+DATA.condominio.nome+'</div>'
      +'<div class="kv"><span class="k">Saldo em caixa</span><span class="v">'+brl(saldoAtual())+'</span></div>'
      +'<div class="kv"><span class="k">Despesas / orçamento</span><span class="v">'+brl(t.g)+' / '+brl(t.o)+' ('+t.p.toFixed(0)+'%)</span></div>'
      +'<div class="kv"><span class="k">Inadimplência</span><span class="v">'+i.pct.toFixed(1).replace('.',',')+'% · '+brl(i.valor)+'</span></div>'
      +'<div class="kv"><span class="k">A pagar (aberto)</span><span class="v">'+brl(ap.valor)+'</span></div>'
      +'<div class="kv"><span class="k">Contas a aprovar</span><span class="v">'+pend+'</span></div>'
      +'<div class="kv"><span class="k">Folha mensal</span><span class="v">'+brl(folha)+'</span></div>'
      +'<div class="kv"><span class="k">Próxima assembleia</span><span class="v">'+(prox?dataBR(prox.data):'—')+'</span></div></div>';
    botAfter(800, 'Aqui está o panorama do mês:'+card).then(function(){ chips([_navChip('Visão Geral','visao'), _navChip('Contas a Pagar','pagar'), {label:'Buscar unidade', onClick:function(){ addUser('Buscar uma unidade'); clearChips(); intentBuscaPrompt(); }}]); });
  }
  function intentDespesas(){ var t=termometro(); botAfter(700,'As <b>despesas do mês</b> somam <b>'+brl(t.g)+'</b> de <b>'+brl(t.o)+'</b> orçados ('+t.p.toFixed(0)+'%). O agente Contábil classifica cada despesa por grupo no Resultado Contábil.').then(function(){ chips([_navChip('Resultado Contábil','resultado'), _navChip('Contas a Pagar','pagar')]); }); }
  function intentResultado(){ botAfter(650,'O <b>Resultado Contábil</b> traz DRE, Balanço, Fluxo de Caixa e Balancete — atualizados automaticamente pelo agente Contábil a cada lançamento.').then(function(){ chips([_navChip('Abrir Resultado Contábil','resultado')]); }); }
  function intentPrevisao(){ botAfter(650,'A <b>Previsão Orçamentária</b> projeta receitas, despesas e saldo pela média histórica — você ajusta reajuste da taxa, inflação e horizonte.').then(function(){ chips([_navChip('Abrir Previsão','previsao')]); }); }
  function intentFolha(){ var ativos=DATA.funcionarios.filter(function(f){return f.status==='ativo';}); var folha=sum(ativos,function(x){return x.salario;}); botAfter(700,'A <b>folha mensal</b> é <b>'+brl(folha)+'</b> com <b>'+ativos.length+'</b> funcionários ativos. O agente de DP processa a folha e roda admissão/demissão no eSocial.').then(function(){ chips([_navChip('Departamento Pessoal','dp')]); }); }
  function intentFornecedores(){ var n=(DATA.fornecedores||[]).length; botAfter(650,'Há <b>'+n+'</b> fornecedores cadastrados; as contas de cada um aparecem em Contas a Pagar.').then(function(){ chips([_navChip('Contas a Pagar','pagar')]); }); }
  function intentContagens(){ botAfter(650,'O <b>'+DATA.condominio.nome+'</b> tem <b>'+DATA.unidades.length+'</b> unidades, <b>'+DATA.moradores.length+'</b> pessoas cadastradas e <b>'+DATA.funcionarios.filter(function(f){return f.status==='ativo';}).length+'</b> funcionários ativos.').then(function(){ chips([_navChip('Abrir Cadastro','cadastro')]); }); }
  function intentRelatorio(){ botAfter(700,'Posso te levar onde emitir <b>relatórios em PDF</b>: o <b>Resultado Contábil</b> e a <b>Previsão</b> têm o botão "Emitir PDF"; em Contas a Pagar você baixa os comprovantes.').then(function(){ chips([_navChip('Resultado Contábil','resultado'), _navChip('Previsão','previsao'), _navChip('Contas a Pagar','pagar')]); }); }
  function intentRegua(){ botAfter(650,'A <b>régua de cobrança</b> define as etapas que o agente de Cobrança executa (lembrete, cobrança no atraso, notificação…). Aqui no SGC você acompanha a inadimplência e as ações em <b>Contas a Receber</b>; a configuração da régua e das mensagens é feita pela Domus na Central de Controle.').then(function(){ chips([_navChip('Abrir Contas a Receber','receber')]); }); }
  function intentBuscaPrompt(){ botAfter(600,'Diga o <b>número da unidade</b> (ex.: 201 ou 201-A) ou o <b>nome do morador</b> que eu mostro o resumo.').then(defaultChips); }
  function _acharUnidade(q){ var m=(q||'').match(/(\d{2,4})\s*-?\s*([abAB])?\b/); if(!m) return null; var num=m[1]; var bloco=(m[2]||'').toUpperCase(); return DATA.unidades.find(function(u){ return String(u.num)===num && (!bloco || u.bloco===bloco); }) || DATA.unidades.find(function(u){ return String(u.num)===num; }); }
  function _acharMorador(q){ q=(q||'').toLowerCase().replace(/.*\b(morador|moradora|pessoa|s[íi]ndic[oa]|do|da|de)\b\s*/,'').trim(); if(q.length<3) return null; return DATA.moradores.find(function(m){ return (m.nome||'').toLowerCase().indexOf(q)>=0; }); }

  /* ---------- IA: perguntas abertas ancoradas nos dados ---------- */
  function contexto(){
    const i=inadimplencia(), ap=aPagarAberto(), t=termometro();
    const pend=DATA.contasPagar.filter(c=>c.status==='pendente').length;
    const folha=sum(DATA.funcionarios.filter(f=>f.status==='ativo'),x=>x.salario);
    const prox=DATA.assembleias.find(a=>a.status==='convocada');
    return [
      'Condomínio: '+DATA.condominio.nome+' — '+DATA.unidades.length+' unidades, '+DATA.moradores.length+' pessoas, '+DATA.funcionarios.filter(f=>f.status==='ativo').length+' funcionários.',
      'Saldo em caixa: '+brl(saldoAtual())+'.',
      'Despesas de junho: '+brl(t.g)+' de '+brl(t.o)+' orçados ('+t.p.toFixed(0)+'%).',
      'Inadimplência: '+i.pct.toFixed(1)+'% — '+i.qtd+' cotas vencidas ('+brl(i.valor)+').',
      'Cota condominial: '+brl(DATA.condominio.cota)+' por unidade/mês.',
      'Contas a pagar em aberto: '+brl(ap.valor)+', '+pend+' aguardando aprovação do gestor.',
      'Folha mensal: '+brl(folha)+'.',
      'Próxima assembleia: '+(prox? prox.titulo+' em '+dataBR(prox.data)+' ('+prox.local+')':'nenhuma convocada')+'.',
      'Agentes Domus operam: Cobrança, Pagamentos, Contábil, DP e Atendimento — a governança humana (síndica) aprova.'
    ].join('\n');
  }
  function prompt(q){
    return 'Você é o assistente operacional da Domus, uma administradora de condomínios AI-native. '+
      'Fala com Helena, a síndica. Responda em português do Brasil, de forma breve (2 a 5 frases), clara e calorosa — '+
      'fale de "lar" e "condomínio", sem juridiquês, sem hype de IA, sem inventar números. '+
      'Se a pergunta pedir um dado que não está nos DADOS abaixo, diga com franqueza que não tem essa informação no momento. '+
      'Use **negrito** apenas em números ou termos-chave.\n\nDADOS ATUAIS DO CONDOMÍNIO:\n'+contexto()+'\n\nPergunta da síndica: '+q;
  }
  async function aiAnswer(q){
    const t=typingNode();
    let ans=null;
    try{ if(window.claude && window.claude.complete) ans = await window.claude.complete(prompt(q)); }catch(e){ ans=null; }
    t.remove();
    if(ans && ans.trim()){ addBot(formatAI(ans)); defaultChips(); return; }
    // sem IA conectada → tenta resolver pela busca de unidade/morador antes de orientar
    var u=_acharUnidade(q); var mor=u?null:_acharMorador(q);
    if(u){ addBot('Encontrei a <b>Unidade '+u.num+'-'+u.bloco+'</b> — abrindo o resumo.'); try{ if(typeof sgcResumoUnidade==='function') sgcResumoUnidade(u.id); }catch(e){} }
    else if(mor){ addBot('Encontrei <b>'+mor.nome+'</b> — abrindo o resumo.'); try{ if(typeof sgcResumoMorador==='function') sgcResumoMorador(mor.id); }catch(e){} }
    else addBot('Ainda não tenho uma IA aberta conectada (isso liga com um backend depois), mas já resolvo bastante. Peça, por exemplo: <b>resumo do mês</b>, <b>inadimplência</b>, <b>despesas</b>, <b>folha</b>, <b>contas a aprovar</b>, <b>lançar conta por foto</b>, <b>convocar assembleia</b> ou <b>publicar aviso</b> — ou busque uma <b>unidade/morador</b> pelo número ou nome.');
    defaultChips();
  }

  /* ---------- captura de documento / foto → lançamento ---------- */
  const SAMPLES=[
    {fornecedor:'Sabesp',                  descricao:'Conta de água — junho/2026',            grupo:'Utilities',                 conta:'Água',                      valor:4380, venc:'2026-06-20'},
    {fornecedor:'Enel SP',                 descricao:'Energia das áreas comuns — junho/2026', grupo:'Utilities',                 conta:'Luz/Força',                 valor:6720, venc:'2026-06-18'},
    {fornecedor:'Eleva Manutenção Predial',descricao:'Reparo emergencial da bomba d\'água',   grupo:'Manutenção e Conservação',  conta:'Bombas/Motores/Exaustores', valor:1850, venc:'2026-06-23'},
    {fornecedor:'Brilho Total Serviços',   descricao:'Limpeza extra pós-obra do hall',        grupo:'Manutenção e Conservação',  conta:'Limpeza',                   valor:1200, venc:'2026-06-26'}
  ];
  let _si=0;
  const maxLct = () => DATA.contasPagar.reduce((mx,c)=>Math.max(mx, parseInt(String(c.numero||'').replace(/\D/g,''))||0),0);

  function onFile(name, isPhoto){ if(!$('chat').classList.contains('open')) window.chatToggle(true); addUser((isPhoto?'📷 ':'📎 ')+name); clearChips(); processDoc(name, isPhoto); }
  window.chatFile = function(input){ const f=input.files&&input.files[0]; if(!f) return; const name=f.name||'foto.jpg'; const isPhoto=input.id==='chat-cam'; input.value=''; hideMenu(); onFile(name, isPhoto); };

  async function processDoc(name, isPhoto){
    await botAfter(750, 'Recebi '+(isPhoto?'a foto':'o documento')+' <b>'+esc(name)+'</b>. Estou '+(isPhoto?'lendo a imagem':'lendo o documento')+', extraindo os campos e validando contra o plano de contas…');
    const ex = SAMPLES[_si++ % SAMPLES.length];
    const m = await botAfter(1500,
      'Validado. Identifiquei uma <b>conta a pagar</b>:'+
      '<div class="chat-card"><div class="ttl">'+PG+' Dados extraídos</div>'+
      '<div class="kv"><span class="k">Fornecedor</span><span class="v">'+ex.fornecedor+'</span></div>'+
      '<div class="kv"><span class="k">Descrição</span><span class="v">'+ex.descricao+'</span></div>'+
      '<div class="kv"><span class="k">Classificação</span><span class="v">'+ex.conta+'</span></div>'+
      '<div class="kv"><span class="k">Vencimento</span><span class="v">'+dataBR(ex.venc)+'</span></div>'+
      '<div class="kv"><span class="k">Valor</span><span class="v">'+brl(ex.valor)+'</span></div>'+
      '<div class="chat-actions"><button class="btn primary sm" id="dc-go">Lançar para aprovação</button><button class="btn sm" id="dc-x">Descartar</button></div></div>');
    m.querySelector('#dc-go').onclick = ()=>{ m.querySelector('.chat-actions').innerHTML='<span class="muted" style="font-size:12px">✓ Lançado</span>'; lancarConta(ex); };
    m.querySelector('#dc-x').onclick = ()=>{ m.querySelector('.chat-actions').innerHTML='<span class="muted" style="font-size:12px">Descartado</span>'; addBot('Sem problema — descartei. Nada foi lançado.'); defaultChips(); };
  }

  async function lancarConta(ex){
    const num = 'LCT-'+String(maxLct()+1).padStart(4,'0');
    const conta = {id:nextId(DATA.contasPagar), numero:num, fornecedor:ex.fornecedor, descricao:ex.descricao, grupo:ex.grupo, conta:ex.conta, categoria:ex.conta, valor:ex.valor, total:ex.valor, vencimento:ex.venc, competencia:ex.venc.slice(0,7), status:'pendente', pago_em:null, encargos:0, origem:'Chat'};
    DATA.contasPagar.push(conta);
    if(typeof addEvent==='function') addEvent('Pagamentos','Conta lançada', conta.descricao+' ('+conta.fornecedor+') — '+brl(conta.valor)+', aguardando aprovação');
    sync();
    const m = await botAfter(800, 'Pronto! Lancei a conta <b>'+num+'</b> na sua <b>fila de aprovação</b>. Por governança, o pagamento só ocorre após o seu aval.'+
      '<div class="chat-actions"><button class="btn primary sm" id="lc-ap">Aprovar agora</button><button class="btn sm" id="lc-ver">Ver na fila</button></div>');
    m.querySelector('#lc-ap').onclick = ()=>{ if(typeof aprovarPagar==='function') aprovarPagar(conta.id); sync(); m.querySelector('.chat-actions').innerHTML='<span class="muted" style="font-size:12px">✓ Aprovada — na fila do agente Pagamentos</span>'; addBot('✓ <b>'+num+'</b> aprovada. O agente Pagamentos liquida na rotina do dia e o Contábil lança no fluxo.'); defaultChips(); };
    m.querySelector('#lc-ver').onclick = ()=>{ nav('pagar'); window.chatToggle(false); };
    defaultChips();
  }

  /* ---------- demissão (governança) ---------- */
  function intentDemitir(raw){
    const m = raw.match(/(?:demitir|desligar|demiss[aã]o)\s+(?:o |a |do |da )?([A-Za-zÀ-ÿ]{2,})/i);
    const termo = m ? m[1] : null;
    let f = termo ? DATA.funcionarios.find(x=>x.status==='ativo' && x.nome.toLowerCase().includes(termo.toLowerCase())) : null;
    if(f) return confirmDemitir(f);
    botAfter(700, (termo? 'Não encontrei <b>'+esc(termo)+'</b> no quadro ativo. ' : '')+'Quem você quer desligar?').then(()=>{
      const ativos = DATA.funcionarios.filter(x=>x.status==='ativo');
      chips(ativos.slice(0,6).map(x=>({label:x.nome.split(' ')[0]+' · '+x.cargo.split(' ')[0], onClick:()=>{ clearChips(); addUser('Desligar '+x.nome); confirmDemitir(x); }})));
    });
  }
  async function confirmDemitir(f){
    const m = await botAfter(850, 'Para desligar <b>'+f.nome+'</b> ('+f.cargo+'), a governança dispara estas etapas:'+
      '<div class="chat-card"><div class="ttl">'+PG+' Processo de demissão</div>'+
      '<div class="kv"><span class="k">1 · Rescisão no eSocial</span><span class="v">agente DP</span></div>'+
      '<div class="kv"><span class="k">2 · Cálculo de verbas rescisórias</span><span class="v">agente Contábil</span></div>'+
      '<div class="kv"><span class="k">3 · Baixa na folha de pagamento</span><span class="v">agente DP</span></div>'+
      '<div class="kv"><span class="k">4 · Provisão no fluxo de caixa</span><span class="v">agente Contábil</span></div>'+
      '<div class="chat-actions"><button class="btn primary sm" id="cf-go">Confirmar e iniciar</button><button class="btn sm" id="cf-no">Cancelar</button></div></div>');
    m.querySelector('#cf-go').onclick = ()=>{ m.querySelector('.chat-actions').innerHTML='<span class="muted" style="font-size:12px">✓ Processo iniciado</span>'; doDemitir(f); };
    m.querySelector('#cf-no').onclick = ()=>{ m.querySelector('.chat-actions').innerHTML='<span class="muted" style="font-size:12px">Cancelado</span>'; addBot('Ok, cancelei. Nada foi alterado no quadro.'); defaultChips(); };
  }
  async function doDemitir(f){
    f.status='em_demissao';
    if(typeof addEvent==='function'){ addEvent('DP','Demissão iniciada', f.nome+' ('+f.cargo+') — rescisão rodando no eSocial (via assistente)'); addEvent('Contabil','Verbas provisionadas', 'Rescisão de '+f.nome+' — cálculo e provisão no fluxo de caixa'); }
    sync();
    const m = await botAfter(950, 'Iniciei a demissão de <b>'+f.nome+'</b>. O agente de DP roda a rescisão no eSocial e o Contábil provisionou as verbas. Acompanhe em Departamento Pessoal.'+
      '<div class="chat-actions"><button class="btn sm" id="cf-dp">Ver em Departamento Pessoal</button></div>');
    m.querySelector('#cf-dp').onclick = ()=>{ nav('dp'); window.chatToggle(false); };
    defaultChips();
  }

  /* ---------- outras ações ---------- */
  async function intentAdmitir(){ const m=await botAfter(700,'Posso abrir uma <b>admissão</b> no eSocial. Vou te levar ao formulário no Departamento Pessoal — informe nome, cargo e salário, e o agente de DP cuida do registro.'+'<div class="chat-actions"><button class="btn primary sm" id="ia">Abrir admissão</button></div>'); m.querySelector('#ia').onclick=()=>{ nav('dp'); window.chatToggle(false); }; defaultChips(); }
  async function intentAssembleia(){ const m=await botAfter(700,'Vou abrir a <b>convocação de assembleia</b> — você define título, pauta e data, e o agente envia o aviso prévio legal a todos os condôminos.'+'<div class="chat-actions"><button class="btn primary sm" id="iv">Convocar assembleia</button></div>'); m.querySelector('#iv').onclick=()=>{ window.chatToggle(false); try{ if(SEC!=='assembleias') nav('assembleias'); }catch(e){} if(typeof abrirConvocar==='function') abrirConvocar(); }; defaultChips(); }
  async function intentAviso(){ const m=await botAfter(700,'Vamos publicar um <b>comunicado</b>. Abra o formulário, escolha o público e o agente de Atendimento entrega via WhatsApp e app.'+'<div class="chat-actions"><button class="btn primary sm" id="iaviso">Novo aviso</button></div>'); m.querySelector('#iaviso').onclick=()=>{ window.chatToggle(false); try{ if(SEC!=='avisos') nav('avisos'); }catch(e){} if(typeof abrirAviso==='function') abrirAviso(); }; defaultChips(); }
  async function intentLancar(){ const m=await botAfter(700,'Claro! Para lançar uma conta, <b>tire uma foto</b> ou <b>anexe/arraste</b> o boleto ou a nota. Eu leio, valido e coloco na sua fila de aprovação.'+'<div class="chat-actions"><button class="btn primary sm" id="il-cam">📷 Tirar foto</button><button class="btn sm" id="il-file">📎 Anexar</button></div>'); m.querySelector('#il-cam').onclick=()=>chatPick('cam'); m.querySelector('#il-file').onclick=()=>chatPick('file'); }

  async function fin(low, raw){
    if(/inadimpl|atras|cobran/.test(low)){ const i=inadimplencia(); const m=await botAfter(750,'A inadimplência está em <b>'+i.pct.toFixed(1).replace('.',',')+'%</b> — '+i.qtd+' cotas vencidas, somando '+brl(i.valor)+'. O agente de Cobrança já acionou a régua.'+'<div class="chat-actions"><button class="btn sm" id="fr">Ver Contas a Receber</button></div>'); m.querySelector('#fr').onclick=()=>{ nav('receber'); window.chatToggle(false); }; defaultChips(); return; }
    if(/a pagar|pendente|aprovar|pagamento/.test(low)){ return listaPendentes(); }
    if(/quantas? cota|cota/.test(low)){ const i=inadimplencia(); await botAfter(700,'Cota condominial: <b>'+brl(DATA.condominio.cota)+'</b>/unidade. Em atraso: '+i.qtd+' cotas ('+brl(i.valor)+').'); defaultChips(); return; }
    return aiAnswer(raw);
  }
  async function listaPendentes(){
    const pend = DATA.contasPagar.filter(c=>c.status==='pendente');
    if(!pend.length){ await botAfter(650,'Não há contas aguardando aprovação. Você está em dia! 🎉'); defaultChips(); return; }
    let html='Você tem <b>'+pend.length+' conta(s)</b> aguardando aprovação:';
    pend.forEach(c=>{ html+='<div class="chat-card"><div class="kv"><span class="k">'+esc(c.descricao)+'</span></div><div class="kv"><span class="k">'+esc(c.fornecedor)+'</span><span class="v">'+brl(c.total)+'</span></div><div class="chat-actions"><button class="btn primary sm" data-ap="'+c.id+'">Aprovar</button></div></div>'; });
    const m = await botAfter(900, html);
    m.querySelectorAll('[data-ap]').forEach(b=>b.onclick=()=>{ if(typeof aprovarPagar==='function') aprovarPagar(+b.dataset.ap); sync(); b.textContent='Aprovada ✓'; b.disabled=true; });
    defaultChips();
  }

  /* ---------- anexo: menu + câmera + arrastar ---------- */
  window.chatAttachMenu = function(){ const m=$('chat-menu'); m.hidden = !m.hidden; };
  function hideMenu(){ const m=$('chat-menu'); if(m) m.hidden=true; }
  window.chatPick = function(which){ hideMenu(); $(which==='cam'?'chat-cam':'chat-file').click(); };
  window.chatAttach = function(){ chatPick('file'); };

  document.addEventListener('click', e=>{ const w=document.querySelector('.chat-attach-wrap'); if(w && !w.contains(e.target)) hideMenu(); });

  (function dragdrop(){
    const c=$('chat'); if(!c) return;
    let depth=0;
    c.addEventListener('dragenter', e=>{ e.preventDefault(); depth++; c.classList.add('drag'); });
    c.addEventListener('dragover', e=>{ e.preventDefault(); });
    c.addEventListener('dragleave', e=>{ depth=Math.max(0,depth-1); if(depth===0) c.classList.remove('drag'); });
    c.addEventListener('drop', e=>{ e.preventDefault(); depth=0; c.classList.remove('drag'); const f=e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]; if(f){ const isImg=/^image\//.test(f.type); onFile(f.name||(isImg?'foto.jpg':'documento'), isImg); } });
  })();
})();
