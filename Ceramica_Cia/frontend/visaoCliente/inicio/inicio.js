// ======================================================
// CERÂMICA & CIA — VITRINE DO CLIENTE
// Fonte única de produtos: public.produtos (SQL original)
// ======================================================

const $ = (seletor) => document.querySelector(seletor);
const API = '';

const botaoMenu = $('#botaoMenu');
const navegacao = $('#navegacao');
const lista = $('#listaProdutos');
const busca = $('#buscaProdutos');
const contador = $('#contadorProdutos');
const modal = $('#modalProduto');

let produtos = [];
let categorias = [];
let produtoSelecionado = null;
let categoriaSelecionada = '';

function normalizarProduto(p) {
    return {
        ...p,
        id_produto: p.id_produto,
        nome_produto: p.nome_produto,
        descricao_produto: p.descricao_produto || '',
        categoria_id: p.categoria_id,
        nome_categoria: p.nome_categoria || '',
        preco_produto: Number(p.preco_produto ?? p.preco_unitario_produto ?? 0),
        estoque_produto: Number(p.estoque_produto ?? p.quantidade_estoque_produto ?? 0),
        imagem_url: p.imagem_url || ''
    };
}

const moeda = (valor) => Number(valor || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
});

// ---------------- Menu responsivo ----------------
if (botaoMenu && navegacao) {
    botaoMenu.addEventListener('click', () => {
        const aberto = navegacao.classList.toggle('aberta');
        botaoMenu.setAttribute('aria-expanded', String(aberto));
    });

    navegacao.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', () => {
            navegacao.classList.remove('aberta');
            botaoMenu.setAttribute('aria-expanded', 'false');
        });
    });
}

// ---------------- Banner ----------------
const slides = [...document.querySelectorAll('.banner-slide')];
const indicadores = [...document.querySelectorAll('.indicador')];
let slideAtual = 0;

function mostrarSlide(indice) {
    if (!slides.length) return;
    slideAtual = (indice + slides.length) % slides.length;
    slides.forEach((slide, i) => slide.classList.toggle('ativo', i === slideAtual));
    indicadores.forEach((botao, i) => botao.classList.toggle('ativo', i === slideAtual));
}

$('.banner-anterior')?.addEventListener('click', () => mostrarSlide(slideAtual - 1));
$('.banner-proximo')?.addEventListener('click', () => mostrarSlide(slideAtual + 1));
indicadores.forEach((botao, i) => botao.addEventListener('click', () => mostrarSlide(i)));
if (slides.length > 1) setInterval(() => mostrarSlide(slideAtual + 1), 6000);

// ---------------- Carrinho ----------------
function obterCarrinho() {
    try {
        const dados = JSON.parse(localStorage.getItem('carrinho') || '[]');
        return Array.isArray(dados) ? dados : [];
    } catch {
        return [];
    }
}

function atualizarContadorCarrinho() {
    const elemento = $('#contadorCarrinho');
    if (!elemento) return;
    const quantidade = obterCarrinho().reduce((total, item) => total + Number(item.quantidade || 0), 0);
    elemento.textContent = quantidade;
}

function adicionarAoCarrinho(produto, quantidade = 1) {
    if (!produto || produto.estoque_produto <= 0) {
        alert('Este produto está esgotado.');
        return false;
    }

    const carrinho = obterCarrinho();
    const id = produto.id_produto;
    const existente = carrinho.find((item) => String(item.id) === String(id));
    const quantidadeAtual = existente ? Number(existente.quantidade || 0) : 0;

    if (quantidadeAtual + quantidade > produto.estoque_produto) {
        alert(`Você já possui ${quantidadeAtual} unidade(s) no carrinho. Estoque disponível: ${produto.estoque_produto}.`);
        return false;
    }

    if (existente) {
        existente.quantidade = quantidadeAtual + quantidade;
    } else {
        carrinho.push({
            id,
            nome: produto.nome_produto,
            preco: produto.preco_produto,
            quantidade,
            imagem: `/view-image/${encodeURIComponent(id)}`
        });
    }

    localStorage.setItem('carrinho', JSON.stringify(carrinho));
    atualizarContadorCarrinho();
    alert('Produto adicionado ao carrinho!');
    return true;
}

