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

document.addEventListener("DOMContentLoaded", () => {
  inicializarComponentesGerais();
  popularSeletoresEstrategicos();
  carregarDadosNoPainel();
  preencherInputsComLoteSalvo(); // Garante o carregamento inicial nos inputs
});

// Alterna a visibilidade da aba de atualização do topo
function toggleAbaAtualizacao() {
  const aba = document.getElementById("abaAtualizarLotes");
  aba.classList.toggle("aberto");
}

function popularSeletoresEstrategicos() {
  const selectConsulta = document.getElementById("selecaoConsulta");
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
  const linhaSelecionada = document.getElementById("regLinha").value;
  const selectRegProduto = document.getElementById("regProduto");
  selectRegProduto.innerHTML = "";

  if (bancoProdutos[linhaSelecionada]) {
    bancoProdutos[linhaSelecionada].forEach(p => {
      let opt = document.createElement("option");
      opt.value = p.codigo;
      opt.textContent = p.nome;
      selectRegProduto.appendChild(opt);
    });
  }
  preencherInputsComLoteSalvo();
}

// NOVO: Lê os dados salvos e preenche os inputs editáveis automaticamente
function preencherInputsComLoteSalvo() {
  const codigoProd = document.getElementById("regProduto").value;
  const loteEmbSalvo = localStorage.getItem(`emb_lote_${codigoProd}`);

  if (loteEmbSalvo) {
    // Exemplo de quebra: "JUN 333/26" -> ["JUN", "333/26"] -> ["333", "26"]
    const partes = loteEmbSalvo.split(" ");
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

  // Preenche o do fitilho (que é geral)
  const loteFitSalvo = localStorage.getItem("fitilho_lote");
  if (loteFitSalvo) {
    const partesFit = loteFitSalvo.split(" ");
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
}

function obterDataAtualFormatada() {
  const hoje = new Date();
  const dia = String(hoje.getDate()).padStart(2, '0');
  const mes = String(hoje.getMonth() + 1).padStart(2, '0');
  const ano = hoje.getFullYear();
  return `${dia}/${mes}/${ano}`;
}

function salvarLoteEmbalagem() {
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

  localStorage.setItem(`emb_lote_${codigoProd}`, loteFormatado);
  localStorage.setItem(`emb_data_${codigoProd}`, dataAtual);

  alert("Lote de embalagem atualizado com sucesso!");
  carregarDadosNoPainel();
}

function salvarLoteFitilho() {
  const mes = document.getElementById("fitMes").value;
  const num = document.getElementById("fitNum").value;
  const ano = document.getElementById("fitAno").value;

  if (num.length !== 3) {
    alert("O número do lote precisa ter exatamente 3 dígitos!");
    return;
  }

  const loteFormatado = `${mes} ${num}/${ano}`;
  const dataAtual = obterDataAtualFormatada();

  localStorage.setItem("fitilho_lote", loteFormatado);
  localStorage.setItem("fitilho_data", dataAtual);

  alert("Lote geral do fitilho atualizado com sucesso!");
  carregarDadosNoPainel();
  preencherInputsComLoteSalvo();
}

function carregarDadosNoPainel() {
  const codigoSelecionado = document.getElementById("selecaoConsulta").value;
  let produtoAchado = null;

  for (let linha in bancoProdutos) {
    let p = bancoProdutos[linha].find(item => item.codigo === codigoSelecionado);
    if (p) { produtoAchado = p; break; }
  }

  if (!produtoAchado) return;

  document.getElementById("viewNomeProduto").textContent = produtoAchado.nome;
  document.getElementById("viewCodigoProduto").textContent = `Código: ${produtoAchado.codigo}`;
  
  const imgElement = document.getElementById("viewImagemProduto");
  imgElement.src = `img/produtos/${produtoAchado.codigo}.png`;
  imgElement.onerror = function() { this.src = 'img/produtos/default.png'; };

  const loteEmbSalvo = localStorage.getItem(`emb_lote_${produtoAchado.codigo}`);
  const dataEmbSalva = localStorage.getItem(`emb_data_${produtoAchado.codigo}`);

  document.getElementById("viewLoteEmbalagem").textContent = loteEmbSalvo ? loteEmbSalvo : "SEM LOTE GRAVADO";
  document.getElementById("viewDataEmbalagem").textContent = dataEmbSalva ? `Atualizada em: ${dataEmbSalva}` : "Nunca atualizado";

  const loteFitSalvo = localStorage.getItem("fitilho_lote");
  const dataFitSalva = localStorage.getItem("fitilho_data");

  document.getElementById("viewLoteFitilho").textContent = loteFitSalvo ? loteFitSalvo : "SEM LOTE GRAVADO";
  document.getElementById("viewDataFitilho").textContent = dataFitSalva ? `Atualizada em: ${dataFitSalva}` : "Nunca atualizado";
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
  if(document.getElementById("dataHojeCompacta")) document.getElementById("dataHojeCompacta").textContent = dataFormatada.substring(0,5);
  if(document.getElementById("dataAtual")) document.getElementById("dataAtual").textContent = dataFormatada;

  const btnDark = document.getElementById("toggleDarkMode");
  if(btnDark) {
    btnDark.addEventListener("click", () => {
      document.body.classList.toggle("dark-mode");
    });
  }
}

// Registro do Service Worker para o PWA
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js")
      .then(reg => console.log("SW ativo:", reg.scope))
      .catch(err => console.log("Erro SW:", err));
  });
}