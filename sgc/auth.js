/* ============================================================
   Domus · SGC — Camada de acesso
   Login por CPF → o perfil (Síndico / Morador / Funcionário) é
   definido automaticamente pelo cadastro. Síndico segue para a
   seleção de condomínio; demais veem o portal correspondente.
   ============================================================ */
(function(){
  const PORTAL = '<svg class="portal" viewBox="0 0 100 100"><path d="M18 92 L18 46 A32 32 0 0 1 82 46 L82 92" stroke-width="9"></path><path d="M38 92 L38 56 A12 12 0 0 1 62 56 L62 92" stroke-width="9"></path></svg>';
  const CHEVRON = '<svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"></path></svg>';

  // diretório de demonstração — o CPF carrega o perfil cadastrado
  const USERS = {
    '11111111111': {nome:'Helena Martins', papel:'Síndico', papelF:'Síndica', av:'HM', condos:[
      {nome:'Condomínio Felipe II',              cidade:'São Paulo · SP', unidades:100, status:'ativo'},
      {nome:'Residencial Jardim das Acácias',    cidade:'Campinas · SP',  unidades:64,  status:'implantacao'},
      {nome:'Edifício Aurora',                   cidade:'São Paulo · SP', unidades:48,  status:'implantacao'}
    ]},
    '22222222222': {nome:'Carlos Mendes',     papel:'Morador',     av:'CM', condos:[{nome:'Condomínio Felipe II', cidade:'São Paulo · SP', unidades:100, status:'ativo'}]},
    '33333333333': {nome:'Antônio Ferreira',  papel:'Funcionário', av:'AF', condos:[{nome:'Condomínio Felipe II', cidade:'São Paulo · SP', unidades:100, status:'ativo'}]}
  };

  const $ = id => document.getElementById(id);
  const digits = s => (s||'').replace(/\D/g,'').slice(0,11);
  function mask(s){ const d=digits(s); if(d.length>9) return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9)}`; if(d.length>6) return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6)}`; if(d.length>3) return `${d.slice(0,3)}.${d.slice(3)}`; return d; }
  let CUR = null;

  function show(which){ ['auth-login','auth-condo','auth-role'].forEach(id=>{ const el=$(id); if(el) el.hidden = (id!==which); }); $('auth').hidden=false; }

  window.authCpfInput = function(el){
    el.value = mask(el.value);
    const u = USERS[digits(el.value)];
    const r = $('au-role'); const err = $('au-err'); if(err) err.hidden=true;
    if(u){ r.hidden=false; $('au-role-nm').textContent = u.papel; } else { r.hidden=true; }
  };
  window.authFill = function(cpf){ const el=$('au-cpf'); el.value=mask(cpf); window.authCpfInput(el); const s=$('au-senha'); if(s) s.focus(); };

  window.authEntrar = function(e){
    e.preventDefault();
    const u = USERS[digits($('au-cpf').value)];
    if(!u){ $('au-err').hidden=false; return false; }
    CUR = u;
    if(u.papel==='Síndico') mostrarCondos(u); else mostrarRole(u);
    return false;
  };

  function mostrarCondos(u){
    $('au-greet-av').textContent = u.av;
    $('au-greet-nm').textContent = u.nome;
    $('au-greet-role').textContent = (u.papelF||u.papel) + ' · ' + u.condos.length + ' condomínios';
    $('au-condo-grid').innerHTML = u.condos.map((c,i)=>{
      const ativo = c.status==='ativo';
      return `<button class="condo-opt" ${ativo?'':'disabled'} onclick="authSelectCondo(${i})">
        <span class="ic">${PORTAL}</span>
        <div class="nm">${c.nome}</div>
        <div class="meta">${c.cidade} · ${c.unidades} unidades</div>
        ${ativo?'<div class="go">Analisar &rarr;</div>':'<span class="tag"><span class="badge pendente">Em implantação</span></span>'}
      </button>`;
    }).join('');
    show('auth-condo');
  }

  function mostrarRole(u){
    $('au-role-h').textContent = 'Você entrou como ' + u.papel;
    $('au-role-p').textContent = u.papel==='Morador'
      ? 'Este protótipo é o Portal do Gestor (síndico). O morador acessa o app do condômino — boletos e 2ª via, reservas de áreas comuns, avisos e atas — numa experiência separada.'
      : 'Este protótipo é o Portal do Gestor (síndico). O funcionário acessa o app da equipe — registro de ponto, escala de trabalho e comunicados internos — numa experiência separada.';
    show('auth-role');
  }

  window.authSelectCondo = function(i){
    const c = CUR.condos[i];
    if(!c || c.status!=='ativo') return;
    aplicar(CUR, c);
    try{ localStorage.setItem('domus_auth', JSON.stringify({cpf: Object.keys(USERS).find(k=>USERS[k]===CUR), condo: c.nome})); }catch(e){}
    $('auth').hidden = true;
  };

  // entra direto como síndico (atalho de demonstração a partir do portal de morador/funcionário)
  window.authDemoSindico = function(){ CUR = USERS['11111111111']; mostrarCondos(CUR); };

  window.authVoltarLogin = function(){ show('auth-login'); };
  window.authTrocarCondo = function(){ const u = CUR || USERS['11111111111']; CUR = u; mostrarCondos(u); };
  window.authLogout = function(){
    try{ localStorage.removeItem('domus_auth'); }catch(e){}
    CUR = null;
    const cpf=$('au-cpf'); if(cpf) cpf.value=''; const s=$('au-senha'); if(s) s.value='demo';
    $('au-role').hidden=true; $('au-err').hidden=true;
    show('auth-login');
  };

  function aplicar(u, c){
    const chip = document.querySelector('.condo-chip');
    if(chip){ const nm=chip.querySelector('.nm'), mt=chip.querySelector('.meta'); if(nm) nm.textContent=c.nome; if(mt) mt.textContent='Portal do gestor · '+c.unidades+' unidades'; }
    const sw = document.querySelector('.tb-switch'); if(sw) sw.innerHTML = c.nome + ' ' + CHEVRON;
    const av = $('tb-av'); if(av){ av.textContent = u.av; av.title = u.nome + ' · ' + (u.papelF||u.papel); }
    try{ if(typeof DATA!=='undefined' && DATA.condominio) DATA.condominio.nome = c.nome; }catch(e){}
    try{ if(typeof nav==='function') nav('visao'); }catch(e){}
  }

  function init(){
    let saved=null; try{ saved=JSON.parse(localStorage.getItem('domus_auth')||'null'); }catch(e){}
    if(saved && saved.cpf && USERS[saved.cpf] && USERS[saved.cpf].papel==='Síndico'){
      const u=USERS[saved.cpf]; CUR=u;
      const c=u.condos.find(x=>x.nome===saved.condo && x.status==='ativo') || u.condos.find(x=>x.status==='ativo');
      if(c){ aplicar(u,c); $('auth').hidden=true; return; }
    }
    show('auth-login');
    const cpf=$('au-cpf'); if(cpf) setTimeout(()=>{ try{cpf.focus();}catch(e){} },80);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
