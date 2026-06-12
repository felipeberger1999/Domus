/* =========================================================================
   VISÃO GERENCIAL — dados operacionais do SGC de cada condomínio na CCD.
   A administradora tem acesso total: pessoas, cotas (CAR), contas a pagar,
   contábil, DP e comunicação — por condomínio e consolidado (Operação).
   ========================================================================= */
var NOMES=['Maria','João','Ana','Carlos','Beatriz','Rafael','Patrícia','Diego','Lucas','Fernanda','Paulo','Juliana','Marcos','Camila','Bruno','Larissa','Felipe','Aline','Rodrigo','Tatiane'];
var SOBRES=['Silva','Santos','Oliveira','Souza','Lima','Pereira','Costa','Almeida','Nunes','Rocha','Dias','Alves','Mendes','Carvalho','Gomes','Martins','Araújo','Barbosa','Ribeiro','Fernandes'];
var CARGOS=[['Zelador',2650],['Porteiro (diurno)',2100],['Porteiro (noturno)',2300],['Auxiliar de limpeza',1820],['Jardineiro',1900],['Auxiliar de manutenção',2200]];
function _hash(s){ var h=7; for(var i=0;i<s.length;i++) h=(h*31+s.charCodeAt(i))>>>0; return h; }
function _rng(seed){ var s=(seed%233280)||7; return function(){ s=(s*9301+49297)%233280; return s/233280; }; }
function pad2(n){ return ('0'+n).slice(-2); }
function mlabelC(c){ var M=['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez']; var p=String(c).split('-'); return M[parseInt(p[1],10)-1]+'/'+p[0].slice(2); }
function dataBRC(d){ var p=String(d).split('-'); return p[2]+'/'+p[1]+'/'+p[0]; }
function hojeISO(){ try{ return new Date().toISOString().slice(0,10); }catch(e){ return '2026-06-12'; } }
function unidLabel(i,x){ var porAndar=4; var meio=Math.ceil(x.unidades/2); var bloco=(x.unidades>60 && i>=meio)?'B':'A'; var j=(bloco==='B')? i-meio : i; var andar=Math.floor(j/porAndar)+1, ap=(j%porAndar)+1; return (andar*100+ap)+'-'+bloco; }

function oper(x){
  if(x.oper) return x.oper;
  var rnd=_rng(_hash(x.id));
  var o={moradores:[],funcionarios:[],boletos:[],contasPagar:[],avisos:[],assembleias:[]};
  for(var i=0;i<x.unidades;i++){
    var nome=NOMES[Math.floor(rnd()*NOMES.length)]+' '+SOBRES[Math.floor(rnd()*SOBRES.length)];
    o.moradores.push({id:i+1, nome:nome, unidade:unidLabel(i,x), tipo:(rnd()<0.12?'inquilino':'morador'),
      telefone:'+55 11 9'+Math.floor(rnd()*9000+1000)+'-'+Math.floor(rnd()*9000+1000),
      email:nome.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z ]/g,'').replace(/ +/g,'.')+'@email.com'});
  }
  var nf=Math.max(2,Math.round(x.unidades/14));
  for(var f=0; f<nf; f++){ var cg=CARGOS[f%CARGOS.length]; o.funcionarios.push({id:f+1, nome:NOMES[Math.floor(rnd()*NOMES.length)]+' '+SOBRES[Math.floor(rnd()*SOBRES.length)], cargo:cg[0], salario:cg[1], status:'ativo', admissao:(2021+(f%5))+'-'+pad2((f%12)+1)+'-15'}); }
  var emOnb=(x.status==='onboarding');
  var nInad=Math.round(x.unidades*(x.kpi.inad||0)/100);
  var bid=1;
  o.moradores.forEach(function(m,i){
    if(!emOnb){
      o.boletos.push({id:bid++, unidade:m.unidade, morador:m.nome, competencia:'2026-04', valor:x.params.taxa, vencimento:'2026-04-'+pad2(x.params.diaVenc), status:'pago'});
      o.boletos.push({id:bid++, unidade:m.unidade, morador:m.nome, competencia:'2026-05', valor:x.params.taxa, vencimento:'2026-05-'+pad2(x.params.diaVenc), status:(i<nInad?'vencido':'pago')});
    }
    o.boletos.push({id:bid++, unidade:m.unidade, morador:m.nome, competencia:'2026-06', valor:x.params.taxa, vencimento:'2026-06-'+pad2(x.params.diaVenc), status:'aberto'});
  });
  var folha=o.funcionarios.reduce(function(s,fu){return s+fu.salario;},0);
  var POOL=[
    ['Folha salarial','Domus (folha)','Pessoal',folha],
    ['Água e esgoto','Sabesp','Utilities',Math.round(x.unidades*42)],
    ['Energia das áreas comuns','Enel SP','Utilities',Math.round(x.unidades*65)],
    ['Limpeza e conservação','Brilho Total Serviços','Manutenção',Math.round(x.unidades*18)],
    ['Manutenção dos elevadores','Eleva Manutenção Predial','Manutenção',Math.round(x.unidades*16)],
    ['Portaria e vigilância','SegMax Segurança','Manutenção',Math.round(x.unidades*18)],
    ['Taxa de administração','Domus','Administradora',Math.round(x.unidades*10)],
    ['Internet e telefonia','Vivo','Utilities',600]
  ];
  if(!emOnb){
    var cid=1, num=1;
    POOL.forEach(function(pl){ o.contasPagar.push({id:cid++, numero:'LCT-'+('000'+num++).slice(-4), descricao:pl[0]+' — mai/26', fornecedor:pl[1], grupo:pl[2], valor:pl[3], vencimento:'2026-05-12', competencia:'2026-05', status:'paga'}); });
    var pend=x.kpi.pend||0;
    POOL.forEach(function(pl,idx){ o.contasPagar.push({id:cid++, numero:'LCT-'+('000'+num++).slice(-4), descricao:pl[0]+' — jun/26', fornecedor:pl[1], grupo:pl[2], valor:pl[3], vencimento:'2026-06-12', competencia:'2026-06', status:(idx<pend?'pendente':'aprovada')}); });
    o.avisos.push({id:1, data:'2026-06-01', titulo:'Manutenção programada das áreas comuns', publico:'Todos', mensagem:'A equipe realizará manutenção preventiva nas áreas comuns ao longo de junho. Acompanhe os comunicados.'});
  }
  o.assembleias.push({id:1, titulo:'Assembleia Geral Ordinária 2026', tipo:'ordinaria', data:'2026-03-20', local:'Salão de festas', status:'realizada', pauta:'1) Prestação de contas 2025; 2) Previsão orçamentária 2026; 3) Eleição de síndico.', ata:'Aprovadas por maioria a prestação de contas de 2025 e a previsão orçamentária de 2026. Síndico(a) '+x.sindico+' conduzirá o mandato de 2026.'});
  if(!emOnb && rnd()>0.45){ o.assembleias.unshift({id:2, titulo:'AGE — Melhorias e rateios', tipo:'extraordinaria', data:'2026-06-28', local:'Salão de festas', status:'convocada', pauta:'1) Orçamentos de melhorias; 2) Definição de rateio extraordinário.', ata:''}); }
  x.oper=o;
  return o;
}
function syncKpi(x){
  var o=x.oper; if(!o) return;
  var venc=o.boletos.filter(function(b){return b.status==='vencido';}).length;
  x.kpi.inad = x.unidades ? Math.round(venc/x.unidades*1000)/10 : 0;
  x.kpi.pend = o.contasPagar.filter(function(c){return c.status==='pendente';}).length;
  x.kpi.aPagar = o.contasPagar.filter(function(c){return c.status==='pendente'||c.status==='aprovada';}).reduce(function(s,c){return s+c.valor;},0);
}
function operTodos(){ CCD.forEach(function(x){ oper(x); syncKpi(x); }); ccdSave(); }

