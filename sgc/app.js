
const HOJE=new Date('2026-06-01T00:00:00'); const HOJE_ISO='2026-06-01';
const TAXA=580;
const COMPETS=['2026-01','2026-02','2026-03','2026-04','2026-05','2026-06'];
const MES={'2026-01':'jan/26','2026-02':'fev/26','2026-03':'mar/26','2026-04':'abr/26','2026-05':'mai/26','2026-06':'jun/26'};
function mlabel(c){return MES[c]||c}

/* Plano de contas (custos e despesas do condomínio) — grupo → contas */
const PLANO=[
 {grupo:'Pessoal',contas:['Folha Salarial','Adiantamento Salarial','FGTS','INSS','PIS sobre a Folha','IRRF','Férias','Plano de Saúde','Ticket Refeição / Alimentação','Vale Transporte','Gestão de Vale Transporte','Tarifa de Pessoal','Seguro de Vida']},
 {grupo:'Utilities',contas:['Luz/Força','Telefone','Água','Internet']},
 {grupo:'Manutenção e Conservação',contas:['Ar-Condicionado','Elevadores','Bombas/Motores/Exaustores','Incêndio','Câmeras','Limpeza','Tratamento de Água','Locação de Equipamentos','Serviços de Terceiros','Interfones e Antenas','Luz de Emergência','Plantas de Ornamentação','Catracas']},
 {grupo:'Administradora',contas:['Taxa de Administração','Cópias','Envio de Correspondências','Material de Expediente']},
 {grupo:'Despesas Bancárias',contas:['Tarifas bancárias','Cartão de crédito']},
 {grupo:'Impostos',contas:['INSS','PIS/COFINS','CSLL']},
 {grupo:'Outros',contas:['Outros']}];
const GRUPO_ORDER=PLANO.map(p=>p.grupo);
function grupoDaConta(conta){const p=PLANO.find(p=>p.contas.includes(conta));return p?p.grupo:'Outros';}

function makeSeed(){
  const SOBR=['Silva','Santos','Oliveira','Souza','Lima','Pereira','Costa','Almeida','Nunes','Rocha','Dias','Alves','Mendes','Carvalho','Gomes','Martins','Araújo','Barbosa','Ribeiro','Fernandes'];
  const NOM=['Maria','João','Ana','Carlos','Beatriz','Rafael','Patrícia','Diego','Lucas','Fernanda','Paulo','Juliana','Marcos','Camila','Bruno','Larissa','Felipe','Aline','Rodrigo','Tatiane'];
  const MOD=['Honda Civic','Fiat Argo','Toyota Corolla','VW T-Cross','Jeep Renegade','Hyundai HB20','Chevrolet Onix','Renault Kwid'];
  const unidades=[],moradores=[],vagas=[],veiculos=[]; let uid=1,mid=1,vcid=1;
  // 100 unidades: 2 blocos × 10 andares × 5 aptos; 1 vaga por unidade; ~50% com veículo
  for(const bloco of ['A','B']){
    for(let andar=1;andar<=10;andar++){
      for(let ap=1;ap<=5;ap++){
        const num=(andar*100+ap).toString();
        unidades.push({id:uid,num,bloco,fracao:0.01});
        const nome=NOM[(uid*3)%NOM.length]+' '+SOBR[(uid*7)%SOBR.length];
        const cpf=String(10100100100+uid*8642).slice(0,11).replace(/(\d{3})(\d{3})(\d{3})(\d{2})/,'$1.$2.$3-$4');
        const tel='+55 11 9'+String(60000000+uid*271).slice(0,4)+'-'+String(1000+uid*37).slice(-4);
        moradores.push({id:mid,unidade_id:uid,nome,tipo:(uid%9===0?'inquilino':'morador'),telefone:tel,email:nome.toLowerCase().normalize('NFD').replace(/[^a-z ]/g,'').replace(/ /g,'.')+(uid)+'@email.com',cpf,acesso:(uid===1?'Gestor':'Morador')});
        vagas.push({id:uid,ident:'G-'+String(uid).padStart(3,'0'),unidade_id:uid});
        if(uid%2===0)veiculos.push({id:vcid++,morador_id:mid,modelo:MOD[uid%MOD.length],placa:'ABC'+String(1000+uid).slice(-4),vaga_id:uid});
        mid++; uid++;
      }
    }
  }
  // BOLETOS (cotas condominiais) — 6 meses. jan-abr pagos; mai ~12% vencido; jun a vencer
  const boletos=[]; let bid=1;
  unidades.forEach(u=>{
    ['2026-01','2026-02','2026-03','2026-04'].forEach(c=>boletos.push({id:bid++,unidade_id:u.id,competencia:c,valor:TAXA,vencimento:c+'-10',status:'pago',pago_em:c+'-10',origem:'seed'}));
    const inad=(u.id%8===0); // ~12 unidades inadimplentes
    boletos.push({id:bid++,unidade_id:u.id,competencia:'2026-05',valor:TAXA,vencimento:'2026-05-10',status:inad?'vencido':'pago',pago_em:inad?null:'2026-05-10',origem:'seed'});
    boletos.push({id:bid++,unidade_id:u.id,competencia:'2026-06',valor:TAXA,vencimento:'2026-06-10',status:'aberto',pago_em:null,origem:'seed'});
  });
  // CONTAS A PAGAR (despesas) pelo plano de contas — 6 meses, escala de 100 unidades
  let cid=1, lct=1; const contasPagar=[];
  const cp=(forn,desc,grupo,conta,valor,venc,comp,status)=>contasPagar.push({id:cid++,numero:'LCT-'+String(lct++).padStart(4,'0'),fornecedor:forn,descricao:desc,grupo,conta,categoria:conta,valor,total:valor,vencimento:venc,competencia:comp,status,pago_em:status==='paga'?venc:null,origem:'seed'});
  const REC=[
    ['Domus (folha)','Pessoal','Folha Salarial',18000,'05'],['Caixa Econômica','Pessoal','FGTS',1440,'07'],
    ['Receita Federal','Pessoal','INSS',3600,'20'],['Unimed','Pessoal','Plano de Saúde',1800,'10'],
    ['SPTrans','Pessoal','Vale Transporte',1200,'05'],['Ticket Log','Pessoal','Ticket Refeição / Alimentação',2200,'05'],
    ['Enel SP','Utilities','Luz/Força',6500,'08'],['Sabesp','Utilities','Água',4200,'10'],
    ['Vivo','Utilities','Internet',350,'12'],['Vivo','Utilities','Telefone',250,'12'],
    ['Brilho Total Serviços','Manutenção e Conservação','Limpeza',1800,'05'],['Eleva Manutenção Predial','Manutenção e Conservação','Elevadores',1600,'12'],
    ['SegMax Segurança','Manutenção e Conservação','Serviços de Terceiros',1800,'05'],['Vigia CFTV','Manutenção e Conservação','Câmeras',600,'14'],
    ['Protege Incêndio','Manutenção e Conservação','Incêndio',400,'15'],['Frio & Clima','Manutenção e Conservação','Ar-Condicionado',500,'15'],
    ['HidroPredial','Manutenção e Conservação','Bombas/Motores/Exaustores',700,'16'],
    ['Domus','Administradora','Taxa de Administração',1000,'05'],['Papelaria Central','Administradora','Material de Expediente',200,'08'],
    ['Banco do Brasil','Despesas Bancárias','Tarifas bancárias',350,'28'],['Receita Federal','Impostos','PIS/COFINS',600,'20']];
  const mes=(comp,st)=>REC.forEach(r=>cp(r[0],r[2]+' — '+mlabel(comp),r[1],r[2],r[3],comp+'-'+r[4],comp,st));
  ['2026-01','2026-02','2026-03','2026-04','2026-05'].forEach(c=>mes(c,'paga'));
  mes('2026-06','aprovada');
  cp('Eleva Manutenção Predial','Manutenção preventiva dos elevadores','Manutenção e Conservação','Elevadores',2500,'2026-06-12','2026-06','pendente');
  cp('Jardins & Cia','Paisagismo do hall de entrada','Manutenção e Conservação','Plantas de Ornamentação',1200,'2026-06-14','2026-06','pendente');
  // encargos (juros/multa) por atraso no pagamento a fornecedores — exemplos
  contasPagar.forEach(c=>c.encargos=0);
  const enc=(pred,pct)=>{const c=contasPagar.find(pred);if(c)c.encargos=Math.round(c.valor*pct*100)/100;};
  enc(c=>c.conta==='Água'&&c.competencia==='2026-03',0.08);
  enc(c=>c.conta==='Luz/Força'&&c.competencia==='2026-04',0.05);
  enc(c=>c.conta==='Elevadores'&&c.status==='pendente',0.10);
  contasPagar.forEach(c=>c.total=c.valor+(c.encargos||0));
  const fornecedores=[{nome:'Brilho Total Serviços',servico:'Limpeza e conservação',cnpj:'01.111.111/0001-11'},{nome:'Eleva Manutenção Predial',servico:'Elevadores e hidráulica',cnpj:'03.333.333/0001-33'},{nome:'SegMax Segurança',servico:'Portaria e vigilância',cnpj:'02.222.222/0001-22'},{nome:'Sabesp',servico:'Água e esgoto',cnpj:'43.776.517/0001-80'},{nome:'Enel SP',servico:'Energia elétrica',cnpj:'61.695.227/0001-93'},{nome:'Vivo',servico:'Telefonia e internet',cnpj:'02.449.992/0001-64'},{nome:'Vigia CFTV',servico:'Câmeras e monitoramento',cnpj:'04.444.444/0001-44'}];
  const regua=[
    {ordem:1,rotulo:'Lembrete amigável',off:-5,canal:'whatsapp',publico:'Todos com cota a vencer',msg:'Olá! Sua cota condominial vence em 5 dias. 🏛️',ativo:true},
    {ordem:2,rotulo:'Aviso no vencimento',off:0,canal:'whatsapp',publico:'Cotas que vencem hoje',msg:'Sua cota vence hoje. Pague pelo PIX.',ativo:true},
    {ordem:3,rotulo:'1ª cobrança',off:1,canal:'whatsapp',publico:'Inadimplentes (1 dia)',msg:'Cota venceu ontem. Regularize para evitar encargos.',ativo:true},
    {ordem:4,rotulo:'2ª cobrança',off:7,canal:'email',publico:'Inadimplentes (7 dias)',msg:'Cota em aberto há 7 dias. Segue 2ª via.',ativo:true},
    {ordem:5,rotulo:'Notificação formal',off:15,canal:'carta',publico:'Inadimplentes (15 dias)',msg:'Notificação extrajudicial de débito.',ativo:true}];
  const funcionarios=[
    {id:1,nome:'Antônio Ferreira',cargo:'Zelador',salario:2650,cpf:'101.101.101-01',admissao:'2021-03-01',jornada:'44h/semana',status:'ativo',horasExtras:0},
    {id:2,nome:'José Santos',cargo:'Porteiro (diurno)',salario:2100,cpf:'102.102.102-02',admissao:'2022-06-15',jornada:'12x36',status:'ativo',horasExtras:4},
    {id:3,nome:'Marcos Oliveira',cargo:'Porteiro (noturno)',salario:2300,cpf:'103.103.103-03',admissao:'2023-01-10',jornada:'12x36',status:'ativo',horasExtras:6},
    {id:4,nome:'Rosa Almeida',cargo:'Auxiliar de limpeza',salario:1820,cpf:'104.104.104-04',admissao:'2020-09-01',jornada:'44h/semana',status:'ativo',horasExtras:0},
    {id:5,nome:'Pedro Nunes',cargo:'Jardineiro',salario:1900,cpf:'105.105.105-05',admissao:'2024-02-20',jornada:'44h/semana',status:'ativo',horasExtras:0},
    {id:6,nome:'Sandra Gomes',cargo:'Porteiro (diurno)',salario:2100,cpf:'106.106.106-06',admissao:'2022-11-03',jornada:'12x36',status:'ativo',horasExtras:2},
    {id:7,nome:'Luiz Barbosa',cargo:'Porteiro (noturno)',salario:2300,cpf:'107.107.107-07',admissao:'2023-08-19',jornada:'12x36',status:'ativo',horasExtras:8},
    {id:8,nome:'Cláudia Ramos',cargo:'Auxiliar de limpeza',salario:1820,cpf:'108.108.108-08',admissao:'2021-05-12',jornada:'44h/semana',status:'ativo',horasExtras:0},
    {id:9,nome:'Roberto Pinto',cargo:'Auxiliar de manutenção',salario:2200,cpf:'109.109.109-09',admissao:'2024-04-01',jornada:'44h/semana',status:'ativo',horasExtras:3}];
  const assembleias=[
    {id:1,titulo:'Assembleia Geral Ordinária 2026',tipo:'ordinaria',data:'2026-03-20',local:'Salão de festas',status:'realizada',pauta:'1) Prestação de contas 2025; 2) Previsão orçamentária 2026; 3) Eleição de síndico.',ata:'Aos vinte dias de março de 2026, reuniram-se os condôminos em assembleia ordinária. Aprovadas por maioria a prestação de contas de 2025 e a previsão orçamentária de 2026. Reeleito o síndico para novo mandato de 1 ano.',convocacao_em:'2026-03-05'},
    {id:2,titulo:'AGE — Reforma da fachada',tipo:'extraordinaria',data:'2026-06-25',local:'Salão de festas',status:'convocada',pauta:'1) Orçamentos para reforma da fachada; 2) Definição de rateio extraordinário.',ata:'',convocacao_em:'2026-06-01'}];
  const feed=[
    {ts:'08:30:00',agente:'Contabil',acao:'Atualizou demonstrações',det:'DRE, Balanço, Fluxo e Balancete recalculados a partir das contas a pagar e dos recebíveis'},
    {ts:'08:35:00',agente:'Cobranca',acao:'Enviou lembrete',det:'Lembrete -5d via WhatsApp para 100 unidades (competência junho)'},
    {ts:'08:40:00',agente:'Cobranca',acao:'Régua acionada',det:'1ª cobrança disparada para 12 unidades inadimplentes (maio)'},
    {ts:'08:45:00',agente:'Pagamentos',acao:'Identificou conta',det:'Manutenção preventiva de elevadores — R$ 2.500,00 aguardando aprovação'},
    {ts:'08:50:00',agente:'DP',acao:'Processou folha',det:'Folha de maio enviada ao eSocial (9 funcionários)'}];
  const ANIM=[['Rex','Cão','Médio'],['Mel','Cão','Pequeno'],['Thor','Cão','Grande'],['Nina','Gato','Pequeno'],['Luna','Gato','Pequeno'],['Bidu','Cão','Pequeno'],['Amora','Gato','Pequeno'],['Bob','Cão','Médio']];
  const animais=[]; let anid=1;
  moradores.forEach((m,i)=>{if(i%7===0){const a=ANIM[(anid-1)%ANIM.length];animais.push({id:anid++,morador_id:m.id,nome:a[0],especie:a[1],porte:a[2]});}});
  const avisos=[
    {id:1,data:'2026-06-01',titulo:'Manutenção dos elevadores',publico:'Todos',mensagem:'No dia 12/06 os elevadores passarão por manutenção preventiva das 8h às 12h. Pedimos a compreensão de todos.'},
    {id:2,data:'2026-05-20',titulo:'Dedetização das áreas comuns',publico:'Moradores',mensagem:'A dedetização ocorrerá no sábado, 24/05. Mantenha animais de estimação dentro das unidades.'},
    {id:3,data:'2026-05-05',titulo:'Escala de férias da portaria',publico:'Funcionários',mensagem:'A escala de férias de junho/julho já está disponível com o zelador. Confirmem suas datas até 15/05.'}];
  return {condominio:{nome:'Condomínio Felipe II',cnpj:'12.345.678/0001-90',endereco:'Rua das Oliveiras, 250 — São Paulo/SP',saldoInicial:150000,orcamento:55000,cota:TAXA},
    unidades,moradores,vagas,veiculos,boletos,contasPagar,fornecedores,regua,funcionarios,assembleias,feed,animais,avisos};
}
let DATA=makeSeed();
let PERIODO={de:COMPETS[0],ate:COMPETS[COMPETS.length-1]};
let BAL_DATA=COMPETS[COMPETS.length-1];                 // data (posição) do Balanço Patrimonial
let BLC_DE=COMPETS[0], BLC_ATE=COMPETS[COMPETS.length-1]; // período do Balancete
let PAGAR_MES='2026-06', PAGAR_STATUS='', PAGAR_GRUPO='', PAGAR_FORN='';
let CR_DE='', CR_ATE='', CR_UNI='';                    // filtros da carteira a receber
let CAD_U_BLOCO='',CAD_U_Q='',CAD_P_TIPO='',CAD_P_Q='',CAD_V_Q='',CAD_A_ESP='',CAD_A_Q=''; // filtros do cadastro
let FOCUS_ID='';                                       // restaura foco do campo após re-render
let PREV_REAJ=0, PREV_INFL=0, PREV_MESES=6;            // cenário da previsão orçamentária
let CAD_OPEN={u:false,p:false,v:false,a:false};        // estado aberto/recolhido dos blocos do cadastro

