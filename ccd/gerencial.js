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
  o.saldoInicial = emOnb ? 0 : Math.round(x.unidades*x.params.taxa*2.4);
  x.oper=o;
  return o;
}
/* competências presentes (boletos + contas a pagar), ordenadas */
function compsCcd(x){ var o=oper(x), s={}; o.boletos.forEach(function(b){s[b.competencia]=1;}); o.contasPagar.forEach(function(c){s[c.competencia]=1;}); return Object.keys(s).sort(); }
/* saldo de caixa acumulado até o fim de uma competência (recebimentos − pagamentos) */
function saldoCaixaAteCcd(x, comp){
  var o=oper(x);
  var rec=o.boletos.filter(function(b){return b.status==='pago' && b.competencia<=comp;}).reduce(function(s,b){return s+b.valor;},0);
  var pag=o.contasPagar.filter(function(c){return c.status==='paga' && c.competencia<=comp;}).reduce(function(s,c){return s+c.valor;},0);
  return (o.saldoInicial||0) + rec - pag;
}
function syncKpi(x){
  var o=x.oper; if(!o) return;
  var venc=o.boletos.filter(function(b){return b.status==='vencido';}).length;
  x.kpi.inad = x.unidades ? Math.round(venc/x.unidades*1000)/10 : 0;
  x.kpi.pend = o.contasPagar.filter(function(c){return c.status==='pendente';}).length;
  x.kpi.aPagar = o.contasPagar.filter(function(c){return c.status==='pendente'||c.status==='aprovada';}).reduce(function(s,c){return s+c.valor;},0);
  var cs=compsCcd(x); x.kpi.saldo = cs.length ? saldoCaixaAteCcd(x, cs[cs.length-1]) : (o.saldoInicial||0);
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
  var moradoresCard='<div class="card span-12"><div class="flex-between"><h3 style="margin:0">Moradores · '+o.moradores.length+'</h3><div style="display:flex;gap:10px;align-items:center"><input class="inp" id="pe-q" placeholder="Buscar por nome ou unidade…" style="max-width:280px" value="'+_esc(PE_Q)+'" oninput="pessoasBusca(this.value)"><button class="btn primary sm" onclick="novoMoradorCcd(\''+x.id+'\')">+ Novo morador</button></div></div>'
    +'<div class="tblx" style="margin-top:10px"><table class="tbl" style="min-width:760px"><thead><tr><th>Unidade</th><th>Morador</th><th>Tipo</th><th>Telefone</th><th class="num">Ações</th></tr></thead><tbody>'+rows+'</tbody></table></div>'
    +(lista.length>200?'<p class="muted" style="font-size:12px;margin-top:8px">Mostrando 200 de '+lista.length+' — refine a busca.</p>':'')+'</div>';
  var ativos=o.funcionarios.filter(function(f){return f.status==='ativo';});
  var folha=ativos.reduce(function(s,f){return s+f.salario;},0);
  var fr=o.funcionarios.map(function(f){
    return '<tr><td><strong>'+_esc(f.nome)+'</strong></td><td>'+_esc(f.cargo)+'</td><td class="num">'+brl(f.salario)+'</td><td style="white-space:nowrap">'+dataBRC(f.admissao)+'</td><td><span class="badge '+(f.status==='ativo'?'ativo':'demitido')+'">'+f.status+'</span></td><td class="num" style="white-space:nowrap"><button class="btn sm" onclick="abrirFuncCcd(\''+x.id+'\','+f.id+')">✎ Editar</button> '+(f.status==='ativo'?'<button class="btn sm" onclick="desligarFunc(\''+x.id+'\','+f.id+')">Desligar</button>':'')+'</td></tr>';
  }).join('');
  var sindicoCard='<div class="card span-4"><h3>Síndico(a)</h3>'+kv('Nome', x.sindico)+kv('Mandato', x.desde+' — atual')+kv('Contato', 'sindico@'+x.id+'.domus.app')+'<div style="margin-top:12px"><button class="btn sm" onclick="abrirEditCondo(\''+x.id+'\')">✎ Alterar síndico</button></div></div>';
  var dpCard='<div class="card span-8"><div class="flex-between"><h3 style="margin:0">Funcionários & DP · folha '+brl(folha)+'/mês</h3><div style="display:flex;gap:10px;align-items:center"><span class="muted" style="font-size:12px">'+ativos.length+' ativo(s)</span><button class="btn primary sm" onclick="novoFuncCcd(\''+x.id+'\')">+ Novo funcionário</button></div></div>'
    +'<div class="tblx" style="margin-top:10px"><table class="tbl" style="min-width:680px"><thead><tr><th>Nome</th><th>Cargo</th><th class="num">Salário</th><th>Admissão</th><th>Status</th><th class="num">Ações</th></tr></thead><tbody>'+fr+'</tbody></table></div></div>';
  return '<div class="grid">'+sindicoCard+dpCard+moradoresCard+'</div>';
}
function novoMoradorCcd(cid){
  document.getElementById('mr-condo').value=cid; document.getElementById('mr-id').value='';
  document.getElementById('mr-h').textContent='Novo morador';
  document.getElementById('mr-del').style.display='none';
  ['mr-nome','mr-unidade','mr-tel','mr-email'].forEach(function(i){ document.getElementById(i).value=''; });
  document.getElementById('mr-tipo').value='morador';
  abrirModal('modal-morador-ccd');
}
function abrirMoradorCcd(cid, mid){
  var m=oper(condo(cid)).moradores.find(function(z){return z.id===mid;}); if(!m) return;
  document.getElementById('mr-condo').value=cid; document.getElementById('mr-id').value=mid;
  document.getElementById('mr-h').textContent='Editar morador';
  document.getElementById('mr-del').style.display='';
  document.getElementById('mr-nome').value=m.nome; document.getElementById('mr-unidade').value=m.unidade;
  document.getElementById('mr-tipo').value=m.tipo; document.getElementById('mr-tel').value=m.telefone; document.getElementById('mr-email').value=m.email;
  abrirModal('modal-morador-ccd');
}
function salvarMoradorCcd(ev){
  ev.preventDefault();
  var x=condo(document.getElementById('mr-condo').value); var o=oper(x);
  var idv=document.getElementById('mr-id').value;
  var nome=document.getElementById('mr-nome').value.trim(); if(!nome){ toast('Informe o nome.'); return false; }
  if(!idv){
    var nid=o.moradores.reduce(function(s,z){return Math.max(s,z.id);},0)+1;
    o.moradores.unshift({id:nid, nome:nome, unidade:document.getElementById('mr-unidade').value.trim()||'—', tipo:document.getElementById('mr-tipo').value, telefone:document.getElementById('mr-tel').value.trim(), email:document.getElementById('mr-email').value.trim()});
    addFeed('Cadastro', x.nome, 'Morador adicionado', nome+' incluído no cadastro pela equipe Domus');
    fecharModal('modal-morador-ccd'); render(); toast(nome+' adicionado.');
    return false;
  }
  var m=o.moradores.find(function(z){return z.id===parseInt(idv);}); if(!m) return false;
  m.nome=nome; m.unidade=document.getElementById('mr-unidade').value.trim()||m.unidade;
  m.tipo=document.getElementById('mr-tipo').value; m.telefone=document.getElementById('mr-tel').value.trim(); m.email=document.getElementById('mr-email').value.trim();
  addFeed('Cadastro', x.nome, 'Morador atualizado', m.nome+' ('+m.unidade+') editado pela equipe Domus');
  fecharModal('modal-morador-ccd'); render(); toast('Cadastro de '+m.nome+' salvo.');
  return false;
}
function excluirMoradorCcd(){
  var x=condo(document.getElementById('mr-condo').value); var o=oper(x);
  var m=o.moradores.find(function(z){return z.id===parseInt(document.getElementById('mr-id').value);}); if(!m) return;
  if(!confirm('Excluir o morador '+m.nome+' ('+m.unidade+') do cadastro?')) return;
  if(!confirm('Tem certeza? Confirme novamente para excluir '+m.nome+'.')) return;
  o.moradores=o.moradores.filter(function(z){return z.id!==m.id;});
  addFeed('Cadastro', x.nome, 'Morador excluído', m.nome+' ('+m.unidade+') removido do cadastro pela equipe Domus');
  fecharModal('modal-morador-ccd'); render(); toast(m.nome+' excluído do cadastro.');
}
function novoFuncCcd(cid){
  document.getElementById('fc-condo').value=cid; document.getElementById('fc-id').value='';
  document.getElementById('fc-h').textContent='Novo funcionário';
  document.getElementById('fc-del').style.display='none';
  document.getElementById('fc-nome').value=''; document.getElementById('fc-cargo').value=''; document.getElementById('fc-salario').value='';
  abrirModal('modal-func-ccd');
}
function abrirFuncCcd(cid, fid){
  var f=oper(condo(cid)).funcionarios.find(function(z){return z.id===fid;}); if(!f) return;
  document.getElementById('fc-condo').value=cid; document.getElementById('fc-id').value=fid;
  document.getElementById('fc-h').textContent='Editar funcionário';
  document.getElementById('fc-del').style.display='';
  document.getElementById('fc-nome').value=f.nome; document.getElementById('fc-cargo').value=f.cargo; document.getElementById('fc-salario').value=f.salario;
  abrirModal('modal-func-ccd');
}
function salvarFuncCcd(ev){
  ev.preventDefault();
  var x=condo(document.getElementById('fc-condo').value); var o=oper(x);
  var idv=document.getElementById('fc-id').value;
  var nome=document.getElementById('fc-nome').value.trim(); if(!nome){ toast('Informe o nome.'); return false; }
  if(!idv){
    var nid=o.funcionarios.reduce(function(s,z){return Math.max(s,z.id);},0)+1;
    o.funcionarios.push({id:nid, nome:nome, cargo:document.getElementById('fc-cargo').value.trim()||'Auxiliar', salario:parseFloat(document.getElementById('fc-salario').value)||1800, status:'ativo', admissao:hojeISO()});
    addFeed('DP', x.nome, 'Funcionário admitido', nome+' incluído na equipe — admissão encaminhada ao eSocial');
    fecharModal('modal-func-ccd'); render(); toast(nome+' admitido.');
    return false;
  }
  var f=o.funcionarios.find(function(z){return z.id===parseInt(idv);}); if(!f) return false;
  f.nome=nome; f.cargo=document.getElementById('fc-cargo').value.trim()||f.cargo; f.salario=parseFloat(document.getElementById('fc-salario').value)||f.salario;
  addFeed('DP', x.nome, 'Funcionário atualizado', f.nome+' ('+f.cargo+') editado pela equipe Domus');
  fecharModal('modal-func-ccd'); render(); toast('Cadastro de '+f.nome+' salvo.');
  return false;
}
function excluirFuncCcd(){
  var x=condo(document.getElementById('fc-condo').value); var o=oper(x);
  var f=o.funcionarios.find(function(z){return z.id===parseInt(document.getElementById('fc-id').value);}); if(!f) return;
  if(!confirm('Excluir '+f.nome+' ('+f.cargo+') do cadastro? Para rescisão formal, use "Desligar".')) return;
  if(!confirm('Tem certeza? Confirme novamente para excluir '+f.nome+'.')) return;
  o.funcionarios=o.funcionarios.filter(function(z){return z.id!==f.id;});
  addFeed('DP', x.nome, 'Funcionário excluído', f.nome+' ('+f.cargo+') removido do cadastro pela equipe Domus');
  fecharModal('modal-func-ccd'); render(); toast(f.nome+' excluído do cadastro.');
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
    var ac = (b.status==='pago' ? '' : '<button class="btn primary sm" onclick="baixarCota(\''+x.id+'\','+b.id+')">Registrar pagamento</button> <button class="btn sm" onclick="segundaVia(\''+x.id+'\','+b.id+')">2ª via</button> ')
      +'<button class="btn sm" onclick="abrirCotaCcd(\''+x.id+'\','+b.id+')">✎</button>';
    return '<tr><td style="white-space:nowrap"><button class="lnk-cell" onclick="extratoUnidadeCcd(\''+x.id+'\',\''+_esc(b.unidade)+'\')" title="Ver extrato da unidade">'+_esc(b.unidade)+'</button></td><td>'+_esc(b.morador)+'</td><td style="white-space:nowrap">'+mlabelC(b.competencia)+'</td><td style="white-space:nowrap">'+dataBRC(b.vencimento)+'</td><td class="num">'+brl(b.valor)+'</td><td><span class="badge '+b.status+'">'+b.status+'</span></td><td class="num" style="white-space:nowrap">'+ac+'</td></tr>';
  }).join('');
  var sel=function(on,val,lbl){ return '<option value="'+val+'"'+(on===val?' selected':'')+'>'+lbl+'</option>'; };
  var tabela='<div class="card span-12"><h3>Controle de cotas <span class="r">'+lista.length+' registro(s)</span></h3>'
    +'<div class="pg-toolbar"><select class="inp" style="width:auto" onchange="cotasFiltro(\'comp\',this.value)">'+sel(CT_COMP,'','Todas as competências')+comps.map(function(c){return sel(CT_COMP,c,mlabelC(c));}).join('')+'</select>'
    +'<select class="inp" style="width:auto" onchange="cotasFiltro(\'st\',this.value)">'+sel(CT_ST,'','Todos os status')+['aberto','vencido','pago'].map(function(s){return sel(CT_ST,s,s);}).join('')+'</select>'
    +'<input class="inp" id="ct-q" style="width:220px" placeholder="Unidade ou morador…" value="'+_esc(CT_Q)+'" oninput="cotasFiltro(\'q\',this.value)"></div>'
    +'<div class="tblx"><table class="tbl" style="min-width:880px"><thead><tr><th>Unidade</th><th>Morador</th><th>Compet.</th><th>Vencimento</th><th class="num">Valor</th><th>Status</th><th class="num">Ações</th></tr></thead><tbody>'+rows+'</tbody></table></div>'
    +(ord.length>250?'<p class="muted" style="font-size:12px;margin-top:8px">Mostrando 250 de '+ord.length+' — use os filtros.</p>':'')+'</div>';
  return kpis+'<div class="grid">'+inadPorMorador(x)+tabela+'</div>';
}
/* controle de inadimplência por morador (agrupado, com encargos) */
function devedores(x){
  var o=oper(x); var map={};
  o.boletos.filter(function(b){return b.status==='vencido';}).forEach(function(b){
    var k=b.unidade; if(!map[k]) map[k]={unidade:b.unidade, morador:b.morador, n:0, val:0, comps:[]};
    map[k].n++; map[k].val+=b.valor; map[k].comps.push(mlabelC(b.competencia));
  });
  return Object.keys(map).map(function(k){
    var d=map[k];
    d.multa=Math.round(d.val*(x.params.multa||2))/100;
    d.juros=Math.round(d.val*(x.params.juros||1))/100;
    d.total=Math.round((d.val+d.multa+d.juros)*100)/100;
    var m=o.moradores.find(function(z){return z.unidade===d.unidade;});
    d.tel=m?m.telefone:''; d.email=m?m.email:'';
    return d;
  }).sort(function(a,b){return b.total-a.total;});
}
function inadPorMorador(x){
  var dev=devedores(x);
  if(!dev.length) return '<div class="card span-12"><h3>Inadimplência por morador</h3><p class="muted" style="margin-top:8px">Nenhum morador inadimplente. 🎉</p></div>';
  var tot=dev.reduce(function(s,d){return s+d.total;},0);
  var rows=dev.map(function(d){
    return '<tr><td><strong>'+_esc(d.morador)+'</strong><div class="muted" style="font-size:11px">'+_esc(d.tel)+'</div></td><td style="white-space:nowrap"><button class="lnk-cell" onclick="extratoUnidadeCcd(\''+x.id+'\',\''+_esc(d.unidade)+'\')" title="Ver extrato">'+_esc(d.unidade)+'</button></td><td class="num">'+d.n+'</td><td style="white-space:nowrap">'+_esc(d.comps.join(', '))+'</td><td class="num">'+brl(d.val)+'</td><td class="num"><strong>'+brl(d.total)+'</strong><div class="muted" style="font-size:10.5px">+ multa '+brl(d.multa)+' · juros '+brl(d.juros)+'</div></td>'
      +'<td class="num" style="white-space:nowrap"><button class="btn primary sm" onclick="cobrarMorador(\''+x.id+'\',\''+_esc(d.unidade)+'\')">Cobrar agora</button> <button class="btn sm" onclick="extratoUnidadeCcd(\''+x.id+'\',\''+_esc(d.unidade)+'\')">Extrato</button></td></tr>';
  }).join('');
  return '<div class="card span-12"><div class="flex-between"><h3 style="margin:0">Inadimplência por morador <span class="r">'+dev.length+' devedor(es) · '+brl(tot)+' atualizado</span></h3><span class="muted" style="font-size:12px">multa '+(x.params.multa||2)+'% + juros '+(x.params.juros||1)+'% a.m.</span></div>'
    +'<div class="tblx" style="margin-top:8px"><table class="tbl" style="min-width:880px"><thead><tr><th>Morador</th><th>Unidade</th><th class="num">Cotas</th><th>Competências</th><th class="num">Original</th><th class="num">Atualizado</th><th class="num">Ações</th></tr></thead><tbody>'+rows+'</tbody></table></div></div>';
}
function cobrarMorador(cid, unidade){
  var x=condo(cid);
  addFeed('Cobrança', x.nome, 'Cobrança acionada', 'Régua disparada manualmente para a unidade '+unidade+' — mensagem personalizada por e-mail e WhatsApp (modo teste)');
  toast('Agente de Cobrança acionado para a unidade '+unidade+' (modo teste — nada enviado).');
}
function verCotasUnidade(unidade){ CT_Q=unidade.toLowerCase(); CT_ST='vencido'; CT_COMP=''; render(); window.scrollTo(0,300); }
/* extrato da unidade — conta-corrente do condômino, com saldo devedor corrente */
function extratoUnidadeCcd(cid, unidade){
  var x=condo(cid); var o=oper(x);
  var bs=o.boletos.filter(function(b){return b.unidade===unidade;}).slice().sort(function(a,b){return a.competencia<b.competencia?-1:(a.competencia>b.competencia?1:0);});
  if(!bs.length){ toast('Sem cotas para a unidade '+unidade+'.'); return; }
  var morador=(o.moradores.find(function(m){return m.unidade===unidade;})||{nome:bs[0].morador}).nome;
  var movs=[];
  bs.forEach(function(b){
    movs.push({data:b.vencimento, hist:'Emissão da cota '+mlabelC(b.competencia), deb:b.valor, cred:0, st:b.status});
    if(b.status==='pago') movs.push({data:b.vencimento, hist:'Pagamento da cota '+mlabelC(b.competencia), deb:0, cred:b.valor, st:'pago'});
  });
  // saldo devedor corrente (débito de emissão − crédito de pagamento)
  var run=0; movs.forEach(function(m){ run=Math.round((run+m.deb-m.cred)*100)/100; m.saldo=run; });
  var aberto=bs.filter(function(b){return b.status==='aberto'||b.status==='vencido';});
  var devOrig=aberto.reduce(function(s,b){return s+b.valor;},0);
  var venc=bs.filter(function(b){return b.status==='vencido';}).reduce(function(s,b){return s+b.valor;},0);
  var multa=Math.round(venc*(x.params.multa||2))/100, juros=Math.round(venc*(x.params.juros||1))/100;
  var atualizado=Math.round((devOrig+multa+juros)*100)/100;
  var rows=movs.map(function(m){
    return '<tr><td style="white-space:nowrap">'+dataBRC(m.data)+'</td><td>'+_esc(m.hist)+' '+(m.st?'<span class="badge '+m.st+'">'+m.st+'</span>':'')+'</td><td class="num">'+(m.deb?brl(m.deb):'—')+'</td><td class="num">'+(m.cred?brl(m.cred):'—')+'</td><td class="num" style="white-space:nowrap"><strong>'+brl(m.saldo)+'</strong></td></tr>';
  }).join('');
  var resumo='<div class="grid" style="margin-bottom:4px">'
    +'<div class="card kpi span-4" style="padding:14px 16px"><h3>Em aberto</h3><div class="valor" style="font-size:20px">'+brl(devOrig)+'</div><div class="legenda">'+aberto.length+' cota(s)</div></div>'
    +'<div class="card kpi terracota span-4" style="padding:14px 16px"><h3>Vencido + encargos</h3><div class="valor" style="font-size:20px">'+brl(atualizado)+'</div><div class="legenda">multa '+brl(multa)+' · juros '+brl(juros)+'</div></div>'
    +'<div class="card kpi pinho span-4" style="padding:14px 16px"><h3>Cotas pagas</h3><div class="valor" style="font-size:20px">'+bs.filter(function(b){return b.status==='pago';}).length+'</div><div class="legenda">de '+bs.length+' no período</div></div>'
    +'</div>';
  document.querySelector('#modal-prev-ccd .pv-title').textContent='Extrato · Unidade '+unidade;
  document.querySelector('#modal-prev-ccd .pv-sub').innerHTML='<b>'+_esc(morador)+'</b> · '+_esc(x.nome)+' · conta-corrente do condômino';
  document.querySelector('#modal-prev-ccd .pv-body').innerHTML=resumo+'<div class="tblx"><table class="tbl" style="min-width:540px"><thead><tr><th>Data</th><th>Histórico</th><th class="num">Débito</th><th class="num">Crédito</th><th class="num">Saldo devedor</th></tr></thead><tbody>'+rows+'</tbody></table></div>';
  abrirModal('modal-prev-ccd');
}
function abrirCotaCcd(cid, bid){
  var b=oper(condo(cid)).boletos.find(function(z){return z.id===bid;}); if(!b) return;
  document.getElementById('cq-condo').value=cid; document.getElementById('cq-id').value=bid;
  document.getElementById('cq-unidade').value=b.unidade; document.getElementById('cq-morador').value=b.morador;
  document.getElementById('cq-comp').value=b.competencia; document.getElementById('cq-venc').value=b.vencimento;
  document.getElementById('cq-valor').value=b.valor; document.getElementById('cq-status').value=b.status;
  abrirModal('modal-cota-ccd');
}
function salvarCotaCcd(ev){
  ev.preventDefault();
  var x=condo(document.getElementById('cq-condo').value); var b=oper(x).boletos.find(function(z){return z.id===parseInt(document.getElementById('cq-id').value);}); if(!b) return false;
  b.competencia=document.getElementById('cq-comp').value.trim()||b.competencia;
  b.vencimento=document.getElementById('cq-venc').value||b.vencimento;
  b.valor=parseFloat(document.getElementById('cq-valor').value)||b.valor;
  b.status=document.getElementById('cq-status').value;
  syncKpi(x);
  addFeed('Cobrança', x.nome, 'Cobrança editada', 'Cota '+b.unidade+' ('+mlabelC(b.competencia)+') corrigida pela equipe Domus — '+brl(b.valor)+' · '+b.status);
  fecharModal('modal-cota-ccd'); render(); toast('Cobrança da unidade '+b.unidade+' atualizada.');
  return false;
}
function excluirCotaCcd(){
  var x=condo(document.getElementById('cq-condo').value); var o=oper(x);
  var b=o.boletos.find(function(z){return z.id===parseInt(document.getElementById('cq-id').value);}); if(!b) return;
  if(!confirm('Excluir a cobrança da unidade '+b.unidade+' ('+mlabelC(b.competencia)+')?')) return;
  if(!confirm('Tem certeza? Confirme novamente para excluir.')) return;
  o.boletos=o.boletos.filter(function(z){return z.id!==b.id;});
  syncKpi(x);
  addFeed('Cobrança', x.nome, 'Cobrança excluída', 'Cota '+b.unidade+' ('+mlabelC(b.competencia)+') removida pela equipe Domus');
  fecharModal('modal-cota-ccd'); render(); toast('Cobrança excluída.');
}
function baixarCota(cid, bid){
  var x=condo(cid); var b=oper(x).boletos.find(function(z){return z.id===bid;}); if(!b||b.status==='pago') return;
  b.status='pago'; syncKpi(x);
  addFeed('Cobrança', x.nome, 'Pagamento registrado', 'Cota '+b.unidade+' ('+mlabelC(b.competencia)+') — '+brl(b.valor)+' baixada pela equipe Domus');
  render(); toast('Pagamento da unidade '+b.unidade+' registrado.');
}
function segundaVia(cid, bid){
  var x=condo(cid); var b=oper(x).boletos.find(function(z){return z.id===bid;}); if(!b) return;
  addFeed('Cobrança', x.nome, '2ª via emitida', 'Unidade '+b.unidade+' ('+mlabelC(b.competencia)+') — enviada por e-mail ao morador');
  toast('2ª via da unidade '+b.unidade+' gerada e enviada (demo).');
}