/* ---------- aba PESSOAS (moradores + síndico + funcionários/DP) ---------- */
var PE_Q='';
function pessoasBusca(v){ PE_Q=(v||'').toLowerCase(); render(); var i=document.getElementById('pe-q'); if(i){ i.focus(); i.value=PE_Q; i.setSelectionRange(PE_Q.length,PE_Q.length); } }
function condoPessoas(x){
  var o=oper(x);
  var lista=o.moradores.filter(function(m){ return !PE_Q || (m.nome+' '+m.unidade).toLowerCase().indexOf(PE_Q)>=0; });
  var rows=lista.slice(0,200).map(function(m){
    return '<tr><td style="white-space:nowrap"><strong>'+_esc(m.unidade)+'</strong></td><td>'+_esc(m.nome)+'<div class="muted" style="font-size:11px">'+_esc(m.email)+'</div></td><td><span class="badge '+m.tipo+'">'+m.tipo+'</span></td><td style="white-space:nowrap">'+_esc(m.telefone)+'</td><td class="num"><button class="btn sm" onclick="abrirMoradorCcd(\''+x.id+'\','+m.id+')">✎ Editar</button></td></tr>';
  }).join('');
  var moradoresCard='<div class="card span-12"><div class="flex-between"><h3 style="margin:0">Moradores · '+o.moradores.length+'</h3><input class="inp" id="pe-q" placeholder="Buscar por nome ou unidade…" style="max-width:280px" value="'+_esc(PE_Q)+'" oninput="pessoasBusca(this.value)"></div>'
    +'<div class="tblx" style="margin-top:10px"><table class="tbl" style="min-width:760px"><thead><tr><th>Unidade</th><th>Morador</th><th>Tipo</th><th>Telefone</th><th class="num">Ações</th></tr></thead><tbody>'+rows+'</tbody></table></div>'
    +(lista.length>200?'<p class="muted" style="font-size:12px;margin-top:8px">Mostrando 200 de '+lista.length+' — refine a busca.</p>':'')+'</div>';
  var ativos=o.funcionarios.filter(function(f){return f.status==='ativo';});
  var folha=ativos.reduce(function(s,f){return s+f.salario;},0);
  var fr=o.funcionarios.map(function(f){
    return '<tr><td><strong>'+_esc(f.nome)+'</strong></td><td>'+_esc(f.cargo)+'</td><td class="num">'+brl(f.salario)+'</td><td style="white-space:nowrap">'+dataBRC(f.admissao)+'</td><td><span class="badge '+(f.status==='ativo'?'ativo':'demitido')+'">'+f.status+'</span></td><td class="num" style="white-space:nowrap"><button class="btn sm" onclick="abrirFuncCcd(\''+x.id+'\','+f.id+')">✎ Editar</button> '+(f.status==='ativo'?'<button class="btn sm" onclick="desligarFunc(\''+x.id+'\','+f.id+')">Desligar</button>':'')+'</td></tr>';
  }).join('');
  var sindicoCard='<div class="card span-4"><h3>Síndico(a)</h3>'+kv('Nome', x.sindico)+kv('Mandato', x.desde+' — atual')+kv('Contato', 'sindico@'+x.id+'.domus.app')+'<div style="margin-top:12px"><button class="btn sm" onclick="abrirEditCondo(\''+x.id+'\')">✎ Alterar síndico</button></div></div>';
  var dpCard='<div class="card span-8"><div class="flex-between"><h3 style="margin:0">Funcionários & DP · folha '+brl(folha)+'/mês</h3><span class="muted" style="font-size:12px">'+ativos.length+' ativo(s)</span></div>'
    +'<div class="tblx" style="margin-top:10px"><table class="tbl" style="min-width:680px"><thead><tr><th>Nome</th><th>Cargo</th><th class="num">Salário</th><th>Admissão</th><th>Status</th><th class="num">Ações</th></tr></thead><tbody>'+fr+'</tbody></table></div></div>';
  return '<div class="grid">'+sindicoCard+dpCard+moradoresCard+'</div>';
}
function abrirMoradorCcd(cid, mid){
  var m=oper(condo(cid)).moradores.find(function(z){return z.id===mid;}); if(!m) return;
  document.getElementById('mr-condo').value=cid; document.getElementById('mr-id').value=mid;
  document.getElementById('mr-nome').value=m.nome; document.getElementById('mr-unidade').value=m.unidade;
  document.getElementById('mr-tipo').value=m.tipo; document.getElementById('mr-tel').value=m.telefone; document.getElementById('mr-email').value=m.email;
  abrirModal('modal-morador-ccd');
}
function salvarMoradorCcd(ev){
  ev.preventDefault();
  var x=condo(document.getElementById('mr-condo').value); var m=oper(x).moradores.find(function(z){return z.id===parseInt(document.getElementById('mr-id').value);}); if(!m) return false;
  m.nome=document.getElementById('mr-nome').value.trim()||m.nome; m.unidade=document.getElementById('mr-unidade').value.trim()||m.unidade;
  m.tipo=document.getElementById('mr-tipo').value; m.telefone=document.getElementById('mr-tel').value.trim(); m.email=document.getElementById('mr-email').value.trim();
  addFeed('Cadastro', x.nome, 'Morador atualizado', m.nome+' ('+m.unidade+') editado pela equipe Domus');
  fecharModal('modal-morador-ccd'); render(); toast('Cadastro de '+m.nome+' salvo.');
  return false;
}
function abrirFuncCcd(cid, fid){
  var f=oper(condo(cid)).funcionarios.find(function(z){return z.id===fid;}); if(!f) return;
  document.getElementById('fc-condo').value=cid; document.getElementById('fc-id').value=fid;
  document.getElementById('fc-nome').value=f.nome; document.getElementById('fc-cargo').value=f.cargo; document.getElementById('fc-salario').value=f.salario;
  abrirModal('modal-func-ccd');
}
function salvarFuncCcd(ev){
  ev.preventDefault();
  var x=condo(document.getElementById('fc-condo').value); var f=oper(x).funcionarios.find(function(z){return z.id===parseInt(document.getElementById('fc-id').value);}); if(!f) return false;
  f.nome=document.getElementById('fc-nome').value.trim()||f.nome; f.cargo=document.getElementById('fc-cargo').value.trim()||f.cargo; f.salario=parseFloat(document.getElementById('fc-salario').value)||f.salario;
  addFeed('DP', x.nome, 'Funcionário atualizado', f.nome+' ('+f.cargo+') editado pela equipe Domus');
  fecharModal('modal-func-ccd'); render(); toast('Cadastro de '+f.nome+' salvo.');
  return false;
}
function desligarFunc(cid, fid){
  var x=condo(cid); var f=oper(x).funcionarios.find(function(z){return z.id===fid;}); if(!f) return;
  if(!confirm('Iniciar o desligamento de '+f.nome+' ('+f.cargo+')?')) return;
  f.status='desligado';
  addFeed('DP', x.nome, 'Desligamento iniciado', f.nome+' ('+f.cargo+') — rescisão encaminhada ao eSocial');
  render(); toast('Desligamento de '+f.nome+' iniciado.');
}