/* helpers */
const brl=v=>(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const pct=v=>(Math.round(v*10)/10).toString().replace('.',',')+'%';
const dataBR=iso=>iso?iso.split('-').reverse().join('/'):'—';
const cap=s=>s?s[0].toUpperCase()+s.slice(1):s;
const uNum=id=>(DATA.unidades.find(u=>u.id==id)||{}).num||'—';
const uBloco=id=>(DATA.unidades.find(u=>u.id==id)||{}).bloco||'';
const moradorDaUnidade=id=>DATA.moradores.find(m=>m.unidade_id==id);
const vagaIdent=id=>(DATA.vagas.find(v=>v.id==id)||{}).ident||'';
function addEvent(agente,acao,det){DATA.feed.unshift({ts:new Date().toLocaleTimeString('pt-BR'),agente,acao,det});}
function nextId(arr){return arr.reduce((m,x)=>Math.max(m,x.id),0)+1;}
const sum=(a,f)=>a.reduce((s,x)=>s+f(x),0);

/* ===== núcleo financeiro (compartilhado por todas as telas) ===== */
function recebidoAte(ate){return sum(DATA.boletos.filter(b=>b.status==='pago'&&b.competencia<=ate),b=>b.valor);}
function pagoAte(ate){return sum(DATA.contasPagar.filter(c=>c.status==='paga'&&c.competencia<=ate),c=>c.total);}
function saldoCaixaAte(ate){return DATA.condominio.saldoInicial+recebidoAte(ate)-pagoAte(ate);}
function saldoAtual(){return saldoCaixaAte('2026-06');}
function inadimplencia(){const ab=DATA.boletos.filter(b=>b.status==='aberto'||b.status==='vencido');const v=ab.filter(b=>b.status==='vencido');return {pct:ab.length?v.length/ab.length*100:0,valor:sum(v,b=>b.valor),qtd:v.length};}
function despesaCompet(comp){return sum(DATA.contasPagar.filter(c=>c.competencia===comp),c=>c.valor);}
function termometro(){const g=despesaCompet('2026-06'),o=DATA.condominio.orcamento||1,p=g/o*100;return {g,o,p,nivel:p<80?'ok':p<=100?'atencao':'estouro'};}
function evolucao(){return COMPETS.map(c=>({mes:mlabel(c).slice(0,3),valor:despesaCompet(c)}));}
function aPagarAberto(){const c=DATA.contasPagar.filter(c=>c.status!=='paga');return {valor:sum(c,x=>x.valor),qtd:DATA.contasPagar.filter(c=>c.status==='pendente').length};}
function movimentos(){
  const r=DATA.boletos.filter(b=>b.status==='pago').map(b=>({data:b.pago_em,desc:'Taxa '+uNum(b.unidade_id)+' · '+mlabel(b.competencia),tipo:'receita',valor:b.valor,origem:b.origem}));
  const d=DATA.contasPagar.filter(c=>c.status==='paga').map(c=>({data:c.pago_em,desc:c.descricao,tipo:'despesa',valor:c.valor,origem:c.origem}));
  return r.concat(d).sort((a,b)=>(b.data||'').localeCompare(a.data||''));
}

/* navegação */
const TITLES={visao:['Visão Geral','Indicadores do Condomínio Felipe II'],receber:['Contas a Receber','Emissão, recebimento, inadimplência e régua de cobrança'],pagar:['Contas a Pagar','Lançamentos, aprovações, comprovantes — linkados ao Resultado Contábil'],resultado:['Resultado Contábil','DRE, Balanço Patrimonial, Fluxo de Caixa e Balancete'],previsao:['Previsão Orçamentária','Projeção do resultado com base no histórico de recebimentos e pagamentos'],dp:['Departamento Pessoal','Folha de pagamento, ponto, admissões e demissões'],assembleias:['Atas & Assembleias','Convocação de assembleias e repositório de atas'],avisos:['Avisos','Comunicados aos moradores e funcionários'],cadastro:['Cadastro','Pessoas, unidades, vagas de garagem, veículos e animais']};
let SEC='visao';
function nav(sec){SEC=sec;FOCUS_ID='';document.querySelectorAll('#nav a').forEach(a=>a.classList.toggle('active',a.dataset.sec===sec));document.getElementById('pg-title').textContent=TITLES[sec][0];document.getElementById('pg-sub').textContent=TITLES[sec][1];render();}
function render(){const c=document.getElementById('content');c.innerHTML=({visao:renderVisao,receber:renderReceber,pagar:renderPagar,resultado:renderResultado,previsao:renderPrevisao,avisos:renderAvisos,dp:renderDP,assembleias:renderAssembleias,cadastro:renderCadastro})[SEC]();
  if(FOCUS_ID){const el=document.getElementById(FOCUS_ID);if(el){el.focus();try{el.setSelectionRange(el.value.length,el.value.length);}catch(e){}}}}
function resetar(){DATA=makeSeed();PERIODO={de:COMPETS[0],ate:COMPETS[COMPETS.length-1]};BAL_DATA=COMPETS[COMPETS.length-1];BLC_DE=COMPETS[0];BLC_ATE=COMPETS[COMPETS.length-1];PAGAR_MES='2026-06';PAGAR_STATUS=PAGAR_GRUPO=PAGAR_FORN='';CR_DE=CR_ATE=CR_UNI='';CAD_OPEN={u:false,p:false,v:false,a:false};CAD_U_BLOCO=CAD_U_Q=CAD_P_TIPO=CAD_P_Q=CAD_V_Q=CAD_A_ESP=CAD_A_Q='';PREV_REAJ=0;PREV_INFL=0;PREV_MESES=6;nav('visao');}

/* ===== Visão Geral ===== */
function renderVisao(){
  const ina=inadimplencia(),t=termometro(),ap=aPagarAberto(),ev=evolucao(),mx=Math.max(...ev.map(e=>e.valor),1);
  const prox=DATA.assembleias.find(a=>a.status==='convocada');
  return `<div class="grid">
   <div class="card kpi pinho span-3"><h3>Saldo em caixa</h3><div class="valor">${brl(saldoAtual())}</div><div class="legenda">Conta do condomínio</div></div>
   <div class="card kpi terracota span-3"><h3>Inadimplência</h3><div class="valor">${pct(ina.pct)}</div><div class="legenda">${ina.qtd} boleto(s) · ${brl(ina.valor)}</div></div>
   <div class="card kpi span-3"><h3>Despesas do mês</h3><div class="valor">${brl(t.g)}</div><div class="legenda">Junho/2026 (competência)</div></div>
   <div class="card kpi terracota span-3"><h3>A pagar (aberto)</h3><div class="valor">${brl(ap.valor)}</div><div class="legenda">${ap.qtd} pendente(s) de aprovação</div></div>
   <div class="card kpi span-3"><h3>Unidades</h3><div class="valor">${DATA.unidades.length}</div><div class="legenda">Total cadastradas</div></div>
   <div class="card kpi span-3"><h3>Pessoas</h3><div class="valor">${DATA.moradores.length}</div><div class="legenda">Cadastro ativo</div></div>
   <div class="card kpi span-3"><h3>Funcionários</h3><div class="valor">${DATA.funcionarios.filter(f=>f.status==='ativo').length}</div><div class="legenda">Ativos (folha)</div></div>
   <div class="card kpi span-3"><h3>Próxima assembleia</h3><div class="valor" style="font-size:20px">${prox?dataBR(prox.data):'—'}</div><div class="legenda">${prox?prox.titulo:'Nenhuma'}</div></div>
   <div class="card span-6"><h3>Termômetro de gastos</h3><div class="gauge-track"><div class="gauge-fill ${t.nivel}" style="width:${Math.min(t.p,100)}%"></div></div><div class="nums"><span>Gasto ${brl(t.g)}</span><span>${pct(t.p)} do orçamento</span><span>Orçado ${brl(t.o)}</span></div></div>
   <div class="card span-6"><h3>Evolução de despesas</h3><div class="bars">${ev.map(e=>`<div class="bar"><span class="v">${brl(e.valor)}</span><div class="col" style="height:${e.valor/mx*100}%"></div><span class="lbl">${e.mes}</span></div>`).join('')}</div></div>
   <div class="card span-7"><h3>Últimos lançamentos · prestação de contas</h3><table class="tbl"><thead><tr><th>Data</th><th>Descrição</th><th class="num">Valor</th><th>Origem</th></tr></thead><tbody>${movimentos().slice(0,8).map(l=>`<tr><td>${dataBR(l.data)}</td><td>${l.desc}</td><td class="num ${l.tipo==='receita'?'rec':'desp'}">${l.tipo==='receita'?'+':'−'} ${brl(l.valor)}</td><td>${l.origem&&l.origem!=='seed'?`<span class="chip">${l.origem}</span>`:''}</td></tr>`).join('')}</tbody></table></div>
   <div class="card feed span-5"><h3><span class="live-dot"></span> Atividade dos agentes</h3><ul>${DATA.feed.slice(0,8).map(f=>`<li><span class="ts">${f.ts}</span><span class="ag ${f.agente}">${f.agente}</span> · ${f.acao}<div class="det">${f.det}</div></li>`).join('')}</ul></div>
  </div>`;
}

/* ===== Contas a Receber ===== */
function renderReceber(){
  const b=DATA.boletos;
  const abertos=b.filter(x=>x.status==='aberto'||x.status==='vencido');
  const recebido=sum(b.filter(x=>x.status==='pago'),x=>x.valor);
  const totalReceber=sum(abertos,x=>x.valor);
  const aVencer=sum(b.filter(x=>x.status==='aberto'),x=>x.valor);
  const ina=inadimplencia();
  const aging={'1-30':0,'31-60':0,'61-90':0,'90+':0};
  b.filter(x=>x.status==='vencido').forEach(x=>{const d=Math.round((HOJE-new Date(x.vencimento+'T00:00:00'))/864e5);const k=d<=30?'1-30':d<=60?'31-60':d<=90?'61-90':'90+';aging[k]+=x.valor;});
  const segs=[['A vencer',aVencer,'pinho'],['1-30 d',aging['1-30'],'terracota'],['31-60 d',aging['31-60'],'terracota'],['61-90 d',aging['61-90'],'terracota'],['90+ d',aging['90+'],'terracota']];
  const mxA=Math.max(...segs.map(s=>s[1]),1);
  const acoes=acoesProgramadas();
  const recon=DATA.feed.filter(f=>['Cobranca','Contabil'].includes(f.agente)).slice(0,5);
  const cotas=[...abertos].sort((a,c)=>(a.status===c.status?0:a.status==='vencido'?-1:1)||uNum(a.unidade_id).localeCompare(uNum(c.unidade_id)));
  const atraso=x=>x.status==='vencido'?Math.max(0,Math.round((HOJE-new Date(x.vencimento+'T00:00:00'))/864e5))+' d':'—';
  // carteira agrupada por unidade (expansível) — com filtros de vencimento e unidade
  const cartLista=abertos.filter(x=>(!CR_DE||x.vencimento>=CR_DE)&&(!CR_ATE||x.vencimento<=CR_ATE)&&(!CR_UNI||String(x.unidade_id)===CR_UNI));
  const porUni={}; cartLista.forEach(x=>{(porUni[x.unidade_id]=porUni[x.unidade_id]||[]).push(x);});
  const uniKeys=Object.keys(porUni).sort((a,d)=>{const av=porUni[a].some(x=>x.status==='vencido'),bv=porUni[d].some(x=>x.status==='vencido');if(av!==bv)return av?-1:1;return uNum(a).localeCompare(uNum(d),'pt',{numeric:true});});
  const carteiraHtml=uniKeys.map(uk=>{
    const lst=porUni[uk].sort((a,d)=>a.competencia.localeCompare(d.competencia));
    const tot=sum(lst,x=>x.valor), venc=lst.filter(x=>x.status==='vencido');
    const maxAtr=venc.length?Math.max(...venc.map(x=>Math.round((HOJE-new Date(x.vencimento+'T00:00:00'))/864e5))):0;
    const rows=lst.map(x=>`<tr><td>Cota ${mlabel(x.competencia)}</td><td>${dataBR(x.vencimento)}</td><td class="num">${brl(x.valor)}</td><td class="${x.status==='vencido'?'desp':'muted'}">${atraso(x)}</td><td><span class="badge ${x.status}">${x.status}</span></td><td><a class="lnk" onclick="reciboCota(${x.id})">⬇ Recibo</a></td><td class="num"><button class="btn pinho sm" onclick="confirmarPagamento(${x.id})">Confirmar pgto</button></td></tr>`).join('');
    return `<details class="uni"><summary><span class="arr">▶</span><span><strong>${uNum(uk)}-${uBloco(uk)}</strong> · <span class="muted">${(moradorDaUnidade(uk)||{}).nome||''}</span></span><span class="muted">${lst.length} cota(s)</span><span class="num"><strong>${brl(tot)}</strong></span><span>${venc.length?`<span class="badge vencido">${maxAtr}d atraso</span>`:'<span class="badge aberto">a vencer</span>'}</span></summary><div class="body"><table class="tbl"><thead><tr><th>Cota</th><th>Vencimento</th><th class="num">Valor</th><th>Atraso</th><th>Status</th><th>Recibo</th><th class="num">Ação</th></tr></thead><tbody>${rows}</tbody></table></div></details>`;
  }).join('');
  return `<div class="ai-note"><svg class="ic" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2E5A4F" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 8v4l3 2"/></svg><div>O <strong>agente Cobrança</strong> controla a carteira a receber cota por cota e executa a <strong>régua de cobrança</strong> (editável) automaticamente.</div></div>
  <div class="grid">
   <div class="card span-12"><div class="flex-between"><div><h3 style="margin:0">Valor da cota condominial</h3><p class="muted" style="font-size:12px;margin:4px 0 0">Cadastro do valor base da cota — aplica-se às novas competências emitidas.</p></div><div style="display:flex;align-items:center;gap:8px"><span class="muted" style="font-weight:600">R$</span><input class="inp" style="width:130px;font-size:16px" type="number" step="0.01" value="${DATA.condominio.cota}" onchange="setCota(this.value)"><span class="muted" style="font-size:12px">/ unidade · mês</span></div></div></div>
   <div class="card kpi terracota span-3"><h3>Total a receber</h3><div class="valor">${brl(totalReceber)}</div><div class="legenda">${abertos.length} cota(s) em aberto</div></div>
   <div class="card kpi terracota span-3"><h3>Vencido</h3><div class="valor">${brl(ina.valor)}</div><div class="legenda">${ina.qtd} cota(s) em atraso</div></div>
   <div class="card kpi span-3"><h3>Inadimplência</h3><div class="valor">${pct(ina.pct)}</div><div class="legenda">das cotas em aberto</div></div>
   <div class="card kpi pinho span-3"><h3>Recebido (acum.)</h3><div class="valor">${brl(recebido)}</div><div class="legenda">Cotas pagas</div></div>
   <div class="card span-12"><div class="flex-between"><h3 style="margin:0">Aging da carteira a receber</h3><div class="muted" style="font-size:13px">Em aberto <strong>${brl(totalReceber)}</strong> · Vencido <strong style="color:var(--terracota)">${brl(ina.valor)}</strong></div></div><div class="bars" style="height:170px;margin-top:6px">${segs.map(s=>`<div class="bar"><span class="v">${brl(s[1])}</span><div class="col ${s[2]}" style="height:${s[1]/mxA*100}%"></div><span class="lbl">${s[0]}</span></div>`).join('')}</div></div>
   <div class="card span-7"><h3>Ações programadas · próximos 7 dias</h3>${acoes.length?`<table class="tbl" style="margin-top:6px"><thead><tr><th>Data</th><th>Ação do agente</th><th>Canal</th><th class="num">Alcance</th></tr></thead><tbody>${acoes.map(a=>`<tr><td><strong>${dataBR(a.data)}</strong></td><td>Enviar <strong>${a.rotulo}</strong> da Cota Condominial de ${mlabel(a.comp)}</td><td><span class="chip">${a.canal}</span></td><td class="num">${a.n} unid.</td></tr>`).join('')}</tbody></table>`:'<p class="muted" style="margin-top:8px">Nenhuma ação nos próximos 7 dias.</p>'}<p class="muted" style="font-size:12px;margin-top:10px">Geradas pela régua de cobrança aplicada às cotas em aberto.</p></div>
   <div class="card span-5"><div class="flex-between"><h3 style="margin:0">Régua de cobrança</h3><button class="btn sm" onclick="abrirRegua()">✎ Editar régua</button></div><div class="regua" style="margin-top:10px">${DATA.regua.filter(e=>e.ativo).map(e=>`<div class="etapa"><div class="off">${e.off!==0?(e.off>0?'+':'')+e.off:'D0'}<small>${e.off!==0?'dias':'venc.'}</small></div><div><div class="rot">${e.rotulo} <span class="chip">${e.canal}</span></div><div class="msg">${e.publico}</div></div></div>`).join('')}</div></div>
   <div class="card span-12"><h3>Carteira a receber — por unidade <span class="chip" style="margin-left:6px">clique para expandir</span></h3>
     <div style="display:flex;gap:10px;flex-wrap:wrap;margin:6px 0 12px;align-items:center">
       <label style="font-size:11px;color:var(--musgo);font-weight:600">Vencimento de</label><input type="date" class="inp" style="width:auto" value="${CR_DE}" onchange="setCarteira('de',this.value)">
       <label style="font-size:11px;color:var(--musgo);font-weight:600">até</label><input type="date" class="inp" style="width:auto" value="${CR_ATE}" onchange="setCarteira('ate',this.value)">
       <select class="inp" style="width:auto" onchange="setCarteira('uni',this.value)"><option value="">Todas as unidades</option>${DATA.unidades.slice().sort((a,b)=>a.num.localeCompare(b.num,'pt',{numeric:true})).map(u=>`<option value="${u.id}" ${String(u.id)===CR_UNI?'selected':''}>${u.num}-${u.bloco}</option>`).join('')}</select>
       <button class="btn sm" onclick="limparCarteira()">Limpar filtros</button>
       <span class="muted" style="font-size:12px">${uniKeys.length} unidade(s) · ${cartLista.length} cota(s)</span>
     </div>
     <div class="muted" style="display:grid;grid-template-columns:20px 1.6fr 1fr 1fr 1fr;gap:12px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;padding:0 14px 6px"><span></span><span>Unidade · responsável</span><span>Cotas</span><span class="num">Total</span><span>Situação</span></div>
     ${carteiraHtml||'<p class="muted">Nenhuma cota em aberto.</p>'}</div>
   <div class="card feed span-12"><h3><span class="live-dot"></span> Reconciliação dos agentes</h3><ul>${recon.length?recon.map(f=>`<li><span class="ts">${f.ts}</span><span class="ag ${f.agente}">${f.agente}</span> · ${f.acao}<div class="det">${f.det}</div></li>`).join(''):'<li class="vazio">Sem reconciliações.</li>'}</ul></div>
  </div>`;
}
function acoesProgramadas(){
  const fim=new Date(HOJE);fim.setDate(fim.getDate()+7);const map={};
  DATA.boletos.filter(b=>b.status==='aberto'||b.status==='vencido').forEach(b=>{DATA.regua.filter(e=>e.ativo).forEach(e=>{const d=new Date(b.vencimento+'T00:00:00');d.setDate(d.getDate()+e.off);if(d>=HOJE&&d<=fim){const di=d.toISOString().slice(0,10),k=e.rotulo+'|'+b.competencia+'|'+di;if(!map[k])map[k]={rotulo:e.rotulo,canal:e.canal,comp:b.competencia,data:di,n:0};map[k].n++;}});});
  return Object.values(map).sort((a,b)=>a.data.localeCompare(b.data));
}
function setCarteira(k,v){if(k==='de')CR_DE=v;else if(k==='ate')CR_ATE=v;else CR_UNI=v;render();}
function limparCarteira(){CR_DE='';CR_ATE='';CR_UNI='';render();}
function setCota(v){DATA.condominio.cota=parseFloat(v)||0;render();}
function confirmarPagamento(id){const b=DATA.boletos.find(x=>x.id===id);if(!b||b.status==='pago')return;b.status='pago';b.pago_em=HOJE_ISO;b.origem='Cobrança';addEvent('Cobranca','Registrou pagamento',`Cota ${uNum(b.unidade_id)} (${mlabel(b.competencia)}) paga — ${brl(b.valor)}`);addEvent('Contabil','Lançou receita',`Taxa ${uNum(b.unidade_id)} — ${brl(b.valor)} → reflete no Fluxo de Caixa`);render();}
function reciboCota(id){
  const b=DATA.boletos.find(x=>x.id===id);if(!b)return;const cond=DATA.condominio;const u=DATA.unidades.find(u=>u.id===b.unidade_id)||{};const m=moradorDaUnidade(b.unidade_id)||{};
  const linha=`34191.79001 01043.510047 91020.150008 8 9${String(b.id).padStart(4,'0')}0000058000`;
  const html=`<html><head><meta charset="utf-8"><title>Cota ${u.num} ${mlabel(b.competencia)}</title><style>body{font-family:Arial,Helvetica,sans-serif;color:#211D1A;max-width:580px;margin:30px auto;padding:0 20px}.box{border:1px solid #E2D8CA;border-radius:12px;padding:22px}.row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #eee;font-size:14px}.row b{color:#555;font-weight:600}.tot{font-size:20px;font-weight:700;color:#C05F3C}.hd{display:flex;align-items:center;gap:10px;border-bottom:2px solid #211D1A;padding-bottom:12px;margin-bottom:18px}.wm{font-family:Georgia,serif;font-size:22px;font-weight:700}.dig{font-family:monospace;font-size:12px;background:#f6f1e9;padding:10px;border-radius:8px;margin-top:14px;word-break:break-all}.st{display:inline-block;font-size:12px;font-weight:700;padding:3px 10px;border-radius:999px;background:${b.status==='vencido'?'#F4DDD3':'#EDE3D3'};color:${b.status==='vencido'?'#A04A2C':'#7a5230'}}</style></head><body>
  <div class="hd"><svg width="30" height="30" viewBox="0 0 100 100"><path d="M18 92 L18 46 A32 32 0 0 1 82 46 L82 92" fill="none" stroke="#C05F3C" stroke-width="9" stroke-linecap="round"/><path d="M38 92 L38 56 A12 12 0 0 1 62 56 L62 92" fill="none" stroke="#C05F3C" stroke-width="9" stroke-linecap="round"/></svg><div><div class="wm">Domus</div><div style="font-size:12px;color:#666">Recibo / 2ª via — Cota Condominial</div></div></div>
  <div class="box"><div class="row"><b>Condomínio</b><span>${cond.nome}</span></div><div class="row"><b>Unidade</b><span>${u.num} (Bloco ${u.bloco})</span></div><div class="row"><b>Responsável</b><span>${m.nome||'—'}</span></div><div class="row"><b>Competência</b><span>${mlabel(b.competencia)}</span></div><div class="row"><b>Vencimento</b><span>${dataBR(b.vencimento)}</span></div><div class="row"><b>Situação</b><span class="st">${b.status}</span></div><div class="row" style="border-bottom:none;margin-top:8px"><b>Valor da cota</b><span class="tot">${brl(b.valor)}</span></div><div class="dig">${linha}</div></div>
  <p style="font-size:12px;color:#888;margin-top:16px">Documento gerado pelo agente de Cobrança Domus em ${new Date().toLocaleDateString('pt-BR')}.</p>
  <script>window.onload=function(){window.print()}<\/script></body></html>`;
  const w=window.open('','_blank','width=640,height=780');if(w){w.document.write(html);w.document.close();}
}
function abrirRegua(){document.getElementById('regua-rows').innerHTML='';DATA.regua.forEach(e=>addEtapaRow(e));document.getElementById('modal-regua').classList.add('open');}
function addEtapaRow(e){e=e||{rotulo:'',off:0,canal:'whatsapp',publico:'',msg:'',ativo:true};const w=document.createElement('div');w.className='etapa-edit';w.style.cssText='border:1px solid var(--linha);border-radius:10px;padding:12px;background:var(--areia);display:flex;flex-direction:column;gap:8px';w.innerHTML=`<div style="display:grid;grid-template-columns:1fr 84px 1fr auto;gap:8px"><input class="inp er-rot" placeholder="Rótulo" value="${(e.rotulo||'').replace(/"/g,'&quot;')}"><input class="inp er-off" type="number" placeholder="dias" title="dias relativos ao vencimento (negativo = antes)" value="${e.off}"><select class="inp er-canal">${['whatsapp','email','carta','ligacao'].map(c=>`<option ${c===e.canal?'selected':''}>${c}</option>`).join('')}</select><button type="button" class="btn sm" onclick="this.closest('.etapa-edit').remove()">✕</button></div><input class="inp er-pub" placeholder="Público (ex.: Inadimplentes 7 dias)" value="${(e.publico||'').replace(/"/g,'&quot;')}"><input class="inp er-msg" placeholder="Mensagem enviada ao condômino" value="${(e.msg||'').replace(/"/g,'&quot;')}"><label style="font-size:12px;color:var(--musgo);display:flex;gap:6px;align-items:center"><input type="checkbox" class="er-ativo" ${e.ativo?'checked':''}> etapa ativa</label>`;document.getElementById('regua-rows').appendChild(w);}
function salvarRegua(ev){ev.preventDefault();const rows=[...document.querySelectorAll('#regua-rows .etapa-edit')];DATA.regua=rows.map(r=>({rotulo:r.querySelector('.er-rot').value.trim()||'Etapa',off:parseInt(r.querySelector('.er-off').value)||0,canal:r.querySelector('.er-canal').value,publico:r.querySelector('.er-pub').value.trim(),msg:r.querySelector('.er-msg').value.trim(),ativo:r.querySelector('.er-ativo').checked})).sort((a,b)=>a.off-b.off);DATA.regua.forEach((e,i)=>e.ordem=i+1);addEvent('Cobranca','Régua atualizada',`${DATA.regua.length} etapa(s) configurada(s) pelo gestor`);fecharRegua();render();return false;}
function fecharRegua(){document.getElementById('modal-regua').classList.remove('open');}

/* ===== Contas a Pagar ===== */
function renderPagar(){
  const c=DATA.contasPagar;
  const ord=contasFiltradas();
  const aPagar=sum(c.filter(x=>x.status==='pendente'||x.status==='aprovada'),x=>x.total), pagoAcum=sum(c.filter(x=>x.status==='paga'),x=>x.total), pend=c.filter(x=>x.status==='pendente').length;
  const fornNomes=[...new Set(c.map(x=>x.fornecedor))].sort();
  const acao=x=>x.status==='pendente'?`<button class="btn primary sm" onclick="aprovarPagar(${x.id})">Aprovar</button> <button class="btn sm" onclick="negarPagar(${x.id})">Negar</button>`:x.status==='aprovada'?`<button class="btn pinho sm" onclick="liquidarPagar(${x.id})">Liquidar</button>`:'<span class="muted">—</span>';
  const comp=x=>x.status==='paga'?`<a class="lnk" onclick="comprovante(${x.id})">⬇ Baixar</a>`:'<span class="muted">—</span>';
  return `<div class="ai-note"><svg class="ic" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2E5A4F" stroke-width="2"><path d="M3 7h18v12H3z"/><path d="M3 11h18"/></svg><div>O <strong>agente Pagamentos</strong> identifica contas e paga fornecedores/folha; o <strong>agente Contábil</strong> lança cada movimento — tudo reflete automaticamente no <strong>Resultado Contábil</strong> (DRE, Balanço e Fluxo).</div></div>
  <div class="grid">
   <div class="card kpi terracota span-3"><h3>A pagar (aberto)</h3><div class="valor">${brl(aPagar)}</div><div class="legenda">Pendentes + aprovadas</div></div>
   <div class="card kpi span-3"><h3>Aguardando aprovação</h3><div class="valor">${pend}</div><div class="legenda">Identificadas pelo agente</div></div>
   <div class="card kpi pinho span-3"><h3>Pago (acumulado)</h3><div class="valor">${brl(pagoAcum)}</div><div class="legenda">Liquidado no período</div></div>
   <div class="card kpi span-3"><h3>Fornecedores</h3><div class="valor">${DATA.fornecedores.length}</div><div class="legenda">Cadastrados</div></div>
   <div class="card span-12"><h3>Lançamentos de contas a pagar</h3>
     <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:12px">
       <select class="inp" style="width:auto" onchange="setPagarFiltro('mes',this.value)"><option value="">Todas as competências</option>${COMPETS.map(c=>`<option value="${c}" ${c===PAGAR_MES?'selected':''}>${mlabel(c)}</option>`).join('')}</select>
       <select class="inp" style="width:auto" onchange="setPagarFiltro('status',this.value)"><option value="">Todos os status</option>${['pendente','aprovada','paga','negada'].map(s=>`<option value="${s}" ${s===PAGAR_STATUS?'selected':''}>${cap(s)}</option>`).join('')}</select>
       <select class="inp" style="width:auto" onchange="setPagarFiltro('grupo',this.value)"><option value="">Todos os grupos</option>${GRUPO_ORDER.map(g=>`<option value="${g}" ${g===PAGAR_GRUPO?'selected':''}>${g}</option>`).join('')}</select>
       <select class="inp" style="width:auto" onchange="setPagarFiltro('forn',this.value)"><option value="">Todos os fornecedores</option>${fornNomes.map(f=>`<option value="${f}" ${f===PAGAR_FORN?'selected':''}>${f}</option>`).join('')}</select>
       <button class="btn sm" onclick="limparPagar()">Limpar filtros</button>
       <button class="btn pinho sm" onclick="baixarComprovantes()">⬇ PDF dos comprovantes</button>
       <span class="muted" style="font-size:12px;align-self:center">${ord.length} lançamento(s)</span>
     </div>
     <table class="tbl"><thead><tr><th>Nº</th><th>Data</th><th>Descrição</th><th class="num">Valor</th><th class="num">Juros/multa</th><th class="num">Total</th><th>Status</th><th>Comprov.</th><th class="num">Ação</th></tr></thead><tbody>${ord.map(x=>`<tr><td style="white-space:nowrap"><strong>${x.numero}</strong></td><td style="white-space:nowrap">${dataBR(x.pago_em||x.vencimento)}</td><td>${x.descricao}<div class="muted" style="font-size:11px">${x.fornecedor} · ${x.grupo} › ${x.conta}</div></td><td class="num">${brl(x.valor)}</td><td class="num ${x.encargos?'desp':'muted'}">${x.encargos?'+ '+brl(x.encargos):'–'}</td><td class="num"><strong>${brl(x.total)}</strong></td><td><span class="badge ${x.status}">${x.status}</span></td><td>${comp(x)}</td><td class="num" style="white-space:nowrap">${acao(x)}</td></tr>`).join('')}</tbody></table><p class="muted" style="font-size:12px;margin-top:10px">Cada lançamento alimenta o <strong>Resultado Contábil</strong>: as despesas entram na DRE por competência e no Balanço (passivo) enquanto abertas; ao liquidar, refletem no Fluxo de Caixa.</p></div>
   <div class="card span-12"><div class="flex-between"><h3 style="margin:0">Fornecedores</h3></div><table class="tbl" style="margin-top:12px"><thead><tr><th>Nome</th><th>Serviço</th><th>CNPJ</th></tr></thead><tbody>${DATA.fornecedores.map(f=>`<tr><td>${f.nome}</td><td class="muted">${f.servico}</td><td class="muted">${f.cnpj}</td></tr>`).join('')}</tbody></table></div>
  </div>`;
}
function setPagarFiltro(k,v){if(k==='mes')PAGAR_MES=v;else if(k==='status')PAGAR_STATUS=v;else if(k==='grupo')PAGAR_GRUPO=v;else if(k==='forn')PAGAR_FORN=v;render();}
function limparPagar(){PAGAR_MES='';PAGAR_STATUS='';PAGAR_GRUPO='';PAGAR_FORN='';render();}
function aprovarPagar(id){const c=DATA.contasPagar.find(x=>x.id===id);if(!c||c.status!=='pendente')return;c.status='aprovada';addEvent('Pagamentos','Pagamento aprovado',`${c.numero} ${c.descricao} (${c.fornecedor}) — ${brl(c.valor)} na fila`);render();}
function negarPagar(id){const c=DATA.contasPagar.find(x=>x.id===id);if(!c||c.status!=='pendente')return;if(!confirm('Negar o lançamento '+c.numero+'?'))return;c.status='negada';addEvent('Pagamentos','Pagamento negado',`${c.numero} ${c.descricao} (${c.fornecedor}) — ${brl(c.valor)} recusado pelo gestor`);render();}
function liquidarPagar(id){const c=DATA.contasPagar.find(x=>x.id===id);if(!c||c.status!=='aprovada')return;c.status='paga';c.pago_em=HOJE_ISO;c.origem='Pagamentos';addEvent('Pagamentos','Pagou fornecedor',`${c.numero} ${c.descricao} — ${brl(c.total)} liquidado${c.encargos?' (inclui '+brl(c.encargos)+' de juros/multa)':''}`);addEvent('Contabil','Lançou despesa',`${c.descricao} — ${brl(c.total)} → reflete no Fluxo de Caixa`);render();}
const _CMP_CSS=`body{font-family:Arial,Helvetica,sans-serif;color:#211D1A;margin:0;padding:0}.cmp{max-width:560px;margin:0 auto;padding:28px 20px;page-break-after:always}.box{border:1px solid #E2D8CA;border-radius:12px;padding:22px}.row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #eee;font-size:14px}.row b{color:#555;font-weight:600}.tot{font-size:20px;font-weight:700;color:#2E5A4F}.hd{display:flex;align-items:center;gap:10px;border-bottom:2px solid #211D1A;padding-bottom:12px;margin-bottom:18px}.wm{font-family:Georgia,serif;font-size:22px;font-weight:700}.ft{font-size:12px;color:#888;margin-top:16px}`;
function comprovanteBox(c){const cond=DATA.condominio;return `<div class="cmp"><div class="hd"><svg width="30" height="30" viewBox="0 0 100 100"><path d="M18 92 L18 46 A32 32 0 0 1 82 46 L82 92" fill="none" stroke="#C05F3C" stroke-width="9" stroke-linecap="round"/><path d="M38 92 L38 56 A12 12 0 0 1 62 56 L62 92" fill="none" stroke="#C05F3C" stroke-width="9" stroke-linecap="round"/></svg><div><div class="wm">Domus</div><div style="font-size:12px;color:#666">Comprovante de Pagamento</div></div></div><div class="box"><div class="row"><b>Condomínio</b><span>${cond.nome}</span></div><div class="row"><b>CNPJ</b><span>${cond.cnpj}</span></div><div class="row"><b>Nº do lançamento</b><span>${c.numero}</span></div><div class="row"><b>Data do pagamento</b><span>${dataBR(c.pago_em||c.vencimento)}</span></div><div class="row"><b>Fornecedor</b><span>${c.fornecedor}</span></div><div class="row"><b>Descrição</b><span>${c.descricao}</span></div><div class="row"><b>Conta contábil</b><span>${c.grupo} › ${c.conta}</span></div><div class="row"><b>Competência</b><span>${mlabel(c.competencia)}</span></div><div class="row"><b>Valor</b><span>${brl(c.valor)}</span></div><div class="row"><b>Juros / multa</b><span>${c.encargos?brl(c.encargos):'—'}</span></div><div class="row" style="border-bottom:none;margin-top:8px"><b>Valor total pago</b><span class="tot">${brl(c.total)}</span></div></div><p class="ft">Pagamento processado pelo agente de Pagamentos Domus · gerado em ${new Date().toLocaleDateString('pt-BR')}.</p></div>`;}
function _abrirImpressao(titulo,corpo){const w=window.open('','_blank','width=700,height=840');if(w){w.document.write(`<html><head><meta charset="utf-8"><title>${titulo}</title><style>${_CMP_CSS}</style></head><body>${corpo}<script>window.onload=function(){window.print()}<\/script></body></html>`);w.document.close();}}
function comprovante(id){const c=DATA.contasPagar.find(x=>x.id===id);if(c)_abrirImpressao('Comprovante '+c.numero,comprovanteBox(c));}
function contasFiltradas(){return [...DATA.contasPagar].filter(x=>(!PAGAR_MES||x.competencia===PAGAR_MES)&&(!PAGAR_STATUS||x.status===PAGAR_STATUS)&&(!PAGAR_GRUPO||x.grupo===PAGAR_GRUPO)&&(!PAGAR_FORN||x.fornecedor===PAGAR_FORN)).sort((a,b)=>{const r={pendente:0,aprovada:1,paga:2,negada:3};return (r[a.status]-r[b.status])||(b.vencimento||'').localeCompare(a.vencimento||'');});}
function baixarComprovantes(){const pagas=contasFiltradas().filter(c=>c.status==='paga');if(!pagas.length){alert('Não há pagamentos liquidados no filtro selecionado.');return;}_abrirImpressao('Comprovantes ('+pagas.length+')',pagas.map(comprovanteBox).join(''));}

/* ===== Resultado Contábil ===== */
function inPer(c){return c>=PERIODO.de&&c<=PERIODO.ate;}
function calcDRE(){
  const receita=sum(DATA.boletos.filter(b=>b.status!=='pendente'&&inPer(b.competencia)),b=>b.valor);
  const grupos={};
  DATA.contasPagar.filter(c=>c.status!=='negada'&&inPer(c.competencia)).forEach(c=>{
    const g=c.grupo||grupoDaConta(c.conta||c.categoria), k=c.conta||c.categoria;
    (grupos[g]=grupos[g]||{total:0,contas:{}});
    grupos[g].total+=c.total; grupos[g].contas[k]=(grupos[g].contas[k]||0)+c.total;
  });
  const totalDesp=Object.values(grupos).reduce((s,g)=>s+g.total,0);
  return {receita,grupos,totalDesp,resultado:receita-totalDesp};
}
function calcFluxo(){
  const prev=COMPETS[COMPETS.indexOf(PERIODO.de)-1]; const saldoIni=prev?saldoCaixaAte(prev):DATA.condominio.saldoInicial;
  const entradas=sum(DATA.boletos.filter(b=>b.status==='pago'&&inPer(b.competencia)),b=>b.valor);
  const saidas=sum(DATA.contasPagar.filter(c=>c.status==='paga'&&inPer(c.competencia)),c=>c.valor);
  return {saldoIni,entradas,saidas,saldoFim:saldoIni+entradas-saidas};
}
function calcBalanco(ate){
  const disp=saldoCaixaAte(ate);
  const aReceber=sum(DATA.boletos.filter(b=>(b.status==='aberto'||b.status==='vencido')&&b.competencia<=ate),b=>b.valor);
  const aPagar=sum(DATA.contasPagar.filter(c=>(c.status==='pendente'||c.status==='aprovada')&&c.competencia<=ate),c=>c.total);
  const ativo=disp+aReceber;
  return {disp,aReceber,ativo,aPagar,passivo:aPagar,pl:ativo-aPagar};
}
function calcBalancete(de,ate){
  const inR=c=>c>=de&&c<=ate, prev=COMPETS[COMPETS.indexOf(de)-1], before=c=>c<de;
  const E=sum(DATA.boletos.filter(b=>b.status!=='pendente'&&inR(b.competencia)),b=>b.valor);
  const R=sum(DATA.boletos.filter(b=>b.status==='pago'&&inR(b.competencia)),b=>b.valor);
  const desp=DATA.contasPagar.filter(c=>c.status!=='negada'&&inR(c.competencia));
  const P=sum(desp,c=>c.total);
  const G=sum(DATA.contasPagar.filter(c=>c.status==='paga'&&inR(c.competencia)),c=>c.total);
  const caixaIni=prev?saldoCaixaAte(prev):DATA.condominio.saldoInicial;
  const crIni=sum(DATA.boletos.filter(b=>(b.status==='aberto'||b.status==='vencido')&&before(b.competencia)),b=>b.valor);
  const cpIni=sum(DATA.contasPagar.filter(c=>(c.status==='pendente'||c.status==='aprovada')&&before(c.competencia)),c=>c.total);
  const plIni=caixaIni+crIni-cpIni;
  const dgrp={}; desp.forEach(c=>{const k=c.grupo+'|'+c.conta;dgrp[k]=(dgrp[k]||0)+c.total;});
  const conta=(cod,nome,ini,deb,cred,nat)=>({tipo:'c',cod,nome,ini,deb,cred,nat,fim:nat==='D'?ini+deb-cred:ini+cred-deb});
  const linhas=[];
  const sec=(cod,nome,cts)=>{linhas.push({tipo:'h',cod,nome});cts.forEach(c=>linhas.push(c));linhas.push({tipo:'s',nome:'Subtotal '+nome,ini:sum(cts,c=>c.ini),deb:sum(cts,c=>c.deb),cred:sum(cts,c=>c.cred),fim:sum(cts,c=>c.fim)});};
  sec('1','ATIVO',[conta('1.1.01','Caixa e equivalentes (disponível)',caixaIni,R,G,'D'),conta('1.1.02','Contas a receber — cotas condominiais',crIni,E,R,'D')]);
  sec('2','PASSIVO',[conta('2.1.01','Contas a pagar — fornecedores',cpIni,G,P,'C')]);
  sec('3','PATRIMÔNIO LÍQUIDO',[conta('3.1.01','Fundo de reserva / superávit acumulado',plIni,0,0,'C')]);
  sec('4','RECEITAS',[conta('4.1.01','Taxas condominiais',0,0,E,'C')]);
  linhas.push({tipo:'h',cod:'5',nome:'DESPESAS'});
  let dDeb=0,dFim=0;
  GRUPO_ORDER.forEach(g=>{const p=PLANO.find(p=>p.grupo===g);const cts=[];p.contas.forEach(cn=>{const v=dgrp[g+'|'+cn];if(v)cts.push(conta(codConta(g,cn),cn,0,v,0,'D'));});if(!cts.length)return;linhas.push({tipo:'h2',cod:codGrupo(g),nome:g});cts.forEach(c=>linhas.push(c));const sd=sum(cts,c=>c.deb),sf=sum(cts,c=>c.fim);linhas.push({tipo:'s',nome:'Subtotal '+g,ini:0,deb:sd,cred:0,fim:sf});dDeb+=sd;dFim+=sf;});
  linhas.push({tipo:'s',nome:'Subtotal DESPESAS',ini:0,deb:dDeb,cred:0,fim:dFim});
  const cs=linhas.filter(l=>l.tipo==='c');
  return {linhas,totDeb:sum(cs,l=>l.deb),totCred:sum(cs,l=>l.cred),totFimD:sum(cs.filter(l=>l.nat==='D'),l=>l.fim),totFimC:sum(cs.filter(l=>l.nat==='C'),l=>l.fim)};
}
function codGrupo(g){return '5.'+(GRUPO_ORDER.indexOf(g)+1);}
function codConta(g,c){const p=PLANO.find(p=>p.grupo===g);const i=p?p.contas.indexOf(c):-1;return codGrupo(g)+'.'+String(i<0?0:i+1).padStart(3,'0');}
function setPeriodo(k,v){PERIODO[k]=v;if(PERIODO.de>PERIODO.ate){if(k==='de')PERIODO.ate=v;else PERIODO.de=v;}render();}
function presetPeriodo(p){const L=COMPETS.length;if(p==='mes'){PERIODO.de=PERIODO.ate=COMPETS[L-1];}else if(p==='ant'){PERIODO.de=PERIODO.ate=COMPETS[L-2];}else if(p==='tri'){PERIODO.de=COMPETS[Math.max(0,L-3)];PERIODO.ate=COMPETS[L-1];}else{PERIODO.de=COMPETS[0];PERIODO.ate=COMPETS[L-1];}render();}
function setBalData(v){BAL_DATA=v;render();}
function setBlc(k,v){if(k==='de')BLC_DE=v;else BLC_ATE=v;if(BLC_DE>BLC_ATE){if(k==='de')BLC_ATE=v;else BLC_DE=v;}render();}
function renderResultado(){
  const dre=calcDRE(),flx=calcFluxo(),bal=calcBalanco(BAL_DATA);
  const opt=sel=>COMPETS.map(c=>`<option value="${c}" ${c===sel?'selected':''}>${mlabel(c)}</option>`).join('');
  const grupoRows=GRUPO_ORDER.filter(g=>dre.grupos[g]).map(g=>{
    const gd=dre.grupos[g];
    const linhas=Object.entries(gd.contas).sort((a,b)=>b[1]-a[1]).map(([c,v])=>`<tr><td style="padding-left:26px" class="muted">${c}</td><td class="num desp">− ${brl(v)}</td></tr>`).join('');
    return `<tr class="grp"><td>${g}</td><td class="num desp">− ${brl(gd.total)}</td></tr>${linhas}`;
  }).join('');
  const blc=calcBalancete(BLC_DE,BLC_ATE);
  const fmtb=v=>v?brl(v):'–';
  const blcRows=blc.linhas.map(l=>{
    if(l.tipo==='h')return `<tr class="grp"><td>${l.cod}</td><td>${l.nome}</td><td></td><td></td><td></td><td></td></tr>`;
    if(l.tipo==='h2')return `<tr><td class="muted">${l.cod}</td><td style="font-weight:600">${l.nome}</td><td></td><td></td><td></td><td></td></tr>`;
    if(l.tipo==='s')return `<tr style="font-weight:600;background:rgba(228,200,180,.12)"><td></td><td>${l.nome}</td><td class="num">${fmtb(l.ini)}</td><td class="num">${fmtb(l.deb)}</td><td class="num">${fmtb(l.cred)}</td><td class="num">${fmtb(l.fim)}</td></tr>`;
    return `<tr><td class="muted">${l.cod}</td><td style="padding-left:20px">${l.nome}</td><td class="num">${fmtb(l.ini)}</td><td class="num">${fmtb(l.deb)}</td><td class="num">${fmtb(l.cred)}</td><td class="num">${fmtb(l.fim)} <span class="muted" style="font-size:10px">${l.nat}</span></td></tr>`;
  }).join('');
  const hoje=new Date().toLocaleDateString('pt-BR');
  return `<div class="ai-note no-print"><svg class="ic" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2E5A4F" stroke-width="2"><path d="M4 4h16v16H4z"/><path d="M8 16v-4M12 16v-7M16 16v-2"/></svg><div>O <strong>agente Contábil</strong> mantém DRE, Balanço Patrimonial, Fluxo de Caixa e o <strong>Balancete</strong> sempre atualizados, a partir das contas a pagar e dos recebíveis. Filtre o período (inclusive <strong>meses anteriores</strong>) e <strong>emita o PDF</strong> do que estiver na tela.</div></div>
  <div class="flex-between no-print" style="margin-bottom:16px">
    <div style="display:flex;gap:10px;align-items:flex-end;flex-wrap:wrap">
      <span style="font-size:11px;color:var(--musgo);font-weight:700;align-self:center;text-transform:uppercase;letter-spacing:.04em">Período · DRE e Fluxo</span>
      <div class="field"><label>De</label><select class="inp" onchange="setPeriodo('de',this.value)">${opt(PERIODO.de)}</select></div>
      <div class="field"><label>Até</label><select class="inp" onchange="setPeriodo('ate',this.value)">${opt(PERIODO.ate)}</select></div>
      <div style="display:flex;gap:6px;flex-wrap:wrap"><button class="btn sm" onclick="presetPeriodo('mes')">Mês atual</button><button class="btn sm" onclick="presetPeriodo('ant')">Mês anterior</button><button class="btn sm" onclick="presetPeriodo('tri')">Trimestre</button><button class="btn sm" onclick="presetPeriodo('ano')">Ano</button></div>
    </div>
    <button class="btn primary" onclick="window.print()">⬇ Emitir PDF</button>
  </div>
  <div class="print-only"><div style="display:flex;align-items:center;gap:12px;border-bottom:2px solid #211D1A;padding-bottom:12px"><svg width="28" height="28" viewBox="0 0 100 100"><path d="M18 92 L18 46 A32 32 0 0 1 82 46 L82 92" fill="none" stroke="#C05F3C" stroke-width="9" stroke-linecap="round"/><path d="M38 92 L38 56 A12 12 0 0 1 62 56 L62 92" fill="none" stroke="#C05F3C" stroke-width="9" stroke-linecap="round"/></svg><div><div style="font-family:Georgia,serif;font-size:22px;font-weight:700">Domus</div><div style="font-size:12px;color:#555">Resultado Contábil — ${DATA.condominio.nome}</div></div><div style="margin-left:auto;text-align:right;font-size:12px;color:#555">Período: ${mlabel(PERIODO.de)} a ${mlabel(PERIODO.ate)}<br>Emitido em ${hoje}</div></div></div>
  <div class="grid">
   <div class="card span-7"><h3>DRE — Demonstração do Resultado <span class="chip" style="margin-left:6px">regime de competência</span></h3>
     <table class="stmt" style="width:100%"><tbody>
       <tr class="grp"><td>RECEITAS OPERACIONAIS</td><td></td></tr>
       <tr><td style="padding-left:26px" class="muted">Taxas condominiais</td><td class="num rec">+ ${brl(dre.receita)}</td></tr>
       <tr class="tot"><td>(=) Receita operacional</td><td class="num">${brl(dre.receita)}</td></tr>
       <tr class="grp"><td>(−) DESPESAS OPERACIONAIS</td><td></td></tr>
       ${grupoRows}
       <tr class="tot"><td>(=) Total de despesas</td><td class="num desp">− ${brl(dre.totalDesp)}</td></tr>
       <tr class="tot"><td>(=) RESULTADO DO PERÍODO (${dre.resultado>=0?'superávit':'déficit'})</td><td class="num" style="color:${dre.resultado>=0?'var(--pinho)':'var(--terracota)'}">${brl(dre.resultado)}</td></tr>
     </tbody></table></div>
   <div class="card span-5"><h3>Fluxo de Caixa <span class="chip" style="margin-left:6px">método direto</span></h3>
     <table class="stmt" style="width:100%"><tbody>
       <tr><td>Saldo inicial do período</td><td class="num">${brl(flx.saldoIni)}</td></tr>
       <tr class="grp"><td>ATIVIDADES OPERACIONAIS</td><td></td></tr>
       <tr><td style="padding-left:26px" class="muted">(+) Recebimento de cotas condominiais</td><td class="num rec">+ ${brl(flx.entradas)}</td></tr>
       <tr><td style="padding-left:26px" class="muted">(−) Pagamentos a fornecedores e folha</td><td class="num desp">− ${brl(flx.saidas)}</td></tr>
       <tr class="tot"><td>(=) Geração líquida de caixa</td><td class="num" style="color:${(flx.entradas-flx.saidas)>=0?'var(--pinho)':'var(--terracota)'}">${brl(flx.entradas-flx.saidas)}</td></tr>
       <tr class="tot"><td>(=) Saldo final do período</td><td class="num" style="color:var(--pinho)">${brl(flx.saldoFim)}</td></tr>
     </tbody></table></div>
   <div class="card span-12"><div class="flex-between"><h3 style="margin:0">Balanço Patrimonial</h3><div style="display:flex;gap:8px;align-items:center"><label style="font-size:11px;color:var(--musgo);font-weight:600">Posição em</label><select class="inp" style="width:auto" onchange="setBalData(this.value)">${COMPETS.map(c=>`<option value="${c}" ${c===BAL_DATA?'selected':''}>${mlabel(c)}</option>`).join('')}</select></div></div>
     <div style="display:grid;grid-template-columns:1fr 1fr;gap:28px">
       <table class="stmt" style="width:100%"><tbody>
         <tr class="grp"><td>ATIVO</td><td></td></tr>
         <tr><td class="muted" style="font-weight:600">Circulante</td><td></td></tr>
         <tr><td style="padding-left:26px" class="muted">Disponível (caixa e bancos)</td><td class="num">${brl(bal.disp)}</td></tr>
         <tr><td style="padding-left:26px" class="muted">Contas a receber — cotas</td><td class="num">${brl(bal.aReceber)}</td></tr>
         <tr class="tot"><td>(=) TOTAL DO ATIVO</td><td class="num">${brl(bal.ativo)}</td></tr>
       </tbody></table>
       <table class="stmt" style="width:100%"><tbody>
         <tr class="grp"><td>PASSIVO E PATRIMÔNIO LÍQUIDO</td><td></td></tr>
         <tr><td class="muted" style="font-weight:600">Passivo circulante</td><td></td></tr>
         <tr><td style="padding-left:26px" class="muted">Contas a pagar</td><td class="num">${brl(bal.passivo)}</td></tr>
         <tr><td class="muted" style="font-weight:600">Patrimônio líquido</td><td></td></tr>
         <tr><td style="padding-left:26px" class="muted">Fundo / superávit acumulado</td><td class="num">${brl(bal.pl)}</td></tr>
         <tr class="tot"><td>(=) TOTAL DO PASSIVO + PL</td><td class="num">${brl(bal.passivo+bal.pl)}</td></tr>
       </tbody></table>
     </div></div>
   <div class="card span-12"><div class="flex-between"><h3 style="margin:0">Balancete de Verificação <span class="chip">competência</span></h3><div style="display:flex;gap:8px;align-items:center"><label style="font-size:11px;color:var(--musgo);font-weight:600">De</label><select class="inp" style="width:auto" onchange="setBlc('de',this.value)">${COMPETS.map(c=>`<option value="${c}" ${c===BLC_DE?'selected':''}>${mlabel(c)}</option>`).join('')}</select><label style="font-size:11px;color:var(--musgo);font-weight:600">Até</label><select class="inp" style="width:auto" onchange="setBlc('ate',this.value)">${COMPETS.map(c=>`<option value="${c}" ${c===BLC_ATE?'selected':''}>${mlabel(c)}</option>`).join('')}</select></div></div>
     <table class="tbl" style="margin-top:12px"><thead><tr><th>Código</th><th>Conta</th><th class="num">Saldo inicial</th><th class="num">Débito</th><th class="num">Crédito</th><th class="num">Saldo final</th></tr></thead>
     <tbody>${blcRows}
       <tr style="font-weight:700;border-top:2px solid var(--linha)"><td></td><td>TOTAIS</td><td class="num">—</td><td class="num">${brl(blc.totDeb)}</td><td class="num">${brl(blc.totCred)}</td><td class="num">—</td></tr>
     </tbody></table>
     <p class="muted" style="font-size:12px;margin-top:10px">Inclui contas patrimoniais (Ativo, Passivo, PL) e de resultado (Receitas, Despesas) no plano de contas. Verificação: <strong>Σ débitos = Σ créditos</strong> (${brl(blc.totDeb)}) e saldos finais <strong>devedores = credores</strong> (${brl(blc.totFimD)}).</p></div>
  </div>`;
}

/* ===== Previsão Orçamentária ===== */
const MNOM=['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
function projMes(i){const tot=5+i,ano=2026+Math.floor(tot/12);return MNOM[tot%12]+'/'+String(ano).slice(2);}
function setPrev(k,v){if(k==='reaj')PREV_REAJ=parseFloat(v)||0;else if(k==='infl')PREV_INFL=parseFloat(v)||0;else PREV_MESES=parseInt(v)||6;render();}
function renderPrevisao(){
  const hist=COMPETS.map((c,i)=>({mes:mlabel(c),rec:sum(DATA.boletos.filter(b=>b.status!=='pendente'&&b.competencia===c),b=>b.valor),desp:sum(DATA.contasPagar.filter(x=>x.status!=='negada'&&x.competencia===c),x=>x.valor),saldo:saldoCaixaAte(c),tipo:'real'}));
  hist.forEach(h=>h.res=h.rec-h.desp);
  const avgRec=hist.reduce((s,h)=>s+h.rec,0)/hist.length, avgDesp=hist.reduce((s,h)=>s+h.desp,0)/hist.length;
  const recP=avgRec*(1+PREV_REAJ/100), despP=avgDesp*(1+PREV_INFL/100);
  let saldo=saldoAtual(); const proj=[];
  for(let i=1;i<=PREV_MESES;i++){saldo+=recP-despP;proj.push({mes:projMes(i),rec:recP,desp:despP,res:recP-despP,saldo,tipo:'proj'});}
  const todas=[...hist,...proj];
  const resAcum=proj.reduce((s,p)=>s+p.res,0), saldoFim=proj.length?proj[proj.length-1].saldo:saldoAtual();
  const maxV=Math.max(...todas.map(t=>Math.max(t.rec,t.desp)),1), maxS=Math.max(...todas.map(t=>t.saldo),1);
  const resCls=v=>v>=0?'var(--pinho)':'var(--terracota)';
  return `<div class="ai-note no-print"><svg class="ic" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2E5A4F" stroke-width="2"><path d="M3 3v18h18"/><path d="M7 14l4-4 3 3 5-6"/></svg><div>Projeção do resultado a partir da <strong>média histórica</strong> de recebimentos e despesas (jan–jun). Ajuste o cenário (reajuste da taxa, inflação das despesas, horizonte) e o agente Contábil recalcula a previsão.</div></div>
  <div class="flex-between no-print" style="margin-bottom:16px"><div style="display:flex;gap:14px;align-items:flex-end;flex-wrap:wrap">
    <div class="field"><label>Reajuste da taxa (%)</label><input class="inp" type="number" step="0.5" style="width:130px" value="${PREV_REAJ}" onchange="setPrev('reaj',this.value)"></div>
    <div class="field"><label>Inflação despesas (%)</label><input class="inp" type="number" step="0.5" style="width:130px" value="${PREV_INFL}" onchange="setPrev('infl',this.value)"></div>
    <div class="field"><label>Horizonte</label><select class="inp" style="width:auto" onchange="setPrev('meses',this.value)">${[3,6,12].map(m=>`<option value="${m}" ${m===PREV_MESES?'selected':''}>${m} meses</option>`).join('')}</select></div>
  </div><button class="btn primary" onclick="window.print()">⬇ Emitir PDF</button></div>
  <p class="muted no-print" style="font-size:12px;margin:-6px 0 14px"><strong>Reajuste da taxa</strong> = aumento % previsto na receita (ex.: reajuste anual da cota condominial). <strong>Inflação das despesas</strong> = aumento % previsto nos custos. Ambos em 0% = projeção pela média histórica, sem variação.</p>
  <div class="print-only"><div style="display:flex;align-items:center;gap:12px;border-bottom:2px solid #211D1A;padding-bottom:12px"><svg width="28" height="28" viewBox="0 0 100 100"><path d="M18 92 L18 46 A32 32 0 0 1 82 46 L82 92" fill="none" stroke="#C05F3C" stroke-width="9" stroke-linecap="round"/><path d="M38 92 L38 56 A12 12 0 0 1 62 56 L62 92" fill="none" stroke="#C05F3C" stroke-width="9" stroke-linecap="round"/></svg><div><div style="font-family:Georgia,serif;font-size:22px;font-weight:700">Domus</div><div style="font-size:12px;color:#555">Previsão Orçamentária — ${DATA.condominio.nome}</div></div><div style="margin-left:auto;text-align:right;font-size:12px;color:#555">Horizonte ${PREV_MESES} meses · reajuste ${PREV_REAJ}% · inflação ${PREV_INFL}%</div></div></div>
  <div class="grid">
   <div class="card kpi pinho span-3"><h3>Receita média/mês</h3><div class="valor">${brl(avgRec)}</div><div class="legenda">Histórico jan–jun</div></div>
   <div class="card kpi span-3"><h3>Despesa média/mês</h3><div class="valor">${brl(avgDesp)}</div><div class="legenda">Histórico jan–jun</div></div>
   <div class="card kpi span-3"><h3>Resultado projetado/mês</h3><div class="valor" style="color:${resCls(recP-despP)}">${brl(recP-despP)}</div><div class="legenda">No cenário atual</div></div>
   <div class="card kpi span-3"><h3>Saldo projetado</h3><div class="valor">${brl(saldoFim)}</div><div class="legenda">Em ${proj.length?proj[proj.length-1].mes:'—'}</div></div>

   <div class="card span-7"><h3>Receitas × Despesas — realizado e projetado</h3>
     <div style="display:flex;gap:14px;font-size:12px;color:var(--musgo);margin-bottom:6px"><span><span style="display:inline-block;width:10px;height:10px;background:var(--pinho);border-radius:2px"></span> Receita</span><span><span style="display:inline-block;width:10px;height:10px;background:var(--terracota);border-radius:2px"></span> Despesa</span><span class="muted">· meses translúcidos = projeção</span></div>
     <div style="overflow-x:auto;padding-bottom:2px"><div style="display:flex;align-items:flex-end;gap:6px;min-width:${todas.length*42}px">${todas.map(t=>`<div style="flex:1;min-width:34px;display:flex;flex-direction:column;align-items:center;opacity:${t.tipo==='proj'?.6:1}"><span style="font-size:9px;font-weight:700;color:${resCls(t.res)};white-space:nowrap">${(t.res/1000).toFixed(0)}k</span><div style="display:flex;gap:3px;align-items:flex-end;justify-content:center;width:100%;height:148px;margin-top:3px"><div style="flex:1;max-width:11px;background:var(--pinho);border-radius:3px 3px 0 0;height:${Math.max(t.rec/maxV*100,1)}%" title="Receita ${brl(t.rec)}"></div><div style="flex:1;max-width:11px;background:var(--terracota);border-radius:3px 3px 0 0;height:${Math.max(t.desp/maxV*100,1)}%" title="Despesa ${brl(t.desp)}"></div></div><div style="font-size:10px;color:var(--musgo);margin-top:5px;white-space:nowrap">${t.mes}</div></div>`).join('')}</div></div></div>

   <div class="card span-5"><h3>Saldo em caixa projetado</h3>
     <div style="overflow-x:auto;padding-bottom:2px"><div style="display:flex;align-items:flex-end;gap:6px;min-width:${todas.length*34}px">${todas.map(t=>`<div style="flex:1;min-width:26px;display:flex;flex-direction:column;align-items:center;opacity:${t.tipo==='proj'?.6:1}"><span style="font-size:9px;font-weight:600;white-space:nowrap">${(t.saldo/1000).toFixed(0)}k</span><div style="display:flex;align-items:flex-end;justify-content:center;width:100%;height:148px;margin-top:3px"><div style="width:70%;max-width:22px;background:var(--pinho);border-radius:4px 4px 0 0;height:${Math.max(t.saldo/maxS*100,2)}%"></div></div><div style="font-size:10px;color:var(--musgo);margin-top:5px;white-space:nowrap">${t.mes}</div></div>`).join('')}</div></div></div>

   <div class="card span-12"><h3>Projeção detalhada</h3>
     <table class="tbl"><thead><tr><th>Mês</th><th></th><th class="num">Receitas</th><th class="num">Despesas</th><th class="num">Resultado</th><th class="num">Saldo acumulado</th></tr></thead><tbody>
       ${todas.map(t=>`<tr><td><strong>${t.mes}</strong></td><td>${t.tipo==='proj'?'<span class="badge pendente">projeção</span>':'<span class="badge ativo">realizado</span>'}</td><td class="num rec">${brl(t.rec)}</td><td class="num desp">${brl(t.desp)}</td><td class="num" style="color:${resCls(t.res)};font-weight:600">${brl(t.res)}</td><td class="num">${brl(t.saldo)}</td></tr>`).join('')}
       <tr style="font-weight:700;border-top:2px solid var(--linha)"><td>Resultado projetado (${PREV_MESES}m)</td><td></td><td class="num">${brl(recP*PREV_MESES)}</td><td class="num">${brl(despP*PREV_MESES)}</td><td class="num" style="color:${resCls(resAcum)}">${brl(resAcum)}</td><td class="num">${brl(saldoFim)}</td></tr>
     </tbody></table>
     <p class="muted" style="font-size:12px;margin-top:10px">Projeção ilustrativa: receita e despesa médias do histórico, ajustadas pelo cenário (reajuste ${PREV_REAJ.toString().replace('.',',')}% · inflação ${PREV_INFL.toString().replace('.',',')}%). Não considera sazonalidade nem despesas extraordinárias pontuais.</p></div>
  </div>`;
}

/* ===== Departamento Pessoal ===== */
function renderDP(){
  const f=DATA.funcionarios,ativos=f.filter(x=>x.status==='ativo'),proc=f.filter(x=>['em_admissao','em_demissao'].includes(x.status));
  const folha=sum(ativos,x=>x.salario),he=sum(f,x=>x.horasExtras||0);
  return `<div class="ai-note"><svg class="ic" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2E5A4F" stroke-width="2"><circle cx="9" cy="8" r="3"/><path d="M3.5 20a5.5 5.5 0 0 1 11 0"/></svg><div>O <strong>agente de DP</strong> processa a folha, controla o ponto e roda <strong>admissão/demissão no eSocial</strong>. O gestor inicia aqui e acompanha.</div></div>
  <div class="grid">
   <div class="card kpi pinho span-3"><h3>Folha mensal</h3><div class="valor">${brl(folha)}</div><div class="legenda">Funcionários ativos</div></div>
   <div class="card kpi span-3"><h3>Ativos</h3><div class="valor">${ativos.length}</div><div class="legenda">No quadro</div></div>
   <div class="card kpi span-3"><h3>Em processo</h3><div class="valor">${proc.length}</div><div class="legenda">Admissão/demissão</div></div>
   <div class="card kpi span-3"><h3>Horas extras (mês)</h3><div class="valor">${he}h</div><div class="legenda">Folha de ponto · junho</div></div>
   <div class="card span-12"><h3>Quadro de funcionários</h3><table class="tbl"><thead><tr><th>Nome</th><th>Cargo</th><th>Admissão</th><th>Jornada</th><th class="num">Salário</th><th class="num">H. extras</th><th>Status</th><th class="num">Ação</th></tr></thead><tbody>${f.map(x=>`<tr><td>${x.nome}<div class="muted" style="font-size:11px">CPF ${x.cpf}</div></td><td>${x.cargo}</td><td>${dataBR(x.admissao)}</td><td class="muted">${x.jornada}</td><td class="num">${brl(x.salario)}</td><td class="num">${x.horasExtras||0}h</td><td><span class="badge ${x.status}">${x.status.replace('_',' ')}</span></td><td class="num">${x.status==='ativo'?`<button class="btn sm" onclick="iniciarDemissao(${x.id})">Iniciar demissão</button>`:'<span class="muted">em andamento</span>'}</td></tr>`).join('')}</tbody></table></div>
   <div class="card span-6"><h3>Nova admissão</h3><form onsubmit="return iniciarAdmissao(event)" style="display:flex;flex-direction:column;gap:10px"><input class="inp" id="adm-nome" placeholder="Nome do funcionário" required><input class="inp" id="adm-cargo" placeholder="Cargo (ex.: Porteiro)" required><input class="inp" id="adm-salario" type="number" step="0.01" placeholder="Salário (R$)" required><button class="btn primary" type="submit">Iniciar admissão (eSocial)</button></form></div>
   <div class="card span-6"><h3>Folha de ponto · junho/2026</h3><table class="tbl"><thead><tr><th>Funcionário</th><th>Cargo</th><th class="num">Horas extras</th></tr></thead><tbody>${f.map(x=>`<tr><td>${x.nome}</td><td class="muted">${x.cargo}</td><td class="num">${x.horasExtras||0}h</td></tr>`).join('')}</tbody></table></div>
  </div>`;
}
function iniciarDemissao(id){const x=DATA.funcionarios.find(f=>f.id===id);if(!x||x.status!=='ativo')return;if(!confirm('Iniciar demissão de '+x.nome+'?'))return;x.status='em_demissao';addEvent('DP','Demissão iniciada',`${x.nome} (${x.cargo}) — rodando rescisão no eSocial`);render();}
function iniciarAdmissao(e){e.preventDefault();const nome=document.getElementById('adm-nome').value.trim(),cargo=document.getElementById('adm-cargo').value.trim(),sal=parseFloat(document.getElementById('adm-salario').value)||0;DATA.funcionarios.push({id:nextId(DATA.funcionarios),nome,cargo,salario:sal,cpf:'—',admissao:HOJE_ISO,jornada:'44h/semana',status:'em_admissao',horasExtras:0});addEvent('DP','Admissão iniciada',`${nome} (${cargo}) — rodando admissão no eSocial`);render();return false;}

/* ===== Assembleias ===== */
function renderAssembleias(){
  const prox=DATA.assembleias.find(a=>a.status==='convocada');
  const todas=[...DATA.assembleias].sort((a,b)=>b.data.localeCompare(a.data)),docs=todas.filter(a=>a.ata);
  let ph;
  if(prox){const dias=Math.round((new Date(prox.data)-HOJE)/864e5);ph=`<div class="flex-between"><div><h3 style="margin:0 0 6px">Próxima assembleia</h3><div style="font-family:var(--serif);font-size:20px;font-weight:600">${prox.titulo}</div><div class="muted" style="margin-top:4px">${cap(prox.tipo)} · ${dataBR(prox.data)} · ${prox.local}${dias>=0?` · <strong style="color:var(--terracota)">em ${dias} dias</strong>`:''}</div></div><span class="badge convocada">convocada</span></div><div style="margin-top:12px"><strong style="font-size:13px">Pauta:</strong> <span class="muted">${prox.pauta}</span></div>${prox.convocacao_em?`<div class="ai-note" style="margin:14px 0 0;background:#FBEFD2;border-color:#E8D8A8;border-left-color:#C9962F;color:#7a5d12"><svg class="ic" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C9962F" stroke-width="2"><path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/></svg><div>Aviso prévio enviado em ${dataBR(prox.convocacao_em)} — prazo legal cumprido pelo agente.</div></div>`:''}`;}
  else ph='<h3>Próxima assembleia</h3><p class="muted">Nenhuma assembleia convocada.</p>';
  const ger=true;
  return `<div class="ai-note"><svg class="ic" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2E5A4F" stroke-width="2"><path d="M6 2h9l5 5v15H6z"/><path d="M14 2v6h6"/></svg><div>O <strong>agente de Assembleias</strong> convoca (com aviso prévio), conduz e <strong>emite as atas</strong>. Tudo fica no repositório.</div></div>
  <div class="grid">
   ${ger?`<div class="card span-12"><div class="flex-between"><h3 style="margin:0">Convocação de assembleia</h3><button class="btn primary sm" onclick="abrirConvocar()">+ Convocar assembleia</button></div><p class="muted" style="font-size:12px;margin-top:6px">O agente envia o aviso prévio com a pauta a todos os condôminos e registra a convocação.</p></div>`:''}
   <div class="card span-12" style="border-left:4px solid var(--terracota)">${ph}</div>
   <div class="card span-7"><h3>Todas as assembleias</h3><table class="tbl"><thead><tr><th>Título</th><th>Tipo</th><th>Data</th><th>Status</th><th class="num">Ata</th></tr></thead><tbody>${todas.map(a=>`<tr><td>${a.titulo}</td><td class="muted">${cap(a.tipo)}</td><td>${dataBR(a.data)}</td><td><span class="badge ${a.status}">${a.status}</span></td><td class="num">${a.ata?`<a class="lnk" onclick="baixarAta(${a.id})">⬇ PDF</a>`:'<span class="muted">—</span>'}</td></tr>`).join('')}</tbody></table></div>
   <div class="card span-5"><h3>Repositório de atas</h3>${docs.length?docs.map(a=>`<details class="acc"><summary>📄 ${a.titulo}<span class="muted" style="font-size:12px;font-weight:400">${dataBR(a.data)}</span></summary><div class="body">${a.ata}<div style="margin-top:10px"><button class="btn sm" onclick="baixarAta(${a.id})">⬇ Baixar ata (PDF)</button></div></div></details>`).join(''):'<p class="muted">Nenhuma ata publicada.</p>'}</div>
  </div>`;
}
function abrirConvocar(){document.getElementById('cv-titulo').value='';document.getElementById('cv-tipo').value='ordinaria';document.getElementById('cv-data').value='';document.getElementById('cv-local').value='Salão de festas';document.getElementById('cv-pauta').value='';document.getElementById('modal-convocar').classList.add('open');}
function fecharConvocar(){document.getElementById('modal-convocar').classList.remove('open');}
function salvarConvocar(e){e.preventDefault();const a={id:nextId(DATA.assembleias),titulo:document.getElementById('cv-titulo').value.trim(),tipo:document.getElementById('cv-tipo').value,data:document.getElementById('cv-data').value||HOJE_ISO,local:document.getElementById('cv-local').value.trim(),status:'convocada',pauta:document.getElementById('cv-pauta').value.trim(),ata:'',convocacao_em:HOJE_ISO};DATA.assembleias.push(a);addEvent('Atendimento','Assembleia convocada',`${a.titulo} — aviso prévio enviado a 100 unidades`);fecharConvocar();render();return false;}
function baixarAta(id){const a=DATA.assembleias.find(x=>x.id===id);if(!a)return;const cond=DATA.condominio;_abrirImpressao('Ata — '+a.titulo,`<div class="cmp"><div class="hd"><svg width="30" height="30" viewBox="0 0 100 100"><path d="M18 92 L18 46 A32 32 0 0 1 82 46 L82 92" fill="none" stroke="#C05F3C" stroke-width="9" stroke-linecap="round"/><path d="M38 92 L38 56 A12 12 0 0 1 62 56 L62 92" fill="none" stroke="#C05F3C" stroke-width="9" stroke-linecap="round"/></svg><div><div class="wm">Domus</div><div style="font-size:12px;color:#666">Ata de Assembleia</div></div></div><div class="box"><div class="row"><b>Condomínio</b><span>${cond.nome}</span></div><div class="row"><b>Assembleia</b><span>${a.titulo}</span></div><div class="row"><b>Tipo</b><span>${cap(a.tipo)}</span></div><div class="row"><b>Data</b><span>${dataBR(a.data)}</span></div><div class="row" style="border-bottom:none"><b>Local</b><span>${a.local}</span></div></div><p style="margin-top:16px;font-size:13px;line-height:1.6"><b>Pauta:</b> ${a.pauta}</p><p style="margin-top:10px;font-size:13px;line-height:1.6"><b>Ata:</b> ${a.ata}</p><p class="ft">Documento emitido pelo agente de Assembleias Domus · ${new Date().toLocaleDateString('pt-BR')}.</p></div>`);}

/* ===== Avisos ===== */
function renderAvisos(){
  const ger=true;
  let avisos=[...DATA.avisos].sort((a,b)=>b.data.localeCompare(a.data));
  return `<div class="ai-note"><svg class="ic" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2E5A4F" stroke-width="2"><path d="M10 5a2 2 0 1 1 4 0v.4a7 7 0 0 1 4 6.3V15l1.5 2.5H4.5L6 15v-3.3a7 7 0 0 1 4-6.3z"/></svg><div>Comunicados esporádicos do condomínio. O <strong>agente de Atendimento</strong> entrega cada aviso ao público escolhido (WhatsApp/app) e mantém o histórico aqui.</div></div>
  <div class="grid">
   ${ger?`<div class="card span-12"><div class="flex-between"><h3 style="margin:0">Comunicados publicados</h3><button class="btn primary sm" onclick="abrirAviso()">+ Novo aviso</button></div></div>`:''}
   ${avisos.length?avisos.map(a=>`<div class="card span-6"><div class="flex-between"><h3 style="margin:0">${a.titulo}</h3><span class="chip">${a.publico}</span></div><div class="muted" style="font-size:12px;margin:4px 0 8px">${dataBR(a.data)}</div><div style="font-size:14px;line-height:1.55">${a.mensagem}</div>${ger?`<div style="margin-top:12px;display:flex;gap:8px"><button class="btn sm" onclick="abrirAviso(${a.id})">Editar</button><button class="btn sm" onclick="excluirAviso(${a.id})">Excluir</button></div>`:''}</div>`).join(''):'<div class="card span-12"><p class="muted">Nenhum aviso para o seu perfil.</p></div>'}
  </div>`;
}
function abrirAviso(id){const ed=id!=null;const a=ed?DATA.avisos.find(x=>x.id===id):{};document.getElementById('av-id').value=ed?a.id:'';document.getElementById('av-titulo-h').textContent=ed?'Editar aviso':'Novo aviso';document.getElementById('av-titulo').value=a.titulo||'';document.getElementById('av-publico').value=a.publico||'Todos';document.getElementById('av-msg').value=a.mensagem||'';document.getElementById('modal-aviso').classList.add('open');}
function fecharAviso(){document.getElementById('modal-aviso').classList.remove('open');}
function salvarAviso(e){e.preventDefault();const idv=document.getElementById('av-id').value;const d={titulo:document.getElementById('av-titulo').value.trim(),publico:document.getElementById('av-publico').value,mensagem:document.getElementById('av-msg').value.trim(),data:HOJE_ISO};if(idv){Object.assign(DATA.avisos.find(x=>x.id==idv),d);}else{DATA.avisos.push({id:nextId(DATA.avisos),...d});addEvent('Atendimento','Aviso enviado',`"${d.titulo}" → ${d.publico}`);}fecharAviso();render();return false;}
function excluirAviso(id){const a=DATA.avisos.find(x=>x.id===id);if(!a||!confirm('Excluir o aviso "'+a.titulo+'"?'))return;DATA.avisos=DATA.avisos.filter(x=>x.id!==id);render();}

/* ===== Cadastro ===== */
function veicsDe(mid){return DATA.veiculos.filter(v=>v.morador_id===mid);}
function morOf(id){return DATA.moradores.find(m=>m.id===id)||{};}
function uniLabelDe(mid){const m=morOf(mid);return m.unidade_id?uNum(m.unidade_id)+'-'+uBloco(m.unidade_id):'—';}
function renderCadastro(){
  const blocos=[...new Set(DATA.unidades.map(u=>u.bloco))].sort();
  const especies=[...new Set(DATA.animais.map(a=>a.especie))].sort();
  const qU=CAD_U_Q.toLowerCase(),qP=CAD_P_Q.toLowerCase(),qV=CAD_V_Q.toLowerCase(),qA=CAD_A_Q.toLowerCase();
  let ud=DATA.unidades.map(u=>{const nm=DATA.moradores.filter(m=>m.unidade_id===u.id).length;const nb=DATA.boletos.filter(b=>b.unidade_id===u.id).length;const nv=DATA.vagas.filter(v=>v.unidade_id===u.id).length;return {...u,nm,nb,nv,del:nm===0&&nb===0};});
  ud=ud.filter(u=>(!CAD_U_BLOCO||u.bloco===CAD_U_BLOCO)&&(!qU||u.num.toLowerCase().includes(qU)));
  let pessoas=[...DATA.moradores].sort((a,b)=>a.nome.localeCompare(b.nome)).filter(p=>(!CAD_P_TIPO||p.tipo===CAD_P_TIPO)&&(!qP||(p.nome+' '+p.cpf+' '+p.email+' '+uNum(p.unidade_id)).toLowerCase().includes(qP)));
  let veics=[...DATA.veiculos].sort((a,b)=>uniLabelDe(a.morador_id).localeCompare(uniLabelDe(b.morador_id),'pt',{numeric:true})).filter(v=>!qV||((v.modelo||'')+' '+(v.placa||'')+' '+(morOf(v.morador_id).nome||'')+' '+uniLabelDe(v.morador_id)).toLowerCase().includes(qV));
  let anims=[...DATA.animais].sort((a,b)=>uniLabelDe(a.morador_id).localeCompare(uniLabelDe(b.morador_id),'pt',{numeric:true})).filter(a=>(!CAD_A_ESP||a.especie===CAD_A_ESP)&&(!qA||(a.nome+' '+(morOf(a.morador_id).nome||'')+' '+uniLabelDe(a.morador_id)).toLowerCase().includes(qA)));
  return `<div class="grid">
   <div class="card kpi pinho span-3"><h3>Unidades</h3><div class="valor">${DATA.unidades.length}</div><div class="legenda">${DATA.vagas.length} vagas</div></div>
   <div class="card kpi span-3"><h3>Pessoas</h3><div class="valor">${DATA.moradores.length}</div><div class="legenda">Moradores, inquilinos, visitantes</div></div>
   <div class="card kpi span-3"><h3>Veículos</h3><div class="valor">${DATA.veiculos.length}</div><div class="legenda">Cadastrados</div></div>
   <div class="card kpi span-3"><h3>Animais</h3><div class="valor">${DATA.animais.length}</div><div class="legenda">Registrados</div></div>
   ${cadAppCardHTML()}
   <div class="card span-12"><div class="flex-between"><h3 style="margin:0">Cadastrar / editar</h3><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn primary sm" onclick="abrirUnidade()">+ Unidade</button><button class="btn primary sm" onclick="abrirPessoa()">+ Pessoa</button><button class="btn primary sm" onclick="abrirVeiculo()">+ Veículo</button><button class="btn primary sm" onclick="abrirAnimal()">+ Animal</button></div></div>
     <p class="muted" style="font-size:12px;margin-top:6px">Atalhos para os cadastros abaixo. Cada bloco também tem seus próprios botões de editar/excluir e filtros.</p></div>

   <details class="card span-12" ${CAD_OPEN.u?'open':''} ontoggle="setCadOpen('u',this.open)"><summary><span>Unidades<span class="ct">${DATA.unidades.length} cadastradas · clique para abrir a base</span></span><span class="arr">▶</span></summary>
     <div class="imp-bar"><button class="btn primary sm" onclick="abrirUnidade()">+ Cadastrar</button><button class="btn sm" onclick="baixarModelo('unidades')">⬇ Baixar modelo (CSV)</button><label class="btn sm" style="cursor:pointer">⬆ Importar CSV<input type="file" accept=".csv" style="display:none" onchange="importarCSV('unidades',this)"></label></div>
     <div style="display:flex;gap:10px;flex-wrap:wrap;margin:0 0 10px;align-items:center"><select class="inp" style="width:auto" onchange="setCadUni('b',this.value)"><option value="">Todos os blocos</option>${blocos.map(b=>`<option value="${b}" ${b===CAD_U_BLOCO?'selected':''}>Bloco ${b}</option>`).join('')}</select><input id="cad-q-uni" class="inp" style="width:auto;min-width:160px" placeholder="Buscar número…" value="${CAD_U_Q}" oninput="setCadUni('q',this.value)"><button class="btn sm" onclick="limparCad('u')">Limpar</button><span class="muted" style="font-size:12px">${ud.length} de ${DATA.unidades.length}</span></div>
     <table class="tbl"><thead><tr><th>Número</th><th>Bloco</th><th class="num">Moradores</th><th class="num">Boletos</th><th class="num">Vagas</th><th class="num">Ações</th></tr></thead><tbody>${ud.length?ud.map(u=>`<tr><td><strong>${u.num}</strong></td><td class="muted">${u.bloco}</td><td class="num">${u.nm}</td><td class="num">${u.nb}</td><td class="num">${u.nv}</td><td class="num" style="white-space:nowrap"><button class="btn sm" onclick="abrirUnidade(${u.id})">Editar</button> ${u.del?`<button class="btn sm" onclick="excluirUnidade(${u.id})">Excluir</button>`:`<button class="btn sm" disabled title="Possui moradores ou boletos">Excluir</button>`}</td></tr>`).join(''):'<tr><td colspan="6" class="muted">Nenhuma unidade no filtro.</td></tr>'}</tbody></table></details>

   <details class="card span-12" ${CAD_OPEN.p?'open':''} ontoggle="setCadOpen('p',this.open)"><summary><span>Pessoas<span class="ct">${DATA.moradores.length} cadastradas · clique para abrir a base</span></span><span class="arr">▶</span></summary>
     <div class="imp-bar"><button class="btn primary sm" onclick="abrirPessoa()">+ Cadastrar</button><button class="btn sm" onclick="baixarModelo('pessoas')">⬇ Baixar modelo (CSV)</button><label class="btn sm" style="cursor:pointer">⬆ Importar CSV<input type="file" accept=".csv" style="display:none" onchange="importarCSV('pessoas',this)"></label></div>
     <div style="display:flex;gap:10px;flex-wrap:wrap;margin:0 0 10px;align-items:center"><select class="inp" style="width:auto" onchange="setCadPes('t',this.value)"><option value="">Todos os tipos</option>${['morador','inquilino','visitante'].map(t=>`<option value="${t}" ${t===CAD_P_TIPO?'selected':''}>${cap(t)}</option>`).join('')}</select><input id="cad-q-pes" class="inp" style="width:auto;min-width:200px" placeholder="Buscar nome, CPF, email…" value="${CAD_P_Q}" oninput="setCadPes('q',this.value)"><button class="btn sm" onclick="limparCad('p')">Limpar</button><span class="muted" style="font-size:12px">${pessoas.length} de ${DATA.moradores.length}</span></div>
     <p class="muted" style="font-size:12px;margin:-2px 0 10px">A coluna <strong>Acesso</strong> define o que cada pessoa poderá acessar nos sistemas linkados (app do condômino, app do funcionário) — não altera este portal do gestor.</p>
     <table class="tbl"><thead><tr><th>Nome</th><th>Unidade</th><th>Bloco</th><th>Tipo</th><th>Telefone</th><th>Email</th><th>CPF</th><th>Acesso</th><th class="num">Ações</th></tr></thead><tbody>${pessoas.length?pessoas.map(p=>`<tr><td><strong>${p.nome}</strong></td><td>${uNum(p.unidade_id)}</td><td class="muted">${uBloco(p.unidade_id)}</td><td><span class="badge ${p.tipo}">${p.tipo}</span></td><td class="muted">${p.telefone||'—'}</td><td class="muted">${p.email||'—'}</td><td class="muted">${p.cpf||'—'}</td><td><span class="chip">${p.acesso||'—'}</span></td><td class="num" style="white-space:nowrap"><button class="btn sm" onclick="abrirPessoa(${p.id})">Editar</button> <button class="btn sm" onclick="excluirPessoa(${p.id})">Excluir</button></td></tr>`).join(''):'<tr><td colspan="9" class="muted">Nenhuma pessoa no filtro.</td></tr>'}</tbody></table></details>

   <details class="card span-12" ${CAD_OPEN.v?'open':''} ontoggle="setCadOpen('v',this.open)"><summary><span>Veículos<span class="ct">${DATA.veiculos.length} cadastrados · clique para abrir a base</span></span><span class="arr">▶</span></summary>
     <div class="imp-bar"><button class="btn primary sm" onclick="abrirVeiculo()">+ Cadastrar</button><button class="btn sm" onclick="baixarModelo('veiculos')">⬇ Baixar modelo (CSV)</button><label class="btn sm" style="cursor:pointer">⬆ Importar CSV<input type="file" accept=".csv" style="display:none" onchange="importarCSV('veiculos',this)"></label></div>
     <div style="display:flex;gap:10px;flex-wrap:wrap;margin:0 0 10px;align-items:center"><input id="cad-q-vei" class="inp" style="width:auto;min-width:220px" placeholder="Buscar placa, modelo, dono, unidade…" value="${CAD_V_Q}" oninput="setCadVei(this.value)"><button class="btn sm" onclick="limparCad('v')">Limpar</button><span class="muted" style="font-size:12px">${veics.length} de ${DATA.veiculos.length}</span></div>
     <table class="tbl"><thead><tr><th>Unidade</th><th>Dono</th><th>Tipo / modelo</th><th>Placa</th><th>Vaga</th><th class="num">Ações</th></tr></thead><tbody>${veics.length?veics.map(v=>`<tr><td><strong>${uniLabelDe(v.morador_id)}</strong></td><td class="muted">${morOf(v.morador_id).nome||'—'}</td><td>${v.modelo||'—'}</td><td class="muted">${v.placa||'—'}</td><td>${v.vaga_id?`<span class="chip">${vagaIdent(v.vaga_id)}</span>`:'<span class="muted">—</span>'}</td><td class="num" style="white-space:nowrap"><button class="btn sm" onclick="abrirVeiculo(${v.id})">Editar</button> <button class="btn sm" onclick="excluirVeiculo(${v.id})">Excluir</button></td></tr>`).join(''):'<tr><td colspan="6" class="muted">Nenhum veículo no filtro.</td></tr>'}</tbody></table></details>

   <details class="card span-12" ${CAD_OPEN.a?'open':''} ontoggle="setCadOpen('a',this.open)"><summary><span>Animais<span class="ct">${DATA.animais.length} registrados · clique para abrir a base</span></span><span class="arr">▶</span></summary>
     <div class="imp-bar"><button class="btn primary sm" onclick="abrirAnimal()">+ Cadastrar</button><button class="btn sm" onclick="baixarModelo('animais')">⬇ Baixar modelo (CSV)</button><label class="btn sm" style="cursor:pointer">⬆ Importar CSV<input type="file" accept=".csv" style="display:none" onchange="importarCSV('animais',this)"></label></div>
     <div style="display:flex;gap:10px;flex-wrap:wrap;margin:0 0 10px;align-items:center"><select class="inp" style="width:auto" onchange="setCadAni('e',this.value)"><option value="">Todas as espécies</option>${especies.map(e=>`<option value="${e}" ${e===CAD_A_ESP?'selected':''}>${e}</option>`).join('')}</select><input id="cad-q-ani" class="inp" style="width:auto;min-width:200px" placeholder="Buscar nome, dono, unidade…" value="${CAD_A_Q}" oninput="setCadAni('q',this.value)"><button class="btn sm" onclick="limparCad('a')">Limpar</button><span class="muted" style="font-size:12px">${anims.length} de ${DATA.animais.length}</span></div>
     <table class="tbl"><thead><tr><th>Unidade</th><th>Dono</th><th>Nome</th><th>Espécie</th><th>Porte</th><th class="num">Ações</th></tr></thead><tbody>${anims.length?anims.map(a=>`<tr><td><strong>${uniLabelDe(a.morador_id)}</strong></td><td class="muted">${morOf(a.morador_id).nome||'—'}</td><td>${a.nome}</td><td>${a.especie}</td><td class="muted">${a.porte}</td><td class="num" style="white-space:nowrap"><button class="btn sm" onclick="abrirAnimal(${a.id})">Editar</button> <button class="btn sm" onclick="excluirAnimal(${a.id})">Excluir</button></td></tr>`).join(''):'<tr><td colspan="6" class="muted">Nenhum animal no filtro.</td></tr>'}</tbody></table></details>
  </div>`;
}
function cadAppCardHTML(){
  const app=((typeof Domus!=='undefined'&&Domus.get('cadastroApp'))||[]);
  if(!app.length) return '';
  const L={unidades:'Unidade',pessoas:'Pessoa',veiculos:'Veículo',animais:'Animal'};
  const desc=r=>{const it=r.item||{}; if(r.tipo==='unidades')return '<strong>Unidade '+(it.u||'')+'</strong>'+(it.morador&&it.morador!=='—'?' · '+it.morador:'')+(it.vaga?' · vaga '+it.vaga:''); if(r.tipo==='pessoas')return '<strong>'+(it.nome||'')+'</strong> · '+(it.u||'')+' · '+(it.tipo||''); if(r.tipo==='veiculos')return '<strong>'+(it.modelo||'')+' '+(it.placa||'')+'</strong> · '+(it.u||''); return '<strong>'+(it.nome||'')+'</strong> · '+(it.especie||'')+' · '+(it.u||'');};
  const rows=app.map(r=>`<tr><td><span class="chip">${L[r.tipo]||r.tipo}</span></td><td>${desc(r)}</td><td class="muted">app do gestor</td><td class="num"><button class="btn sm" onclick="delCadApp(${r.id})">Excluir</button></td></tr>`).join('');
  return `<div class="card span-12"><div class="flex-between"><h3 style="margin:0">Cadastros adicionados pelo app <span class="r">${app.length}</span></h3></div><p class="muted" style="font-size:12px;margin:6px 0 10px">Registros incluídos pelo gestor no app — sincronizados em tempo real com este portal.</p><table class="tbl"><thead><tr><th>Tipo</th><th>Registro</th><th>Origem</th><th class="num">Ações</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}
function delCadApp(id){ if(typeof Domus!=='undefined'){ Domus.update('cadastroApp',a=>a.filter(x=>x.id!==id)); render(); } }
function baixarModelo(tipo){
  const T={
    unidades:{h:'numero;bloco',d:'numero = número da unidade (ex.: 201)  |  bloco = identificação do bloco (ex.: A)',ex:'201;A'},
    pessoas:{h:'nome;unidade;bloco;tipo;telefone;email;cpf;acesso',d:'tipo = morador | inquilino | visitante     acesso = Gestor | Morador | Funcionário | Sem acesso',ex:'Fulano de Tal;201;A;morador;+55 11 90000-0000;fulano@email.com;000.000.000-00;Morador'},
    veiculos:{h:'cpf_dono;modelo;placa;vaga',d:'cpf_dono = CPF de pessoa já cadastrada     vaga = código (ex.: G-001) ou deixe vazio',ex:'000.000.000-00;Fiat Mobi;ABC1D23;G-001'},
    animais:{h:'cpf_dono;nome;especie;porte',d:'especie = Cão | Gato | Ave | Outro     porte = Pequeno | Médio | Grande',ex:'000.000.000-00;Rex;Cão;Médio'}};
  const t=T[tipo];const csv='sep=;\n'+t.h+'\n# COMO PREENCHER: '+t.d+'  (apague esta linha de instruções antes de importar)\n'+t.ex;
  const blob=new Blob(['﻿'+csv],{type:'text/csv;charset=utf-8'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='modelo-'+tipo+'.csv';document.body.appendChild(a);a.click();a.remove();
}
function importarCSV(tipo,input){const f=input.files&&input.files[0];if(!f)return;const r=new FileReader();r.onload=function(){
  let ls=r.result.split(/\r?\n/).map(l=>l.replace(/^﻿/,'').trim()).filter(l=>l&&!/^sep=/i.test(l)&&!l.startsWith('#'));
  ls.shift(); let n=0;
  ls.forEach(l=>{const c=(l.indexOf(';')>=0?l.split(';'):l.split(',')).map(s=>s.trim());try{
    if(tipo==='unidades'){if(c[0]){DATA.unidades.push({id:nextId(DATA.unidades),num:c[0],bloco:c[1]||'',fracao:0.01});n++;}}
    else if(tipo==='pessoas'){if(c[0]){const u=DATA.unidades.find(x=>x.num===c[1]&&(!c[2]||x.bloco===c[2]))||DATA.unidades.find(x=>x.num===c[1]);DATA.moradores.push({id:nextId(DATA.moradores),unidade_id:u?u.id:(DATA.unidades[0]&&DATA.unidades[0].id),nome:c[0],tipo:(['morador','inquilino','visitante'].includes((c[3]||'').toLowerCase())?c[3].toLowerCase():'morador'),telefone:c[4]||'',email:c[5]||'',cpf:c[6]||'',acesso:c[7]||'Morador'});n++;}}
    else if(tipo==='veiculos'){const m=DATA.moradores.find(x=>x.cpf===c[0]);if(m){const vg=DATA.vagas.find(v=>v.ident===c[3]);DATA.veiculos.push({id:nextId(DATA.veiculos),morador_id:m.id,modelo:c[1]||'',placa:(c[2]||'').toUpperCase(),vaga_id:vg?vg.id:null});n++;}}
    else if(tipo==='animais'){const m=DATA.moradores.find(x=>x.cpf===c[0]);if(m){DATA.animais.push({id:nextId(DATA.animais),morador_id:m.id,nome:c[1]||'',especie:c[2]||'Outro',porte:c[3]||'Médio'});n++;}}
  }catch(e){}});input.value='';CAD_OPEN[{unidades:'u',pessoas:'p',veiculos:'v',animais:'a'}[tipo]]=true;alert(n+' registro(s) importado(s) com sucesso.');render();};r.readAsText(f,'UTF-8');}
function setCadOpen(k,v){CAD_OPEN[k]=v;}
function setCadUni(k,v){if(k==='b'){CAD_U_BLOCO=v;FOCUS_ID='';}else{CAD_U_Q=v;FOCUS_ID='cad-q-uni';}render();}
function setCadPes(k,v){if(k==='t'){CAD_P_TIPO=v;FOCUS_ID='';}else{CAD_P_Q=v;FOCUS_ID='cad-q-pes';}render();}
function setCadVei(v){CAD_V_Q=v;FOCUS_ID='cad-q-vei';render();}
function setCadAni(k,v){if(k==='e'){CAD_A_ESP=v;FOCUS_ID='';}else{CAD_A_Q=v;FOCUS_ID='cad-q-ani';}render();}
function limparCad(b){if(b==='u'){CAD_U_BLOCO='';CAD_U_Q='';}else if(b==='p'){CAD_P_TIPO='';CAD_P_Q='';}else if(b==='v'){CAD_V_Q='';}else{CAD_A_ESP='';CAD_A_Q='';}FOCUS_ID='';render();}
function unidadeOptions(sel){return DATA.unidades.map(u=>`<option value="${u.id}"${sel==u.id?' selected':''}>${u.num} (Bloco ${u.bloco})</option>`).join('');}
function vagaOptions(sel){return '<option value="">Sem vaga</option>'+DATA.vagas.map(v=>`<option value="${v.id}"${sel==v.id?' selected':''}>${v.ident}</option>`).join('');}
function moradorOptions(sel){return DATA.moradores.slice().sort((a,b)=>a.nome.localeCompare(b.nome)).map(m=>`<option value="${m.id}"${sel==m.id?' selected':''}>${m.nome} — ${uniLabelDe(m.id)}</option>`).join('');}
function abrirPessoa(id){const ed=id!=null;const p=ed?DATA.moradores.find(m=>m.id===id):{};document.getElementById('mp-titulo').textContent=ed?'Editar pessoa':'Cadastrar pessoa';document.getElementById('f-id').value=ed?p.id:'';document.getElementById('f-nome').value=p.nome||'';document.getElementById('f-unidade').innerHTML=unidadeOptions(p.unidade_id);document.getElementById('f-tipo').value=p.tipo||'morador';document.getElementById('f-telefone').value=p.telefone||'';document.getElementById('f-email').value=p.email||'';document.getElementById('f-cpf').value=p.cpf||'';document.getElementById('f-acesso').value=p.acesso||'Morador';document.getElementById('modal-pessoa').classList.add('open');}
function fecharPessoa(){document.getElementById('modal-pessoa').classList.remove('open');}
function salvarPessoa(e){e.preventDefault();const idv=document.getElementById('f-id').value;const d={nome:document.getElementById('f-nome').value.trim(),unidade_id:parseInt(document.getElementById('f-unidade').value),tipo:document.getElementById('f-tipo').value,telefone:document.getElementById('f-telefone').value.trim(),email:document.getElementById('f-email').value.trim(),cpf:document.getElementById('f-cpf').value.trim(),acesso:document.getElementById('f-acesso').value};if(idv){Object.assign(DATA.moradores.find(x=>x.id==idv),d);}else{DATA.moradores.push({id:nextId(DATA.moradores),...d});}fecharPessoa();render();return false;}
function excluirPessoa(id){const m=DATA.moradores.find(x=>x.id===id);if(!m||!confirm('Excluir '+m.nome+'? (veículos e animais vinculados também serão removidos)'))return;DATA.veiculos=DATA.veiculos.filter(v=>v.morador_id!==id);DATA.animais=DATA.animais.filter(a=>a.morador_id!==id);DATA.moradores=DATA.moradores.filter(x=>x.id!==id);render();}
function abrirVeiculo(id){const ed=id!=null;const v=ed?DATA.veiculos.find(x=>x.id===id):{};document.getElementById('ve-id').value=ed?v.id:'';document.getElementById('ve-titulo').textContent=ed?'Editar veículo':'Cadastrar veículo';document.getElementById('ve-morador').innerHTML=moradorOptions(v.morador_id);document.getElementById('ve-modelo').value=v.modelo||'';document.getElementById('ve-placa').value=v.placa||'';document.getElementById('ve-vaga').innerHTML=vagaOptions(v.vaga_id);document.getElementById('modal-veiculo').classList.add('open');}
function fecharVeiculo(){document.getElementById('modal-veiculo').classList.remove('open');}
function salvarVeiculo(e){e.preventDefault();const idv=document.getElementById('ve-id').value;const mid=parseInt(document.getElementById('ve-morador').value);const vv=document.getElementById('ve-vaga').value;const vid=vv?parseInt(vv):null;const d={morador_id:mid,modelo:document.getElementById('ve-modelo').value.trim(),placa:document.getElementById('ve-placa').value.trim().toUpperCase(),vaga_id:vid};if(idv){Object.assign(DATA.veiculos.find(x=>x.id==idv),d);}else{DATA.veiculos.push({id:nextId(DATA.veiculos),...d});}if(vid){const vg=DATA.vagas.find(v=>v.id===vid);if(vg)vg.unidade_id=morOf(mid).unidade_id;}fecharVeiculo();render();return false;}
function excluirVeiculo(id){const v=DATA.veiculos.find(x=>x.id===id);if(!v||!confirm('Excluir o veículo '+(v.placa||'')+'?'))return;DATA.veiculos=DATA.veiculos.filter(x=>x.id!==id);render();}
function abrirAnimal(id){const ed=id!=null;const a=ed?DATA.animais.find(x=>x.id===id):{};document.getElementById('an-id').value=ed?a.id:'';document.getElementById('an-titulo').textContent=ed?'Editar animal':'Cadastrar animal';document.getElementById('an-morador').innerHTML=moradorOptions(a.morador_id);document.getElementById('an-nome').value=a.nome||'';document.getElementById('an-especie').value=a.especie||'Cão';document.getElementById('an-porte').value=a.porte||'Pequeno';document.getElementById('modal-animal').classList.add('open');}
function fecharAnimal(){document.getElementById('modal-animal').classList.remove('open');}
function salvarAnimal(e){e.preventDefault();const idv=document.getElementById('an-id').value;const d={morador_id:parseInt(document.getElementById('an-morador').value),nome:document.getElementById('an-nome').value.trim(),especie:document.getElementById('an-especie').value,porte:document.getElementById('an-porte').value};if(idv){Object.assign(DATA.animais.find(x=>x.id==idv),d);}else{DATA.animais.push({id:nextId(DATA.animais),...d});}fecharAnimal();render();return false;}
function excluirAnimal(id){const a=DATA.animais.find(x=>x.id===id);if(!a||!confirm('Excluir o animal '+a.nome+'?'))return;DATA.animais=DATA.animais.filter(x=>x.id!==id);render();}
function abrirUnidade(id){const ed=id!=null;const u=ed?DATA.unidades.find(x=>x.id===id):{};document.getElementById('mu-titulo').textContent=ed?'Editar unidade':'Cadastrar unidade';document.getElementById('u-id').value=ed?u.id:'';document.getElementById('u-num').value=u.num||'';document.getElementById('u-bloco').value=u.bloco||'';document.getElementById('modal-unidade').classList.add('open');}
function fecharUnidade(){document.getElementById('modal-unidade').classList.remove('open');}
function salvarUnidade(e){e.preventDefault();const idv=document.getElementById('u-id').value;const d={num:document.getElementById('u-num').value.trim(),bloco:document.getElementById('u-bloco').value.trim()};if(idv){Object.assign(DATA.unidades.find(x=>x.id==idv),d);}else{DATA.unidades.push({id:nextId(DATA.unidades),fracao:0.01,...d});}fecharUnidade();render();return false;}
function excluirUnidade(id){const nm=DATA.moradores.filter(m=>m.unidade_id===id).length,nb=DATA.boletos.filter(b=>b.unidade_id===id).length;if(nm||nb)return;const u=DATA.unidades.find(x=>x.id===id);if(!u||!confirm('Excluir a unidade '+u.num+'?'))return;DATA.vagas.forEach(v=>{if(v.unidade_id===id)v.unidade_id=null;});DATA.unidades=DATA.unidades.filter(x=>x.id!==id);render();}

/* init */
document.getElementById('nav').addEventListener('click',e=>{const a=e.target.closest('a');if(a)nav(a.dataset.sec);});
['modal-pessoa','modal-unidade','modal-regua','modal-veiculo','modal-animal','modal-convocar','modal-aviso'].forEach(id=>document.getElementById(id).addEventListener('click',e=>{if(e.target.id===id)e.currentTarget.classList.remove('open');}));
document.addEventListener('keydown',e=>{if(e.key==='Escape'){fecharPessoa();fecharUnidade();fecharRegua();fecharVeiculo();fecharAnimal();fecharConvocar();fecharAviso();}});
nav('visao');


/* ============================================================
   Override — Visão Geral (direção "Pátio") + chrome da topbar.
   Anexado ao engine original: reaproveita todos os helpers
   (inadimplencia, termometro, evolucao, movimentos, aprovarPagar…).
   Declaração de função sobrescreve a original por hoisting.
   ============================================================ */
function renderVisao(){
  const PG = '<svg class="portal" viewBox="0 0 100 100"><path d="M18 92 L18 46 A32 32 0 0 1 82 46 L82 92" stroke-width="10"></path><path d="M38 92 L38 56 A12 12 0 0 1 62 56 L62 92" stroke-width="10"></path></svg>';
  const MES3 = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  const ina = inadimplencia(), t = termometro(), ap = aPagarAberto();
  const ev = evolucao(), mx = Math.max(...ev.map(e=>e.valor),1);
  const prox = DATA.assembleias.find(a=>a.status==='convocada');
  const pend = DATA.contasPagar.filter(c=>c.status==='pendente');
  const funcAtivos = DATA.funcionarios.filter(f=>f.status==='ativo').length;
  const c0 = pend[0];

  // ---- resumo do dia ----
  const brief = `<div class="vg-brief">
    <span class="av">${PG}</span>
    <p>Hoje seus agentes <b>processaram a folha de maio</b>, dispararam a <b>1ª cobrança</b> a ${ina.qtd} inadimplentes e atualizaram a contabilidade.${pend.length?` Há <b>${pend.length} conta(s)</b> esperando seu aval.`:' Nada pendente para você no momento.'}</p>
  </div>`;

  // ---- ação que precisa de você ----
  const needyou = c0 ? `<div class="vg-needyou">
    <div class="ic">${PG}</div>
    <div class="txt">
      <div class="eyebrow"><span class="status-dot wait"></span> Precisa de você <span class="ag">· Agente Pagamentos</span></div>
      <h2>${c0.descricao}</h2>
      <div class="facts">
        <span class="fact"><span class="k">Fornecedor</span><span class="v">${c0.fornecedor}</span></span>
        <span class="fact"><span class="k">Valor</span><span class="v">${brl(c0.valor)}</span></span>
        <span class="fact"><span class="k">Vencimento</span><span class="v">${dataBR(c0.vencimento)}</span></span>
        ${pend.length>1?`<span class="queue">+${pend.length-1} na fila</span>`:''}
      </div>
    </div>
    <div class="act">
      <button class="btn primary" onclick="aprovarPagar(${c0.id})">Aprovar pagamento</button>
      <button class="btn" onclick="nav('pagar')">Revisar conta</button>
    </div>
  </div>` : '';

  // ---- KPIs ----
  const kpis = `<div class="grid">
    <div class="card kpi pinho feat span-3"><h3>Saldo em caixa</h3><div class="valor">${brl(saldoAtual())}</div><div class="legenda">▲ R$ 4.140 no mês · conta do condomínio</div></div>
    <div class="card kpi terracota span-3"><h3>Inadimplência</h3><div class="valor">${pct(ina.pct)}</div><div class="legenda">${ina.qtd} cotas em aberto · ${brl(ina.valor)}</div></div>
    <div class="card kpi span-3"><h3>Despesas do mês</h3><div class="valor">${brl(t.g)}</div><div class="legenda">Junho · ${pct(t.p)} do orçamento</div></div>
    <div class="card kpi terracota span-3"><h3>A pagar · aberto</h3><div class="valor">${brl(ap.valor)}</div><div class="legenda">${ap.qtd} conta(s) aguardando aprovação</div></div>
  </div>`;

  // ---- o que os agentes fizeram ----
  const agente = (nome, dotcls, status, body, mini) => `<div class="vg-acard${dotcls==='wait'?' wait':''}">
    <div class="top"><span class="av">${PG}</span><div><div class="nm">${nome}</div><div class="st"><span class="status-dot ${dotcls}"></span> ${status}</div></div></div>
    <div class="bd">${body}</div>${mini||''}</div>`;
  const agents = `<h2 class="vg-h">O que seus agentes fizeram hoje</h2>
  <p class="vg-sub">Cinco agentes cuidam do back-office, do portão ao caixa. Você só entra quando a decisão é sua.</p>
  <div class="vg-agents">
    ${agente('Contábil','done','Concluído · 08:30','Recalculou <b>DRE, Balanço, Fluxo</b> e Balancete a partir das contas do mês.')}
    ${agente('Cobrança','work','Enviando · 08:40',`Disparou a <b>1ª cobrança</b> para ${ina.qtd} unidades inadimplentes de maio.`)}
    ${agente('DP','done','Concluído · 08:50',`Enviou a <b>folha de maio</b> ao eSocial — ${funcAtivos} funcionários.`)}
    ${pend.length
      ? agente('Pagamentos','wait','Aguarda você · 08:45',`Separou <b>${pend.length} conta(s)</b> para sua aprovação.`,`<div class="mini"><button class="btn primary sm" onclick="nav('pagar')">Revisar fila</button></div>`)
      : agente('Pagamentos','done','Concluído · 08:45','Pagou os fornecedores aprovados do mês. Sem pendências.')}
  </div>`;

  // ---- gráficos ----
  const charts = `<div class="grid">
    <div class="card span-8"><h3>Evolução de despesas · jan–jun 2026</h3>
      <div class="bars">${ev.map((e,i)=>`<div class="bar"><span class="v">${brl(e.valor)}</span><div class="col${i===ev.length-1?' terracota':''}" style="height:${e.valor/mx*100}%"></div><span class="lbl">${e.mes}</span></div>`).join('')}</div></div>
    <div class="card span-4"><h3>Termômetro de gastos · junho</h3>
      <div style="display:flex;align-items:baseline;justify-content:space-between;margin-bottom:12px"><span class="muted" style="font-size:13px">${brl(t.g)} de ${brl(t.o)}</span><span style="font-family:var(--serif);font-size:28px;font-weight:560;color:var(--ambar)">${pct(t.p)}</span></div>
      <div class="gauge-track"><div class="gauge-fill ${t.nivel}" style="width:${Math.min(t.p,100)}%"></div></div>
      <div class="nums"><span>No limite saudável</span><span>Orçado ${brl(t.o)}</span></div></div>
  </div>`;

  // ---- lançamentos + assembleia ----
  const dp = prox ? prox.data.split('-') : null;
  const assemb = prox ? `<div class="cal-chip">
      <div class="cal"><span class="d">${dp[2]}</span><span class="m">${MES3[+dp[1]-1]}</span></div>
      <div><div class="t">${prox.titulo}</div><div class="s">${prox.local} · convocada em ${dataBR(prox.convocacao_em)}</div><div style="margin-top:8px"><span class="badge convocada">convocada</span></div></div>
    </div>` : '<p class="muted">Nenhuma assembleia convocada.</p>';
  const movs = movimentos().slice(0,6);
  const bottom = `<div class="grid">
    <div class="card span-8"><h3>Últimos lançamentos · prestação de contas</h3>
      <table class="tbl"><thead><tr><th>Data</th><th>Descrição</th><th class="num">Valor</th><th>Origem</th></tr></thead><tbody>
      ${movs.map(l=>`<tr><td class="muted" style="white-space:nowrap">${dataBR(l.data)}</td><td>${l.desc}</td><td class="num ${l.tipo==='receita'?'rec':'desp'}">${l.tipo==='receita'?'+':'−'} ${brl(l.valor)}</td><td>${l.origem&&l.origem!=='seed'?`<span class="badge ativo">${l.origem}</span>`:'<span class="muted">seed</span>'}</td></tr>`).join('')}
      </tbody></table></div>
    <div class="card span-4"><h3>Próxima assembleia</h3>${assemb}</div>
  </div>`;

  return brief + needyou + kpis + agents + charts + bottom;
}

/* ---------- chrome: contador de aprovações na topbar ---------- */
function atualizarTopbar(){
  const el = document.getElementById('tb-appr');
  if(!el) return;
  const n = DATA.contasPagar.filter(c=>c.status==='pendente').length;
  if(n>0){ el.hidden=false; el.querySelector('.n').textContent = n + (n===1?' aprovação':' aprovações'); }
  else { el.hidden=true; }
}

/* embrulha render() para manter a topbar em sincronia */
if (typeof render === 'function'){
  const _render0 = render;
  render = function(){ _render0(); try{ atualizarTopbar(); }catch(e){} };
}
atualizarTopbar();

/* ============================================================
   Override — Contas a Pagar (fila de aprovação dos agentes)
   Reaproveita: contasFiltradas, aprovarPagar, negarPagar,
   liquidarPagar, comprovante, baixarComprovantes, setPagarFiltro…
   ============================================================ */
function renderPagar(){
  const PG = '<svg class="portal" viewBox="0 0 100 100"><path d="M18 92 L18 46 A32 32 0 0 1 82 46 L82 92" stroke-width="10"></path><path d="M38 92 L38 56 A12 12 0 0 1 62 56 L62 92" stroke-width="10"></path></svg>';
  const c = DATA.contasPagar;
  const ord = contasFiltradas();
  const pendList = c.filter(x=>x.status==='pendente');
  const aPagar = sum(c.filter(x=>x.status==='pendente'||x.status==='aprovada'),x=>x.total);
  const pagoAcum = sum(c.filter(x=>x.status==='paga'),x=>x.total);
  const aprovQtd = c.filter(x=>x.status==='aprovada').length;
  const pend = pendList.length;
  const fornNomes = [...new Set(c.map(x=>x.fornecedor))].sort();

  const acao = x => x.status==='pendente'
      ? `<button class="btn primary sm" onclick="aprovarPagar(${x.id})">Aprovar</button> <button class="btn sm" onclick="negarPagar(${x.id})">Negar</button>`
      : x.status==='aprovada'
        ? `<button class="btn pinho sm" onclick="liquidarPagar(${x.id})">Liquidar</button>`
        : '<span class="muted">—</span>';
  const comp = x => x.status==='paga'
      ? `<button class="btn sm" onclick="comprovante(${x.id})">⬇ PDF</button>`
      : '<span class="muted">—</span>';

  // --- fila de aprovação (cards) ---
  const apprCard = x => `<div class="pg-appr">
      <div class="ic">${PG}</div>
      <div class="txt">
        <div class="eyebrow"><span class="status-dot wait"></span> Aguardando aprovação <span class="ag">· ${x.numero}</span></div>
        <h4>${x.descricao}</h4>
        <div class="facts">
          <span class="fact"><span class="k">Fornecedor</span><span class="v">${x.fornecedor}</span></span>
          <span class="fact"><span class="k">Valor</span><span class="v">${brl(x.valor)}</span></span>
          <span class="fact"><span class="k">Vencimento</span><span class="v">${dataBR(x.vencimento)}</span></span>
          <span class="fact"><span class="k">Conta contábil</span><span class="v">${x.grupo} › ${x.conta}</span></span>
        </div>
      </div>
      <div class="act">
        <button class="btn primary" onclick="aprovarPagar(${x.id})">Aprovar</button>
        <button class="btn" onclick="negarPagar(${x.id})">Negar</button>
      </div>
    </div>`;
  const queue = pend
    ? `<div class="card span-12 pg-queue"><h3><span class="status-dot wait"></span> Fila de aprovação dos agentes <span class="r">${pend} conta(s) aguardando você · ${brl(sum(pendList,x=>x.valor))}</span></h3>${pendList.map(apprCard).join('')}</div>`
    : `<div class="card span-12"><div class="pg-clear-in"><span class="ic">${PG}</span><div><div class="t">Nenhuma conta aguardando aprovação</div><div class="s">O agente Pagamentos já encaminhou tudo. Você está em dia.</div></div></div></div>`;

  // --- tabela completa (filtros + comprovantes 1 a 1 e em lote) ---
  const sel = (on,val) => `value="${val}"${val===on?' selected':''}`;
  const tabela = `<div class="card span-12"><h3>Lançamentos de contas a pagar <span class="r">${ord.length} lançamento(s)</span></h3>
     <div class="pg-toolbar">
       <select class="inp" style="width:auto" onchange="setPagarFiltro('mes',this.value)"><option value="">Todas as competências</option>${COMPETS.map(k=>`<option ${sel(PAGAR_MES,k)}>${mlabel(k)}</option>`).join('')}</select>
       <select class="inp" style="width:auto" onchange="setPagarFiltro('status',this.value)"><option value="">Todos os status</option>${['pendente','aprovada','paga','negada'].map(s=>`<option ${sel(PAGAR_STATUS,s)}>${cap(s)}</option>`).join('')}</select>
       <select class="inp" style="width:auto" onchange="setPagarFiltro('grupo',this.value)"><option value="">Todos os grupos</option>${GRUPO_ORDER.map(g=>`<option ${sel(PAGAR_GRUPO,g)}>${g}</option>`).join('')}</select>
       <select class="inp" style="width:auto" onchange="setPagarFiltro('forn',this.value)"><option value="">Todos os fornecedores</option>${fornNomes.map(f=>`<option ${sel(PAGAR_FORN,f)}>${f}</option>`).join('')}</select>
       <button class="btn sm" onclick="limparPagar()">Limpar filtros</button>
       <button class="btn pinho sm" onclick="baixarComprovantes()">⬇ Baixar todos os comprovantes (PDF)</button>
       <span class="sp">Comprovantes individuais na coluna ao lado de cada conta paga</span>
     </div>
     <table class="tbl"><thead><tr><th>Nº</th><th>Data</th><th>Descrição</th><th class="num">Valor</th><th class="num">Juros/multa</th><th class="num">Total</th><th>Status</th><th>Comprovante</th><th class="num">Ação</th></tr></thead><tbody>${ord.map(x=>`<tr><td style="white-space:nowrap"><strong>${x.numero}</strong></td><td style="white-space:nowrap">${dataBR(x.pago_em||x.vencimento)}</td><td>${x.descricao}<div class="muted" style="font-size:11px">${x.fornecedor} · ${x.grupo} › ${x.conta}</div></td><td class="num">${brl(x.valor)}</td><td class="num ${x.encargos?'desp':'muted'}">${x.encargos?'+ '+brl(x.encargos):'–'}</td><td class="num"><strong>${brl(x.total)}</strong></td><td><span class="badge ${x.status}">${x.status}</span></td><td>${comp(x)}</td><td class="num" style="white-space:nowrap">${acao(x)}</td></tr>`).join('')}</tbody></table>
     <p class="muted" style="font-size:12px;margin-top:10px">Cada lançamento alimenta o <strong>Resultado Contábil</strong>: as despesas entram na DRE por competência e no Balanço (passivo) enquanto abertas; ao liquidar, refletem no Fluxo de Caixa.</p></div>`;

  const fornec = `<div class="card span-12"><h3>Fornecedores <span class="r">${DATA.fornecedores.length} cadastrados</span></h3><table class="tbl"><thead><tr><th>Nome</th><th>Serviço</th><th>CNPJ</th></tr></thead><tbody>${DATA.fornecedores.map(f=>`<tr><td><strong>${f.nome}</strong></td><td class="muted">${f.servico}</td><td class="muted">${f.cnpj}</td></tr>`).join('')}</tbody></table></div>`;

  return `<div class="ai-note"><svg class="ic" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2E5A4F" stroke-width="2"><path d="M3 7h18v12H3z"></path><path d="M3 11h18"></path></svg><div>O <strong>agente Pagamentos</strong> identifica as contas e encaminha cada uma para a sua aprovação. Ao aprovar, ele paga o fornecedor e o <strong>agente Contábil</strong> lança o movimento no <strong>Resultado Contábil</strong>.</div></div>
  <div class="grid">
   <div class="card kpi terracota span-3"><h3>A pagar · aberto</h3><div class="valor">${brl(aPagar)}</div><div class="legenda">${pend} pendente(s) + ${aprovQtd} aprovada(s)</div></div>
   <div class="card kpi span-3"><h3>Aguardando você</h3><div class="valor">${pend}</div><div class="legenda">Identificadas pelo agente</div></div>
   <div class="card kpi pinho span-3"><h3>Pago · acumulado</h3><div class="valor">${brl(pagoAcum)}</div><div class="legenda">Liquidado no período</div></div>
   <div class="card kpi span-3"><h3>Fornecedores</h3><div class="valor">${DATA.fornecedores.length}</div><div class="legenda">Cadastrados</div></div>
   ${queue}
   ${tabela}
   ${fornec}
  </div>`;
}

/* ============================================================
   Override — Departamento Pessoal (fluxo guiado eSocial)
   ============================================================ */
function renderDP(){
  const PG = '<svg class="portal" viewBox="0 0 100 100"><path d="M18 92 L18 46 A32 32 0 0 1 82 46 L82 92" stroke-width="10"></path><path d="M38 92 L38 56 A12 12 0 0 1 62 56 L62 92" stroke-width="10"></path></svg>';
  const f = DATA.funcionarios, ativos = f.filter(x=>x.status==='ativo'), proc = f.filter(x=>['em_admissao','em_demissao'].includes(x.status));
  const folha = sum(ativos,x=>x.salario), he = sum(f,x=>x.horasExtras||0);

  const procCard = x => {
    const adm = x.status==='em_admissao';
    return `<div class="dp-proc">
      <span class="ic">${PG}</span>
      <div class="txt">
        <div class="eyebrow"><span class="status-dot work"></span> ${adm?'Admissão em andamento':'Demissão em andamento'} · eSocial</div>
        <div class="nm">${x.nome}</div>
        <div class="meta">${x.cargo} · ${adm?'entrada em '+dataBR(x.admissao):'rescisão iniciada pelo gestor'}</div>
        <div class="steps"><span class="step done">Dados enviados</span><span class="step doing">Validação eSocial</span><span class="step">${adm?'Registro':'Homologação'}</span></div>
      </div>
      <div class="amt"><span class="k">${adm?'Salário':'Verbas rescis.'}</span><span class="v">${brl(adm?x.salario:Math.round(x.salario*1.3))}</span></div>
    </div>`;
  };
  const procSec = proc.length
    ? `<div class="card span-12"><h3><span class="status-dot work"></span> Processos no eSocial <span class="r">${proc.length} em andamento · conduzidos pelo agente de DP</span></h3>${proc.map(procCard).join('')}</div>`
    : `<div class="card span-12"><div class="pg-clear-in"><span class="ic">${PG}</span><div><div class="t">Nenhum processo aberto no eSocial</div><div class="s">O agente de DP concluiu as admissões e rescisões. Quadro estável.</div></div></div></div>`;

  const quadro = `<div class="card span-12"><h3>Quadro de funcionários <span class="r">${ativos.length} ativos na folha</span></h3><table class="tbl"><thead><tr><th>Nome</th><th>Cargo</th><th>Admissão</th><th>Jornada</th><th class="num">Salário</th><th class="num">H. extras</th><th>Status</th><th class="num">Ação</th></tr></thead><tbody>${f.map(x=>`<tr><td><strong>${x.nome}</strong><div class="muted" style="font-size:11px">CPF ${x.cpf}</div></td><td>${x.cargo}</td><td class="muted">${dataBR(x.admissao)}</td><td class="muted">${x.jornada}</td><td class="num">${brl(x.salario)}</td><td class="num">${x.horasExtras||0}h</td><td><span class="badge ${x.status}">${x.status.replace('_',' ')}</span></td><td class="num">${x.status==='ativo'?`<button class="btn sm" onclick="iniciarDemissao(${x.id})">Iniciar demissão</button>`:'<span class="muted">em andamento</span>'}</td></tr>`).join('')}</tbody></table></div>`;

  const ponto = `<div class="card span-7"><h3>Folha de ponto · junho/2026 <span class="r">${he}h extras no mês</span></h3><table class="tbl"><thead><tr><th>Funcionário</th><th>Cargo</th><th class="num">Horas extras</th></tr></thead><tbody>${f.map(x=>`<tr><td>${x.nome}</td><td class="muted">${x.cargo}</td><td class="num">${x.horasExtras||0}h</td></tr>`).join('')}</tbody></table></div>`;

  const admit = `<div class="card span-5"><h3>Nova admissão</h3><p class="muted" style="font-size:12.5px;line-height:1.5;margin:0 0 14px">Informe os dados e o <strong>agente de DP</strong> abre o processo no eSocial automaticamente.</p><form onsubmit="return iniciarAdmissao(event)" class="dp-admit"><div class="field"><label>Nome do funcionário</label><input class="inp" id="adm-nome" placeholder="Ex.: Maria Souza" required></div><div class="field"><label>Cargo</label><input class="inp" id="adm-cargo" placeholder="Ex.: Porteiro" required></div><div class="field"><label>Salário (R$)</label><input class="inp" id="adm-salario" type="number" step="0.01" placeholder="0,00" required></div><button class="btn primary" type="submit" style="margin-top:4px">Iniciar admissão no eSocial</button></form></div>`;

  return `<div class="ai-note"><svg class="ic" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2E5A4F" stroke-width="2"><circle cx="9" cy="8" r="3"></circle><path d="M3.5 20a5.5 5.5 0 0 1 11 0"></path></svg><div>O <strong>agente de DP</strong> processa a folha, controla o ponto e conduz <strong>admissões e rescisões no eSocial</strong>. Você inicia aqui e acompanha cada etapa.</div></div>
  <div class="grid">
   <div class="card kpi pinho span-3"><h3>Folha mensal</h3><div class="valor">${brl(folha)}</div><div class="legenda">${ativos.length} funcionários ativos</div></div>
   <div class="card kpi span-3"><h3>Ativos no quadro</h3><div class="valor">${ativos.length}</div><div class="legenda">Com registro vigente</div></div>
   <div class="card kpi terracota span-3"><h3>Em processo</h3><div class="valor">${proc.length}</div><div class="legenda">Admissão / demissão</div></div>
   <div class="card kpi span-3"><h3>Horas extras · mês</h3><div class="valor">${he}h</div><div class="legenda">Folha de ponto de junho</div></div>
   ${procSec}
   ${quadro}
   ${ponto}
   ${admit}
  </div>`;
}

/* ============================================================
   Override (wrap) — Resultado Contábil: faixa-resumo editorial
   ============================================================ */
if (typeof renderResultado === 'function'){
  const _renderResultado0 = renderResultado;
  renderResultado = function(){
    let hero = '';
    try{
      const dre = calcDRE(), sup = dre.resultado>=0;
      hero = `<div class="res-hero no-print">
        <div class="it"><span class="k">Receita do período</span><span class="v rec">${brl(dre.receita)}</span></div>
        <div class="it"><span class="k">Despesas do período</span><span class="v desp">${brl(dre.totalDesp)}</span></div>
        <div class="it big"><span class="k">Resultado · ${sup?'superávit':'déficit'}</span><span class="v" style="color:${sup?'var(--pinho)':'var(--terracota)'}">${brl(dre.resultado)}</span></div>
      </div>`;
    }catch(e){}
    return hero + _renderResultado0();
  };
}

/* ============================================================
   Override (wrap) — Contas a Receber: faixa do agente Cobrança
   ============================================================ */
function top5Receber(){
  const abertos=DATA.boletos.filter(x=>x.status==='aberto'||x.status==='vencido');
  const porUni={}; abertos.forEach(x=>{ (porUni[x.unidade_id]=porUni[x.unidade_id]||[]).push(x); });
  const arr=Object.keys(porUni).map(uk=>{ const lst=porUni[uk]; const venc=lst.filter(x=>x.status==='vencido'); const maxAtr=venc.length?Math.max(...venc.map(x=>Math.round((HOJE-new Date(x.vencimento+'T00:00:00'))/864e5))):0; return {uk, total:sum(lst,x=>x.valor), vencido:sum(venc,x=>x.valor), qtd:lst.length, maxAtr}; });
  arr.sort((a,b)=>b.vencido-a.vencido || b.total-a.total || b.maxAtr-a.maxAtr);
  return arr.slice(0,5);
}
function top5CardHTML(){
  const t5=top5Receber();
  if(!t5.length) return '<div class="card span-12"><h3>Top 5 — maiores devedores</h3><p class="muted">Nenhuma cota em aberto. 🎉</p></div>';
  return `<div class="card span-12"><div class="flex-between"><h3 style="margin:0">Top 5 — maiores devedores</h3><span class="muted" style="font-size:12px">Priorize a cobrança destes</span></div>
    <table class="tbl" style="margin-top:10px"><thead><tr><th>#</th><th>Unidade</th><th>Responsável</th><th class="num">Cotas</th><th class="num">Em aberto</th><th class="num">Vencido</th><th>Atraso</th></tr></thead><tbody>
    ${t5.map((t,i)=>`<tr><td><strong>${i+1}º</strong></td><td><strong>${uNum(t.uk)}-${uBloco(t.uk)}</strong></td><td class="muted">${(moradorDaUnidade(t.uk)||{}).nome||'—'}</td><td class="num">${t.qtd}</td><td class="num">${brl(t.total)}</td><td class="num desp">${t.vencido?brl(t.vencido):'—'}</td><td>${t.maxAtr?`<span class="badge vencido">${t.maxAtr}d</span>`:'<span class="badge aberto">a vencer</span>'}</td></tr>`).join('')}
    </tbody></table></div>`;
}
if (typeof renderReceber === 'function'){
  const _renderReceber0 = renderReceber;
  renderReceber = function(){
    let band = '';
    try{
      const PG = '<svg class="portal" viewBox="0 0 100 100"><path d="M18 92 L18 46 A32 32 0 0 1 82 46 L82 92" stroke-width="10"></path><path d="M38 92 L38 56 A12 12 0 0 1 62 56 L62 92" stroke-width="10"></path></svg>';
      const ina = inadimplencia();
      const abertos = DATA.boletos.filter(x=>x.status==='aberto'||x.status==='vencido');
      band = `<div class="cob-band"><span class="av">${PG}</span><div class="txt"><div class="eyebrow">Agente Cobrança · em ação</div><p>Monitorando <b>${abertos.length} cotas em aberto</b>, sendo <b>${ina.qtd} vencidas</b> (${brl(ina.valor)}). A régua de cobrança é executada automaticamente pelos agentes.</p></div></div>`;
    }catch(e){}
    let html = _renderReceber0();
    try{
      const ini = html.indexOf('<div class="card span-7"><h3>Ações programadas');
      const fim = html.indexOf('<div class="card span-12"><h3>Carteira a receber');
      if(ini>=0 && fim>ini){ html = html.slice(0,ini) + top5CardHTML() + html.slice(fim); }
    }catch(e){}
    return band + html;
  };
}

/* ============================================================
   Override — Atas & Assembleias (próxima assembleia em destaque)
   ============================================================ */
function renderAssembleias(){
  const MES3 = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  const APP = ((typeof Domus!=='undefined'&&Domus.get('assembleiasApp'))||[]);
  const ASM = APP.concat(DATA.assembleias);
  const prox = ASM.find(a=>a.status==='convocada');
  const todas = [...ASM].sort((a,b)=>b.data.localeCompare(a.data)), docs = todas.filter(a=>a.ata);
  let hero;
  if(prox){
    const dias = Math.round((new Date(prox.data)-HOJE)/864e5);
    const dp = prox.data.split('-');
    hero = `<div class="card span-12 asm-hero">
      <div class="asm-top">
        <div class="cal-chip"><div class="cal big"><span class="d">${dp[2]}</span><span class="m">${MES3[+dp[1]-1]}</span></div>
          <div><div class="eyebrow">Próxima assembleia <span class="badge convocada">convocada</span></div>
          <div class="ttl">${prox.titulo}</div>
          <div class="meta">${cap(prox.tipo)} · ${prox.local}${dias>=0?` · <strong style="color:var(--terracota)">em ${dias} dias</strong>`:''}</div></div>
        </div>
        <button class="btn primary" onclick="abrirConvocar()">+ Convocar assembleia</button>
      </div>
      <div class="asm-pauta"><span class="k">Pauta</span><p>${prox.pauta}</p></div>
      ${prox.convocacao_em?`<div class="asm-prazo"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8a6d12" stroke-width="2"><path d="M12 9v4M12 17h.01"></path><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"></path></svg> <span>Aviso prévio enviado em <b>${dataBR(prox.convocacao_em)}</b> — prazo legal cumprido pelo agente.</span></div>`:''}
    </div>`;
  } else {
    hero = `<div class="card span-12 asm-hero"><div class="asm-top"><div class="cal-chip"><div class="cal big empty"><span class="d">—</span></div><div><div class="eyebrow">Próxima assembleia</div><div class="ttl">Nenhuma assembleia convocada</div><div class="meta">Convoque uma nova — o agente envia o aviso prévio a todos os condôminos.</div></div></div><button class="btn primary" onclick="abrirConvocar()">+ Convocar assembleia</button></div></div>`;
  }
  return `<div class="ai-note"><svg class="ic" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2E5A4F" stroke-width="2"><path d="M6 2h9l5 5v15H6z"></path><path d="M14 2v6h6"></path></svg><div>O <strong>agente de Assembleias</strong> convoca (com aviso prévio legal), conduz e <strong>emite as atas</strong> — tudo guardado no repositório.</div></div>
  <div class="grid">
   ${hero}
   <div class="card span-7"><h3>Todas as assembleias <span class="r">${todas.length} registro(s)</span></h3><table class="tbl"><thead><tr><th>Título</th><th>Tipo</th><th>Data</th><th>Status</th><th class="num">Ata</th></tr></thead><tbody>${todas.map(a=>`<tr><td><strong>${a.titulo}</strong></td><td class="muted">${cap(a.tipo)}</td><td class="muted">${dataBR(a.data)}</td><td><span class="badge ${a.status}">${a.status}</span></td><td class="num">${a.ata?`<button class="btn sm" onclick="baixarAta(${a.id})">⬇ PDF</button>`:'<span class="muted">—</span>'}</td></tr>`).join('')}</tbody></table></div>
   <div class="card span-5"><h3>Repositório de atas <span class="r">${docs.length} publicada(s)</span></h3>${docs.length?docs.map(a=>`<details class="acc"><summary><span class="asm-doc"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--terracota)" stroke-width="2"><path d="M6 2h9l5 5v15H6z"></path><path d="M14 2v6h6"></path></svg> ${a.titulo}</span><span class="muted" style="font-size:12px;font-weight:400">${dataBR(a.data)}</span></summary><div class="body">${a.ata}<div style="margin-top:12px"><button class="btn sm" onclick="baixarAta(${a.id})">⬇ Baixar ata (PDF)</button></div></div></details>`).join(''):'<p class="muted">Nenhuma ata publicada ainda.</p>'}</div>
  </div>`;
}

/* ============================================================
   Override — Avisos (comunicados do agente de Atendimento)
   ============================================================ */
function renderAvisos(){
  const BELL = '<svg viewBox="0 0 24 24" fill="none" stroke="var(--terracota)" stroke-width="2"><path d="M10 5a2 2 0 1 1 4 0v.4a7 7 0 0 1 4 6.3V15l1.5 2.5H4.5L6 15v-3.3a7 7 0 0 1 4-6.3z"></path><path d="M9.5 21h5"></path></svg>';
  const PG = '<svg class="portal" viewBox="0 0 100 100"><path d="M18 92 L18 46 A32 32 0 0 1 82 46 L82 92" stroke-width="11"></path><path d="M38 92 L38 56 A12 12 0 0 1 62 56 L62 92" stroke-width="11"></path></svg>';
  const avisos = [...DATA.avisos].sort((a,b)=>b.data.localeCompare(a.data));
  const card = a => `<div class="card span-4 aviso-card">
     <div class="aviso-top"><span class="aviso-ic">${BELL}</span><span class="chip">${a.publico}</span></div>
     <div class="aviso-ttl">${a.titulo}</div>
     <div class="aviso-date">${dataBR(a.data)}</div>
     <p class="aviso-msg">${a.mensagem}</p>
     <div class="aviso-foot"><span class="aviso-deliv">${PG} Entregue via WhatsApp e app · agente Atendimento</span></div>
     <div class="aviso-actions"><button class="btn sm" onclick="abrirAviso(${a.id})">Editar</button><button class="btn sm" onclick="excluirAviso(${a.id})">Excluir</button></div>
   </div>`;
  return `<div class="ai-note"><svg class="ic" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2E5A4F" stroke-width="2"><path d="M10 5a2 2 0 1 1 4 0v.4a7 7 0 0 1 4 6.3V15l1.5 2.5H4.5L6 15v-3.3a7 7 0 0 1 4-6.3z"></path><path d="M9.5 21h5"></path></svg><div>Comunicados esporádicos do condomínio. O <strong>agente de Atendimento</strong> entrega cada aviso ao público escolhido (WhatsApp e app) e mantém o histórico aqui.</div></div>
  <div class="grid">
   <div class="card span-12"><div class="flex-between"><h3 style="margin:0">Comunicados publicados <span class="r">${avisos.length} ativo(s)</span></h3><button class="btn primary sm" onclick="abrirAviso()">+ Novo aviso</button></div></div>
   ${avisos.length?avisos.map(card).join(''):'<div class="card span-12"><p class="muted" style="margin:0">Nenhum aviso publicado ainda.</p></div>'}
  </div>`;
}

/* ============================================================
   Microinteração — toast quando um agente executa uma ação
   (embrulha addEvent, usado por aprovar/confirmar/admitir/…)
   ============================================================ */
function mostrarToast(agente, acao, det){
  const PG = '<svg class="portal" viewBox="0 0 100 100"><path d="M18 92 L18 46 A32 32 0 0 1 82 46 L82 92" stroke-width="11"></path><path d="M38 92 L38 56 A12 12 0 0 1 62 56 L62 92" stroke-width="11"></path></svg>';
  let host = document.getElementById('toast-host');
  if(!host){ host=document.createElement('div'); host.id='toast-host'; host.className='toast-host'; document.body.appendChild(host); }
  const t = document.createElement('div');
  t.className = 'toast';
  t.innerHTML = `<span class="ic">${PG}</span><div class="tx"><div class="hd"><b>${agente}</b> · agente Domus</div><div class="ac">${acao}</div></div>`;
  host.appendChild(t);
  requestAnimationFrame(()=>t.classList.add('in'));
  setTimeout(()=>{ t.classList.remove('in'); setTimeout(()=>t.remove(),320); }, 3400);
}
if (typeof addEvent === 'function'){
  const _addEvent0 = addEvent;
  const AGN = {Contabil:'Contábil',Cobranca:'Cobrança',Pagamentos:'Pagamentos',DP:'DP',Atendimento:'Atendimento'};
  addEvent = function(agente, acao, det){
    _addEvent0(agente, acao, det);
    try{ mostrarToast(AGN[agente]||agente, acao, det); }catch(e){}
  };
}

/* ============================================================
   Override — Contas bancárias no Cadastro (ordem de prioridade)
   O agente Pagamentos debita da conta principal primeiro.
   ============================================================ */
function ensureBancos(){
  if(!DATA.bancos){
    DATA.bancos = [
      {id:1, banco:'Banco do Brasil',          agencia:'1234-5', conta:'00012345-6', tipo:'Corrente', titular:'Condomínio Felipe II'},
      {id:2, banco:'Itaú Unibanco',            agencia:'4567',   conta:'98765-4',    tipo:'Corrente', titular:'Condomínio Felipe II'},
      {id:3, banco:'Caixa · Fundo de Reserva', agencia:'0987',   conta:'55544-3',    tipo:'Poupança', titular:'Condomínio Felipe II'}
    ];
  }
}
function bancosCardHTML(){
  ensureBancos();
  const ic = '<svg viewBox="0 0 24 24"><path d="M3 21h18"></path><path d="M4 21V10l8-5 8 5v11"></path><path d="M9 21v-6h6v6"></path></svg>';
  const rows = DATA.bancos.map((b,i)=>`<div class="bank-row">
      <span class="bank-pri">${i+1}</span>
      <span class="bank-mv"><button class="bank-ar" ${i===0?'disabled':''} onclick="moverBanco(${b.id},-1)" title="Subir prioridade">▲</button><button class="bank-ar" ${i===DATA.bancos.length-1?'disabled':''} onclick="moverBanco(${b.id},1)" title="Descer prioridade">▼</button></span>
      <span class="bank-ic">${ic}</span>
      <div class="bank-info"><div class="bank-nm">${b.banco} ${i===0?'<span class="badge ativo">Principal</span>':''}</div><div class="bank-meta">Ag. ${b.agencia} · ${b.tipo} ${b.conta} · ${b.titular}</div></div>
      <div class="bank-act"><button class="btn sm" onclick="abrirBanco(${b.id})">Editar</button><button class="btn sm" onclick="excluirBanco(${b.id})">Excluir</button></div>
    </div>`).join('');
  return `<div class="card span-12"><div class="flex-between"><div><h3 style="margin:0">Contas bancárias</h3><p class="muted" style="font-size:12px;margin:5px 0 0">Em <strong>ordem de prioridade</strong> — o agente Pagamentos debita da conta principal primeiro e segue a fila se faltar saldo.</p></div><button class="btn primary sm" onclick="abrirBanco()">+ Adicionar conta</button></div><div class="bank-list">${rows||'<p class="muted">Nenhuma conta cadastrada.</p>'}</div></div>`;
}
function moverBanco(id, dir){ const i=DATA.bancos.findIndex(b=>b.id===id); const j=i+dir; if(i<0||j<0||j>=DATA.bancos.length) return; const t=DATA.bancos[i]; DATA.bancos[i]=DATA.bancos[j]; DATA.bancos[j]=t; render(); }
function abrirBanco(id){ ensureBancos(); const ed=id!=null; const b=ed?DATA.bancos.find(x=>x.id===id):{}; document.getElementById('bk-titulo').textContent=ed?'Editar conta bancária':'Adicionar conta bancária'; document.getElementById('bk-id').value=ed?b.id:''; document.getElementById('bk-banco').value=b.banco||''; document.getElementById('bk-ag').value=b.agencia||''; document.getElementById('bk-conta').value=b.conta||''; document.getElementById('bk-tipo').value=b.tipo||'Corrente'; document.getElementById('bk-titular').value=b.titular||DATA.condominio.nome; document.getElementById('modal-banco').classList.add('open'); }
function fecharBanco(){ document.getElementById('modal-banco').classList.remove('open'); }
function salvarBanco(e){ e.preventDefault(); ensureBancos(); const idv=document.getElementById('bk-id').value; const d={banco:document.getElementById('bk-banco').value.trim(), agencia:document.getElementById('bk-ag').value.trim(), conta:document.getElementById('bk-conta').value.trim(), tipo:document.getElementById('bk-tipo').value, titular:document.getElementById('bk-titular').value.trim()}; if(idv){ Object.assign(DATA.bancos.find(x=>x.id==idv), d); } else { DATA.bancos.push({id:nextId(DATA.bancos), ...d}); } fecharBanco(); render(); return false; }
function excluirBanco(id){ const b=DATA.bancos.find(x=>x.id===id); if(!b||!confirm('Excluir a conta '+b.banco+'?')) return; DATA.bancos=DATA.bancos.filter(x=>x.id!==id); render(); }

if (typeof renderCadastro === 'function'){
  const _renderCadastro0 = renderCadastro;
  renderCadastro = function(){ return _renderCadastro0().replace(/<\/div>\s*$/, bancosCardHTML()+'</div>'); };
}
(function(){ const mb=document.getElementById('modal-banco'); if(mb) mb.addEventListener('click', e=>{ if(e.target===mb) mb.classList.remove('open'); }); })();
function toggleSidebar(){ const s=document.querySelector('.sidebar'), sc=document.getElementById('sb-scrim'); if(s) s.classList.toggle('open'); if(sc) sc.classList.toggle('open'); }
(function(){ const n=document.getElementById('nav'); if(n) n.addEventListener('click',()=>{ const s=document.querySelector('.sidebar'); if(s&&s.classList.contains('open')) toggleSidebar(); }); })();

/* ============================================================
   Portaria & Reservas — área de acompanhamento conectada ao App
   Lê/escreve o estado compartilhado (window.Domus / bridge.js).
   ============================================================ */
function _v(id){ const el=document.getElementById(id); return el? el.value.trim() : ''; }
function renderPortaria(){
  if(typeof Domus==='undefined') return '<div class="ai-note">Bridge não carregado.</div>';
  const espacos=Domus.get('espacos')||[], reservas=Domus.get('reservas')||[], visitantes=Domus.get('visitantes')||[], entregas=Domus.get('entregas')||[], servicos=Domus.get('servicos')||[];
  const aguard=entregas.filter(e=>e.status==='aguardando').length;
  const ambRows=espacos.map(e=>`<tr><td><strong>${e.nome}</strong><div class="muted" style="font-size:11px">${e.reserva||''}</div></td><td class="muted">${e.cap}</td><td class="num">${e.taxa?brl(e.taxa):'isento'}</td><td><span class="badge ${e.ativo?'ativo':'negada'}">${e.ativo?'ativo':'inativo'}</span></td><td class="num" style="white-space:nowrap"><button class="btn sm" onclick="portariaToggleEspaco(${e.id})">${e.ativo?'Desativar':'Ativar'}</button> <button class="btn sm" onclick="portariaDelEspaco(${e.id})">Remover</button></td></tr>`).join('');
  const resRows=reservas.length?reservas.map(r=>`<tr><td><strong>${r.espaco}</strong></td><td>${r.unidade}</td><td class="muted">${r.morador}</td><td>${dataBR(r.data)}</td><td class="muted">${r.hora}</td><td><span class="badge ativo">${r.status}</span></td></tr>`).join(''):'<tr><td colspan="6" class="muted">Nenhuma reserva.</td></tr>';
  const visRows=visitantes.length?visitantes.map(v=>`<tr><td><strong>${v.nome}</strong></td><td>${v.unidade}</td><td class="muted">${v.doc}</td><td>${dataBR(v.data)}</td><td>${v.placa?`<span class="chip">${v.placa}</span>`:'<span class="muted">—</span>'}</td><td class="num"><button class="btn sm" onclick="portariaRevogar(${v.id})">Revogar</button></td></tr>`).join(''):'<tr><td colspan="6" class="muted">Nenhum visitante autorizado.</td></tr>';
  const entRows=entregas.map(e=>`<tr><td><strong>${e.remetente}</strong><div class="muted" style="font-size:11px">${e.tipo}</div></td><td>${e.unidade}</td><td class="muted" style="font-size:12px">${e.recebido}</td><td><span class="badge ${e.status==='retirado'?'ativo':'pendente'}">${e.status}</span></td><td class="num">${e.status==='aguardando'?`<button class="btn sm" onclick="portariaEntregaRetirar(${e.id})">Marcar retirado</button>`:'<span class="muted">—</span>'}</td></tr>`).join('');
  const svcRows=servicos.length?servicos.map(s=>`<tr><td><strong>${s.nome}</strong><div class="muted" style="font-size:11px">${s.cat||''}</div></td><td>${s.unidade||'—'}</td><td class="muted">${s.morador||'—'}</td><td>${dataBR(s.data)}</td><td><span class="badge pendente">${s.status||'novo lead'}</span></td></tr>`).join(''):'<tr><td colspan="5" class="muted">Nenhum serviço solicitado pelos moradores ainda.</td></tr>';
  return `<div class="ai-note"><svg class="ic" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2E5A4F" stroke-width="2"><path d="M3 21h18"></path><path d="M5 21V8l7-4 7 4v13"></path></svg><div>Tudo aqui está <strong>conectado ao app do morador</strong> em tempo real: ambientes que você libera aparecem para reserva, e reservas, visitantes, entregas e pedidos de serviço dos moradores caem nesta tela.</div></div>
  <div class="grid">
   <div class="card kpi pinho span-3"><h3>Ambientes ativos</h3><div class="valor">${espacos.filter(e=>e.ativo).length}</div><div class="legenda">Reserváveis pelo app</div></div>
   <div class="card kpi span-3"><h3>Reservas</h3><div class="valor">${reservas.length}</div><div class="legenda">Feitas pelos moradores</div></div>
   <div class="card kpi span-3"><h3>Visitantes</h3><div class="valor">${visitantes.length}</div><div class="legenda">Autorizados</div></div>
   <div class="card kpi terracota span-3"><h3>Entregas a retirar</h3><div class="valor">${aguard}</div><div class="legenda">Na portaria</div></div>

   <div class="card span-12"><div class="flex-between"><h3 style="margin:0">Ambientes reserváveis</h3></div>
     <form onsubmit="return portariaAddEspaco(event)" style="display:flex;gap:8px;flex-wrap:wrap;margin:6px 0 14px;align-items:center">
       <input class="inp" id="pe-nome" style="width:auto;min-width:160px" placeholder="Nome do ambiente" required>
       <input class="inp" id="pe-cap" style="width:auto;min-width:120px" placeholder="Capacidade">
       <input class="inp" id="pe-taxa" type="number" step="0.01" style="width:120px" placeholder="Taxa (R$)">
       <input class="inp" id="pe-reg" style="width:auto;min-width:170px" placeholder="Regras / horário">
       <button class="btn primary sm" type="submit">+ Adicionar ambiente</button>
     </form>
     <table class="tbl"><thead><tr><th>Ambiente</th><th>Capacidade</th><th class="num">Taxa</th><th>Status</th><th class="num">Ações</th></tr></thead><tbody>${ambRows}</tbody></table></div>

   <div class="card span-6"><h3>Reservas dos moradores</h3><table class="tbl"><thead><tr><th>Ambiente</th><th>Unidade</th><th>Morador</th><th>Data</th><th>Horário</th><th>Status</th></tr></thead><tbody>${resRows}</tbody></table></div>
   <div class="card span-6"><h3>Visitantes autorizados</h3><table class="tbl"><thead><tr><th>Nome</th><th>Unidade</th><th>Doc/Motivo</th><th>Data</th><th>Placa</th><th class="num">Ação</th></tr></thead><tbody>${visRows}</tbody></table></div>

   <div class="card span-7"><h3>Entregas na portaria</h3>
     <form onsubmit="return portariaAddEntrega(event)" style="display:flex;gap:8px;flex-wrap:wrap;margin:6px 0 14px;align-items:center">
       <input class="inp" id="pd-rem" style="width:auto;min-width:150px" placeholder="Remetente (ex.: Amazon)" required>
       <input class="inp" id="pd-tipo" style="width:auto;min-width:120px" placeholder="Tipo (pacote…)">
       <input class="inp" id="pd-uni" style="width:120px" placeholder="Unidade (ex.: 42-A)">
       <button class="btn primary sm" type="submit">+ Registrar entrega</button>
     </form>
     <table class="tbl"><thead><tr><th>Remetente</th><th>Unidade</th><th>Recebido</th><th>Status</th><th class="num">Ação</th></tr></thead><tbody>${entRows}</tbody></table></div>
   <div class="card span-5"><h3>Serviços solicitados</h3><table class="tbl"><thead><tr><th>Serviço</th><th>Unid.</th><th>Morador</th><th>Data</th><th>Status</th></tr></thead><tbody>${svcRows}</tbody></table></div>
   <div class="card span-12"><h3>Imóveis anunciados <span class="r">aluguel e venda · relação administradora–morador</span></h3><table class="tbl"><thead><tr><th>Unidade</th><th>Morador</th><th>Finalidade</th><th class="num">Valor</th><th>Anunciado</th><th>Status</th></tr></thead><tbody>${(Domus.get('anuncios')||[]).length?(Domus.get('anuncios')||[]).map(a=>`<tr><td><strong>${a.unidade}</strong></td><td class="muted">${a.morador}</td><td><span class="badge ${a.finalidade==='Venda'?'aprovada':'convocada'}">${a.finalidade}</span></td><td class="num">${brl(a.valor)}</td><td class="muted">${dataBR(a.data)}</td><td><span class="badge pendente">${a.status||'em análise'}</span></td></tr>`).join(''):'<tr><td colspan="6" class="muted">Nenhum imóvel anunciado pelos moradores ainda.</td></tr>'}</tbody></table></div>
  </div>`;
}
function portariaAddEspaco(e){ e.preventDefault(); const nome=_v('pe-nome'); if(!nome) return false; Domus.push('espacos',{id:Domus.nextId('espacos'),nome,cap:_v('pe-cap')||'—',taxa:parseFloat(_v('pe-taxa'))||0,reserva:_v('pe-reg')||'',ativo:true}); render(); return false; }
function portariaToggleEspaco(id){ Domus.update('espacos',a=>a.map(x=>x.id===id?Object.assign({},x,{ativo:!x.ativo}):x)); render(); }
function portariaDelEspaco(id){ if(!confirm('Remover este ambiente das opções de reserva?')) return; Domus.update('espacos',a=>a.filter(x=>x.id!==id)); render(); }
function portariaRevogar(id){ if(!confirm('Revogar autorização deste visitante?')) return; Domus.update('visitantes',a=>a.filter(x=>x.id!==id)); render(); }
function portariaAddEntrega(e){ e.preventDefault(); const rem=_v('pd-rem'); if(!rem) return false; const n=new Date(); const ts=n.toLocaleDateString('pt-BR')+' '+n.toLocaleTimeString('pt-BR').slice(0,5); Domus.push('entregas',{id:Domus.nextId('entregas'),remetente:rem,tipo:_v('pd-tipo')||'Pacote',unidade:_v('pd-uni')||'—',recebido:ts,status:'aguardando'}); if(typeof addEvent==='function') addEvent('Atendimento','Encomenda registrada', rem+' para '+(_v('pd-uni')||'a unidade')+' — morador notificado no app'); render(); return false; }
function portariaEntregaRetirar(id){ Domus.update('entregas',a=>a.map(x=>x.id===id?Object.assign({},x,{status:'retirado'}):x)); render(); }

/* títulos + roteamento da nova seção */
if(typeof TITLES!=='undefined') TITLES.portaria=['Portaria & Reservas','Ambientes, reservas, visitantes, entregas e serviços — conectado ao app do morador'];
if(typeof render==='function'){
  const _rp=render;
  render=function(){ if(typeof SEC!=='undefined' && SEC==='portaria'){ const c=document.getElementById('content'); if(c) c.innerHTML=renderPortaria(); try{atualizarTopbar();}catch(e){} return; } _rp(); };
}

/* sincronização de avisos SGC ↔ App + reatividade ao bridge */
if(typeof Domus!=='undefined'){
  try{ if(typeof DATA!=='undefined' && DATA.avisos) DATA.avisos = Domus.get('avisos'); }catch(e){}
  ['salvarAviso','excluirAviso'].forEach(n=>{ if(typeof window[n]==='function'){ const o=window[n]; window[n]=function(){ const r=o.apply(this,arguments); try{ Domus.set('avisos', DATA.avisos); }catch(e){} return r; }; } });
  const _procPag=new Set();
  function aplicarPagamentos(){
    (Domus.get('pagamentos')||[]).forEach(p=>{ if(_procPag.has(p.id)) return; _procPag.add(p.id);
      const u=(DATA.unidades||[]).find(x=>x.num===p.numUnidade && x.bloco===p.bloco);
      if(!u) return;
      const b=DATA.boletos.find(x=>x.unidade_id===u.id && x.competencia===p.comp && (x.status==='aberto'||x.status==='vencido'));
      if(b){ b.status='pago'; b.pago_em=p.data||HOJE_ISO; b.origem='App do morador';
        if(typeof addEvent==='function'){ addEvent('Cobranca','Pagamento via app','Unidade '+p.numUnidade+'-'+p.bloco+' pagou a cota '+mlabel(p.comp)+' — '+brl(b.valor)); addEvent('Contabil','Lançou receita','Taxa '+p.numUnidade+' — '+brl(b.valor)+' → reflete no Fluxo de Caixa'); }
      }
    });
  }
  aplicarPagamentos();
  const _procAcao=new Set();
  function negarContaApp(id){ const c=DATA.contasPagar.find(x=>x.id===id); if(c&&c.status==='pendente'){ c.status='negada'; if(typeof addEvent==='function') addEvent('Pagamentos','Pagamento negado',c.numero+' '+c.descricao+' — recusado pelo gestor (via app)'); } }
  function aplicarAcoesApp(){ (Domus.get('aprovacoesAcoes')||[]).forEach(a=>{ if(_procAcao.has(a.id))return; _procAcao.add(a.id); if(a.acao==='aprovar' && typeof aprovarPagar==='function') aprovarPagar(a.contaId); else if(a.acao==='negar') negarContaApp(a.contaId); }); }
  function publicarGestao(){ try{
    const ina=inadimplencia(), t=termometro(), ap=aPagarAberto();
    const pend=DATA.contasPagar.filter(c=>c.status==='pendente').map(c=>({id:c.id,descricao:c.descricao,fornecedor:c.fornecedor,valor:c.valor,total:c.total,venc:c.vencimento,grupo:c.grupo,conta:c.conta}));
    const cpLista=DATA.contasPagar.map(c=>({id:c.id,numero:c.numero,descricao:c.descricao,fornecedor:c.fornecedor,grupo:c.grupo,conta:c.conta,valor:c.valor,total:c.total,encargos:c.encargos||0,venc:c.vencimento,competencia:c.competencia,status:c.status,pago_em:c.pago_em||''}));
    const t5=(typeof top5Receber==='function'?top5Receber():[]).map(x=>({unidade:uNum(x.uk)+'-'+uBloco(x.uk),nome:(moradorDaUnidade(x.uk)||{}).nome||'—',total:x.total,vencido:x.vencido,atraso:x.maxAtr}));
    const feed=(DATA.feed||[]).slice(0,7).map(f=>({agente:f.agente,acao:f.acao,det:f.det,ts:f.ts}));
    const dre=(typeof calcDRE==='function')?calcDRE():{receita:0,totalDesp:0,resultado:0};
    const asm=(DATA.assembleias||[]).map(a=>({titulo:a.titulo,tipo:a.tipo,data:a.data,status:a.status,pauta:a.pauta,local:a.local,ata:a.ata||''}));
    const folha=sum(DATA.funcionarios.filter(f=>f.status==='ativo'),x=>x.salario);
    const agAcc={'1-30':0,'31-60':0,'61-90':0,'90+':0};
    DATA.boletos.filter(x=>x.status==='vencido').forEach(x=>{const dd=Math.round((HOJE-new Date(x.vencimento+'T00:00:00'))/864e5);const kk=dd<=30?'1-30':dd<=60?'31-60':dd<=90?'61-90':'90+';agAcc[kk]+=x.valor;});
    const aVencer=sum(DATA.boletos.filter(x=>x.status==='aberto'),x=>x.valor);
    const agingArr=[['A vencer',aVencer],['1-30 d',agAcc['1-30']],['31-60 d',agAcc['31-60']],['61-90 d',agAcc['61-90']],['90+ d',agAcc['90+']]];
    const abertosR=DATA.boletos.filter(x=>x.status==='aberto'||x.status==='vencido');
    const totalRec=sum(abertosR,x=>x.valor), recAcum=sum(DATA.boletos.filter(b=>b.status==='pago'),b=>b.valor);
    const porUR={}; abertosR.forEach(x=>{(porUR[x.unidade_id]=porUR[x.unidade_id]||[]).push(x);});
    const carteiraArr=Object.keys(porUR).map(uk=>{const lst=porUR[uk];const venc=lst.filter(x=>x.status==='vencido');const maxA=venc.length?Math.max(...venc.map(x=>Math.round((HOJE-new Date(x.vencimento+'T00:00:00'))/864e5))):0;return {unidade:uNum(uk)+'-'+uBloco(uk),nome:(moradorDaUnidade(uk)||{}).nome||'—',total:sum(lst,x=>x.valor),vencido:sum(venc,x=>x.valor),qtd:lst.length,atraso:maxA,cotas:lst.map(x=>{var dd=x.status==='vencido'?Math.max(0,Math.round((HOJE-new Date(x.vencimento+'T00:00:00'))/864e5)):0;var enc=x.status==='vencido'?Math.round((x.valor*0.02+x.valor*0.01/30*dd)*100)/100:0;return {comp:x.competencia,valor:x.valor,status:x.status,venc:x.vencimento,dias:dd,enc:enc,total:Math.round((x.valor+enc)*100)/100};})};});
    var pHist=COMPETS.map(function(c){return {rec:sum(DATA.boletos.filter(function(b){return b.status!=='pendente'&&b.competencia===c;}),function(b){return b.valor;}),desp:sum(DATA.contasPagar.filter(function(x){return x.status!=='negada'&&x.competencia===c;}),function(x){return x.total;})};});
    var pAvgR=pHist.reduce(function(s,h){return s+h.rec;},0)/pHist.length, pAvgD=pHist.reduce(function(s,h){return s+h.desp;},0)/pHist.length;
    var pSaldo=saldoAtual(); var pProj=[]; var MN=['jul','ago','set','out','nov','dez']; for(var pm=0;pm<6;pm++){ pSaldo+=pAvgR-pAvgD; pProj.push({mes:MN[pm],rec:pAvgR,desp:pAvgD,res:pAvgR-pAvgD,saldo:pSaldo}); }
    var prevObj={avgRec:pAvgR,avgDesp:pAvgD,resMes:pAvgR-pAvgD,saldoFim:pSaldo,proj:pProj};
    /* listas para o app gestor (Cadastro e DP) */
    var _uById={}; DATA.unidades.forEach(function(u){_uById[u.id]=u;});
    var _mById={}; DATA.moradores.forEach(function(m){_mById[m.id]=m;});
    var _vgById={}; DATA.vagas.forEach(function(v){_vgById[v.id]=v;});
    var _morByUni={}; DATA.moradores.forEach(function(m){ if(!_morByUni[m.unidade_id]) _morByUni[m.unidade_id]=m; });
    var _vehByMor={}; DATA.veiculos.forEach(function(v){ _vehByMor[v.morador_id]=v; });
    var cadUnidades=DATA.unidades.map(function(u){ var m=_morByUni[u.id]||{}; var vh=_vehByMor[m.id]; var vg=DATA.vagas.find(function(g){return g.unidade_id===u.id;}); return {u:u.num+'-'+u.bloco,bloco:u.bloco,morador:m.nome||'\u2014',tipo:m.tipo||'morador',tel:m.telefone||'',vaga:vg?vg.ident:'',placa:vh?vh.placa:''}; });
    var cadPessoas=DATA.moradores.map(function(m){ var u=_uById[m.unidade_id]||{}; return {nome:m.nome,u:(u.num?u.num+'-'+u.bloco:'\u2014'),tipo:m.tipo,tel:m.telefone||'',acesso:m.acesso||'Morador'}; });
    var cadVeiculos=DATA.veiculos.map(function(v){ var m=_mById[v.morador_id]||{}; var u=_uById[m.unidade_id]||{}; var vg=_vgById[v.vaga_id]; return {modelo:v.modelo,placa:v.placa,vaga:vg?vg.ident:'',dono:m.nome||'\u2014',u:(u.num?u.num+'-'+u.bloco:'')}; });
    var cadAnimais=DATA.animais.map(function(a){ var m=_mById[a.morador_id]||{}; var u=_uById[m.unidade_id]||{}; return {nome:a.nome,especie:a.especie,porte:a.porte,dono:m.nome||'\u2014',u:(u.num?u.num+'-'+u.bloco:'')}; });
    var dpLista=DATA.funcionarios.map(function(f){ return {nome:f.nome,cargo:f.cargo,salario:f.salario,admissao:f.admissao,jornada:f.jornada,he:f.horasExtras||0,status:f.status,cpf:f.cpf}; });
    Domus.setQuiet('gestao',{saldo:saldoAtual(),inad:ina.pct,inadValor:ina.valor,inadQtd:ina.qtd,despesas:t.g,orcado:t.o,nivel:t.nivel,aPagar:ap.valor,pendentes:pend,contasPagarLista:cpLista,top:t5,feed,unidades:DATA.unidades.length,moradores:DATA.moradores.length,funcionarios:DATA.funcionarios.filter(f=>f.status==='ativo').length,cota:DATA.condominio.cota,aging:agingArr,carteira:carteiraArr,totalReceber:totalRec,recebido:recAcum,resultado:{receita:dre.receita,despesa:dre.totalDesp,resultado:dre.resultado,grupos:Object.keys(dre.grupos||{}).map(function(gn){return {nome:gn,total:dre.grupos[gn].total,contas:Object.keys(dre.grupos[gn].contas||{}).map(function(cn){return {nome:cn,valor:dre.grupos[gn].contas[cn]};})};}),fluxo:(typeof calcFluxo==='function'?calcFluxo():{}),balanco:(typeof calcBalanco==='function'?calcBalanco(BAL_DATA):{}),balancete:(typeof calcBalancete==='function'?(function(){var bl=calcBalancete(BLC_DE,BLC_ATE);return {totDeb:bl.totDeb,totCred:bl.totCred,totFimD:bl.totFimD,totFimC:bl.totFimC,de:mlabel(BLC_DE),ate:mlabel(BLC_ATE),linhas:bl.linhas.map(function(l){return {cod:l.cod||'',nome:l.nome||l.cod,ini:l.ini||0,deb:l.deb||0,cred:l.cred||0,fim:l.fim||0,nat:l.nat||'',tipo:l.tipo};})};})():{}),periodo:(typeof PERIODO!=='undefined'?(mlabel(PERIODO.de)+' a '+mlabel(PERIODO.ate)):'')},assembleias:asm,cadastro:{unidades:DATA.unidades.length,moradores:DATA.moradores.length,veiculos:DATA.veiculos.length,animais:DATA.animais.length,listaUnidades:cadUnidades,listaPessoas:cadPessoas,listaVeiculos:cadVeiculos,listaAnimais:cadAnimais},dp:{folha,ativos:DATA.funcionarios.filter(f=>f.status==='ativo').length,he:sum(DATA.funcionarios,x=>x.horasExtras||0),lista:dpLista},previsao:prevObj});
  }catch(e){} }
  aplicarAcoesApp(); publicarGestao();
  Domus.on(function(k){ try{ if(typeof DATA!=='undefined') DATA.avisos=Domus.get('avisos'); aplicarPagamentos(); aplicarAcoesApp(); if(typeof SEC!=='undefined') render(); publicarGestao(); }catch(e){} });
  if(typeof render==='function'){ const _rg=render; render=function(){ _rg(); try{ publicarGestao(); }catch(e){} }; }
}