/* ---------- aba CONTAS A PAGAR ---------- */
var PG_COMP='', PG_ST='', PG_GRP='', PG_FORN='';
function pagarFiltro(k,v){ if(k==='comp')PG_COMP=v; else if(k==='st')PG_ST=v; else if(k==='grp')PG_GRP=v; else if(k==='forn')PG_FORN=v; render(); }
function pagarLimpar(){ PG_COMP=PG_ST=PG_GRP=PG_FORN=''; render(); }
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
    var ed=' <button class="btn sm" onclick="abrirLancarCcd(\''+x.id+'\','+c.id+')">✎</button>';
    if(c.status==='pendente') return '<button class="btn primary sm" onclick="aprovarCp(\''+x.id+'\','+c.id+')">Aprovar</button> <button class="btn sm" onclick="negarCp(\''+x.id+'\','+c.id+')">Negar</button>'+ed;
    if(c.status==='aprovada') return '<button class="btn pinho sm" onclick="liquidarCp(\''+x.id+'\','+c.id+')">Liquidar</button>'+ed;
    return ed;
  };
  var comps=compsCcd(x);
  var grupos=[]; o.contasPagar.forEach(function(c){ if(grupos.indexOf(c.grupo)<0) grupos.push(c.grupo); }); grupos.sort();
  var forns=[]; o.contasPagar.forEach(function(c){ if(forns.indexOf(c.fornecedor)<0) forns.push(c.fornecedor); }); forns.sort();
  var lista=o.contasPagar.filter(function(c){
    return (!PG_COMP||c.competencia===PG_COMP) && (!PG_ST||c.status===PG_ST) && (!PG_GRP||c.grupo===PG_GRP) && (!PG_FORN||c.fornecedor===PG_FORN);
  });
  var ord=lista.slice().sort(function(a,b){ var r={pendente:0,aprovada:1,paga:2,negada:3}; return (r[a.status]-r[b.status])||(a.vencimento>b.vencimento?1:-1); });
  var totFiltro=lista.reduce(function(s,c){return s+c.valor;},0);
  var rows=ord.map(function(c){
    return '<tr><td style="white-space:nowrap"><strong>'+c.numero+'</strong></td><td style="min-width:280px"><div style="font-weight:600;line-height:1.35">'+_esc(c.descricao)+'</div><div class="muted" style="font-size:11.5px;margin-top:3px">'+_esc(c.fornecedor)+' · '+_esc(c.grupo)+' · '+mlabelC(c.competencia)+'</div></td><td style="white-space:nowrap">'+dataBRC(c.vencimento)+'</td><td class="num"><strong>'+brl(c.valor)+'</strong></td><td><span class="badge '+c.status+'">'+c.status+'</span></td><td class="num" style="white-space:nowrap">'+ac(c)+'</td></tr>';
  }).join('');
  var sel=function(on,val,lbl){ return '<option value="'+_esc(val)+'"'+(on===val?' selected':'')+'>'+_esc(lbl)+'</option>'; };
  var filtros='<div class="pg-toolbar">'
    +'<select class="inp" style="width:auto" onchange="pagarFiltro(\'comp\',this.value)">'+sel(PG_COMP,'','Todas as competências')+comps.map(function(c){return sel(PG_COMP,c,mlabelC(c));}).join('')+'</select>'
    +'<select class="inp" style="width:auto" onchange="pagarFiltro(\'st\',this.value)">'+sel(PG_ST,'','Todos os status')+['pendente','aprovada','paga','negada'].map(function(s){return sel(PG_ST,s,s);}).join('')+'</select>'
    +'<select class="inp" style="width:auto" onchange="pagarFiltro(\'grp\',this.value)">'+sel(PG_GRP,'','Todos os grupos')+grupos.map(function(g){return sel(PG_GRP,g,g);}).join('')+'</select>'
    +'<select class="inp" style="width:auto" onchange="pagarFiltro(\'forn\',this.value)">'+sel(PG_FORN,'','Todos os fornecedores')+forns.map(function(f){return sel(PG_FORN,f,f);}).join('')+'</select>'
    +((PG_COMP||PG_ST||PG_GRP||PG_FORN)?'<button class="btn sm" onclick="pagarLimpar()">Limpar filtros</button>':'')+'</div>';
  var tabela='<div class="card span-12"><div class="flex-between"><h3 style="margin:0">Lançamentos <span class="r">'+lista.length+' de '+o.contasPagar.length+' · '+brl(totFiltro)+'</span></h3><button class="btn primary sm" onclick="abrirLancarCcd(\''+x.id+'\')">+ Lançar conta</button></div>'
    +filtros
    +'<div class="tblx" style="margin-top:10px"><table class="tbl" style="min-width:880px"><thead><tr><th>Nº</th><th style="min-width:280px">Descrição</th><th>Vencimento</th><th class="num">Valor</th><th>Status</th><th class="num">Ações</th></tr></thead><tbody>'+(rows||'<tr><td colspan="6" class="muted" style="padding:18px">Nenhum lançamento com esses filtros.</td></tr>')+'</tbody></table></div>'
    +'<p class="muted" style="font-size:12px;margin-top:10px">Aprovações aqui valem como aprovação da administradora; o agente Pagamentos executa e o Contábil lança o movimento.</p></div>';
  return kpis+'<div class="grid">'+tabela+'</div>';
}
function aprovarCp(cid, id){ var x=condo(cid); var c=oper(x).contasPagar.find(function(z){return z.id===id;}); if(!c||c.status!=='pendente') return; c.status='aprovada'; syncKpi(x); addFeed('Pagamentos', x.nome, 'Conta aprovada', c.numero+' '+c.descricao+' — '+brl(c.valor)+' aprovada pela Domus'); render(); toast(c.numero+' aprovada.'); }
function negarCp(cid, id){ var x=condo(cid); var c=oper(x).contasPagar.find(function(z){return z.id===id;}); if(!c||c.status!=='pendente') return; if(!confirm('Negar o lançamento '+c.numero+' ('+c.descricao+')?')) return; c.status='negada'; syncKpi(x); addFeed('Pagamentos', x.nome, 'Conta negada', c.numero+' '+c.descricao+' recusada pela Domus'); render(); toast(c.numero+' negada.'); }
function liquidarCp(cid, id){ var x=condo(cid); var c=oper(x).contasPagar.find(function(z){return z.id===id;}); if(!c||c.status!=='aprovada') return; c.status='paga'; syncKpi(x); addFeed('Pagamentos', x.nome, 'Fornecedor pago', c.numero+' '+c.descricao+' — '+brl(c.valor)+' liquidada'); render(); toast(c.numero+' liquidada.'); }
function abrirLancarCcd(cid, id){
  document.getElementById('lc-condo').value=cid;
  document.getElementById('lc-id').value=id||'';
  if(id){
    var c=oper(condo(cid)).contasPagar.find(function(z){return z.id===id;}); if(!c) return;
    document.getElementById('lc-h').textContent='Editar lançamento · '+c.numero;
    document.getElementById('lc-del').style.display='';
    document.getElementById('lc-nota').innerHTML='Edição é correção do lançamento — mudanças de status aqui não movimentam o caixa (use Aprovar/Liquidar).';
    document.getElementById('lc-desc').value=c.descricao; document.getElementById('lc-forn').value=c.fornecedor;
    document.getElementById('lc-grupo').value=c.grupo; document.getElementById('lc-valor').value=c.valor;
    document.getElementById('lc-venc').value=c.vencimento; document.getElementById('lc-status').value=c.status;
  } else {
    document.getElementById('lc-h').textContent='Lançar conta a pagar';
    document.getElementById('lc-del').style.display='none';
    document.getElementById('lc-nota').innerHTML='O lançamento entra como <b>pendente</b> na fila de aprovação deste condomínio.';
    document.getElementById('lc-desc').value=''; document.getElementById('lc-forn').value='';
    document.getElementById('lc-valor').value=''; document.getElementById('lc-status').value='pendente';
  }
  abrirModal('modal-lancar-ccd');
}
function salvarLancarCcd(ev){
  ev.preventDefault();
  var x=condo(document.getElementById('lc-condo').value); if(!x) return false;
  var o=oper(x);
  var idv=document.getElementById('lc-id').value;
  var desc=document.getElementById('lc-desc').value.trim();
  var valor=parseFloat(document.getElementById('lc-valor').value)||0;
  if(!desc||!valor){ toast('Preencha descrição e valor.'); return false; }
  if(idv){
    var c=o.contasPagar.find(function(z){return z.id===parseInt(idv);}); if(!c) return false;
    c.descricao=desc; c.fornecedor=document.getElementById('lc-forn').value.trim()||c.fornecedor;
    c.grupo=document.getElementById('lc-grupo').value; c.valor=valor;
    c.vencimento=document.getElementById('lc-venc').value||c.vencimento;
    c.status=document.getElementById('lc-status').value;
    syncKpi(x);
    addFeed('Pagamentos', x.nome, 'Lançamento editado', c.numero+' '+c.descricao+' corrigido pela equipe Domus — '+brl(c.valor)+' · '+c.status);
    fecharModal('modal-lancar-ccd'); render(); toast(c.numero+' atualizado.');
    return false;
  }
  var maxId=o.contasPagar.reduce(function(s,c){return Math.max(s,c.id);},0);
  var nv={id:maxId+1, numero:'LCT-'+('000'+(o.contasPagar.length+1)).slice(-4), descricao:desc, fornecedor:document.getElementById('lc-forn').value.trim()||'(a definir)', grupo:document.getElementById('lc-grupo').value, valor:valor, vencimento:document.getElementById('lc-venc').value||'2026-06-20', competencia:'2026-06', status:'pendente'};
  o.contasPagar.push(nv); syncKpi(x);
  addFeed('Pagamentos', x.nome, 'Conta lançada', nv.numero+' '+nv.descricao+' — '+brl(nv.valor)+' aguardando aprovação');
  fecharModal('modal-lancar-ccd'); render(); toast('Conta '+nv.numero+' lançada como pendente.');
  return false;
}
function excluirLancCcd(){
  var x=condo(document.getElementById('lc-condo').value); var o=oper(x);
  var c=o.contasPagar.find(function(z){return z.id===parseInt(document.getElementById('lc-id').value);}); if(!c) return;
  if(!confirm('Excluir o lançamento '+c.numero+' ('+c.descricao+')?')) return;
  if(!confirm('Tem certeza? Confirme novamente para excluir '+c.numero+'.')) return;
  o.contasPagar=o.contasPagar.filter(function(z){return z.id!==c.id;});
  syncKpi(x);
  addFeed('Pagamentos', x.nome, 'Lançamento excluído', c.numero+' '+c.descricao+' removido pela equipe Domus');
  fecharModal('modal-lancar-ccd'); render(); toast(c.numero+' excluído.');
}

