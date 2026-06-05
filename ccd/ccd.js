/* =========================================================================
   CENTRAL DE CONTROLE DOMUS (CCD)
   Plano de controle da administradora: governa o SGC e o App de cada
   condomínio, configura os agentes e personaliza a implementação por
   condomínio. Os agentes operam pela CCD, alimentados por SGC/App.
   v1: Portfólio de condomínios + Ficha (config SGC + App + Agentes).
   ========================================================================= */

/* ---------- helpers ---------- */
function brl(n){ return 'R$ ' + (n||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2}); }
function brlk(n){ return 'R$ ' + Math.round(n/1000) + 'k'; }
function pctf(n){ return (n||0).toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1}) + '%'; }
function _esc(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function _nl(s){ return _esc(s).replace(/\n/g,'<br>'); }

/* ---------- catálogos ---------- */
var SGC_FEATURES = [
  ['receber','Contas a Receber','Cotas, inadimplência e recebimentos'],
  ['pagar','Contas a Pagar','Lançamentos, aprovações e comprovantes'],
  ['resultado','Resultado Contábil','DRE, Balanço, Fluxo e Balancete'],
  ['previsao','Previsão Orçamentária','Projeção do resultado'],
  ['dp','Departamento Pessoal','Folha, ponto, admissões/demissões'],
  ['assembleias','Atas & Assembleias','Convocação e repositório de atas'],
  ['avisos','Avisos','Comunicados a moradores e funcionários'],
  ['cadastro','Cadastro','Pessoas, unidades, veículos e animais'],
  ['portaria','Portaria & Reservas','Acesso, encomendas e reservas']
];
var APP_FEATURES = [
  ['inicio','Início','Resumo do condomínio para o morador'],
  ['financeiro','Financeiro / 2ª via','Boletos, PIX e demonstrativos'],
  ['reservas','Reserva de áreas','Salão, churrasqueira, quadra…'],
  ['visitantes','Visitantes & encomendas','Pré-autorização e avisos'],
  ['anuncios','Mural de anúncios','Classificados entre moradores'],
  ['avisos','Avisos & comunicados','Recebimento de comunicados'],
  ['assembleia','Assembleia & votação','Pauta, presença e voto digital'],
  ['ocorrencias','Ocorrências','Abertura de chamados'],
  ['documentos','Documentos','Convenção, atas, regimentos']
];
var AGENTES = [
  ['cobranca','Cobrança','Executa a régua de cobrança e personaliza as mensagens por morador.'],
  ['pagamentos','Pagamentos','Identifica contas, encaminha para aprovação e paga fornecedores.'],
  ['contabil','Contábil','Mantém DRE, Balanço, Fluxo e Balancete a cada lançamento.'],
  ['dp','Departamento Pessoal','Processa folha, ponto e roda admissões/demissões no eSocial.'],
  ['atendimento','Atendimento','Responde moradores e síndico, tira dúvidas e abre chamados.']
];
var AGENTE_IC = {
  cobranca:'<circle cx="12" cy="12" r="9"/><path d="M12 8v4l3 2"/>',
  pagamentos:'<path d="M12 5v14"/><path d="M19 12l-7-7-7 7"/>',
  contabil:'<path d="M4 4h16v16H4z"/><path d="M8 16v-4M12 16v-7M16 16v-2"/>',
  dp:'<circle cx="9" cy="8" r="3.2"/><path d="M3.5 20a5.5 5.5 0 0 1 11 0"/><path d="M16 5.2a3 3 0 0 1 0 5.6"/>',
  atendimento:'<path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/>'
};
var AUTON = [['auto','Automático'],['aprovacao','Requer aprovação'],['off','Desligado']];

/* ---------- régua de cobrança padrão (mora na CCD) ---------- */
var COB_VARS = ['nome','primeiro_nome','unidade','bloco','condominio','competencia','vencimento','dias_atraso','valor','multa','juros','valor_atualizado','pix','linha_digitavel','sindico'];
var COB_REGUA = [
  {ordem:1,rotulo:'Lembrete amigável',off:-3,canais:['whatsapp','email'],tom:'Cordial',publico:'Cotas a vencer (3 dias)',ativo:true,
   assunto:'Lembrete: a cota de {{competencia}} vence em {{vencimento}}',
   wpp:'Olá, {{primeiro_nome}}! 🏛️\nPassando para lembrar que a cota condominial da unidade {{unidade}} ({{competencia}}) vence em *{{vencimento}}*, no valor de *{{valor}}*.\nVocê já pode pagar pelo PIX: {{pix}}\nObrigado por manter seu lar em dia! 💙\n— {{condominio}}',
   email:'Olá, {{nome}},\n\nPassando para lembrar, com carinho, que a cota condominial da sua unidade {{unidade}} referente a {{competencia}} vence em {{vencimento}}, no valor de {{valor}}.\n\nVocê pode pagar de forma rápida:\n• PIX (chave): {{pix}}\n• Linha digitável: {{linha_digitavel}}\n\nSe o pagamento já foi feito, por favor desconsidere este lembrete.\n\nUm abraço,\n{{sindico}} — {{condominio}}'},
  {ordem:2,rotulo:'Aviso no vencimento',off:0,canais:['whatsapp','email'],tom:'Cordial',publico:'Cotas que vencem hoje',ativo:true,
   assunto:'Sua cota de {{competencia}} vence hoje',
   wpp:'Oi, {{primeiro_nome}}! 📅\nHoje é o dia do vencimento da cota de {{competencia}} (unidade {{unidade}}) — *{{valor}}*.\nPague pelo PIX {{pix}} e fique em dia, sem encargos.\n— {{condominio}}',
   email:'Olá, {{nome}},\n\nHoje, {{vencimento}}, vence a cota condominial da unidade {{unidade}} referente a {{competencia}}, no valor de {{valor}}.\n\nPara evitar multa e juros, pague ainda hoje:\n• PIX (chave): {{pix}}\n• Linha digitável: {{linha_digitavel}}\n\nObrigado!\n{{sindico}} — {{condominio}}'},
  {ordem:3,rotulo:'1º aviso de atraso',off:1,canais:['whatsapp'],tom:'Cordial e firme',publico:'Inadimplentes (1 dia)',ativo:true,
   assunto:'Cota de {{competencia}} em aberto — unidade {{unidade}}',
   wpp:'Oi, {{primeiro_nome}}.\nNotamos que a cota de {{competencia}} (unidade {{unidade}}), vencida em {{vencimento}}, está em aberto.\nRegularize hoje pelo PIX {{pix}} para evitar multa e juros. 🙏\nSe precisar de ajuda ou de um acordo, é só responder por aqui.\n— {{condominio}}',
   email:'Olá, {{nome}},\n\nIdentificamos que a cota de {{competencia}} (unidade {{unidade}}), vencida em {{vencimento}}, ainda consta em aberto.\n\nRegularize hoje para evitar a incidência de multa e juros. PIX: {{pix}}.\n\n{{sindico}} — {{condominio}}'},
  {ordem:4,rotulo:'2ª via + encargos',off:7,canais:['email','whatsapp'],tom:'Formal e cordial',publico:'Inadimplentes (7 dias)',ativo:true,
   assunto:'2ª via — cota de {{competencia}} em aberto (unidade {{unidade}})',
   email:'Prezado(a) {{nome}},\n\nA cota condominial da unidade {{unidade}} referente a {{competencia}} permanece em aberto há {{dias_atraso}} dias.\n\nDemonstrativo do débito atualizado:\n• Valor original: {{valor}}\n• Multa (2%): {{multa}}\n• Juros (1% a.m., pro rata): {{juros}}\n• Total atualizado: {{valor_atualizado}}\n\nSegue a 2ª via para pagamento:\n• PIX (chave): {{pix}}\n• Linha digitável: {{linha_digitavel}}\n\nCaso deseje parcelar, podemos avaliar um acordo. Conte conosco.\n\nAtenciosamente,\n{{sindico}} — {{condominio}}',
   wpp:'Olá, {{primeiro_nome}}. A cota de {{competencia}} (unidade {{unidade}}) está em aberto há {{dias_atraso}} dias.\nTotal atualizado: *{{valor_atualizado}}* (valor {{valor}} + multa {{multa}} + juros {{juros}}).\nEnviamos a 2ª via para o seu e-mail. PIX: {{pix}}.\n— {{condominio}}'},
  {ordem:5,rotulo:'Cobrança formal',off:15,canais:['email','whatsapp'],tom:'Firme',publico:'Inadimplentes (15 dias)',ativo:true,
   assunto:'Cobrança — débito condominial em aberto (unidade {{unidade}})',
   email:'Prezado(a) {{nome}},\n\nConsta o débito da cota condominial da unidade {{unidade}}, competência {{competencia}}, vencida em {{vencimento}} e em aberto há {{dias_atraso}} dias.\n\nValor atualizado: {{valor_atualizado}} (valor {{valor}} + multa {{multa}} + juros {{juros}}).\n\nSolicitamos a regularização em 5 (cinco) dias. A manutenção do débito poderá ensejar as medidas previstas na convenção e na legislação, com a continuidade dos encargos.\n\nPara quitar ou negociar: PIX {{pix}}.\n\nAtenciosamente,\n{{sindico}} — {{condominio}}',
   wpp:'Prezado(a) {{primeiro_nome}}, o débito da cota {{competencia}} (unidade {{unidade}}) está vencido há {{dias_atraso}} dias — total atualizado *{{valor_atualizado}}*.\nPedimos a regularização em até 5 dias para evitar medidas previstas na convenção. Podemos negociar. PIX {{pix}}.\n— {{condominio}}'},
  {ordem:6,rotulo:'Notificação extrajudicial',off:30,canais:['email'],tom:'Formal',publico:'Inadimplentes (30 dias)',ativo:true,
   assunto:'Notificação extrajudicial — débito condominial (unidade {{unidade}})',
   email:'Prezado(a) {{nome}},\n\nNa qualidade de administração do {{condominio}}, NOTIFICAMOS V.Sa. de que o débito da cota condominial da unidade {{unidade}}, competência {{competencia}}, vencida em {{vencimento}}, está em aberto há {{dias_atraso}} dias, totalizando {{valor_atualizado}}.\n\nFica V.Sa. NOTIFICADO(A) a quitar o débito em 10 (dez) dias do recebimento. Persistindo a inadimplência, serão adotadas as medidas cabíveis, incluindo protesto e ação de cobrança, nos termos do art. 1.336, §1º, do Código Civil e da convenção, acrescidas custas e honorários.\n\nPara regularização: PIX {{pix}} ou linha digitável {{linha_digitavel}}.\n\n{{sindico}}\nSíndico(a) — {{condominio}}',
   wpp:'Prezado(a) {{primeiro_nome}}, notificação sobre o débito da cota {{competencia}} (unidade {{unidade}}), em aberto há {{dias_atraso}} dias — total {{valor_atualizado}}. Enviamos a notificação completa por e-mail/carta. Para regularizar: PIX {{pix}}.\n— {{condominio}}'}
];

/* ---------- seed de condomínios ---------- */
function mkCondo(o){
  var sgc={}; SGC_FEATURES.forEach(function(f){ sgc[f[0]]=true; });
  var app={}; APP_FEATURES.forEach(function(f){ app[f[0]]=true; });
  var agentes={}; AGENTES.forEach(function(a){ agentes[a[0]]={ativo:true, autonomia:'aprovacao', canais:['whatsapp','email']}; });
  var base={sgc:sgc, app:app, agentes:agentes,
    params:{taxa:580, diaVenc:10, multa:2, juros:1, conta:'Banco do Brasil · Ag 1234-5 · CC 67890-1'},
    governanca:{limitePag:2000, aprovador:'Síndico', reajusteTeto:10}};
  return Object.assign(base, o);
}
function makeCCD(){
  var c=[];
  c.push(mkCondo({id:'felipe2', nome:'Condomínio Felipe II', cidade:'São Paulo', uf:'SP', unidades:100, plano:'Full', status:'ativo', onboarding:100, sindico:'Helena Martins', desde:'2024', sgcUrl:'Domus SGC.html',
    kpi:{inad:8.0, saldo:182500, aPagar:53040, pend:2}}));
  c.push(mkCondo({id:'aurora', nome:'Residencial Aurora', cidade:'Campinas', uf:'SP', unidades:64, plano:'Pro', status:'ativo', onboarding:100, sindico:'Marcos Tavares', desde:'2025',
    params:{taxa:640, diaVenc:5, multa:2, juros:1, conta:'Itaú · Ag 0567 · CC 12345-6'},
    kpi:{inad:11.4, saldo:96200, aPagar:38700, pend:3}}));
  c.push(mkCondo({id:'mirante', nome:'Edifício Mirante', cidade:'São Paulo', uf:'SP', unidades:48, plano:'Essencial', status:'ativo', onboarding:100, sindico:'Cláudia Rezende', desde:'2025',
    params:{taxa:520, diaVenc:10, multa:2, juros:1, conta:'Bradesco · Ag 2233 · CC 4455-0'},
    kpi:{inad:6.2, saldo:54100, aPagar:21300, pend:1}}));
  c.push(mkCondo({id:'acacias', nome:'Parque das Acácias', cidade:'Santo André', uf:'SP', unidades:120, plano:'Full', status:'ativo', onboarding:100, sindico:'Roberto Lemos', desde:'2024',
    params:{taxa:710, diaVenc:8, multa:2, juros:1, conta:'Santander · Ag 0099 · CC 88776-2'},
    kpi:{inad:9.8, saldo:241000, aPagar:71500, pend:4}}));
  c.push(mkCondo({id:'toscana', nome:'Vila Toscana', cidade:'Sorocaba', uf:'SP', unidades:80, plano:'Pro', status:'onboarding', onboarding:60, sindico:'Patrícia Goulart', desde:'2026',
    params:{taxa:600, diaVenc:10, multa:2, juros:1, conta:'(a definir)'},
    kpi:{inad:0, saldo:0, aPagar:0, pend:0}}));
  c.push(mkCondo({id:'ipes', nome:'Solar dos Ipês', cidade:'Jundiaí', uf:'SP', unidades:36, plano:'Essencial', status:'pausado', onboarding:100, sindico:'Eduardo Pires', desde:'2025',
    params:{taxa:480, diaVenc:15, multa:2, juros:1, conta:'Caixa · Ag 0312 · CC 1209-7'},
    kpi:{inad:18.5, saldo:12800, aPagar:9400, pend:0}}));
  // ajustes de configuração (personalização por condomínio)
  byId(c,'aurora').app.assembleia=false;
  byId(c,'mirante').sgc.dp=false; byId(c,'mirante').sgc.portaria=false; byId(c,'mirante').app.reservas=false; byId(c,'mirante').agentes.dp.ativo=false;
  byId(c,'acacias').agentes.cobranca.autonomia='auto'; byId(c,'acacias').agentes.pagamentos.autonomia='auto';
  byId(c,'toscana').agentes.cobranca.ativo=false; byId(c,'toscana').agentes.pagamentos.ativo=false; byId(c,'toscana').agentes.contabil.autonomia='aprovacao'; byId(c,'toscana').sgc.previsao=false;
  byId(c,'ipes').agentes.cobranca.ativo=false; byId(c,'ipes').agentes.pagamentos.ativo=false; byId(c,'ipes').agentes.contabil.ativo=false; byId(c,'ipes').agentes.dp.ativo=false; byId(c,'ipes').agentes.atendimento.ativo=false;
  return c;
}
function byId(arr,id){ return arr.find(function(x){return x.id===id;}); }

/* feed global dos agentes (operação Domus) */
function makeFeed(){
  return [
    {ag:'Cobrança', condo:'Parque das Acácias', acao:'Régua acionada', det:'1º aviso de atraso enviado a 9 unidades (competência maio)', tm:'08:42'},
    {ag:'Pagamentos', condo:'Condomínio Felipe II', acao:'Conta identificada', det:'Manutenção de elevadores — R$ 2.500,00 aguardando aprovação', tm:'08:40'},
    {ag:'Contábil', condo:'Residencial Aurora', acao:'Demonstrações', det:'DRE e Fluxo recalculados após 3 lançamentos', tm:'08:37'},
    {ag:'Cobrança', condo:'Edifício Mirante', acao:'Lembrete', det:'Lembrete -3d via WhatsApp para 48 unidades (junho)', tm:'08:31'},
    {ag:'DP', condo:'Condomínio Felipe II', acao:'Folha processada', det:'Folha de maio enviada ao eSocial (9 funcionários)', tm:'08:25'},
    {ag:'Atendimento', condo:'Residencial Aurora', acao:'Chamado aberto', det:'Morador relatou vazamento na garagem — encaminhado ao zelador', tm:'08:18'},
    {ag:'Governança', condo:'Vila Toscana', acao:'Onboarding', det:'Importação de unidades concluída (80/80) — falta conta bancária', tm:'08:05'}
  ];
}

/* ---------- estado ---------- */
var CCD, FEED, SEC='visao', CUR=null, TAB='resumo';
function condo(id){ return byId(CCD, id); }

/* ---------- navegação ---------- */
function nav(sec){ SEC=sec; CUR=null; setActive(sec); render(); fecharSidebar(); }
function setActive(sec){ document.querySelectorAll('#nav a').forEach(function(a){ a.classList.toggle('active', a.dataset.sec===sec); }); }
function abrirCondo(id){ CUR=id; SEC='condo'; TAB='resumo'; setActive('condos'); render(); window.scrollTo(0,0); }
function condoTab(t){ TAB=t; render(); }
function ccdToggleSidebar(){ document.querySelector('.sidebar').classList.toggle('open'); document.getElementById('sb-scrim').classList.toggle('show'); }
function fecharSidebar(){ document.querySelector('.sidebar').classList.remove('open'); document.getElementById('sb-scrim').classList.remove('show'); }

var TITLES={
  visao:['Visão Geral','Operação Domus — todos os condomínios sob gestão'],
  condos:['Condomínios','Carteira de condomínios e configuração individual'],
  agentes:['Agentes','Catálogo dos agentes Domus e seus padrões de operação'],
  gov:['Governança','Regras de aprovação, autonomia e permissões'],
  registros:['Registros','Auditoria de ações dos agentes e mudanças de configuração'],
  condo:['Ficha do condomínio','Configuração do SGC, do App e dos agentes deste condomínio']
};

/* ---------- render principal ---------- */
function render(){
  var t=TITLES[SEC]||TITLES.visao;
  document.getElementById('pg-title').textContent=t[0];
  document.getElementById('pg-sub').textContent=t[1];
  var c=document.getElementById('content');
  c.innerHTML=({visao:renderVisao,condos:renderCondos,condo:renderCondo,agentes:renderAgentes,gov:renderGov,registros:renderRegistros}[SEC]||renderVisao)();
  atualizarContadores();
}
function atualizarContadores(){
  var ativos=CCD.filter(function(x){return x.status==='ativo';});
  var pend=CCD.reduce(function(s,x){return s+(x.kpi.pend||0);},0);
  var ag=0; CCD.forEach(function(x){ AGENTES.forEach(function(a){ if(x.agentes[a[0]].ativo && x.status==='ativo') ag++; }); });
  document.getElementById('ccd-ncondos').textContent=CCD.length;
  document.getElementById('ccd-stat-pend').textContent=pend;
  document.getElementById('ccd-stat-ag').textContent=ag;
}

/* ---------- VISÃO GERAL (portfólio) ---------- */
function renderVisao(){
  var ativos=CCD.filter(function(x){return x.status==='ativo';});
  var unid=CCD.reduce(function(s,x){return s+x.unidades;},0);
  var arrec=CCD.reduce(function(s,x){return s + (x.status==='ativo'? x.unidades*x.params.taxa : 0);},0);
  var inadW = ativos.reduce(function(s,x){return s + x.kpi.inad*x.unidades;},0) / Math.max(1, ativos.reduce(function(s,x){return s+x.unidades;},0));
  var pend=CCD.reduce(function(s,x){return s+(x.kpi.pend||0);},0);
  var agAtivos=0; CCD.forEach(function(x){ AGENTES.forEach(function(a){ if(x.agentes[a[0]].ativo && x.status==='ativo') agAtivos++; }); });

  var kpis='<div class="grid">'
    +kpi('Condomínios', CCD.length, ativos.length+' ativos · '+(CCD.length-ativos.length)+' em onboarding/pausa','')
    +kpi('Unidades sob gestão', unid.toLocaleString('pt-BR'), 'Lares atendidos pela Domus','pinho')
    +kpi('Arrecadação mensal', brlk(arrec), 'Soma das cotas dos condomínios ativos','')
    +kpi('Inadimplência média', pctf(inadW), 'Ponderada por nº de unidades','terracota')
    +'</div>';

  var rows=CCD.map(function(x){
    return '<tr onclick="abrirCondo(\''+x.id+'\')" style="cursor:pointer">'
      +'<td><strong>'+_esc(x.nome)+'</strong><div class="muted" style="font-size:11.5px">'+_esc(x.cidade)+'/'+x.uf+' · síndico '+_esc(x.sindico)+'</div></td>'
      +'<td class="num">'+x.unidades+'</td>'
      +'<td><span class="ccd-plano">'+x.plano+'</span></td>'
      +'<td>'+pill(x.status)+'</td>'
      +'<td class="num">'+(x.status==='ativo'?pctf(x.kpi.inad):'—')+'</td>'
      +'<td class="num"><button class="btn sm" onclick="event.stopPropagation();abrirCondo(\''+x.id+'\')">Abrir ficha</button></td></tr>';
  }).join('');
  var tabela='<div class="card span-7"><h3>Carteira de condomínios</h3><div class="tblx"><table class="tbl" style="min-width:640px"><thead><tr><th>Condomínio</th><th class="num">Unid.</th><th>Plano</th><th>Status</th><th class="num">Inadimpl.</th><th></th></tr></thead><tbody>'+rows+'</tbody></table></div></div>';

  var feed='<div class="card span-5"><h3>Operação dos agentes · ao vivo</h3><div class="ccd-feed">'
    + FEED.slice(0,7).map(function(f){return '<div class="it"><div class="ag">'+_esc(f.ag)+'</div><div class="tx">'+_esc(f.acao)+' <span class="muted">· '+_esc(f.condo)+'</span><div class="det">'+_esc(f.det)+'</div></div><div class="tm">'+f.tm+'</div></div>';}).join('')
    +'</div></div>';

  var note='<div class="ai-note"><svg class="ic" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2E5A4F" stroke-width="2"><path d="M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7z"/><path d="M9 12l2 2 4-4"/></svg><div>A <strong>CCD</strong> é o centro de comando da Domus: aqui a administradora governa o <strong>SGC</strong> e o <strong>App</strong> de cada condomínio, configura os <strong>agentes</strong> e personaliza a operação. Os agentes rodam pela CCD, alimentados pelos dados do SGC e do App.</div></div>';

  return note+kpis+'<div class="grid">'+tabela+feed+'</div>';
}

/* ---------- CONDOMÍNIOS (cards) ---------- */
function renderCondos(){
  var cards=CCD.map(function(x){
    var modSgc=SGC_FEATURES.filter(function(f){return x.sgc[f[0]];}).length;
    var modApp=APP_FEATURES.filter(function(f){return x.app[f[0]];}).length;
    var agOn=AGENTES.filter(function(a){return x.agentes[a[0]].ativo;}).length;
    return '<div class="card span-4 ccd-condo" onclick="abrirCondo(\''+x.id+'\')">'
      +'<div class="top"><div><h4>'+_esc(x.nome)+'</h4><div class="loc">'+_esc(x.cidade)+'/'+x.uf+' · '+x.unidades+' unidades</div></div>'+pill(x.status)+'</div>'
      +'<div class="mini"><div><div class="k">Inadimpl.</div><div class="v'+(x.kpi.inad>=12?' alerta':'')+'">'+(x.status==='ativo'?pctf(x.kpi.inad):'—')+'</div></div>'
      +'<div><div class="k">Saldo</div><div class="v">'+(x.status==='ativo'?brlk(x.kpi.saldo):'—')+'</div></div>'
      +'<div><div class="k">Ações</div><div class="v'+(x.kpi.pend?' alerta':'')+'">'+(x.kpi.pend||0)+'</div></div></div>'
      +'<div class="foot-row"><span class="ccd-plano">'+x.plano+'</span><span class="muted" style="font-size:12px">SGC '+modSgc+'/'+SGC_FEATURES.length+' · App '+modApp+'/'+APP_FEATURES.length+' · '+agOn+' agentes</span></div>'
      +'</div>';
  }).join('');
  return '<div class="grid">'+cards+'</div>';
}

/* ---------- FICHA DO CONDOMÍNIO ---------- */
function renderCondo(){
  var x=condo(CUR); if(!x) return renderCondos();
  var head='<div class="ccd-fh"><div><button class="back" onclick="nav(\'condos\')">&larr; Condomínios</button>'
    +'<h2>'+_esc(x.nome)+'</h2><div class="sub">'+pill(x.status)+' <span class="ccd-plano">'+x.plano+'</span> · '+_esc(x.cidade)+'/'+x.uf+' · '+x.unidades+' unidades · síndico '+_esc(x.sindico)+'</div></div>'
    +'<div style="display:flex;gap:8px">'+(x.sgcUrl?'<button class="btn" onclick="abrirSGC(\''+x.id+'\')">Abrir SGC ↗</button>':'<button class="btn" onclick="toast(\'SGC em provisionamento para este condomínio.\')">Abrir SGC ↗</button>')+'</div></div>';
  var tabs='<div class="ccd-tabs">'
    +tab('resumo','Resumo')+tab('sgc','Configuração SGC')+tab('app','Configuração App')+tab('agentes','Agentes')
    +'</div>';
  var body=({resumo:condoResumo, sgc:condoSGC, app:condoApp, agentes:condoAgentes}[TAB]||condoResumo)(x);
  return head+tabs+body;
}
function tab(id,label){ return '<button class="tab'+(TAB===id?' active':'')+'" onclick="condoTab(\''+id+'\')">'+label+'</button>'; }

function condoResumo(x){
  var arrec=x.unidades*x.params.taxa;
  var kpis='<div class="grid">'
    +kpi('Arrecadação mensal', brl(arrec), x.unidades+' × '+brl(x.params.taxa),'')
    +kpi('Inadimplência', x.status==='ativo'?pctf(x.kpi.inad):'—', 'Cotas vencidas','terracota')
    +kpi('Saldo em caixa', x.status==='ativo'?brl(x.kpi.saldo):'—','Conta do condomínio','pinho')
    +kpi('Ações p/ governança', x.kpi.pend||0,'Aguardando aprovação','')
    +'</div>';
  var ob = x.status==='onboarding' ? '<div class="card span-12"><h3>Onboarding</h3><div class="ob-track"><div class="ob-fill" style="width:'+x.onboarding+'%"></div></div><p class="muted" style="font-size:12.5px;margin-top:8px">'+x.onboarding+'% concluído. Próximo passo: cadastrar conta bancária e ativar os agentes.</p></div>' : '';
  var info='<div class="card span-6"><h3>Identificação</h3>'
    +kv('Cidade/UF', x.cidade+'/'+x.uf)+kv('Unidades', String(x.unidades))+kv('Plano', x.plano)+kv('Cliente desde', x.desde)+kv('Síndico', x.sindico)+kv('Conta bancária', x.params.conta)+'</div>';
  var agOn=AGENTES.filter(function(a){return x.agentes[a[0]].ativo;});
  var ag='<div class="card span-6"><h3>Agentes ativos</h3>'
    + (agOn.length? agOn.map(function(a){ var cfg=x.agentes[a[0]]; return kv(a[1], autonLabel(cfg.autonomia)); }).join('') : '<p class="muted">Nenhum agente ativo.</p>')
    +'<div style="margin-top:12px"><button class="btn sm" onclick="condoTab(\'agentes\')">Configurar agentes</button></div></div>';
  return kpis+ob+'<div class="grid">'+info+ag+'</div>';
}

function condoSGC(x){
  var feats=SGC_FEATURES.map(function(f){ return featRow('sgc', x.id, f, x.sgc[f[0]]); }).join('');
  var p=x.params;
  var params='<div class="card span-5"><h3>Parâmetros do condomínio</h3><div class="ccd-params">'
    +'<div class="field"><label>Taxa condominial (R$)</label><input class="inp" type="number" value="'+p.taxa+'" onchange="ccdParam(\''+x.id+'\',\'taxa\',this.value)"></div>'
    +'<div class="field"><label>Dia de vencimento</label><input class="inp" type="number" value="'+p.diaVenc+'" onchange="ccdParam(\''+x.id+'\',\'diaVenc\',this.value)"></div>'
    +'<div class="field"><label>Multa por atraso (%)</label><input class="inp" type="number" value="'+p.multa+'" onchange="ccdParam(\''+x.id+'\',\'multa\',this.value)"></div>'
    +'<div class="field"><label>Juros ao mês (%)</label><input class="inp" type="number" value="'+p.juros+'" onchange="ccdParam(\''+x.id+'\',\'juros\',this.value)"></div>'
    +'<div class="field" style="grid-column:1/-1"><label>Conta bancária</label><input class="inp" value="'+_esc(p.conta)+'" onchange="ccdParam(\''+x.id+'\',\'conta\',this.value)"></div>'
    +'</div><p class="muted" style="font-size:12px;margin-top:12px">Estes parâmetros alimentam o SGC e os agentes deste condomínio.</p></div>';
  var card='<div class="card span-7"><h3>Módulos do SGC</h3><p class="muted" style="font-size:12.5px;margin:-6px 0 8px">Ligue/desligue o que este condomínio enxerga no SGC.</p>'+feats+'</div>';
  return '<div class="grid">'+card+params+'</div>';
}
function condoApp(x){
  var feats=APP_FEATURES.map(function(f){ return featRow('app', x.id, f, x.app[f[0]]); }).join('');
  return '<div class="grid"><div class="card span-7"><h3>Funcionalidades do App Domus</h3><p class="muted" style="font-size:12.5px;margin:-6px 0 8px">Personalize o que os moradores deste condomínio veem no aplicativo.</p>'+feats+'</div>'
    +'<div class="card span-5"><h3>Pré-visualização</h3><p class="muted" style="font-size:13px;line-height:1.6">O App de <b>'+_esc(x.nome)+'</b> mostrará apenas as abas ligadas ao lado. Mudanças aqui refletem para todos os moradores deste condomínio.</p><div style="margin-top:10px">'+APP_FEATURES.filter(function(f){return x.app[f[0]];}).map(function(f){return '<span class="chip" style="margin:0 6px 6px 0;display:inline-block">'+_esc(f[1])+'</span>';}).join('')+'</div></div></div>';
}
function condoAgentes(x){
  var rows=AGENTES.map(function(a){
    var cfg=x.agentes[a[0]];
    var seg='<div class="seg">'+AUTON.map(function(o){var on=cfg.autonomia===o[0]; var cls=on?(o[0]==='aprovacao'?'on warn':(o[0]==='off'?'on off':'on')):''; return '<button class="'+cls+'" onclick="setAuton(\''+x.id+'\',\''+a[0]+'\',\''+o[0]+'\')">'+o[1]+'</button>';}).join('')+'</div>';
    var extra = a[0]==='cobranca' ? '<button class="btn sm" onclick="abrirReguaCcd()">Régua & mensagens</button>' : '';
    return '<div class="ccd-agent"><div class="ic"><svg viewBox="0 0 24 24">'+AGENTE_IC[a[0]]+'</svg></div>'
      +'<div class="bd"><div class="nm">'+a[1]+'</div><div class="ds">'+a[2]+'</div>'
      +'<div class="row">'+seg+' '+extra+'</div></div>'
      +'<div class="right"><label class="sw"><input type="checkbox" '+(cfg.ativo?'checked':'')+' onchange="toggleAgente(\''+x.id+'\',\''+a[0]+'\',this.checked)"><span class="tk"></span></label><span class="muted" style="font-size:11px">'+(cfg.ativo?'ativo':'desligado')+'</span></div></div>';
  }).join('');
  return '<div class="grid"><div class="card span-12"><h3>Agentes deste condomínio</h3><p class="muted" style="font-size:12.5px;margin:-6px 0 8px">Defina autonomia (automático, requer aprovação humana, ou desligado) por agente. A governança da Domus continua valendo.</p>'+rows+'</div></div>';
}

/* ---------- AGENTES (catálogo global) ---------- */
function renderAgentes(){
  var cards=AGENTES.map(function(a){
    var on=CCD.filter(function(x){return x.agentes[a[0]].ativo;}).length;
    var extra = a[0]==='cobranca' ? '<button class="btn sm" onclick="abrirReguaCcd()">Régua & mensagens padrão</button>' : '<button class="btn sm" onclick="toast(\'Configuração padrão deste agente em breve.\')">Padrões</button>';
    return '<div class="card span-6"><div class="ccd-agent" style="border:none;padding:0"><div class="ic"><svg viewBox="0 0 24 24">'+AGENTE_IC[a[0]]+'</svg></div><div class="bd"><div class="nm">'+a[1]+'</div><div class="ds">'+a[2]+'</div><div class="row"><span class="chip">ativo em '+on+'/'+CCD.length+' condomínios</span> '+extra+'</div></div></div></div>';
  }).join('');
  var note='<div class="ai-note"><svg class="ic" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2E5A4F" stroke-width="2"><rect x="4" y="7" width="16" height="12" rx="3"/><path d="M12 7V4"/></svg><div>Os <strong>agentes Domus</strong> têm padrões globais definidos aqui e são ativados/ajustados por condomínio na ficha de cada um. A cobrança roda a régua e personaliza as mensagens por morador.</div></div>';
  return note+'<div class="grid">'+cards+'</div>';
}

/* ---------- GOVERNANÇA ---------- */
function renderGov(){
  var rows=CCD.map(function(x){ return '<tr><td><strong>'+_esc(x.nome)+'</strong></td><td class="num">'+brl(x.governanca.limitePag)+'</td><td>'+_esc(x.governanca.aprovador)+'</td><td class="num">'+x.governanca.reajusteTeto+'%</td><td>'+(x.agentes.cobranca.autonomia==='auto'?'Cobrança automática':'Cobrança c/ aprovação')+'</td></tr>'; }).join('');
  var card='<div class="card span-12"><h3>Regras por condomínio</h3><div class="tblx"><table class="tbl" style="min-width:720px"><thead><tr><th>Condomínio</th><th class="num">Limite de pagamento sem aprovação</th><th>Aprovador</th><th class="num">Teto de reajuste</th><th>Autonomia da cobrança</th></tr></thead><tbody>'+rows+'</tbody></table></div><p class="muted" style="font-size:12px;margin-top:10px">Acima do limite, o agente Pagamentos sempre exige aprovação humana. Edição fina por condomínio na próxima iteração.</p></div>';
  var note='<div class="ai-note"><svg class="ic" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2E5A4F" stroke-width="2"><path d="M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7z"/></svg><div>A <strong>governança</strong> define até onde os agentes agem sozinhos. Por padrão, ações financeiras acima do limite exigem aprovação humana do síndico.</div></div>';
  return note+'<div class="grid">'+card+'</div>';
}

/* ---------- REGISTROS ---------- */
function renderRegistros(){
  var rows=FEED.map(function(f){ return '<tr><td style="white-space:nowrap">'+f.tm+'</td><td><span class="chip">'+_esc(f.ag)+'</span></td><td>'+_esc(f.condo)+'</td><td>'+_esc(f.acao)+'<div class="muted" style="font-size:11.5px">'+_esc(f.det)+'</div></td></tr>'; }).join('');
  return '<div class="grid"><div class="card span-12"><h3>Log de auditoria · hoje</h3><div class="tblx"><table class="tbl" style="min-width:680px"><thead><tr><th>Hora</th><th>Agente</th><th>Condomínio</th><th>Ação</th></tr></thead><tbody>'+rows+'</tbody></table></div><p class="muted" style="font-size:12px;margin-top:10px">Cada ação dos agentes e cada mudança de configuração ficam registradas aqui.</p></div></div>';
}

/* ---------- componentes ---------- */
function kpi(titulo, valor, legenda, mod){ return '<div class="card kpi '+(mod||'')+' span-3"><h3>'+titulo+'</h3><div class="valor">'+valor+'</div><div class="legenda">'+legenda+'</div></div>'; }
function kv(k,v){ return '<div class="kv"><span class="k">'+_esc(k)+'</span><span class="v">'+_esc(v)+'</span></div>'; }
function pill(st){ var lbl={ativo:'Ativo',onboarding:'Onboarding',pausado:'Pausado'}[st]||st; return '<span class="pill '+st+'">'+lbl+'</span>'; }
function autonLabel(a){ return {auto:'Automático',aprovacao:'Requer aprovação',off:'Desligado'}[a]||a; }
function featRow(scope, id, f, on){
  return '<div class="ccd-feat"><div><div class="lbl">'+_esc(f[1])+'</div><div class="desc">'+_esc(f[2])+'</div></div>'
    +'<label class="sw"><input type="checkbox" '+(on?'checked':'')+' onchange="ccdToggle(\''+scope+'\',\''+id+'\',\''+f[0]+'\',this.checked)"><span class="tk"></span></label></div>';
}

/* ---------- interações ---------- */
function ccdToggle(scope, id, key, on){ var x=condo(id); x[scope][key]=on; toast((on?'Ativado':'Desativado')+': '+key+' · '+x.nome); }
function ccdParam(id, key, val){ var x=condo(id); x.params[key]=(key==='conta')?val:(parseFloat(val)||0); toast('Parâmetro atualizado: '+key+' · '+x.nome); }
function toggleAgente(id, ag, on){ var x=condo(id); x.agentes[ag].ativo=on; render(); toast((on?'Agente ligado':'Agente desligado')+': '+ag+' · '+x.nome); }
function setAuton(id, ag, val){ var x=condo(id); x.agentes[ag].autonomia=val; if(val!=='off') x.agentes[ag].ativo=true; render(); toast('Autonomia: '+autonLabel(val)+' · '+ag); }
function abrirSGC(id){ var x=condo(id); if(x && x.sgcUrl){ window.location.href=x.sgcUrl; } else { toast('SGC em provisionamento.'); } }
function ccdResetar(){ CCD=makeCCD(); FEED=makeFeed(); nav('visao'); toast('Mockup reiniciado.'); }

/* ---------- cobrança: régua & mensagens (modais) ---------- */
function cobRender(tpl, vars){ return String(tpl||'').replace(/\{\{(\w+)\}\}/g, function(_,k){ return (vars[k]!=null)?vars[k]:('{{'+k+'}}'); }); }
function _canalChip(c){ if(c==='whatsapp') return '<span class="chip cob-ch wpp">WhatsApp</span>'; if(c==='email') return '<span class="chip cob-ch eml">E-mail</span>'; return '<span class="chip cob-ch">'+_esc(c)+'</span>'; }
function _offLabel(off){ return off<0?(off+'d'):(off===0?'D0':'+'+off+'d'); }
function sampleVars(){ return {nome:'Beatriz Araújo',primeiro_nome:'Beatriz',unidade:'203-A',bloco:'A',condominio:'Condomínio Felipe II',competencia:'maio/2026',vencimento:'10/05/2026',dias_atraso:22,valor:'R$ 580,00',multa:'R$ 11,60',juros:'R$ 4,25',valor_atualizado:'R$ 595,85',pix:'12.345.678/0001-90',linha_digitavel:'34191.79001 01043.510047 91020.150008 6 96650000058000',sindico:'Helena Martins'}; }

function abrirReguaCcd(){
  var list=COB_REGUA.slice().sort(function(a,b){return a.off-b.off;}).map(function(e){
    var canais=(e.canais||[]).map(_canalChip).join(' ');
    return '<div class="cob-etapa'+(e.ativo?'':' off')+'"><div class="off"><span>'+_offLabel(e.off)+'</span><small>'+(e.off===0?'venc.':'rel. venc.')+'</small></div>'
      +'<div class="bd"><div class="rot">'+_esc(e.rotulo)+' '+canais+'</div><div class="meta">'+_esc(e.publico)+' · tom '+_esc(e.tom).toLowerCase()+'</div></div>'
      +'<div class="ac" style="display:flex;gap:6px"><button class="btn sm" onclick="verExemploCcd('+e.ordem+')">Ver</button><button class="btn sm" onclick="editarMsgCcd('+e.ordem+')">Editar</button></div></div>';
  }).join('');
  document.getElementById('regua-ccd-list').innerHTML=list;
  abrirModal('modal-regua-ccd');
}
function _previewHTML(e, vars){
  var canais=e.canais||[]; var blocks='';
  if(canais.indexOf('email')>=0) blocks+='<div class="cob-mail"><div class="hd"><span class="ch">E-mail</span><div class="ln assunto"><b>Assunto:</b> '+_esc(cobRender(e.assunto,vars))+'</div></div><div class="bd">'+_nl(cobRender(e.email,vars))+'</div></div>';
  if(canais.indexOf('whatsapp')>=0) blocks+='<div class="cob-wpp"><div class="hd"><span class="ch">WhatsApp</span></div><div class="bubble">'+_nl(cobRender(e.wpp,vars))+'</div></div>';
  return blocks||'<p class="muted">Sem canais configurados.</p>';
}
function verExemploCcd(ordem){
  var e=COB_REGUA.find(function(x){return x.ordem===ordem;}); if(!e) return;
  document.querySelector('#modal-prev-ccd .pv-title').textContent=e.rotulo+' · exemplo';
  document.querySelector('#modal-prev-ccd .pv-sub').innerHTML='Prévia com dados de exemplo (<b>Beatriz Araújo</b>, unidade 203-A). Personalizada por morador no envio real.';
  document.querySelector('#modal-prev-ccd .pv-body').innerHTML=_previewHTML(e, sampleVars());
  abrirModal('modal-prev-ccd');
}
function editarMsgCcd(ordem){
  var e=COB_REGUA.find(function(x){return x.ordem===ordem;}); if(!e) return;
  document.getElementById('msgccd-h').textContent='Mensagem · '+e.rotulo;
  document.getElementById('msgccd-ord').value=ordem;
  document.getElementById('msgccd-eml').checked=(e.canais||[]).indexOf('email')>=0;
  document.getElementById('msgccd-wpp').checked=(e.canais||[]).indexOf('whatsapp')>=0;
  document.getElementById('msgccd-assunto').value=e.assunto||'';
  document.getElementById('msgccd-email').value=e.email||'';
  document.getElementById('msgccd-wppmsg').value=e.wpp||'';
  document.getElementById('msgccd-vars').innerHTML=COB_VARS.map(function(v){return '<button type="button" class="chip" onclick="msgVarInsert(\'{{'+v+'}}\')">{{'+v+'}}</button>';}).join(' ');
  abrirModal('modal-msg-ccd');
}
var _msgLastFocus='msgccd-email';
function msgVarInsert(token){ var ta=document.getElementById(_msgLastFocus)||document.getElementById('msgccd-email'); var s=ta.selectionStart||ta.value.length, en=ta.selectionEnd||ta.value.length; ta.value=ta.value.slice(0,s)+token+ta.value.slice(en); ta.focus(); ta.selectionStart=ta.selectionEnd=s+token.length; }
function salvarMsgCcd(ev){
  ev.preventDefault();
  var ordem=parseInt(document.getElementById('msgccd-ord').value);
  var e=COB_REGUA.find(function(x){return x.ordem===ordem;}); if(!e) return false;
  var canais=[]; if(document.getElementById('msgccd-eml').checked)canais.push('email'); if(document.getElementById('msgccd-wpp').checked)canais.push('whatsapp');
  e.canais=canais.length?canais:['email'];
  e.assunto=document.getElementById('msgccd-assunto').value;
  e.email=document.getElementById('msgccd-email').value;
  e.wpp=document.getElementById('msgccd-wppmsg').value;
  fecharModal('modal-msg-ccd'); abrirReguaCcd(); toast('Mensagem da etapa "'+e.rotulo+'" salva.');
  return false;
}

/* ---------- modais + toast ---------- */
function abrirModal(id){ document.getElementById(id).classList.add('open'); }
function fecharModal(id){ document.getElementById(id).classList.remove('open'); }
function toast(msg){
  var t=document.getElementById('cob-toast');
  if(!t){ t=document.createElement('div'); t.id='cob-toast'; t.className='cob-toast'; document.body.appendChild(t); }
  t.textContent=msg; t.classList.add('show'); clearTimeout(t._t); t._t=setTimeout(function(){ t.classList.remove('show'); },2400);
}

/* ---------- boot ---------- */
document.addEventListener('DOMContentLoaded', function(){
  CCD=makeCCD(); FEED=makeFeed();
  ['modal-regua-ccd','modal-msg-ccd','modal-prev-ccd'].forEach(function(id){ var el=document.getElementById(id); if(el) el.addEventListener('click', function(ev){ if(ev.target.id===id) el.classList.remove('open'); }); });
  ['msgccd-email','msgccd-wppmsg','msgccd-assunto'].forEach(function(id){ var el=document.getElementById(id); if(el) el.addEventListener('focus', function(){ _msgLastFocus=id; }); });
  setActive('visao'); render();
});