/* ---------- aba COTAS (CAR) ---------- */
var CT_COMP='', CT_ST='', CT_Q='';
function cotasFiltro(k,v){ if(k==='comp')CT_COMP=v; if(k==='st')CT_ST=v; if(k==='q')CT_Q=(v||'').toLowerCase(); render(); if(k==='q'){ var i=document.getElementById('ct-q'); if(i){ i.focus(); i.value=CT_Q; i.setSelectionRange(CT_Q.length,CT_Q.length);} } }
function condoCotas(x){
  var o=oper(x);
  var abertas=o.boletos.filter(function(b){return b.status==='aberto';});
  var vencidas=o.boletos.filter(function(b){return b.status==='vencido';});
  var recebMai=o.boletos.filter(function(b){return b.status==='pago'&&b.competencia==='2026-05';}).reduce(function(s,b){return s+b.valor;},0);
  var kpis='<div class="grid">'
    +kpi('Em aberto (a vencer)', brl(abertas.reduce(function(s,b){return s+b.valor;},0)), abertas.length+' cota(s) de '+mlabelC('2026-06'),'')
    +kpi('Vencidas', brl(vencidas.reduce(function(s,b){return s+b.valor;},0)), vencidas.length+' cota(s) — '+(x.kpi.inad||0)+'% de inadimplência','terracota')
    +kpi('Recebido em maio', brl(recebMai), 'Cotas pagas na competência','pinho')
    +kpi('Cota condominial', brl(x.params.taxa), 'Vencimento dia '+x.params.diaVenc,'')
    +'</div>';
  var comps=[]; o.boletos.forEach(function(b){ if(comps.indexOf(b.competencia)<0) comps.push(b.competencia); }); comps.sort();
  var lista=o.boletos.filter(function(b){
    return (!CT_COMP||b.competencia===CT_COMP) && (!CT_ST||b.status===CT_ST) && (!CT_Q||(b.unidade+' '+b.morador).toLowerCase().indexOf(CT_Q)>=0);
  });
  var ord=lista.slice().sort(function(a,b){ var r={vencido:0,aberto:1,pago:2}; return (r[a.status]-r[b.status])||(a.unidade>b.unidade?1:-1); });
  var rows=ord.slice(0,250).map(function(b){
    var ac = b.status==='pago' ? '<span class="muted">—</span>'
      : '<button class="btn primary sm" onclick="baixarCota(\''+x.id+'\','+b.id+')">Registrar pagamento</button> <button class="btn sm" onclick="segundaVia(\''+x.id+'\','+b.id+')">2ª via</button>';
    return '<tr><td style="white-space:nowrap"><strong>'+_esc(b.unidade)+'</strong></td><td>'+_esc(b.morador)+'</td><td style="white-space:nowrap">'+mlabelC(b.competencia)+'</td><td style="white-space:nowrap">'+dataBRC(b.vencimento)+'</td><td class="num">'+brl(b.valor)+'</td><td><span class="badge '+b.status+'">'+b.status+'</span></td><td class="num" style="white-space:nowrap">'+ac+'</td></tr>';
  }).join('');
  var sel=function(on,val,lbl){ return '<option value="'+val+'"'+(on===val?' selected':'')+'>'+lbl+'</option>'; };
  var tabela='<div class="card span-12"><h3>Controle de cotas <span class="r">'+lista.length+' registro(s)</span></h3>'
    +'<div class="pg-toolbar"><select class="inp" style="width:auto" onchange="cotasFiltro(\'comp\',this.value)">'+sel(CT_COMP,'','Todas as competências')+comps.map(function(c){return sel(CT_COMP,c,mlabelC(c));}).join('')+'</select>'
    +'<select class="inp" style="width:auto" onchange="cotasFiltro(\'st\',this.value)">'+sel(CT_ST,'','Todos os status')+['aberto','vencido','pago'].map(function(s){return sel(CT_ST,s,s);}).join('')+'</select>'
    +'<input class="inp" id="ct-q" style="width:220px" placeholder="Unidade ou morador…" value="'+_esc(CT_Q)+'" oninput="cotasFiltro(\'q\',this.value)"></div>'
    +'<div class="tblx"><table class="tbl" style="min-width:880px"><thead><tr><th>Unidade</th><th>Morador</th><th>Compet.</th><th>Vencimento</th><th class="num">Valor</th><th>Status</th><th class="num">Ações</th></tr></thead><tbody>'+rows+'</tbody></table></div>'
    +(ord.length>250?'<p class="muted" style="font-size:12px;margin-top:8px">Mostrando 250 de '+ord.length+' — use os filtros.</p>':'')+'</div>';
  return kpis+'<div class="grid">'+tabela+'</div>';
}
function baixarCota(cid, bid){
  var x=condo(cid); var b=oper(x).boletos.find(function(z){return z.id===bid;}); if(!b||b.status==='pago') return;
  b.status='pago'; x.kpi.saldo=(x.kpi.saldo||0)+b.valor; syncKpi(x);
  addFeed('Cobrança', x.nome, 'Pagamento registrado', 'Cota '+b.unidade+' ('+mlabelC(b.competencia)+') — '+brl(b.valor)+' baixada pela equipe Domus');
  render(); toast('Pagamento da unidade '+b.unidade+' registrado.');
}
function segundaVia(cid, bid){
  var x=condo(cid); var b=oper(x).boletos.find(function(z){return z.id===bid;}); if(!b) return;
  addFeed('Cobrança', x.nome, '2ª via emitida', 'Unidade '+b.unidade+' ('+mlabelC(b.competencia)+') — enviada por e-mail ao morador');
  toast('2ª via da unidade '+b.unidade+' gerada e enviada (demo).');
}

