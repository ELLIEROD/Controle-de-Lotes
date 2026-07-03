/* ===========================================================
   CONFIGURAÇÃO DE DADOS (LINHAS, PRODUTOS E MÁQUINAS)
   =========================================================== */
const dadosProducao = {
  "linha20k": {
    nome: "Linha 20k",
    produtos: {
      "pppi": { label: "PP e PI", validade: 50, retirada: 35, envio: 10 },
      "artesanos": { label: "Artesanos", validade: 35, retirada: 23, envio: 09 },
      "aparas": { label: "Aparas", validade: 15, retirada: 12, envio: 00 }
    }
  },
  "linha3": {
    nome: "Linha 3",
    produtos: {
      "paesEspeciais": { label: "Pães Especiais", validade: 35, retirada: 23, envio: 10 }, 
      "paesintegraise12graos": { label: "Pão Integral Zero e 12 Grãos 350g", validade: 28, retirada: 19, envio: 10 },
      "aparas": { label: "Aparas", validade: 15, retirada: 12, envio: 00 }
    }
  },
  "bolleria": {
    nome: "Bolleria",
    produtos: {
      "brioche": { label: "Brioche", validade: 60, retirada: 45, envio: 15 }, 
      "artesanos": { label: "Artesanos", validade: 35, retirada: 23, envio: 09 },
      "aparas": { label: "Aparas", validade: 15, retirada: 12, envio: 00 }
    }
  }
};

const maquinasPorLinha = {
    "linha20k": ["01", "02", "03", "04", "05", "06"],
    "linha3": ["01", "02", "03"],
    "bolleria": ["01", "02", "03", "04"]
};

const mesesAbrev = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];

/* ===========================================================
   ELEMENTOS DO DOM
   =========================================================== */
const seletorLinha = document.getElementById("seletorLinha");
const seletorProduto = document.getElementById("seletorProduto");
const seletorMaquina = document.getElementById("seletorMaquina");
const seletorUnidade = document.getElementById("seletorUnidade");

const dataHojeCompacta = document.getElementById("dataHojeCompacta");
const dataJulianaSpan = document.getElementById("dataJuliana");
const dataValidadeSpan = document.getElementById("dataValidade");
const dataRetiradaSpan = document.getElementById("dataRetirada");
const dataEnvioSpan = document.getElementById("dataEnvio");

const loteLinhaSuperior = document.getElementById("loteLinhaSuperior");
const loteLinhaInferior = document.getElementById("loteLinhaInferior");
const loteRetiradaGrande = document.getElementById("loteRetiradaGrande");
const loteEnvioGrande = document.getElementById("loteEnvioGrande");

const abaData = document.getElementById("abaData");
const abaLote = document.getElementById("abaLote");

/* ===========================================================
   CENTRAL LOTES (BANCO DE PRODUTOS)
   =========================================================== */
const bancoProdutos = {
  "Bolleria": [
    { id: 1, nome: "Pão de Hambúrguer c/ Gergelim 4,5\" 420g Pullman", codigo: "502642" },
    { id: 2, nome: "Pão de Hambúrguer c/ Gergelim 4,5\" 420g Plus Vitta", codigo: "500226" },
    { id: 3, nome: "Grand Burguer Brioche 520g Pullman", codigo: "502644" },
    { id: 4, nome: "Grand Burguer Brioche 520g Plus Vitta", codigo: "502874" },
    { id: 5, nome: "Pão de Hambúrguer Artesano 420g Pullman", codigo: "505878" },
    { id: 6, nome: "Pão de Hambúrguer Artesano 420g Plus Vitta", codigo: "505879" },
    { id: 7, nome: "Pão de Hambúrguer Artesano Australiano 420g Pullman", codigo: "505880" },
    { id: 8, nome: "Pão de Hambúrguer Artesano Australiano 420g Plus Vitta", codigo: "505881" }
  ]
};

// Variáveis para armazenar listeners ativos do Firebase (evita loops)
let unsubscribeLoteProduto = null;
let unsubscribeFitilho = null;

