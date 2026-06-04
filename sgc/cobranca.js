/* =========================================================================
   AGENTE DE COBRANÇA — MODO DE TESTE (não envia nada)
   Executa a régua de cobrança sobre a carteira a receber e monta, de forma
   personalizada por morador, as mensagens de e-mail e WhatsApp. Tudo é
   pré-visualização: nenhum disparo real é feito.
   ========================================================================= */

var COB_TESTE = true; // trava de segurança: enquanto true, nada é enviado
var COB_SINDICO = 'Helena Martins';

/* ---------- mensagens padrão por etapa (assunto/e-mail/whatsapp) ---------- */
var COB_MSG = {
  'Lembrete amigável': {
    assunto: 'Lembrete: a cota de {{competencia}} vence em {{vencimento}}',
    wpp: 'Olá, {{primeiro_nome}}! 🏛️\nPassando para lembrar que a cota condominial da unidade {{unidade}} ({{competencia}}) vence em *{{vencimento}}*, no valor de *{{valor}}*.\nVocê já pode pagar pelo PIX: {{pix}}\nObrigado por manter seu lar em dia! 💙\n— {{condominio}}',
    email: 'Olá, {{nome}},\n\nPassando para lembrar, com carinho, que a cota condominial da sua unidade {{unidade}} referente a {{competencia}} vence em {{vencimento}}, no valor de {{valor}}.\n\nVocê pode pagar de forma rápida:\n• PIX (chave): {{pix}}\n• Linha digitável: {{linha_digitavel}}\n\nSe o pagamento já foi feito, por favor desconsidere este lembrete.\n\nUm abraço,\n{{sindico}} — {{condominio}}'
  },
  'Aviso no vencimento': {
    assunto: 'Sua cota de {{competencia}} vence hoje',
    wpp: 'Oi, {{primeiro_nome}}! 📅\nHoje é o dia do vencimento da cota de {{competencia}} (unidade {{unidade}}) — *{{valor}}*.\nPague pelo PIX {{pix}} e fique em dia, sem encargos.\n— {{condominio}}',
    email: 'Olá, {{nome}},\n\nHoje, {{vencimento}}, vence a cota condominial da unidade {{unidade}} referente a {{competencia}}, no valor de {{valor}}.\n\nPara evitar multa e juros, pague ainda hoje:\n• PIX (chave): {{pix}}\n• Linha digitável: {{linha_digitavel}}\n\nObrigado!\n{{sindico}} — {{condominio}}'
  },
  '1º aviso de atraso': {
    assunto: 'Cota de {{competencia}} em aberto — unidade {{unidade}}',
    wpp: 'Oi, {{primeiro_nome}}.\nNotamos que a cota de {{competencia}} (unidade {{unidade}}), vencida em {{vencimento}}, está em aberto.\nRegularize hoje pelo PIX {{pix}} para evitar multa e juros. 🙏\nSe precisar de ajuda ou de um acordo, é só responder por aqui.\n— {{condominio}}',
    email: 'Olá, {{nome}},\n\nIdentificamos que a cota de {{competencia}} (unidade {{unidade}}), vencida em {{vencimento}}, ainda consta em aberto.\n\nRegularize hoje para evitar a incidência de multa e juros. PIX: {{pix}}.\n\nSe preferir negociar, estamos à disposição.\n\n{{sindico}} — {{condominio}}'
  },
  '2ª via + encargos': {
    assunto: '2ª via — cota de {{competencia}} em aberto (unidade {{unidade}})',
    email: 'Prezado(a) {{nome}},\n\nA cota condominial da unidade {{unidade}} referente a {{competencia}} permanece em aberto há {{dias_atraso}} dias.\n\nDemonstrativo do débito atualizado:\n• Valor original: {{valor}}\n• Multa (2%): {{multa}}\n• Juros (1% a.m., pro rata): {{juros}}\n• Total atualizado: {{valor_atualizado}}\n\nSegue a 2ª via para pagamento:\n• PIX (chave): {{pix}}\n• Linha digitável: {{linha_digitavel}}\n\nCaso deseje parcelar, podemos avaliar um acordo. Conte conosco.\n\nAtenciosamente,\n{{sindico}} — {{condominio}}',
    wpp: 'Olá, {{primeiro_nome}}. A cota de {{competencia}} (unidade {{unidade}}) está em aberto há {{dias_atraso}} dias.\nTotal atualizado: *{{valor_atualizado}}*\n(valor {{valor}} + multa {{multa}} + juros {{juros}}).\nEnviamos a 2ª via para o seu e-mail. PIX: {{pix}}.\n— {{condominio}}'
  },
  'Cobrança formal': {
    assunto: 'Cobrança — débito condominial em aberto (unidade {{unidade}})',
    email: 'Prezado(a) {{nome}},\n\nConsta em nossos registros o débito da cota condominial da unidade {{unidade}}, competência {{competencia}}, vencida em {{vencimento}} e em aberto há {{dias_atraso}} dias.\n\nValor atualizado até a presente data: {{valor_atualizado}}\n(valor original {{valor}} + multa {{multa}} + juros {{juros}}).\n\nSolicitamos a regularização no prazo de 5 (cinco) dias. A manutenção do débito poderá ensejar as medidas previstas na convenção do condomínio e na legislação, com a continuidade da incidência de encargos.\n\nPara quitar ou negociar: PIX {{pix}}.\n\nAtenciosamente,\n{{sindico}} — {{condominio}}',
    wpp: 'Prezado(a) {{primeiro_nome}}, o débito da cota {{competencia}} (unidade {{unidade}}) está vencido há {{dias_atraso}} dias — total atualizado *{{valor_atualizado}}*.\nPedimos a regularização em até 5 dias para evitar medidas previstas na convenção. Podemos negociar. PIX {{pix}}.\n— {{condominio}}'
  },
  'Notificação extrajudicial': {
    assunto: 'Notificação extrajudicial — débito condominial (unidade {{unidade}})',
    email: 'Prezado(a) {{nome}},\n\nNa qualidade de administração do {{condominio}}, NOTIFICAMOS V.Sa. de que o débito da cota condominial da unidade {{unidade}}, competência {{competencia}}, vencida em {{vencimento}}, encontra-se em aberto há {{dias_atraso}} dias, totalizando {{valor_atualizado}} (valor original {{valor}}, multa {{multa}} e juros {{juros}}).\n\nFica V.Sa. NOTIFICADO(A) a quitar o débito no prazo de 10 (dez) dias a contar do recebimento desta. Persistindo a inadimplência, o condomínio adotará as medidas cabíveis, incluindo protesto e ação de cobrança, nos termos do art. 1.336, §1º, do Código Civil e da convenção condominial, acrescidas as custas e honorários.\n\nPara regularização imediata: PIX {{pix}} ou linha digitável {{linha_digitavel}}.\n\n{{sindico}}\nSíndico(a) — {{condominio}}',
    wpp: 'Prezado(a) {{primeiro_nome}}, esta é uma notificação sobre o débito da cota {{competencia}} (unidade {{unidade}}), em aberto há {{dias_atraso}} dias — total {{valor_atualizado}}. Enviamos a notificação completa por e-mail/carta. Para regularizar: PIX {{pix}}.\n— {{condominio}}'
  }
};