// ---------------- Imagens ----------------
function configurarImagem(img, produto) {
    const imagemLocal = `/view-image/${encodeURIComponent(produto.id_produto)}?v=${Date.now()}`;
    const imagemBanco = produto.imagem_url;
    img.onerror = () => {
        if (imagemBanco && img.dataset.tentouBanco !== 'sim' && !imagemBanco.startsWith('/view-image/')) {
            img.dataset.tentouBanco = 'sim';
            img.src = imagemBanco;
            return;
        }
        img.onerror = null;
        img.src = '/imagens-produtos/000.png';
    };
    img.src = imagemLocal;
}

// ---------------- Modal do produto ----------------
function abrirProduto(produto) {
    produtoSelecionado = produto;
    const imagem = $('#modalImagem');
    configurarImagem(imagem, produto);
    imagem.alt = produto.nome_produto;

    $('#modalNome').textContent = produto.nome_produto;
    $('#modalDescricao').textContent = produto.descricao_produto || 'Uma peça especial feita com carinho.';
    $('#modalPreco').textContent = moeda(produto.preco_produto);
    $('#modalEstoque').textContent = produto.estoque_produto > 0
        ? `${produto.estoque_produto} unidade(s) disponível(is)`
        : 'Produto esgotado';

    const quantidade = $('#modalQuantidade');
    quantidade.value = 1;
    quantidade.max = Math.max(1, produto.estoque_produto);

    const botaoAdicionar = $('#modalAdicionar');
    botaoAdicionar.disabled = produto.estoque_produto <= 0;
    botaoAdicionar.textContent = produto.estoque_produto > 0 ? 'Adicionar ao carrinho' : 'Produto esgotado';

    modal.classList.add('aberto');
    modal.setAttribute('aria-hidden', 'false');
}

function fecharModal() {
    modal?.classList.remove('aberto');
    modal?.setAttribute('aria-hidden', 'true');
    produtoSelecionado = null;
}

$('#fecharModal')?.addEventListener('click', fecharModal);
modal?.addEventListener('click', (evento) => {
    if (evento.target === modal) fecharModal();
});
document.addEventListener('keydown', (evento) => {
    if (evento.key === 'Escape') fecharModal();
});

$('#modalAdicionar')?.addEventListener('click', () => {
    if (!produtoSelecionado) return;
    const quantidade = Number($('#modalQuantidade').value);
    if (!Number.isInteger(quantidade) || quantidade < 1 || quantidade > produtoSelecionado.estoque_produto) {
        alert('Informe uma quantidade disponível válida.');
        return;
    }
    if (adicionarAoCarrinho(produtoSelecionado, quantidade)) fecharModal();
});

// ---------------- Filtros e vitrine ----------------
function produtosFiltrados() {
    const termo = (busca?.value || '').toLocaleLowerCase('pt-BR').trim();
    return produtos.filter((produto) => {
        const texto = `${produto.nome_produto} ${produto.descricao_produto} ${produto.nome_categoria}`.toLocaleLowerCase('pt-BR');
        const correspondeTexto = !termo || texto.includes(termo);
        const correspondeCategoria = !categoriaSelecionada || String(produto.categoria_id) === String(categoriaSelecionada);
        return correspondeTexto && correspondeCategoria;
    });
}