document.addEventListener("DOMContentLoaded", () => {
  inicializarComponentesGerais();
  popularSeletoresEstrategicos();
  escutarLoteFitilhoTempoReal(); // Começa a ouvir o fitilho global imediatamente
});

function toggleAbaAtualizacao() {
  const aba = document.getElementById("abaAtualizarLotes");
  if (aba) aba.classList.toggle("aberto");
}

function popularSeletoresEstrategicos() {
  const selectConsulta = document.getElementById("selecaoConsulta");
  if (!selectConsulta) return;
  selectConsulta.innerHTML = "";
  
  for (let linha in bancoProdutos) {
    bancoProdutos[linha].forEach(p => {
      let opt = document.createElement("option");
      opt.value = p.codigo;
      opt.textContent = `${p.codigo} - ${p.nome}`;
      selectConsulta.appendChild(opt);
    });
  }
  atualizarProdutosCadastro();
}

function atualizarProdutosCadastro() {
  const regLinhaElem = document.getElementById("regLinha");
  const selectRegProduto = document.getElementById("regProduto");
  if (!regLinhaElem || !selectRegProduto) return;

  const linhaSelecionada = regLinhaElem.value;
  selectRegProduto.innerHTML = "";

  if (bancoProdutos[linhaSelecionada]) {
    bancoProdutos[linhaSelecionada].forEach(p => {
      let opt = document.createElement("option");
      opt.value = p.codigo;
      opt.textContent = p.nome;
      selectRegProduto.appendChild(opt);
    });
  }
  
  // Sincroniza o painel de consulta e inicia escuta em tempo real do novo produto
  configurarEscutaTempoRealPainel();
}

// Interliga a seleção de cadastro e consulta para puxar os dados em tempo real da nuvem
function configurarEscutaTempoRealPainel() {
  const codigoProd = document.getElementById("regProduto").value;
  const selectConsulta = document.getElementById("selecaoConsulta");
  
  if (selectConsulta && selectConsulta.value !== codigoProd) {
    selectConsulta.value = codigoProd;
  }

  // Cancela a escuta do produto anterior se ela existir
  if (unsubscribeLoteProduto) unsubscribeLoteProduto();

  if (!window.fbObject) return;
  const { db, ref, onValue } = window.fbObject;

  // Escuta alterações do lote de embalagem específico deste produto na nuvem
  unsubscribeLoteProduto = onValue(ref(db, `embalagens/${codigoProd}`), (snapshot) => {
    const dados = snapshot.val();
    
    // Atualiza os inputs do menu de atualização se houver dados
    if (dados && dados.lote) {
      const partes = dados.lote.split(" ");
      if (partes.length === 2) {
        document.getElementById("embMes").value = partes[0];
        const subPartes = partes[1].split("/");
        if (subPartes.length === 2) {
          document.getElementById("embNum").value = subPartes[0];
          document.getElementById("embAno").value = subPartes[1];
        }
      }
    } else {
      document.getElementById("embNum").value = "";
    }
    
    // Atualiza visualmente o painel principal de exibição
    carregarDadosNoPainel();
  });
}

function escutarLoteFitilhoTempoReal() {
  if (!window.fbObject) return;
  const { db, ref, onValue } = window.fbObject;

  if (unsubscribeFitilho) unsubscribeFitilho();

  // Escuta alterações no lote geral do fitilho na nuvem
  unsubscribeFitilho = onValue(ref(db, "fitilho"), (snapshot) => {
    const dados = snapshot.val();
    if (dados && dados.lote) {
      const partesFit = dados.lote.split(" ");
      if (partesFit.length === 2) {
        document.getElementById("fitMes").value = partesFit[0];
        const subPartesFit = partesFit[1].split("/");
        if (subPartesFit.length === 2) {
          document.getElementById("fitNum").value = subPartesFit[0];
          document.getElementById("fitAno").value = subPartesFit[1];
        }
      }
    } else {
      document.getElementById("fitNum").value = "";
    }
    
    carregarDadosNoPainel();
  });
}