/* ---------- aba CONTAS A PAGAR ---------- */
function condoPagar(x){
  var o=oper(x);
  var pend=o.contasPagar.filter(function(c){return c.status==='pendente';});
  var aprov=o.contasPagar.filter(function(c){return c.status==='aprovada';});
  var kpis='<div class="grid">'
    +kpi('A pagar · aberto', brl(o.contasPagar.filter(function(c){return c.status==='pendente'||c.status==='aprovada';}).reduce(function(s,c){return s+c.valor;},0)), pend.length+' pendente(s) + '+aprov.length+' aprovada(s)','terracota')
    +kpi('Aguardando aprovação', pend.length, 'Fila de governança','')
    +kpi('Pago em maio', brl(o.contasPagar.filter(function(c){return c.status==='paga';}).reduce(function(s,c){return s+c.valor;},0)), 'Liquidado na competência','pinho')
    +kpi('Limite s/ aprovação', brl(x.governanca.limitePag), 'Acima disso, aprovação humana','')
    +'</div>';
  var ac=function(c){
    if(c.status==='pendente') return '<button class="btn primary sm" onclick="aprovarCp(\''+x.id+'\','+c.id+')">Aprovar</button> <button class="btn sm" onclick="negarCp(\''+x.id+'\','+c.id+')">Negar</button>';
    if(c.status==='aprovada') return '<button class="btn pinho sm" onclick="liquidarCp(\''+x.id+'\','+c.id+')">Liquidar</button>';
    return '<span class="muted">—</span>';
  };
  var ord=o.contasPagar.slice().sort(function(a,b){ var r={pendente:0,aprovada:1,paga:2,negada:3}; return (r[a.status]-r[b.status])||(a.vencimento>b.vencimento?1:-1); });
  var rows=ord.map(function(c){
    return '<tr><td style="white-space:nowrap"><strong>'+c.numero+'</strong></td><td style="min-width:280px"><div style="font-weight:600;line-height:1.35">'+_esc(c.descricao)+'</div><div class="muted" style="font-size:11.5px;margin-top:3px">'+_esc(c.fornecedor)+' · '+_esc(c.grupo)+'</div></td><td style="white-space:nowrap">'+dataBRC(c.vencimento)+'</td><td class="num"><strong>'+brl(c.valor)+'</strong></td><td><span class="badge '+c.status+'">'+c.status+'</span></td><td class="num" style="white-space:nowrap">'+ac(c)+'</td></tr>';
  }).join('');
  var tabela='<div class="card span-12"><div class="flex-between"><h3 style="margin:0">Lançamentos <span class="r">'+o.contasPagar.length+'</span></h3><button class="btn primary sm" onclick="abrirLancarCcd(\''+x.id+'\')">+ Lançar conta</button></div>'
    +'<div class="tblx" style="margin-top:10px"><table class="tbl" style="min-width:880px"><thead><tr><th>Nº</th><th style="min-width:280px">Descrição</th><th>Vencimento</th><th class="num">Valor</th><th>Status</th><th class="num">Ações</th></tr></thead><tbody>'+rows+'</tbody></table></div>'
    +'<p class="muted" style="font-size:12px;margin-top:10px">Aprovações aqui valem como aprovação da administradora; o agente Pagamentos executa e o Contábil lança o movimento.</p></div>';
  return kpis+'<div class="grid">'+tabela+'</div>';
}
function aprovarCp(cid, id){ var x=condo(cid); var c=oper(x).contasPagar.find(function(z){return z.id===id;}); if(!c||c.status!=='pendente') return; c.status='aprovada'; syncKpi(x); addFeed('Pagamentos', x.nome, 'Conta aprovada', c.numero+' '+c.descricao+' — '+brl(c.valor)+' aprovada pela Domus'); render(); toast(c.numero+' aprovada.'); }
function negarCp(cid, id){ var x=condo(cid); var c=oper(x).contasPagar.find(function(z){return z.id===id;}); if(!c||c.status!=='pendente') return; if(!confirm('Negar o lançamento '+c.numero+' ('+c.descricao+')?')) return; c.status='negada'; syncKpi(x); addFeed('Pagamentos', x.nome, 'Conta negada', c.numero+' '+c.descricao+' recusada pela Domus'); render(); toast(c.numero+' negada.'); }
function liquidarCp(cid, id){ var x=condo(cid); var c=oper(x).contasPagar.find(function(z){return z.id===id;}); if(!c||c.status!=='aprovada') return; c.status='paga'; x.kpi.saldo=(x.kpi.saldo||0)-c.valor; syncKpi(x); addFeed('Pagamentos', x.nome, 'Fornecedor pago', c.numero+' '+c.descricao+' — '+brl(c.valor)+' liquidada'); render(); toast(c.numero+' liquidada.'); }
function abrirLancarCcd(cid){ document.getElementById('lc-condo').value=cid; document.getElementById('lc-desc').value=''; document.getElementById('lc-forn').value=''; document.getElementById('lc-valor').value=''; abrirModal('modal-lancar-ccd'); }
function salvarLancarCcd(ev){
  ev.preventDefault();
  var x=condo(document.getElementById('lc-condo').value); if(!x) return false;
  var o=oper(x);
  var maxId=o.contasPagar.reduce(function(s,c){return Math.max(s,c.id);},0);
  var c={id:maxId+1, numero:'LCT-'+('000'+(o.contasPagar.length+1)).slice(-4), descricao:document.getElementById('lc-desc').value.trim(), fornecedor:document.getElementById('lc-forn').value.trim()||'(a definir)', grupo:document.getElementById('lc-grupo').value, valor:parseFloat(document.getElementById('lc-valor').value)||0, vencimento:document.getElementById('lc-venc').value||'2026-06-20', competencia:'2026-06', status:'pendente'};
  if(!c.descricao||!c.valor){ toast('Preencha descrição e valor.'); return false; }
  o.contasPagar.push(c); syncKpi(x);
  addFeed('Pagamentos', x.nome, 'Conta lançada', c.numero+' '+c.descricao+' — '+brl(c.valor)+' aguardando aprovação');
  fecharModal('modal-lancar-ccd'); render(); toast('Conta '+c.numero+' lançada como pendente.');
  return false;
}