/* lista de variáveis disponíveis (para o editor) */
var COB_VARS = ['nome','primeiro_nome','unidade','bloco','condominio','competencia','vencimento','dias_atraso','valor','multa','juros','valor_atualizado','pix','linha_digitavel','sindico'];

/* ---------- aplica os templates padrão à régua (idempotente) ---------- */
function cobAplicarTemplates(){
  (DATA.regua||[]).forEach(function(e){
    var d = COB_MSG[e.rotulo];
    if(!e.canais) e.canais = [e.canal||'email'];
    if(d){
      if(e.assunto==null||e.assunto==='') e.assunto = d.assunto||'';
      if(e.email==null||e.email==='')     e.email   = d.email||'';
      if(e.wpp==null||e.wpp==='')         e.wpp     = d.wpp||'';
    } else {
      if(e.assunto==null) e.assunto='';
      if(e.email==null)   e.email = e.msg||'';
      if(e.wpp==null)     e.wpp   = e.msg||'';
    }
  });
}

/* ---------- helpers de dados ---------- */
function cobUnidade(uid){ return (DATA.unidades||[]).find(function(u){return u.id===uid;}) || {num:'?',bloco:'?'}; }
function cobUnidadeLabel(uid){ var u=cobUnidade(uid); return u.num+'-'+u.bloco; }
function cobMoradorDe(uid){
  var ms=(DATA.moradores||[]).filter(function(m){return m.unidade_id===uid;});
  return ms.find(function(m){return m.tipo!=='inquilino';}) || ms[0] || {nome:'Morador',email:'',telefone:''};
}
function cobDiasAtraso(b){ var v=new Date(b.vencimento+'T00:00:00'); return Math.round((HOJE - v)/86400000); }
function cobEncargos(valor, dias){
  if(dias<=0) return {multa:0, juros:0, total:valor};
  var multa = Math.round(valor*0.02*100)/100;
  var juros = Math.round(valor*(0.01/30)*dias*100)/100;
  return {multa:multa, juros:juros, total:Math.round((valor+multa+juros)*100)/100};
}
function cobLinhaDigitavel(b){
  var p=String(b.unidade_id).padStart(3,'0');
  var cents=String(Math.round(b.valor*100)).padStart(8,'0');
  return '34191.79001 0'+p+'3.510047 91020.150008 6 9665'+cents;
}
function cobVars(b, etapa){
  var u=cobUnidade(b.unidade_id), m=cobMoradorDe(b.unidade_id);
  var dias=cobDiasAtraso(b); var enc=cobEncargos(b.valor, dias);
  return {
    nome: m.nome,
    primeiro_nome: (m.nome||'').split(' ')[0],
    unidade: u.num+'-'+u.bloco,
    bloco: u.bloco,
    condominio: DATA.condominio.nome,
    competencia: mlabel(b.competencia),
    vencimento: dataBR(b.vencimento),
    dias_atraso: Math.max(0,dias),
    valor: brl(b.valor),
    multa: brl(enc.multa),
    juros: brl(enc.juros),
    valor_atualizado: brl(enc.total),
    pix: DATA.condominio.cnpj,
    linha_digitavel: cobLinhaDigitavel(b),
    sindico: COB_SINDICO,
    _morador: m, _enc: enc, _dias: dias
  };
}
function cobRender(tpl, vars){
  return String(tpl||'').replace(/\{\{(\w+)\}\}/g, function(_,k){ return (vars[k]!=null)?vars[k]:('{{'+k+'}}'); });
}
function _esc(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function _nl(s){ return _esc(s).replace(/\n/g,'<br>'); }

/* etapa aplicável AGORA conforme dias de atraso (maior off <= dias) */
function cobEtapaAplicavel(dias){
  var cand=(DATA.regua||[]).filter(function(e){return e.ativo && e.off<=dias;});
  if(!cand.length) return null;
  return cand.sort(function(a,b){return a.off-b.off;})[cand.length-1];
}

/* fila ativa de hoje: boletos em aberto/vencidos com etapa aplicável */
function cobFila(){
  var out=[];
  (DATA.boletos||[]).filter(function(b){return b.status==='aberto'||b.status==='vencido';}).forEach(function(b){
    var dias=cobDiasAtraso(b);
    var etapa=cobEtapaAplicavel(dias);
    if(etapa) out.push({b:b, etapa:etapa, dias:dias});
  });
  return out.sort(function(x,y){ return (y.dias-x.dias) || (x.b.unidade_id-y.b.unidade_id); });
}

/* disparos agendados (próximos 30 dias) */
function cobAgenda(){
  var fim=new Date(HOJE); fim.setDate(fim.getDate()+30);
  var rows=[];
  (DATA.boletos||[]).filter(function(b){return b.status==='aberto'||b.status==='vencido';}).forEach(function(b){
    (DATA.regua||[]).filter(function(e){return e.ativo;}).forEach(function(e){
      var d=new Date(b.vencimento+'T00:00:00'); d.setDate(d.getDate()+e.off);
      if(d>=HOJE && d<=fim){
        var di=d.toISOString().slice(0,10), k=e.rotulo+'|'+b.competencia+'|'+di;
        var r=rows.find(function(x){return x.k===k;});
        if(!r){ r={k:k, rotulo:e.rotulo, canais:e.canais||[e.canal], comp:b.competencia, data:di, n:0, off:e.off}; rows.push(r); }
        r.n++;
      }
    });
  });
  return rows.sort(function(a,b){ return a.data<b.data?-1:(a.data>b.data?1:a.off-b.off); });
}

/* ---------- componentes visuais ---------- */
function _canalChip(c){
  if(c==='whatsapp') return '<span class="chip cob-ch wpp">WhatsApp</span>';
  if(c==='email')    return '<span class="chip cob-ch eml">E-mail</span>';
  if(c==='carta')    return '<span class="chip cob-ch crt">Carta</span>';
  return '<span class="chip cob-ch">'+_esc(c)+'</span>';
}
function _offLabel(off){ return off<0?(off+'d'):(off===0?'D0':'+'+off+'d'); }

function renderCobranca(){
  cobAplicarTemplates();
  var PG='<svg class="portal" viewBox="0 0 100 100"><path d="M18 92 L18 46 A32 32 0 0 1 82 46 L82 92" stroke-width="10"></path><path d="M38 92 L38 56 A12 12 0 0 1 62 56 L62 92" stroke-width="10"></path></svg>';
  var abertos=(DATA.boletos||[]).filter(function(b){return b.status==='aberto'||b.status==='vencido';});
  var vencidos=abertos.filter(function(b){return b.status==='vencido';});
  var valAberto=abertos.reduce(function(s,b){return s+b.valor;},0);
  var valVencido=vencidos.reduce(function(s,b){return s+cobEncargos(b.valor,cobDiasAtraso(b)).total;},0);
  var fila=cobFila();
  var msgs=fila.reduce(function(s,f){return s+((f.etapa.canais||[f.etapa.canal]).length);},0);

  // banner modo teste
  var banner='<div class="cob-banner"><span class="ic">🧪</span><div><b>Modo de teste ativado.</b> O agente monta e personaliza cada mensagem por morador, mas <u>nada é enviado</u> — nem e-mail, nem WhatsApp. Use as prévias abaixo para revisar a régua e os textos.</div></div>';

  // kpis
  var kpis='<div class="grid">'
    +'<div class="card kpi span-3"><h3>Carteira em aberto</h3><div class="valor">'+brl(valAberto)+'</div><div class="legenda">'+abertos.length+' cota(s) a receber</div></div>'
    +'<div class="card kpi terracota span-3"><h3>Inadimplentes</h3><div class="valor">'+vencidos.length+'</div><div class="legenda">'+brl(valVencido)+' já com encargos</div></div>'
    +'<div class="card kpi span-3"><h3>Mensagens preparadas</h3><div class="valor">'+msgs+'</div><div class="legenda">simuladas para hoje ('+dataBR(HOJE_ISO)+')</div></div>'
    +'<div class="card kpi pinho span-3"><h3>Etapas da régua</h3><div class="valor">'+(DATA.regua||[]).filter(function(e){return e.ativo;}).length+'</div><div class="legenda">'+(DATA.regua||[]).length+' configurada(s)</div></div>'
    +'</div>';

  // régua (timeline)
  var etapas=(DATA.regua||[]).slice().sort(function(a,b){return a.off-b.off;});
  var reguaCards=etapas.map(function(e,i){
    var canais=(e.canais||[e.canal]).map(_canalChip).join(' ');
    return '<div class="cob-etapa'+(e.ativo?'':' off')+'">'
      +'<div class="off"><span>'+_offLabel(e.off)+'</span><small>'+(e.off===0?'vencimento':'rel. venc.')+'</small></div>'
      +'<div class="bd"><div class="rot">'+_esc(e.rotulo)+' '+canais+(e.ativo?'':' <span class="chip">inativa</span>')+'</div>'
      +'<div class="meta">'+_esc(e.publico||'')+(e.tom?' · tom '+_esc(e.tom).toLowerCase():'')+'</div></div>'
      +'<div class="ac"><button class="btn sm" onclick="cobVerExemplo('+e.ordem+')">Ver mensagem</button></div>'
      +'</div>';
  }).join('');
  var reguaCard='<div class="card span-7"><div class="flex-between"><h3 style="margin:0">Régua de cobrança padrão</h3>'
    +'<div style="display:flex;gap:8px"><button class="btn sm" onclick="abrirCobTpl()">✎ Editar mensagens</button><button class="btn sm" onclick="abrirRegua()">⏱ Editar etapas</button></div></div>'
    +'<div class="cob-regua">'+reguaCards+'</div></div>';

  // agenda (próximos disparos)
  var ag=cobAgenda();
  var agCard='<div class="card span-5"><h3>Próximos disparos programados</h3>'
    +(ag.length?'<table class="tbl" style="margin-top:6px"><thead><tr><th>Data</th><th>Etapa</th><th>Canais</th><th class="num">Alcance</th></tr></thead><tbody>'
      +ag.map(function(a){return '<tr><td><strong>'+dataBR(a.data)+'</strong></td><td>'+_esc(a.rotulo)+'<div class="muted" style="font-size:11px">'+mlabel(a.comp)+'</div></td><td>'+(a.canais||[]).map(_canalChip).join(' ')+'</td><td class="num">'+a.n+' un.</td></tr>';}).join('')
      +'</tbody></table>':'<p class="muted" style="margin-top:8px">Nenhum disparo nos próximos 30 dias.</p>')
    +'<p class="muted" style="font-size:12px;margin-top:10px">Gerado pela régua aplicada às cotas em aberto. Em modo de teste, nada é enviado nessas datas.</p></div>';

  // fila de hoje (cobranças ativas)
  var filaRows=fila.map(function(f){
    var v=cobVars(f.b, f.etapa);
    return '<tr><td style="white-space:nowrap"><strong>'+v.unidade+'</strong></td><td>'+_esc(v.nome)+'<div class="muted" style="font-size:11px">'+_esc(v._morador.email||'')+'</div></td>'
      +'<td style="white-space:nowrap">'+mlabel(f.b.competencia)+'</td>'
      +'<td class="num" style="white-space:nowrap">'+(f.dias>0?f.dias+' dias':(f.dias===0?'hoje':Math.abs(f.dias)+'d p/ vencer'))+'</td>'
      +'<td class="num" style="white-space:nowrap"><strong>'+v.valor_atualizado+'</strong></td>'
      +'<td>'+_esc(f.etapa.rotulo)+' '+(f.etapa.canais||[f.etapa.canal]).map(_canalChip).join(' ')+'</td>'
      +'<td class="num" style="white-space:nowrap"><button class="btn sm" onclick="cobVerMsg('+f.b.id+','+f.etapa.ordem+')">Ver mensagem</button></td></tr>';
  }).join('');
  var filaCard='<div class="card span-12"><div class="flex-between"><h3 style="margin:0">Simulação de hoje · '+dataBR(HOJE_ISO)+'</h3><span class="muted" style="font-size:12px">'+fila.length+' morador(es) na régua agora</span></div>'
    +(fila.length?'<div class="tblx"><table class="tbl" style="min-width:900px;margin-top:8px"><thead><tr><th>Unidade</th><th>Morador</th><th>Competência</th><th class="num">Atraso</th><th class="num">Valor atualizado</th><th>Etapa & canais</th><th class="num">Prévia</th></tr></thead><tbody>'+filaRows+'</tbody></table></div>'
      :'<p class="muted" style="margin-top:8px">Nenhuma cobrança ativa hoje. A carteira está em dia ou aguardando as datas da régua.</p>')
    +'<p class="muted" style="font-size:12px;margin-top:10px">Cada linha é o que o agente <b>enviaria agora</b>, já personalizado. Clique em <b>Ver mensagem</b> para a prévia exata (e-mail e WhatsApp). Nada é enviado em modo de teste.</p></div>';

  var note='<div class="ai-note"><svg class="ic" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2E5A4F" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 8v4l3 2"/></svg><div>O <strong>agente de Cobrança</strong> percorre a carteira a receber, aplica a <strong>régua</strong> e redige uma mensagem personalizada para cada morador por <strong>e-mail e/ou WhatsApp</strong>. Você revisa tudo aqui antes de qualquer envio.</div></div>';

  return note+banner+kpis+'<div class="grid">'+reguaCard+agCard+filaCard+'</div>';
}

/* ---------- prévia de mensagem (modal) ---------- */
function _previewHTML(etapa, vars, morador){
  var canais=etapa.canais||[etapa.canal];
  var blocks='';
  if(canais.indexOf('email')>=0){
    blocks+='<div class="cob-mail"><div class="hd"><span class="ch">E-mail</span><div class="ln"><b>Para:</b> '+_esc(morador.email||'(sem e-mail)')+'</div><div class="ln"><b>De:</b> cobranca@domus.app · '+_esc(vars.condominio)+'</div><div class="ln assunto"><b>Assunto:</b> '+_esc(cobRender(etapa.assunto, vars))+'</div></div><div class="bd">'+_nl(cobRender(etapa.email, vars))+'</div></div>';
  }
  if(canais.indexOf('whatsapp')>=0){
    blocks+='<div class="cob-wpp"><div class="hd"><span class="ch">WhatsApp</span> <span class="ln">'+_esc(morador.telefone||'')+'</span></div><div class="bubble">'+_nl(cobRender(etapa.wpp, vars))+'</div></div>';
  }
  if(canais.indexOf('carta')>=0){
    blocks+='<div class="cob-mail"><div class="hd"><span class="ch">Carta registrada</span></div><div class="bd">'+_nl(cobRender(etapa.email||etapa.assunto, vars))+'</div></div>';
  }
  return blocks||'<p class="muted">Esta etapa não tem canais configurados.</p>';
}
function _abrirPreview(titulo, sub, html){
  document.querySelector('#modal-cob-msg .cm-title').textContent=titulo;
  document.querySelector('#modal-cob-msg .cm-sub').innerHTML=sub;
  document.querySelector('#modal-cob-msg .cm-body').innerHTML=html;
  document.getElementById('modal-cob-msg').classList.add('open');
}
function cobVerMsg(boletoId, etapaOrdem){
  var b=(DATA.boletos||[]).find(function(x){return x.id===boletoId;});
  var etapa=(DATA.regua||[]).find(function(e){return e.ordem===etapaOrdem;});
  if(!b||!etapa) return;
  var vars=cobVars(b, etapa);
  _abrirPreview(etapa.rotulo, 'Para <b>'+_esc(vars.nome)+'</b> · unidade '+_esc(vars.unidade)+' · '+mlabel(b.competencia)+' · atraso de '+vars.dias_atraso+' dia(s)', _previewHTML(etapa, vars, vars._morador));
}
function cobVerExemplo(etapaOrdem){
  cobAplicarTemplates();
  var etapa=(DATA.regua||[]).find(function(e){return e.ordem===etapaOrdem;});
  if(!etapa) return;
  // morador representativo: primeiro vencido; senão primeiro aberto; senão sintético
  var b=(DATA.boletos||[]).find(function(x){return x.status==='vencido';}) || (DATA.boletos||[]).find(function(x){return x.status==='aberto';});
  if(!b){ b={unidade_id:(DATA.unidades[0]||{}).id, competencia:'2026-05', valor:DATA.condominio.cota, vencimento:'2026-05-10'}; }
  // dias de exemplo coerentes com a etapa
  var diasEx=etapa.off>0?Math.max(etapa.off, cobDiasAtraso(b)):0;
  var vars=cobVars(b, etapa);
  var enc=cobEncargos(b.valor, diasEx);
  vars.dias_atraso=Math.max(0,diasEx); vars.multa=brl(enc.multa); vars.juros=brl(enc.juros); vars.valor_atualizado=brl(enc.total);
  _abrirPreview(etapa.rotulo+' · exemplo', 'Prévia com dados de <b>'+_esc(vars.nome)+'</b> (unidade '+_esc(vars.unidade)+'). É só um exemplo para você revisar o texto.', _previewHTML(etapa, vars, vars._morador));
}
function fecharCobMsg(){ document.getElementById('modal-cob-msg').classList.remove('open'); }
function cobTesteAviso(){ cobToast('Modo de teste: nenhuma mensagem foi enviada. 🧪'); }

/* ---------- editor de mensagens (modal) ---------- */
function abrirCobTpl(){
  cobAplicarTemplates();
  var sel=document.getElementById('cobtpl-sel');
  sel.innerHTML=(DATA.regua||[]).map(function(e){return '<option value="'+e.ordem+'">'+_esc(e.rotulo)+'</option>';}).join('');
  document.getElementById('cobtpl-vars').innerHTML=COB_VARS.map(function(v){return '<button type="button" class="chip" onclick="cobTplInsert(\'{{'+v+'}}\')">{{'+v+'}}</button>';}).join(' ');
  cobTplLoad();
  document.getElementById('modal-cob-tpl').classList.add('open');
}
function cobTplLoad(){
  var ord=parseInt(document.getElementById('cobtpl-sel').value);
  var e=(DATA.regua||[]).find(function(x){return x.ordem===ord;}); if(!e) return;
  var canais=e.canais||[e.canal];
  document.getElementById('cobtpl-eml').checked=canais.indexOf('email')>=0;
  document.getElementById('cobtpl-wpp').checked=canais.indexOf('whatsapp')>=0;
  document.getElementById('cobtpl-assunto').value=e.assunto||'';
  document.getElementById('cobtpl-email').value=e.email||'';
  document.getElementById('cobtpl-wppmsg').value=e.wpp||'';
}
var _cobLastFocus='cobtpl-email';
function cobTplInsert(token){
  var ta=document.getElementById(_cobLastFocus); if(!ta) ta=document.getElementById('cobtpl-email');
  var s=ta.selectionStart||ta.value.length, ev=ta.selectionEnd||ta.value.length;
  ta.value=ta.value.slice(0,s)+token+ta.value.slice(ev); ta.focus(); ta.selectionStart=ta.selectionEnd=s+token.length;
}
function salvarCobTpl(ev){
  ev.preventDefault();
  var ord=parseInt(document.getElementById('cobtpl-sel').value);
  var e=(DATA.regua||[]).find(function(x){return x.ordem===ord;}); if(!e) return false;
  var canais=[]; if(document.getElementById('cobtpl-eml').checked)canais.push('email'); if(document.getElementById('cobtpl-wpp').checked)canais.push('whatsapp');
  if(!canais.length) canais=['email'];
  e.canais=canais; e.canal=canais[0];
  e.assunto=document.getElementById('cobtpl-assunto').value;
  e.email=document.getElementById('cobtpl-email').value;
  e.wpp=document.getElementById('cobtpl-wppmsg').value;
  if(typeof addEvent==='function') addEvent('Cobranca','Mensagem ajustada','Etapa "'+e.rotulo+'" editada pelo gestor (modo teste)');
  cobToast('Mensagem da etapa "'+e.rotulo+'" salva.');
  if(SEC==='cobranca') render();
  return false;
}
function fecharCobTpl(){ document.getElementById('modal-cob-tpl').classList.remove('open'); }

/* ---------- toast simples ---------- */
function cobToast(msg){
  var t=document.getElementById('cob-toast');
  if(!t){ t=document.createElement('div'); t.id='cob-toast'; t.className='cob-toast'; document.body.appendChild(t); }
  t.textContent=msg; t.classList.add('show');
  clearTimeout(t._tmr); t._tmr=setTimeout(function(){ t.classList.remove('show'); }, 2600);
}

/* fechar modais ao clicar no fundo + foco em textareas do editor */
document.addEventListener('DOMContentLoaded', function(){
  ['modal-cob-msg','modal-cob-tpl'].forEach(function(id){
    var el=document.getElementById(id);
    if(el) el.addEventListener('click', function(ev){ if(ev.target.id===id) el.classList.remove('open'); });
  });
  ['cobtpl-email','cobtpl-wppmsg','cobtpl-assunto'].forEach(function(id){
    var el=document.getElementById(id);
    if(el) el.addEventListener('focus', function(){ _cobLastFocus=id; });
  });
});
