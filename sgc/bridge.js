/* ============================================================
   Domus · Bridge — estado compartilhado entre o SGC e o App
   Mesma origem → localStorage compartilhado. O evento 'storage'
   sincroniza ao vivo entre janelas/abas (SGC no notebook + App).
   ============================================================ */
window.Domus = (function(){
  const KEY = 'domus_shared_v1';
  const DEFAULTS = {
    avisos: [
      {id:1, data:'2026-06-01', titulo:'Manutenção dos elevadores', autor:'Síndica',  publico:'Todos',    mensagem:'No dia 12/06 os elevadores passarão por manutenção preventiva das 8h às 12h. Pedimos a compreensão de todos.'},
      {id:2, data:'2026-05-28', titulo:'Encomenda na portaria',      autor:'Porteiro', publico:'Bloco A',  mensagem:'Chegaram encomendas para retirada na portaria. Confira a aba Entregas no app.'},
      {id:3, data:'2026-05-20', titulo:'Dedetização das áreas comuns',autor:'Síndica',  publico:'Moradores',mensagem:'A dedetização ocorrerá no sábado, 24/05. Mantenha animais de estimação dentro das unidades.'}
    ],
    espacos: [
      {id:1, nome:'Salão de Festas',       cap:'até 40 pessoas', taxa:150, reserva:'8h às 23h · limpeza inclusa',      ativo:true},
      {id:2, nome:'Churrasqueira',         cap:'até 20 pessoas', taxa:80,  reserva:'10h às 22h · traga seus utensílios',ativo:true},
      {id:3, nome:'Quadra Poliesportiva',  cap:'livre',          taxa:0,   reserva:'7h às 22h · 1h por reserva',        ativo:true},
      {id:4, nome:'Coworking',             cap:'até 8 pessoas',  taxa:0,   reserva:'24h · silêncio',                    ativo:true}
    ],
    reservas: [
      {id:1, espaco:'Churrasqueira', unidade:'402-A', morador:'Carlos Mendes', data:'2026-06-14', hora:'12:00–18:00', status:'confirmada'}
    ],
    visitantes: [
      {id:1, nome:'Marina Costa', doc:'Prestadora · diarista', unidade:'402-A', data:'2026-06-05', placa:'', status:'autorizado'}
    ],
    entregas: [
      {id:1, remetente:'Mercado Livre', tipo:'Pacote pequeno', unidade:'402-A', recebido:'2026-06-01 14:20', status:'aguardando'},
      {id:2, remetente:'iFood',         tipo:'Documento',      unidade:'402-A', recebido:'2026-05-30 19:05', status:'aguardando'},
      {id:3, remetente:'Correios',      tipo:'Caixa',          unidade:'402-A', recebido:'2026-05-27 11:40', status:'retirado'}
    ],
    servicos: [],
    anuncios: []
  };

  // Patch de resiliência (Domus app): cache em memória garante que as
  // mutações funcionem mesmo se o localStorage falhar (ex.: file:// no
  // WKWebView). Quando o localStorage está disponível, ele tem precedência,
  // mantendo a sincronização ao vivo entre o app e o SGC (mesma origem).
  let mem = null;
  function readLS(){ try{ return JSON.parse(localStorage.getItem(KEY)||'null'); }catch(e){ return null; } }
  function all(){ const base = JSON.parse(JSON.stringify(DEFAULTS)); const ls = readLS(); return Object.assign(base, mem||{}, ls||{}); }
  function get(k){ const a=all(); return k? a[k] : a; }
  function persist(a){ mem = a; try{ localStorage.setItem(KEY, JSON.stringify(a)); }catch(e){} }
  const subs=[];
  function fire(k){ subs.forEach(cb=>{ try{ cb(k); }catch(e){} }); }
  function set(k,v){ const a=all(); a[k]=v; persist(a); fire(k); }
  function setQuiet(k,v){ const a=all(); a[k]=v; persist(a); }
  function push(k,item){ const a=all(); a[k]=[item].concat(a[k]||[]); persist(a); fire(k); return item; }
  function update(k,fn){ const a=all(); a[k]=fn(a[k]); persist(a); fire(k); }
  function nextId(k){ const arr=get(k)||[]; return arr.reduce((m,x)=>Math.max(m, x.id||0),0)+1; }
  function on(cb){ subs.push(cb); }
  window.addEventListener('storage', e=>{ if(e.key===KEY) fire('*'); });

  return { get, set, setQuiet, push, update, nextId, on, KEY };
})();