/* ---------- aba CONTÁBIL ---------- */
function condoContabil(x){
  var o=oper(x);
  var recMai=o.boletos.filter(function(b){return b.status==='pago'&&b.competencia==='2026-05';}).reduce(function(s,b){return s+b.valor;},0);
  var despPagas=o.contasPagar.filter(function(c){return c.status==='paga';});
  var despMai=despPagas.reduce(function(s,c){return s+c.valor;},0);
  var grupos={};
  despPagas.forEach(function(c){ grupos[c.grupo]=(grupos[c.grupo]||0)+c.valor; });
  var gKeys=Object.keys(grupos).sort(function(a,b){return grupos[b]-grupos[a];});
  var maxG=gKeys.length?grupos[gKeys[0]]:1;
  var bars=gKeys.map(function(g){ var pct=Math.round(grupos[g]/maxG*100); return '<div class="kv"><span class="k" style="flex:0 0 150px">'+_esc(g)+'</span><span style="flex:1;display:flex;align-items:center;gap:10px"><span style="flex:1;height:9px;background:var(--areia);border:1px solid var(--linha);border-radius:99px;overflow:hidden"><span style="display:block;height:100%;width:'+pct+'%;background:var(--pinho);border-radius:99px"></span></span><span class="v" style="white-space:nowrap">'+brl(grupos[g])+'</span></span></div>'; }).join('');
  var res=recMai-despMai;
  var kpis='<div class="grid">'
    +kpi('Receitas · maio', brl(recMai), 'Cotas recebidas na competência','pinho')
    +kpi('Despesas pagas', brl(despMai), despPagas.length+' lançamento(s) liquidado(s)','terracota')
    +kpi('Resultado', brl(res), res>=0?'Superávit':'Déficit', res>=0?'pinho':'terracota')
    +kpi('Saldo em caixa', brl(x.kpi.saldo||0), 'Atualizado com baixas e liquidações','')
    +'</div>';
  var dre='<div class="card span-6"><h3>DRE simplificada · '+mlabelC('2026-05')+'</h3>'
    +kv('(+) Receita de cotas', brl(recMai))+kv('(−) Despesas operacionais', brl(despMai))+kv('(=) Resultado', brl(res))
    +'<p class="muted" style="font-size:12px;margin-top:12px">Demonstrações completas (DRE, Balanço, Fluxo, Balancete) no SGC do condomínio'+(x.sgcUrl?' — <a href="#" onclick="abrirSGC(\''+x.id+'\');return false" style="color:var(--pinho);font-weight:600">abrir SGC ↗</a>':'')+'.</p></div>';
  var despCard='<div class="card span-6"><h3>Despesas por grupo · acumulado</h3>'+(bars||'<p class="muted">Sem despesas liquidadas ainda.</p>')+'</div>';
  return kpis+'<div class="grid">'+dre+despCard+'</div>';
}