/* ---------- aba CONTÁBIL (fiel ao SGC) ---------- */
var CCD_GRUPOS=['Pessoal','Utilities','Manutenção','Administradora','Impostos','Outros'];
var BL_DE='', BL_ATE='';
function setBlcCcd(k,v){ if(k==='de')BL_DE=v; else BL_ATE=v; if(BL_DE&&BL_ATE&&BL_DE>BL_ATE){ if(k==='de')BL_ATE=v; else BL_DE=v; } render(); }
function blcPeriodo(x){ var cs=compsCcd(x); if(!cs.length) return {de:'',ate:''}; var de=(BL_DE&&cs.indexOf(BL_DE)>=0)?BL_DE:cs[0]; var ate=(BL_ATE&&cs.indexOf(BL_ATE)>=0)?BL_ATE:cs[cs.length-1]; if(de>ate) de=cs[0]; return {de:de, ate:ate}; }
function condoContabil(x){
  var o=oper(x); var per=blcPeriodo(x);
  var inR=function(c){ return c>=per.de && c<=per.ate; };
  var recPer=o.boletos.filter(function(b){return b.status==='pago'&&inR(b.competencia);}).reduce(function(s,b){return s+b.valor;},0);
  var despPagas=o.contasPagar.filter(function(c){return c.status==='paga'&&inR(c.competencia);});
  var despPer=despPagas.reduce(function(s,c){return s+c.valor;},0);
  var grupos={};
  o.contasPagar.filter(function(c){return c.status!=='negada'&&inR(c.competencia);}).forEach(function(c){ grupos[c.grupo]=(grupos[c.grupo]||0)+c.valor; });
  var gKeys=Object.keys(grupos).sort(function(a,b){return grupos[b]-grupos[a];});
  var maxG=gKeys.length?grupos[gKeys[0]]:1;
  var bars=gKeys.map(function(g){ var pct=Math.round(grupos[g]/maxG*100); return '<div class="kv"><span class="k" style="flex:0 0 150px">'+_esc(g)+'</span><span style="flex:1;display:flex;align-items:center;gap:10px"><span style="flex:1;height:9px;background:var(--areia);border:1px solid var(--linha);border-radius:99px;overflow:hidden"><span style="display:block;height:100%;width:'+pct+'%;background:var(--pinho);border-radius:99px"></span></span><span class="v" style="white-space:nowrap">'+brl(grupos[g])+'</span></span></div>'; }).join('');
  var res=recPer-despPer;
  var lbl = mlabelC(per.de)+(per.de!==per.ate?' a '+mlabelC(per.ate):'');
  var kpis='<div class="grid">'
    +kpi('Receita recebida', brl(recPer), 'Cotas pagas no período','pinho')
    +kpi('Despesas pagas', brl(despPer), despPagas.length+' lançamento(s) liquidado(s)','terracota')
    +kpi('Resultado de caixa', brl(res), res>=0?'Superávit':'Déficit', res>=0?'pinho':'terracota')
    +kpi('Saldo em caixa', brl(x.kpi.saldo||0), 'Posição atual','')
    +'</div>';
  var dre='<div class="card span-6"><h3>DRE simplificada · '+lbl+'</h3>'
    +kv('(+) Receita de cotas', brl(recPer))+kv('(−) Despesas operacionais', brl(despPer))+kv('(=) Resultado', brl(res))
    +'<p class="muted" style="font-size:12px;margin-top:12px">Demonstrações completas (DRE, Balanço, Fluxo, Balancete) no SGC do condomínio'+(x.sgcUrl?' — <a href="#" onclick="abrirSGC(\''+x.id+'\');return false" style="color:var(--pinho);font-weight:600">abrir SGC ↗</a>':'')+'.</p></div>';
  var despCard='<div class="card span-6"><h3>Despesas por grupo · período</h3>'+(bars||'<p class="muted">Sem despesas no período.</p>')+'</div>';
  return kpis+'<div class="grid">'+dre+despCard+balanceteCard(x)+'</div>';
}