function obterDataAtualFormatada() {
  const hoje = new Date();
  const dia = String(hoje.getDate()).padStart(2, '0');
  const mes = String(hoje.getMonth() + 1).padStart(2, '0');
  const ano = hoje.getFullYear();
  return `${dia}/${mes}/${ano}`;
}

/* ===========================================================
   GRAVAÇÃO DE DADOS NO FIREBASE REALTIME DATABASE
   =========================================================== */
function salvarLoteEmbalagem() {
  if (!window.fbObject) return alert("Firebase não carregado!");
  const { db, ref, set } = window.fbObject;

  const codigoProd = document.getElementById("regProduto").value;
  const mes = document.getElementById("embMes").value;
  const num = document.getElementById("embNum").value;
  const ano = document.getElementById("embAno").value;

  if (num.length !== 3) {
    alert("O número do lote precisa ter exatamente 3 dígitos!");
    return;
  }

  const loteFormatado = `${mes} ${num}/${ano}`;
  const dataAtual = obterDataAtualFormatada();

  // Salva no caminho exato da nuvem por código de produto
  set(ref(db, `embalagens/${codigoProd}`), {
    lote: loteFormatado,
    data: dataAtual
  }).then(() => {
    alert("Lote de embalagem salvo na nuvem com sucesso!");
  }).catch(err => console.error("Erro ao salvar no Firebase:", err));
}

function salvarLoteFitilho() {
  if (!window.fbObject) return alert("Firebase não carregado!");
  const { db, ref, set } = window.fbObject;

  const mes = document.getElementById("fitMes").value;
  const num = document.getElementById("fitNum").value;
  const ano = document.getElementById("fitAno").value;

  if (num.length !== 3) {
    alert("O número do lote precisa ter exatamente 3 dígitos!");
    return;
  }

  const loteFormatado = `${mes} ${num}/${ano}`;
  const dataAtual = obterDataAtualFormatada();

  // Salva no nó global de fitilho na nuvem
  set(ref(db, "fitilho"), {
    lote: loteFormatado,
    data: dataAtual
  }).then(() => {
    alert("Lote geral de fitilho salvo na nuvem com sucesso!");
  }).catch(err => console.error("Erro ao salvar no Firebase:", err));
}

function carregarDadosNoPainel() {
  const selecaoConsultaElem = document.getElementById("selecaoConsulta");
  if (!selecaoConsultaElem) return;

  const codigoSelecionado = selecaoConsultaElem.value;
  let produtoAchado = null;

  for (let linha in bancoProdutos) {
    let p = bancoProdutos[linha].find(item => item.codigo === codigoSelecionado);
    if (p) { produtoAchado = p; break; }
  }

  if (!produtoAchado) return;

  document.getElementById("viewNomeProduto").textContent = produtoAchado.nome;
  document.getElementById("viewCodigoProduto").textContent = `Código: ${produtoAchado.codigo}`;
  
  const imgElement = document.getElementById("viewImagemProduto");
  if (imgElement) {
    imgElement.src = `img/produtos/${produtoAchado.codigo}.png`;
    imgElement.onerror = function() { this.src = 'img/produtos/default.png'; };
  }

  if (!window.fbObject) return;
  const { db, ref, get } = window.fbObject;

  // Busca do Firebase para renderizar no painel ativo
  get(ref(db, `embalagens/${produtoAchado.codigo}`)).then((snapshot) => {
    const dados = snapshot.val();
    document.getElementById("viewLoteEmbalagem").textContent = dados ? dados.lote : "SEM LOTE GRAVADO";
    document.getElementById("viewDataEmbalagem").textContent = dados ? `Atualizada em: ${dados.data}` : "Nunca atualizado";
  });

  get(ref(db, "fitilho")).then((snapshot) => {
    const dados = snapshot.val();
    document.getElementById("viewLoteFitilho").textContent = dados ? dados.lote : "SEM LOTE GRAVADO";
    document.getElementById("viewDataFitilho").textContent = dados ? `Atualizada em: ${dados.data}` : "Nunca atualizado";
  });
}