/* ---------- aba COMUNICAÇÃO (avisos + atas) ---------- */
function condoCom(x){
  var o=oper(x);
  var av=o.avisos.slice().sort(function(a,b){return a.data<b.data?1:-1;}).map(function(a){
    return '<div class="ccd-feat" style="cursor:default"><div><div class="lbl">'+_esc(a.titulo)+' <span class="chip">'+_esc(a.publico)+'</span></div><div class="desc">'+dataBRC(a.data)+' · '+_esc(a.mensagem)+'</div></div></div>';
  }).join('');
  var avCard='<div class="card span-6"><div class="flex-between"><h3 style="margin:0">Avisos publicados</h3><button class="btn primary sm" onclick="abrirAvisoCcd(\''+x.id+'\')">+ Novo aviso</button></div>'
    +(av||'<p class="muted" style="margin-top:10px">Nenhum aviso publicado ainda.</p>')+'</div>';
  var at=o.assembleias.map(function(a){
    var btn = a.ata ? '<button class="btn sm" onclick="verAtaCcd(\''+x.id+'\','+a.id+')">Ver ata</button>' : '<button class="btn primary sm" onclick="abrirAtaCcd(\''+x.id+'\','+a.id+')">Registrar ata</button>';
    return '<div class="ccd-feat" style="cursor:default"><div><div class="lbl">'+_esc(a.titulo)+' <span class="badge '+a.status+'">'+a.status+'</span></div><div class="desc">'+dataBRC(a.data)+' · '+_esc(a.local)+' · '+_esc(a.pauta)+'</div></div><div style="flex-shrink:0">'+btn+'</div></div>';
  }).join('');
  var atCard='<div class="card span-6"><h3>Assembleias & atas</h3>'+(at||'<p class="muted">Nenhuma assembleia registrada.</p>')+'</div>';
  return '<div class="grid">'+avCard+atCard+'</div>';
}
function abrirAvisoCcd(cid){
  document.getElementById('av-ccd-condo').value=cid||'';
  document.getElementById('av-ccd-titulo').value=''; document.getElementById('av-ccd-msg').value='';
  var wrap=document.getElementById('av-ccd-dest-wrap');
  if(cid){ wrap.style.display='none'; document.getElementById('av-ccd-h').textContent='Novo aviso · '+condo(cid).nome; }
  else{
    wrap.style.display=''; document.getElementById('av-ccd-h').textContent='Aviso em lote · vários condomínios';
    document.getElementById('av-ccd-condos').innerHTML=CCD.filter(function(x){return x.status!=='pausado';}).map(function(x){ return '<label class="av-ck"><input type="checkbox" value="'+x.id+'" checked> '+_esc(x.nome)+'</label>'; }).join('');
  }
  abrirModal('modal-aviso-ccd');
}
function salvarAvisoCcd(ev){
  ev.preventDefault();
  var cid=document.getElementById('av-ccd-condo').value;
  var titulo=document.getElementById('av-ccd-titulo').value.trim();
  var msg=document.getElementById('av-ccd-msg').value.trim();
  var pub=document.getElementById('av-ccd-publico').value;
  if(!titulo||!msg){ toast('Preencha título e mensagem.'); return false; }
  var alvos = cid ? [condo(cid)] : [].slice.call(document.querySelectorAll('#av-ccd-condos input:checked')).map(function(i){return condo(i.value);}).filter(Boolean);
  if(!alvos.length){ toast('Selecione ao menos um condomínio.'); return false; }
  var hoje=hojeISO();
  alvos.forEach(function(x){
    var o=oper(x);
    var nid=o.avisos.reduce(function(s,a){return Math.max(s,a.id);},0)+1;
    o.avisos.unshift({id:nid, data:hoje, titulo:titulo, publico:pub, mensagem:msg});
    if(x.id==='felipe2') pushAvisoApp(titulo, pub, msg, hoje);
  });
  addFeed('Comunicação', alvos.length===1?alvos[0].nome:alvos.length+' condomínios', 'Aviso publicado', '"'+titulo+'" enviado para SGC e App ('+pub+')');
  fecharModal('modal-aviso-ccd'); ccdSave(); if(SEC==='condo'||SEC==='operacao') render();
  toast('Aviso publicado em '+alvos.length+' condomínio(s).');
  return false;
}
/* aviso do felipe2 chega no App do morador (store compartilhado da mesma origem).
   Se o store ainda não existe (bridge só grava na 1ª escrita), criamos um
   parcial com os avisos-semente — o bridge mescla o resto dos DEFAULTS. */