/* ---------- balancete de verificação + razão (partidas dobradas, padrão SGC) ---------- */
function codGrupoCcd(g){ var i=CCD_GRUPOS.indexOf(g); return '5.'+((i<0?CCD_GRUPOS.length:i)+1); }
function calcBalanceteCcd(x, de, ate){
  var o=oper(x);
  var inR=function(c){ return c>=de && c<=ate; }, before=function(c){ return c<de; };
  var cs=compsCcd(x); var prev=cs[cs.indexOf(de)-1];
  var E=o.boletos.filter(function(b){return inR(b.competencia);}).reduce(function(s,b){return s+b.valor;},0);
  var R=o.boletos.filter(function(b){return b.status==='pago' && inR(b.competencia);}).reduce(function(s,b){return s+b.valor;},0);
  var desp=o.contasPagar.filter(function(c){return c.status!=='negada' && inR(c.competencia);});
  var P=desp.reduce(function(s,c){return s+c.valor;},0);
  var G=o.contasPagar.filter(function(c){return c.status==='paga' && inR(c.competencia);}).reduce(function(s,c){return s+c.valor;},0);
  var caixaIni = prev ? saldoCaixaAteCcd(x, prev) : (o.saldoInicial||0);
  var crIni=o.boletos.filter(function(b){return (b.status==='aberto'||b.status==='vencido') && before(b.competencia);}).reduce(function(s,b){return s+b.valor;},0);
  var cpIni=o.contasPagar.filter(function(c){return (c.status==='pendente'||c.status==='aprovada') && before(c.competencia);}).reduce(function(s,c){return s+c.valor;},0);
  var plIni=caixaIni+crIni-cpIni;
  var conta=function(cod,nome,ini,deb,cred,nat,rk){ return {tipo:'c',cod:cod,nome:nome,ini:ini,deb:deb,cred:cred,nat:nat,fim:nat==='D'?ini+deb-cred:ini+cred-deb,rk:rk}; };
  var linhas=[];
  var sec=function(cod,nome,cts){ linhas.push({tipo:'h',cod:cod,nome:nome}); cts.forEach(function(c){linhas.push(c);}); linhas.push({tipo:'s',nome:'Subtotal '+nome,ini:cts.reduce(function(s,c){return s+c.ini;},0),deb:cts.reduce(function(s,c){return s+c.deb;},0),cred:cts.reduce(function(s,c){return s+c.cred;},0),fim:cts.reduce(function(s,c){return s+c.fim;},0)}); };
  sec('1','ATIVO',[conta('1.1.01','Caixa e equivalentes (disponível)',caixaIni,R,G,'D','caixa'),conta('1.1.02','Contas a receber — cotas condominiais',crIni,E,R,'D','receber')]);
  sec('2','PASSIVO',[conta('2.1.01','Contas a pagar — fornecedores',cpIni,G,P,'C','forn')]);
  sec('3','PATRIMÔNIO LÍQUIDO',[conta('3.1.01','Fundo de reserva / superávit acumulado',plIni,0,0,'C','pl')]);
  sec('4','RECEITAS',[conta('4.1.01','Taxas condominiais',0,0,E,'C','receita')]);
  linhas.push({tipo:'h',cod:'5',nome:'DESPESAS'});
  var dDeb=0, dFim=0;
  CCD_GRUPOS.forEach(function(g){
    var items = g==='Outros' ? desp.filter(function(c){return CCD_GRUPOS.indexOf(c.grupo)<0 || c.grupo==='Outros';}) : desp.filter(function(c){return c.grupo===g;});
    if(!items.length) return;
    var forns={}; items.forEach(function(c){ forns[c.fornecedor]=(forns[c.fornecedor]||0)+c.valor; });
    linhas.push({tipo:'h2',cod:codGrupoCcd(g),nome:g});
    var cts=[]; var i=0;
    Object.keys(forns).sort().forEach(function(fn){ i++; cts.push(conta(codGrupoCcd(g)+'.'+('00'+i).slice(-3), fn, 0, forns[fn], 0, 'D', 'desp|'+g+'|'+fn)); });
    cts.forEach(function(c){ linhas.push(c); });
    var sd=cts.reduce(function(s,c){return s+c.deb;},0), sf=cts.reduce(function(s,c){return s+c.fim;},0);
    linhas.push({tipo:'s',nome:'Subtotal '+g,ini:0,deb:sd,cred:0,fim:sf}); dDeb+=sd; dFim+=sf;
  });
  linhas.push({tipo:'s',nome:'Subtotal DESPESAS',ini:0,deb:dDeb,cred:0,fim:dFim});
  var cc=linhas.filter(function(l){return l.tipo==='c';});
  return {linhas:linhas, de:de, ate:ate, prev:prev, caixaIni:caixaIni, crIni:crIni, cpIni:cpIni, plIni:plIni,
    totDeb:cc.reduce(function(s,l){return s+l.deb;},0), totCred:cc.reduce(function(s,l){return s+l.cred;},0),
    totFimD:cc.filter(function(l){return l.nat==='D';}).reduce(function(s,l){return s+l.fim;},0),
    totFimC:cc.filter(function(l){return l.nat==='C';}).reduce(function(s,l){return s+l.fim;},0)};
}
function balanceteCard(x){
  var per=blcPeriodo(x), cs=compsCcd(x);
  var b=calcBalanceteCcd(x, per.de, per.ate);
  var fmtb=function(v){ return v?brl(v):'–'; };
  var rows=b.linhas.map(function(l){
    if(l.tipo==='h') return '<tr class="grp"><td>'+l.cod+'</td><td>'+_esc(l.nome)+'</td><td></td><td></td><td></td><td></td><td></td></tr>';
    if(l.tipo==='h2') return '<tr><td class="muted">'+l.cod+'</td><td style="font-weight:600">'+_esc(l.nome)+'</td><td></td><td></td><td></td><td></td><td></td></tr>';
    if(l.tipo==='s') return '<tr style="font-weight:600;background:rgba(228,200,180,.12)"><td></td><td>'+_esc(l.nome)+'</td><td class="num">'+fmtb(l.ini)+'</td><td class="num">'+fmtb(l.deb)+'</td><td class="num">'+fmtb(l.cred)+'</td><td class="num">'+fmtb(l.fim)+'</td><td></td></tr>';
    return '<tr><td class="muted">'+l.cod+'</td><td style="padding-left:20px">'+_esc(l.nome)+'</td><td class="num">'+fmtb(l.ini)+'</td><td class="num">'+fmtb(l.deb)+'</td><td class="num">'+fmtb(l.cred)+'</td><td class="num">'+fmtb(l.fim)+' <span class="muted" style="font-size:10px">'+l.nat+'</span></td><td class="num"><button class="btn sm" onclick="verRazaoCcd(\''+x.id+'\',\''+l.rk+'\')">Razão</button></td></tr>';
  }).join('');
  var ok=Math.abs(b.totDeb-b.totCred)<0.5 && Math.abs(b.totFimD-b.totFimC)<0.5;
  var selDe='<select class="inp" style="width:auto" onchange="setBlcCcd(\'de\',this.value)">'+cs.map(function(c){return '<option value="'+c+'"'+(c===per.de?' selected':'')+'>'+mlabelC(c)+'</option>';}).join('')+'</select>';
  var selAte='<select class="inp" style="width:auto" onchange="setBlcCcd(\'ate\',this.value)">'+cs.map(function(c){return '<option value="'+c+'"'+(c===per.ate?' selected':'')+'>'+mlabelC(c)+'</option>';}).join('')+'</select>';
  return '<div class="card span-12"><div class="flex-between"><h3 style="margin:0">Balancete de Verificação <span class="chip">competência</span></h3><div style="display:flex;gap:8px;align-items:center"><label style="font-size:11px;color:var(--musgo);font-weight:600">De</label>'+selDe+'<label style="font-size:11px;color:var(--musgo);font-weight:600">Até</label>'+selAte+'</div></div>'
    +'<div class="tblx"><table class="tbl" style="min-width:920px;margin-top:12px"><thead><tr><th>Código</th><th>Conta</th><th class="num">Saldo inicial</th><th class="num">Débito</th><th class="num">Crédito</th><th class="num">Saldo final</th><th class="num">Razão</th></tr></thead><tbody>'+rows
    +'<tr style="font-weight:700;border-top:2px solid var(--linha)"><td></td><td>TOTAIS</td><td class="num">—</td><td class="num">'+brl(b.totDeb)+'</td><td class="num">'+brl(b.totCred)+'</td><td class="num">—</td><td></td></tr>'
    +'</tbody></table></div>'
    +'<p class="muted" style="font-size:12px;margin-top:10px">Contas patrimoniais (Ativo, Passivo, PL) e de resultado (Receitas, Despesas). '+(ok?'Verificação: <strong>Σ débitos = Σ créditos</strong> ('+brl(b.totDeb)+') e saldos finais <strong>devedores = credores</strong> ('+brl(b.totFimD)+').':'⚠ diferença a verificar.')+' Clique em <b>Razão</b> para abrir os movimentos — mesmo padrão do SGC.</p></div>';
}
function razaoMovsCcd(x, rk, de, ate){
  var o=oper(x); var b=calcBalanceteCcd(x, de, ate);
  var inR=function(c){ return c>=de && c<=ate; };
  var cs=compsCcd(x).filter(inR);
  var movs=[];
  function emis(c){ var bs=o.boletos.filter(function(z){return z.competencia===c;}); return {n:bs.length,val:bs.reduce(function(s,z){return s+z.valor;},0)}; }
  function rec(c){ var bs=o.boletos.filter(function(z){return z.competencia===c && z.status==='pago';}); return {n:bs.length,val:bs.reduce(function(s,z){return s+z.valor;},0)}; }
  if(rk==='caixa'){
    movs.push({data:de+'-01', hist:'Saldo inicial de caixa', deb:b.caixaIni, cred:0});
    cs.forEach(function(c){ var r=rec(c); if(r.val) movs.push({data:c+'-15', hist:'Recebimento de cotas '+mlabelC(c)+' ('+r.n+' un.)', deb:r.val, cred:0}); });
    o.contasPagar.filter(function(z){return z.status==='paga' && inR(z.competencia);}).forEach(function(z){ movs.push({data:z.vencimento, hist:'Pagamento '+z.numero+' — '+z.descricao, deb:0, cred:z.valor}); });
  } else if(rk==='receber'){
    movs.push({data:de+'-01', hist:'Saldo inicial — cotas a receber', deb:b.crIni, cred:0});
    cs.forEach(function(c){ var e=emis(c); if(e.val) movs.push({data:c+'-01', hist:'Emissão de cotas '+mlabelC(c)+' ('+e.n+' un.)', deb:e.val, cred:0}); var r=rec(c); if(r.val) movs.push({data:c+'-15', hist:'Baixa por recebimento '+mlabelC(c)+' ('+r.n+' un.)', deb:0, cred:r.val}); });
  } else if(rk==='forn'){
    movs.push({data:de+'-01', hist:'Saldo inicial — fornecedores', deb:0, cred:b.cpIni});
    o.contasPagar.filter(function(z){return z.status!=='negada' && inR(z.competencia);}).forEach(function(z){ movs.push({data:z.vencimento, hist:'Lançamento '+z.numero+' — '+z.descricao, deb:0, cred:z.valor}); if(z.status==='paga') movs.push({data:z.vencimento, hist:'Pagamento '+z.numero, deb:z.valor, cred:0}); });
  } else if(rk==='pl'){
    movs.push({data:de+'-01', hist:'Fundo de reserva / superávit acumulado (abertura)', deb:0, cred:b.plIni});
  } else if(rk==='receita'){
    cs.forEach(function(c){ var e=emis(c); if(e.val) movs.push({data:c+'-01', hist:'Receita de cotas '+mlabelC(c)+' ('+e.n+' un.)', deb:0, cred:e.val}); });
  } else if(rk.indexOf('desp|')===0){
    var parts=rk.split('|'); var g=parts[1], fn=parts[2];
    o.contasPagar.filter(function(z){return z.status!=='negada' && inR(z.competencia) && z.fornecedor===fn && (z.grupo===g || (g==='Outros' && CCD_GRUPOS.indexOf(z.grupo)<0));}).forEach(function(z){ movs.push({data:z.vencimento, hist:z.numero+' — '+z.descricao, deb:z.valor, cred:0}); });
  }
  movs.sort(function(a,bb){ return a.data<bb.data?-1:1; });
  var natC = (rk==='forn'||rk==='pl'||rk==='receita');
  var run=0; movs.forEach(function(m){ run = natC ? Math.round((run+m.cred-m.deb)*100)/100 : Math.round((run+m.deb-m.cred)*100)/100; m.saldo=run; m.natC=natC; });
  return movs;
}
function verRazaoCcd(cid, rk){
  var x=condo(cid); var per=blcPeriodo(x);
  var b=calcBalanceteCcd(x, per.de, per.ate);
  var linha=b.linhas.find(function(l){return l.tipo==='c' && l.rk===rk;}); if(!linha) return;
  var movs=razaoMovsCcd(x, rk, per.de, per.ate);
  var rows=movs.slice(0,120).map(function(m){
    var sl = m.saldo>=0 ? brl(m.saldo)+(m.natC?' C':' D') : brl(-m.saldo)+(m.natC?' D':' C');
    return '<tr><td style="white-space:nowrap">'+dataBRC(m.data)+'</td><td>'+_esc(m.hist)+'</td><td class="num">'+(m.deb?brl(m.deb):'—')+'</td><td class="num">'+(m.cred?brl(m.cred):'—')+'</td><td class="num" style="white-space:nowrap">'+sl+'</td></tr>';
  }).join('');
  document.querySelector('#modal-prev-ccd .pv-title').textContent='Razão · '+linha.cod+' '+linha.nome;
  document.querySelector('#modal-prev-ccd .pv-sub').innerHTML=_esc(x.nome)+' · '+mlabelC(per.de)+(per.de!==per.ate?' a '+mlabelC(per.ate):'')+' · '+movs.length+' movimento(s)'+(movs.length>120?' (mostrando 120)':'');
  document.querySelector('#modal-prev-ccd .pv-body').innerHTML='<div class="tblx"><table class="tbl" style="min-width:540px"><thead><tr><th>Data</th><th>Histórico</th><th class="num">Débito</th><th class="num">Crédito</th><th class="num">Saldo</th></tr></thead><tbody>'+rows+'</tbody></table></div>';
  abrirModal('modal-prev-ccd');
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
  var devAll=[];
  CCD.forEach(function(x){ devedores(x).forEach(function(d){ d.condoNome=x.nome; d.condoId=x.id; devAll.push(d); }); });
  var topRows=devAll.sort(function(a,b){return b.total-a.total;}).slice(0,10).map(function(d){
    return '<tr><td><strong>'+_esc(d.morador)+'</strong><div class="muted" style="font-size:11px">'+_esc(d.condoNome)+'</div></td><td style="white-space:nowrap"><button class="lnk-cell" onclick="extratoUnidadeCcd(\''+d.condoId+'\',\''+_esc(d.unidade)+'\')" title="Ver extrato">'+_esc(d.unidade)+'</button></td><td class="num">'+d.n+'</td><td class="num"><strong>'+brl(d.total)+'</strong></td><td class="num" style="white-space:nowrap"><button class="btn primary sm" onclick="cobrarMorador(\''+d.condoId+'\',\''+_esc(d.unidade)+'\')">Cobrar</button> <button class="btn sm" onclick="abrirCondo(\''+d.condoId+'\',\'cotas\')">Abrir</button></td></tr>';
  }).join('');
  var topCard='<div class="card span-12"><div class="flex-between"><h3 style="margin:0">Top devedores da base <span class="r">'+devAll.length+' morador(es) inadimplente(s)</span></h3><span class="muted" style="font-size:12px">valor atualizado com multa e juros</span></div>'
    +(devAll.length?'<div class="tblx" style="margin-top:8px"><table class="tbl" style="min-width:680px"><thead><tr><th>Morador · condomínio</th><th>Unidade</th><th class="num">Cotas</th><th class="num">Devido</th><th class="num">Ações</th></tr></thead><tbody>'+topRows+'</tbody></table></div>':'<p class="muted" style="margin-top:8px">Base 100% adimplente. 🎉</p>')+'</div>';
  var com='<div class="card span-12"><div class="flex-between"><h3 style="margin:0">Comunicação em lote</h3><button class="btn primary sm" onclick="abrirAvisoCcd(null)">+ Aviso para vários condomínios</button></div><p class="muted" style="font-size:12.5px;margin-top:8px">Publique um comunicado de uma vez para os SGCs e Apps dos condomínios selecionados — ex.: recesso de fim de ano, campanhas, mudanças de processo.</p></div>';
  var note='<div class="ai-note"><svg class="ic" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2E5A4F" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a8 8 0 0 0 .1-6M4.5 9a8 8 0 0 0 .1 6"/></svg><div>Visão <strong>gerencial consolidada</strong>: a Domus enxerga e opera o SGC de todos os condomínios daqui — cotas, aprovações, folha e comunicação. Para o detalhe de um condomínio, abra a ficha dele.</div></div>';
  return note+kpis+'<div class="grid">'+filaCard+inadCard+topCard+com+'</div>';
}