function preencherInputsComLoteSalvo() {
  // Vincula a seleção da consulta e reconfigura o monitoramento instantâneo
  configurarEscutaTempoRealPainel();
}

function inicializarComponentesGerais() {
  setInterval(() => {
    const agora = new Date();
    const txtHora = agora.toLocaleTimeString('pt-BR');
    if(document.getElementById("horaEsquerda")) document.getElementById("horaEsquerda").textContent = txtHora;
    if(document.getElementById("horaDireita")) document.getElementById("horaDireita").textContent = txtHora;
  }, 1000);

  const hoje = new Date();
  const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
  const dataFormatada = hoje.toLocaleDateString('pt-BR', options);
  if(dataHojeCompacta) dataHojeCompacta.textContent = dataFormatada.substring(0,5);
  if(document.getElementById("dataAtual")) document.getElementById("dataAtual").textContent = dataFormatada;

  const btnDark = document.getElementById("toggleDarkMode");
  if(btnDark) {
    btnDark.addEventListener("click", () => {
      document.body.classList.toggle("dark-mode");
    });
  }
}

/* ===========================================================
   LÓGICA DE DATAS E LOTE (ABAS LATERAIS)
   =========================================================== */
function popularSelectProdutos() {
    const linha = seletorLinha.value;
    const prods = dadosProducao[linha].produtos;
    seletorProduto.innerHTML = "";
    for (let chave in prods) {
        let opt = document.createElement("option");
        opt.value = chave; opt.textContent = prods[chave].label;
        seletorProduto.appendChild(opt);
    }
    atualizarMaquinas();
    atualizarCalculosDatas();
}

function atualizarMaquinas() {
    const linha = seletorLinha.value;
    seletorMaquina.innerHTML = "";
    maquinasPorLinha[linha].forEach(m => {
        let opt = document.createElement("option");
        opt.value = m; opt.textContent = `Máquina ${m}`;
        seletorMaquina.appendChild(opt);
    });
    gerarStringLote();
}

function calcularDiaJuliano(data) {
    const inicio = new Date(data.getFullYear(), 0, 0);
    const diff = data - inicio;
    return Math.floor(diff / (1000 * 60 * 60 * 24)).toString().padStart(3, '0');
}

function atualizarCalculosDatas() {
    const hoje = new Date();
    const linhaVal = seletorLinha.value;
    const prodVal = seletorProduto.value;
    
    if (!dadosProducao[linhaVal]?.produtos[prodVal]) return;
    const info = dadosProducao[linhaVal].produtos[prodVal];

    const julianaFormatada = calcularDiaJuliano(hoje);
    if(dataJulianaSpan) dataJulianaSpan.textContent = julianaFormatada;

    const dVal = new Date(hoje); dVal.setDate(hoje.getDate() + info.validade);
    const dRet = new Date(hoje); dRet.setDate(hoje.getDate() + info.retirada);
    const dEnv = new Date(hoje); dEnv.setDate(hoje.getDate() + info.envio); 
    
    if(dataHojeCompacta) dataHojeCompacta.textContent = hoje.toLocaleDateString("pt-BR");
    if(document.getElementById("dataAtual")) document.getElementById("dataAtual").textContent = hoje.toLocaleDateString("pt-BR");
    if(dataValidadeSpan) dataValidadeSpan.textContent = dVal.toLocaleDateString("pt-BR");
    if(dataRetiradaSpan) dataRetiradaSpan.textContent = dRet.getDate().toString().padStart(2, '0') + " " + String(dRet.getMonth()+1).padStart(2, '0');
    if(dataEnvioSpan) dataEnvioSpan.textContent = dEnv.getDate().toString().padStart(2, '0') + " " + String(dEnv.getMonth()+1).padStart(2, '0');
    
    gerarStringLote();
}