var AVISOS_SEED=[
  {id:1, data:'2026-06-01', titulo:'Manutenção dos elevadores', autor:'Síndica', publico:'Todos', mensagem:'No dia 12/06 os elevadores passarão por manutenção preventiva das 8h às 12h. Pedimos a compreensão de todos.'},
  {id:2, data:'2026-05-28', titulo:'Encomenda na portaria', autor:'Porteiro', publico:'Bloco A', mensagem:'Chegaram encomendas para retirada na portaria. Confira a aba Entregas no app.'},
  {id:3, data:'2026-05-20', titulo:'Dedetização das áreas comuns', autor:'Síndica', publico:'Moradores', mensagem:'A dedetização ocorrerá no sábado, 24/05. Mantenha animais de estimação dentro das unidades.'}
];
function pushAvisoApp(titulo, pub, msg, data){
  try{
    var raw=localStorage.getItem('domus_shared_v1');
    var st = raw ? JSON.parse(raw) : {};
    if(!st || typeof st!=='object') st={};
    if(!st.avisos || !st.avisos.length) st.avisos=AVISOS_SEED.slice();
    var nid=st.avisos.reduce(function(s,a){return Math.max(s,a.id||0);},0)+1;
    st.avisos.unshift({id:nid, data:data, titulo:titulo, autor:'Administradora Domus', publico:pub, mensagem:msg});
    localStorage.setItem('domus_shared_v1', JSON.stringify(st));
  }catch(e){}
}
function abrirAtaCcd(cid, aid){
  var x=condo(cid); var a=oper(x).assembleias.find(function(z){return z.id===aid;}); if(!a) return;
  document.getElementById('ata-ccd-condo').value=cid; document.getElementById('ata-ccd-id').value=aid;
  document.getElementById('ata-ccd-h').textContent='Registrar ata · '+a.titulo;
  document.getElementById('ata-ccd-sub').textContent=dataBRC(a.data)+' · '+a.local+' · Pauta: '+a.pauta;
  document.getElementById('ata-ccd-texto').value=a.ata||'';
  abrirModal('modal-ata-ccd');
}
function salvarAtaCcd(ev){
  ev.preventDefault();
  var x=condo(document.getElementById('ata-ccd-condo').value); var a=oper(x).assembleias.find(function(z){return z.id===parseInt(document.getElementById('ata-ccd-id').value);}); if(!a) return false;
  a.ata=document.getElementById('ata-ccd-texto').value.trim();
  if(a.ata && a.status==='convocada') a.status='realizada';
  addFeed('Assembleias', x.nome, 'Ata registrada', '"'+a.titulo+'" — ata publicada no repositório do condomínio');
  fecharModal('modal-ata-ccd'); render(); toast('Ata registrada e publicada.');
  return false;
}
function verAtaCcd(cid, aid){
  var x=condo(cid); var a=oper(x).assembleias.find(function(z){return z.id===aid;}); if(!a) return;
  document.querySelector('#modal-prev-ccd .pv-title').textContent='Ata · '+a.titulo;
  document.querySelector('#modal-prev-ccd .pv-sub').innerHTML=dataBRC(a.data)+' · '+_esc(a.local)+' · '+_esc(x.nome)+' <button class="btn sm" style="margin-left:10px" onclick="fecharModal(\'modal-prev-ccd\');abrirAtaCcd(\''+cid+'\','+aid+')">✎ Editar ata</button>';
  document.querySelector('#modal-prev-ccd .pv-body').innerHTML='<div class="cob-mail"><div class="bd">'+_nl(a.ata)+'</div></div>';
  abrirModal('modal-prev-ccd');
}