function renderizar(listaProdutos) {
    if (!lista || !contador) return;
    lista.replaceChildren();
    contador.textContent = `${listaProdutos.length} ${listaProdutos.length === 1 ? 'peça encontrada' : 'peças encontradas'}`;

    if (!listaProdutos.length) {
        const mensagem = document.createElement('p');
        mensagem.className = 'estado-produtos';
        mensagem.textContent = 'Nenhuma peça encontrada.';
        lista.append(mensagem);
        return;
    }

    listaProdutos.forEach((produto) => {
        const card = document.createElement('article');
        card.className = 'card-produto';
        card.tabIndex = 0;

        const imagem = document.createElement('img');
        imagem.className = 'imagem-produto';
        imagem.alt = produto.nome_produto || 'Peça artesanal';
        imagem.loading = 'lazy';
        configurarImagem(imagem, produto);

        const corpo = document.createElement('div');
        corpo.className = 'conteudo-produto';

        const nome = document.createElement('h3');
        nome.textContent = produto.nome_produto;

        const preco = document.createElement('p');
        preco.className = 'preco-produto';
        preco.textContent = moeda(produto.preco_produto);

        const estoque = document.createElement('p');
        estoque.className = 'estoque-produto';
        estoque.textContent = produto.estoque_produto > 0 ? 'Disponível' : 'Esgotado';

        const botao = document.createElement('button');
        botao.className = 'botao-ver';
        botao.type = 'button';
        botao.textContent = 'Ver produto';
        botao.addEventListener('click', () => { window.location.href = `/visaoCliente/produto/produto.html?id=${encodeURIComponent(produto.id_produto)}`; });

        corpo.append(nome, preco, estoque, botao);
        card.append(imagem, corpo);
        card.addEventListener('click', (evento) => {
            if (evento.target !== botao) window.location.href = `/visaoCliente/produto/produto.html?id=${encodeURIComponent(produto.id_produto)}`;
        });
        card.addEventListener('keydown', (evento) => {
            if (evento.target === card && (evento.key === 'Enter' || evento.key === ' ')) {
                evento.preventDefault();
                window.location.href = `/visaoCliente/produto/produto.html?id=${encodeURIComponent(produto.id_produto)}`;
            }
        });
        lista.append(card);
    });
}

function aplicarFiltros() {
    renderizar(produtosFiltrados());
}

busca?.addEventListener('input', aplicarFiltros);

document.querySelectorAll('[data-categoria]').forEach((link) => {
    link.addEventListener('click', () => {
        const termo = (link.dataset.categoria || '').toLocaleLowerCase('pt-BR').trim();
        const categoria = categorias.find((item) => item.nome_categoria.toLocaleLowerCase('pt-BR').includes(termo));
        categoriaSelecionada = termo && categoria ? String(categoria.id_categoria) : '';
        if (busca) busca.value = '';
        aplicarFiltros();
    });
});

async function carregarCategorias() {
    try {
        const resposta = await fetch(`${API}/categoria`, { cache: 'no-store' });
        if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
        categorias = await resposta.json();
    } catch (erro) {
        console.error('Não foi possível carregar as categorias:', erro);
        categorias = [];
    }
}

async function carregarProdutos({ silencioso = false } = {}) {
    try {
        const resposta = await fetch(`${API}/produto`, { cache: 'no-store' });
        if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
        const dados = await resposta.json();
        if (!Array.isArray(dados)) throw new Error('A API não retornou uma lista de produtos.');

        produtos = dados.map(normalizarProduto);
        aplicarFiltros();

        if (produtoSelecionado) {
            const atualizado = produtos.find((item) => String(item.id_produto) === String(produtoSelecionado.id_produto));
            if (atualizado) produtoSelecionado = atualizado;
        }
    } catch (erro) {
        console.error('Erro ao carregar produtos:', erro);
        if (!silencioso && lista) {
            lista.innerHTML = '<p class="estado-produtos">Não foi possível carregar os produtos. Verifique se o servidor está ligado.</p>';
        }
    }
}

// ---------------- Sessão do usuário ----------------
async function verificarUsuario() {
    const botaoConta = $('#botaoConta');
    const textoConta = $('#textoConta');
    if (!botaoConta || !textoConta) return;
    try {
        const resposta = await fetch('/login/verificaSeUsuarioEstaLogado', {credentials:'include', cache:'no-store'});
        if (!resposta.ok) return;
        const dados = await resposta.json();
        if (dados.status !== 'ok') return;
        textoConta.textContent = 'Minha conta';
        botaoConta.href = '/minha-conta';
    } catch (erro) {
        console.info('Visitante não autenticado.');
    }
}

// ---------------- Inicialização e sincronização ----------------
atualizarContadorCarrinho();
(async () => {
    await carregarCategorias();
    await carregarProdutos();
})();
verificarUsuario();

// Atualiza a vitrine quando a administração altera produtos/estoque/preços.
// A API não usa cache; o intervalo só consulta dados, não modifica o banco.
setInterval(() => carregarProdutos({ silencioso: true }), 8000);
