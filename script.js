/* ===========================================================
   CONFIGURAÇÃO DE DADOS (LINHAS, PRODUTOS E MÁQUINAS)
   =========================================================== */
const dadosProducao = {
  "linha20k": {
    nome: "Linha 20k",
    produtos: {
      "pppi": { label: "PP e PI", validade: 50, retirada: 35, envio: 10 },
      "artesanos": { label: "Artesanos", validade: 35, retirada: 23, envio: 9 },
      "aparas": { label: "Aparas", validade: 15, retirada: 12, envio: 0 }
    }
  },
  "linha3": {
    nome: "Linha 3",
    produtos: {
      "paesEspeciais": { label: "Pães Especiais", validade: 35, retirada: 23, envio: 10 }, 
      "paesintegraise12graos": { label: "Pão Integral Zero e 12 Grãos 350g", validade: 28, retirada: 19, envio: 10 },
      "aparas": { label: "Aparas", validade: 15, retirada: 12, envio: 0 }
    }
  },
  "bolleria": {
    nome: "Bolleria",
    produtos: {
      "brioche": { label: "Brioche", validade: 60, retirada: 45, envio: 15 }, 
      "artesanos": { label: "Artesanos", validade: 35, retirada: 23, envio: 9 },
      "aparas": { label: "Aparas", validade: 15, retirada: 12, envio: 0 }
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
   CENTRAL LOTES (BANCO DE PRODUTOS FIREBASE)
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

// Variáveis de controle globais e escuta do Firebase
let unsubscribeLoteProduto = null;
let unsubscribeFitilho = null;
let diaAtualNaMemoria = new Date().getDate();

/* ===========================================================
   INICIALIZAÇÃO DO SISTEMA (DOM COMPLETAMENTE CARREGADO)
   =========================================================== */
document.addEventListener("DOMContentLoaded", () => {
  inicializarComponentesGerais();
  popularSeletoresEstrategicos();
  configurarEventosAbasLaterais();
  
  // Executa os primeiros cálculos de lote locais das abas se os seletores existirem
  const seletorLinha = document.getElementById("seletorLinha");
  if (seletorLinha) {
    popularSelectProdutos();
  }
  
  // Inicializa escuta do fitilho remoto imediatamente se o Firebase estiver pronto
  escutarLoteFitilhoTempoReal(); 
});

function inicializarComponentesGerais() {
  // Relógio Digital Unificado
  setInterval(atualizarRelogio, 1000);
  atualizarRelogio();

  // Configuração inicial das datas de exibição
  const hoje = new Date();
  const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
  const dataFormatada = hoje.toLocaleDateString('pt-BR', options);
  
  const dataHojeCompacta = document.getElementById("dataHojeCompacta");
  const dataAtual = document.getElementById("dataAtual");
  if (dataHojeCompacta) dataHojeCompacta.textContent = dataFormatada.substring(0, 5);
  if (dataAtual) dataAtual.textContent = dataFormatada;

  // Dark Mode Switcher Unificado
  const btnDark = document.getElementById("toggleDarkMode");
  if (btnDark) {
    btnDark.addEventListener("click", () => {
      document.body.classList.toggle("dark-mode");
    });
  }
}

/* ===========================================================
   LÓGICA INTERNA DAS ABAS LATERAIS (CÁLCULO E EVENTOS DE ENTRADA)
   =========================================================== */
function configurarEventosAbasLaterais() {
  const seletorLinha = document.getElementById("seletorLinha");
  const seletorProduto = document.getElementById("seletorProduto");
  const seletorMaquina = document.getElementById("seletorMaquina");
  const seletorUnidade = document.getElementById("seletorUnidade");
  const abaData = document.getElementById("abaData");
  const abaLote = document.getElementById("abaLote");

  if (seletorLinha) seletorLinha.addEventListener("change", popularSelectProdutos);
  if (seletorProduto) seletorProduto.addEventListener("change", atualizarCalculosDatas);
  if (seletorMaquina) seletorMaquina.addEventListener("change", gerarStringLote);
  if (seletorUnidade) seletorUnidade.addEventListener("change", gerarStringLote);

  // Controle de clique seguro (ignora cliques em selects/options para não fechar a aba)
  if (abaData) {
    abaData.addEventListener("click", (e) => {
      if (['SELECT', 'OPTION', 'LABEL', 'INPUT'].includes(e.target.tagName)) return;
      abaData.classList.toggle("expandida");
    });
  }

  if (abaLote) {
    abaLote.addEventListener("click", (e) => {
      if (['SELECT', 'OPTION', 'LABEL', 'INPUT'].includes(e.target.tagName)) return;
      abaLote.classList.toggle("expandida");
      if (abaLote.classList.contains("expandida")) gerarStringLote();
    });
  }
}

function popularSelectProdutos() {
    const seletorLinha = document.getElementById("seletorLinha");
    const seletorProduto = document.getElementById("seletorProduto");
    if (!seletorLinha || !seletorProduto) return;

    const linha = seletorLinha.value;
    const prods = dadosProducao[linha].produtos;
    seletorProduto.innerHTML = "";
    
    for (let chave in prods) {
        let opt = document.createElement("option");
        opt.value = chave; 
        opt.textContent = prods[chave].label;
        seletorProduto.appendChild(opt);
    }
    atualizarMaquinas();
    atualizarCalculosDatas();
}

function atualizarMaquinas() {
    const seletorLinha = document.getElementById("seletorLinha");
    const seletorMaquina = document.getElementById("seletorMaquina");
    if (!seletorLinha || !seletorMaquina) return;

    const linha = seletorLinha.value;
    seletorMaquina.innerHTML = "";
    maquinasPorLinha[linha].forEach(m => {
        let opt = document.createElement("option");
        opt.value = m; 
        opt.textContent = `Máquina ${m}`;
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
    const seletorLinha = document.getElementById("seletorLinha");
    const seletorProduto = document.getElementById("seletorProduto");
    if (!seletorLinha || !seletorProduto) return;

    const linhaVal = seletorLinha.value;
    const prodVal = seletorProduto.value;
    
    if (!dadosProducao[linhaVal]?.produtos[prodVal]) return;
    const info = dadosProducao[linhaVal].produtos[prodVal];

    const dataJulianaSpan = document.getElementById("dataJuliana");
    const julianaFormatada = calcularDiaJuliano(hoje);
    if (dataJulianaSpan) dataJulianaSpan.textContent = julianaFormatada;

    const dVal = new Date(hoje); dVal.setDate(hoje.getDate() + info.validade);
    const dRet = new Date(hoje); dRet.setDate(hoje.getDate() + info.retirada);
    const dEnv = new Date(hoje); dEnv.setDate(hoje.getDate() + info.envio); 
    
    const dataHojeCompacta = document.getElementById("dataHojeCompacta");
    const dataAtual = document.getElementById("dataAtual");
    const dataValidadeSpan = document.getElementById("dataValidade");
    const dataRetiradaSpan = document.getElementById("dataRetirada");
    const dataEnvioSpan = document.getElementById("dataEnvio");

    if (dataHojeCompacta) dataHojeCompacta.textContent = hoje.toLocaleDateString("pt-BR");
    if (dataAtual) dataAtual.textContent = hoje.toLocaleDateString("pt-BR");
    if (dataValidadeSpan) dataValidadeSpan.textContent = dVal.toLocaleDateString("pt-BR");
    if (dataRetiradaSpan) dataRetiradaSpan.textContent = dRet.getDate().toString().padStart(2, '0') + " " + String(dRet.getMonth()+1).padStart(2, '0');
    if (dataEnvioSpan) dataEnvioSpan.textContent = dEnv.getDate().toString().padStart(2, '0') + " " + String(dEnv.getMonth()+1).padStart(2, '0');
    
    gerarStringLote();
}

function gerarStringLote() {
    const hoje = new Date();
    const seletorLinha = document.getElementById("seletorLinha");
    const seletorProduto = document.getElementById("seletorProduto");
    const seletorUnidade = document.getElementById("seletorUnidade");
    const seletorMaquina = document.getElementById("seletorMaquina");

    if (!seletorLinha || !seletorProduto || !seletorUnidade || !seletorMaquina) return;

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

    const loteLinhaSuperior = document.getElementById("loteLinhaSuperior");
    const loteLinhaInferior = document.getElementById("loteLinhaInferior");
    const loteRetiradaGrande = document.getElementById("loteRetiradaGrande");
    const loteEnvioGrande = document.getElementById("loteEnvioGrande");

    if (loteLinhaSuperior) loteLinhaSuperior.textContent = strVal;
    if (loteLinhaInferior) loteLinhaInferior.textContent = strLote;
    if (loteRetiradaGrande) loteRetiradaGrande.textContent = strRetiradaGrande;
    if (loteEnvioGrande) loteEnvioGrande.textContent = strEnvioGrande;
}

function atualizarRelogio() {
    const agora = new Date();
    const h = agora.toLocaleTimeString("pt-BR");
    const hEsquerda = document.getElementById("horaEsquerda");
    const hDireita = document.getElementById("horaDireita");

    if (hEsquerda) hEsquerda.textContent = h;
    if (hDireita) hDireita.textContent = h;
    
    if (agora.getDate() !== diaAtualNaMemoria) {
        diaAtualNaMemoria = agora.getDate(); 
        atualizarCalculosDatas(); 
    }   
    else if (agora.getSeconds() === 0) {
        gerarStringLote(); 
    }
}

/* ===========================================================
   CENTRAL DE ATUALIZAÇÕES E SINCRONISMO (FIREBASE)
   =========================================================== */
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
  configurarEscutaTempoRealPainel();
}

function configurarEscutaTempoRealPainel() {
  const regProdElem = document.getElementById("regProduto");
  if (!regProdElem) return;
  
  const codigoProd = regProdElem.value;
  const selectConsulta = document.getElementById("selecaoConsulta");
  
  if (selectConsulta && selectConsulta.value !== codigoProd) {
    selectConsulta.value = codigoProd;
  }

  if (unsubscribeLoteProduto) unsubscribeLoteProduto();

  if (!window.fbObject) return;
  const { db, ref, onValue } = window.fbObject;

  unsubscribeLoteProduto = onValue(ref(db, `embalagens/${codigoProd}`), (snapshot) => {
    const dados = snapshot.val();
    const embMes = document.getElementById("embMes");
    const embNum = document.getElementById("embNum");
    const embAno = document.getElementById("embAno");
    
    if (dados && dados.lote) {
      const partes = dados.lote.split(" ");
      if (partes.length === 2 && embMes && embNum && embAno) {
        embMes.value = partes[0];
        const subPartes = partes[1].split("/");
        if (subPartes.length === 2) {
          embNum.value = subPartes[0];
          embAno.value = subPartes[1];
        }
      }
    } else {
      if (embNum) embNum.value = "";
    }
    carregarDadosNoPainel();
  });
}

function escutarLoteFitilhoTempoReal() {
  if (!window.fbObject) return;
  const { db, ref, onValue } = window.fbObject;

  if (unsubscribeFitilho) unsubscribeFitilho();

  unsubscribeFitilho = onValue(ref(db, "fitilho"), (snapshot) => {
    const dados = snapshot.val();
    const fitMes = document.getElementById("fitMes");
    const fitNum = document.getElementById("fitNum");
    const fitAno = document.getElementById("fitAno");

    if (dados && dados.lote) {
      const partesFit = dados.lote.split(" ");
      if (partesFit.length === 2 && fitMes && fitNum && fitAno) {
        fitMes.value = partesFit[0];
        const subPartesFit = partesFit[1].split("/");
        if (subPartesFit.length === 2) {
          fitNum.value = subPartesFit[0];
          fitAno.value = subPartesFit[1];
        }
      }
    } else {
      if (fitNum) fitNum.value = "";
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
  configurarEscutaTempoRealPainel();
}

// Registro do Service Worker para a PWA funcionar offline na fábrica
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js")
      .then(reg => console.log("SW ativo:", reg.scope))
      .catch(err => console.log("Erro SW:", err));
  });
}