/* ---------- OPERAÇÃO (consolidado de todos os condomínios) ---------- */
function renderOperacao(){
  operTodos();
  var carteira=0, vencTot=0, vencVal=0, unidTot=0, folhaTot=0;
  var fila=[];
  CCD.forEach(function(x){
    var o=x.oper;
    carteira += o.boletos.filter(function(b){return b.status==='aberto'||b.status==='vencido';}).reduce(function(s,b){return s+b.valor;},0);
    var v=o.boletos.filter(function(b){return b.status==='vencido';});
    vencTot+=v.length; vencVal+=v.reduce(function(s,b){return s+b.valor;},0);
    unidTot+=x.unidades;
    folhaTot += o.funcionarios.filter(function(f){return f.status==='ativo';}).reduce(function(s,f){return s+f.salario;},0);
    o.contasPagar.filter(function(c){return c.status==='pendente';}).forEach(function(c){ fila.push({x:x, c:c}); });
  });
  var kpis='<div class="grid">'
    +kpi('Carteira a receber', brl(carteira), 'Cotas em aberto + vencidas — '+CCD.length+' condomínios','')
    +kpi('Inadimplência consolidada', pctf(unidTot?vencTot/unidTot*100:0), vencTot+' cotas vencidas · '+brl(vencVal),'terracota')
    +kpi('Fila de aprovação', fila.length, 'Contas pendentes em toda a base','')
    +kpi('Folha consolidada', brl(folhaTot), 'Funcionários de todos os condomínios','pinho')
    +'</div>';
  var filaRows=fila.sort(function(a,b){return b.c.valor-a.c.valor;}).map(function(f){
    return '<tr><td><strong>'+_esc(f.x.nome)+'</strong></td><td style="min-width:240px"><div style="font-weight:600;line-height:1.35">'+_esc(f.c.descricao)+'</div><div class="muted" style="font-size:11.5px;margin-top:2px">'+f.c.numero+' · '+_esc(f.c.fornecedor)+'</div></td><td style="white-space:nowrap">'+dataBRC(f.c.vencimento)+'</td><td class="num"><strong>'+brl(f.c.valor)+'</strong></td><td class="num" style="white-space:nowrap"><button class="btn primary sm" onclick="aprovarCp(\''+f.x.id+'\','+f.c.id+')">Aprovar</button> <button class="btn sm" onclick="negarCp(\''+f.x.id+'\','+f.c.id+')">Negar</button></td></tr>';
  }).join('');
  var filaCard='<div class="card span-7"><h3>Fila única de aprovação · contas a pagar</h3>'
    +(fila.length?'<div class="tblx" style="margin-top:6px"><table class="tbl" style="min-width:680px"><thead><tr><th>Condomínio</th><th style="min-width:240px">Conta</th><th>Venc.</th><th class="num">Valor</th><th class="num">Ações</th></tr></thead><tbody>'+filaRows+'</tbody></table></div>':'<p class="muted" style="margin-top:8px">Nenhuma conta aguardando aprovação em toda a base. 🎉</p>')
    +'</div>';
  var inadRows=CCD.map(function(x){
    var v=x.oper.boletos.filter(function(b){return b.status==='vencido';});
    return {x:x, n:v.length, val:v.reduce(function(s,b){return s+b.valor;},0)};
  }).sort(function(a,b){return b.val-a.val;}).map(function(r){
    return '<tr><td><strong>'+_esc(r.x.nome)+'</strong></td><td class="num">'+r.n+'</td><td class="num">'+brl(r.val)+'</td><td class="num">'+pctf(r.x.kpi.inad||0)+'</td><td class="num"><button class="btn sm" onclick="abrirCondo(\''+r.x.id+'\',\'cotas\')">Abrir cotas</button></td></tr>';
  }).join('');
  var inadCard='<div class="card span-5"><h3>Inadimplência por condomínio</h3><div class="tblx" style="margin-top:6px"><table class="tbl" style="min-width:460px"><thead><tr><th>Condomínio</th><th class="num">Vencidas</th><th class="num">Valor</th><th class="num">%</th><th></th></tr></thead><tbody>'+inadRows+'</tbody></table></div></div>';
  var com='<div class="card span-12"><div class="flex-between"><h3 style="margin:0">Comunicação em lote</h3><button class="btn primary sm" onclick="abrirAvisoCcd(null)">+ Aviso para vários condomínios</button></div><p class="muted" style="font-size:12.5px;margin-top:8px">Publique um comunicado de uma vez para os SGCs e Apps dos condomínios selecionados — ex.: recesso de fim de ano, campanhas, mudanças de processo.</p></div>';
  var note='<div class="ai-note"><svg class="ic" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2E5A4F" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a8 8 0 0 0 .1-6M4.5 9a8 8 0 0 0 .1 6"/></svg><div>Visão <strong>gerencial consolidada</strong>: a Domus enxerga e opera o SGC de todos os condomínios daqui — cotas, aprovações, folha e comunicação. Para o detalhe de um condomínio, abra a ficha dele.</div></div>';
  return note+kpis+'<div class="grid">'+filaCard+inadCard+com+'</div>';
}