function gerarStringLote() {
    const hoje = new Date();
    const linhaVal = seletorLinha.value;
    const prodVal = seletorProduto.value;
    const unidade = seletorUnidade.value;
    const maq = seletorMaquina.value;
    
    if (!dadosProducao[linhaVal]?.produtos[prodVal]) return;

    const info = dadosProducao[linhaVal].produtos[prodVal];
    const dVal = new Date(hoje); dVal.setDate(hoje.getDate() + info.validade);

    const strVal = `VAL ${dVal.getDate().toString().padStart(2, '0')} ${mesesAbrev[dVal.getMonth()]} ${dVal.getFullYear().toString().slice(-2)}`;
    const numLinha = linhaVal === "linha20k" ? "4" : (linhaVal === "linha3" ? "3" : "1");
    
    const juliana = calcularDiaJuliano(hoje); 
    const hora = hoje.getHours().toString().padStart(2, '0') + hoje.getMinutes().toString().padStart(2, '0');
    const strLote = `L${unidade}${numLinha}${juliana}${hora}${maq}`;

    const dRet = new Date(hoje); dRet.setDate(hoje.getDate() + info.retirada);
    const strRetiradaGrande = `DR ${dRet.getDate().toString().padStart(2, '0')}${String(dRet.getMonth()+1).padStart(2, '0')}`;
    
    const dEnv = new Date(hoje); dEnv.setDate(hoje.getDate() + info.envio);
    const strEnvioGrande = `DE ${dEnv.getDate().toString().padStart(2, '0')}${String(dEnv.getMonth()+1).padStart(2, '0')}`;

    if(loteLinhaSuperior) loteLinhaSuperior.textContent = strVal;
    if(loteLinhaInferior) loteLinhaInferior.textContent = strLote;
    if(loteRetiradaGrande) loteRetiradaGrande.textContent = strRetiradaGrande;
    if(loteEnvioGrande) loteEnvioGrande.textContent = strEnvioGrande;
}

/* ===========================================================
   RELÓGIO E EVENTOS
   =========================================================== */
let diaAtualNaMemoria = new Date().getDate();

function atualizarRelogio() {
    const agora = new Date();
    const h = agora.toLocaleTimeString("pt-BR");
    if(document.getElementById("horaEsquerda")) document.getElementById("horaEsquerda").textContent = h;
    if(document.getElementById("horaDireita")) document.getElementById("horaDireita").textContent = h;
    
    if (agora.getDate() !== diaAtualNaMemoria) {
        diaAtualNaMemoria = agora.getDate(); 
        atualizarCalculosDatas(); 
    }  
    else if(agora.getSeconds() === 0) {
        gerarStringLote(); 
    }
}
setInterval(atualizarRelogio, 1000);

if(seletorLinha) seletorLinha.addEventListener("change", popularSelectProdutos);
if(seletorProduto) seletorProduto.addEventListener("change", atualizarCalculosDatas);
if(seletorMaquina) seletorMaquina.addEventListener("change", generarStringLote);
if(seletorUnidade) seletorUnidade.addEventListener("change", generarStringLote);

if(abaData) {
  abaData.addEventListener("click", (e) => {
      if(e.target.tagName === 'SELECT' || e.target.tagName === 'OPTION') return;
      abaData.classList.toggle("expandida");
  });
}

if(abaLote) {
  abaLote.addEventListener("click", (e) => {
      if(e.target.tagName === 'SELECT' || e.target.tagName === 'OPTION') return;
      abaLote.classList.toggle("expandida");
      if (abaLote.classList.contains("expandida")) generarStringLote();
  });
}

const btnDarkInit = document.getElementById('toggleDarkMode');
if(btnDarkInit) {
  btnDarkInit.addEventListener('click', () => {
      document.body.classList.toggle('dark-mode');
  });
}

if(seletorLinha) popularSelectProdutos();
atualizarRelogio();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js")
      .then(reg => console.log("SW ativo:", reg.scope))
      .catch(err => console.log("Erro SW:", err));
  });
}