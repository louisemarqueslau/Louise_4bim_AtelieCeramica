const { query } = require('../database');
const path = require('path');

exports.abrirCrudProduto = (req, res) => {
  const usuario = req.cookies.usuarioLogado;
  if (usuario) {
    return res.sendFile(path.join(__dirname, '../../frontend/produto/produto.html'));
  }
  return res.redirect('/login');
};

// A tabela oficial do projeto é public.produtos, conforme documentacao/projetodw1.sql.
// Os aliases antigos são mantidos apenas para compatibilidade com telas já existentes.
const SELECT_PRODUTOS = `
  SELECT
    p.id_produto,
    p.categoria_id,
    p.nome_produto,
    p.descricao_produto,
    p.preco_produto,
    p.estoque_produto,
    p.imagem_url,
    c.nome_categoria,
    p.preco_produto AS preco_unitario_produto,
    p.estoque_produto AS quantidade_estoque_produto
  FROM public.produtos p
  LEFT JOIN public.categorias c ON c.id_categoria = p.categoria_id
`;

exports.listarProdutos = async (req, res) => {
  try {
    const result = await query(`${SELECT_PRODUTOS} ORDER BY p.id_produto`);
    res.set('Cache-Control', 'no-store');
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar produtos:', error);
    res.status(500).json({ error: 'Não foi possível listar os produtos da tabela public.produtos.' });
  }
};

exports.obterProduto = async (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'ID do produto inválido.' });
  try {
    const result = await query(`${SELECT_PRODUTOS} WHERE p.id_produto = $1`, [id]);
    if (!result.rowCount) return res.status(404).json({ error: 'Produto não encontrado.' });
    res.set('Cache-Control', 'no-store');
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao obter produto:', error);
    res.status(500).json({ error: 'Não foi possível consultar o produto.' });
  }
};

exports.criarProduto = async (req, res) => {
  const nome = String(req.body.nome_produto || '').trim();
  const categoriaId = Number.parseInt(req.body.categoria_id, 10);
  const preco = Number(String(req.body.preco_produto ?? req.body.preco_unitario_produto ?? '').replace(',', '.'));
  const estoque = Number.parseInt(req.body.estoque_produto ?? req.body.quantidade_estoque_produto ?? 0, 10);
  const descricao = req.body.descricao_produto ?? null;
  const imagemUrl = req.body.imagem_url ?? null;

  if (!nome) return res.status(400).json({ error: 'O nome do produto é obrigatório.' });
  if (!Number.isInteger(categoriaId)) return res.status(400).json({ error: 'Selecione uma categoria válida.' });
  if (!Number.isFinite(preco) || preco < 0) return res.status(400).json({ error: 'Informe um preço válido.' });
  if (!Number.isInteger(estoque) || estoque < 0) return res.status(400).json({ error: 'Informe um estoque inteiro igual ou maior que zero.' });

  try {
    const result = await query(
      `INSERT INTO public.produtos
       (categoria_id, nome_produto, descricao_produto, preco_produto, estoque_produto, imagem_url)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [categoriaId, nome, descricao, preco, estoque, imagemUrl]
    );
    res.status(201).json({ message: 'Produto cadastrado com sucesso.', produto: result.rows[0] });
  } catch (error) {
    console.error('Erro ao criar produto:', error);
    if (error.code === '23503') return res.status(400).json({ error: 'A categoria selecionada não existe.' });
    res.status(500).json({ error: 'Não foi possível cadastrar o produto.' });
  }
};

exports.atualizarProduto = async (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'ID do produto inválido.' });

  const campos = [];
  const valores = [];
  const adicionarCampo = (coluna, valor) => {
    valores.push(valor);
    campos.push(`${coluna} = $${valores.length}`);
  };

  const body = req.body;
  if (body.nome_produto !== undefined) {
    const nome = String(body.nome_produto).trim();
    if (!nome) return res.status(400).json({ error: 'O nome do produto não pode ficar vazio.' });
    adicionarCampo('nome_produto', nome);
  }
  if (body.categoria_id !== undefined) {
    const categoriaId = Number.parseInt(body.categoria_id, 10);
    if (!Number.isInteger(categoriaId)) return res.status(400).json({ error: 'Categoria inválida.' });
    adicionarCampo('categoria_id', categoriaId);
  }
  if (body.descricao_produto !== undefined) adicionarCampo('descricao_produto', body.descricao_produto || null);
  if (body.preco_produto !== undefined || body.preco_unitario_produto !== undefined) {
    const preco = Number(String(body.preco_produto ?? body.preco_unitario_produto).replace(',', '.'));
    if (!Number.isFinite(preco) || preco < 0) return res.status(400).json({ error: 'Informe um preço válido.' });
    adicionarCampo('preco_produto', preco);
  }
  if (body.estoque_produto !== undefined || body.quantidade_estoque_produto !== undefined) {
    const estoque = Number(body.estoque_produto ?? body.quantidade_estoque_produto);
    if (!Number.isInteger(estoque) || estoque < 0) return res.status(400).json({ error: 'Informe um estoque inteiro igual ou maior que zero.' });
    adicionarCampo('estoque_produto', estoque);
  }
  if (body.imagem_url !== undefined) adicionarCampo('imagem_url', body.imagem_url || null);

  if (!campos.length) return res.status(400).json({ error: 'Nenhuma informação foi enviada para alteração.' });

  try {
    valores.push(id);
    const result = await query(
      `UPDATE public.produtos SET ${campos.join(', ')} WHERE id_produto = $${valores.length} RETURNING *`,
      valores
    );
    if (!result.rowCount) return res.status(404).json({ error: 'Produto não encontrado.' });
    res.json({ message: 'Produto atualizado com sucesso.', produto: result.rows[0] });
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    if (error.code === '23503') return res.status(400).json({ error: 'A categoria selecionada não existe.' });
    res.status(500).json({ error: 'Não foi possível atualizar o produto.' });
  }
};

exports.deletarProduto = async (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'ID do produto inválido.' });
  try {
    const result = await query('DELETE FROM public.produtos WHERE id_produto = $1 RETURNING id_produto', [id]);
    if (!result.rowCount) return res.status(404).json({ error: 'Produto não encontrado.' });
    res.json({ message: 'Produto excluído com sucesso.' });
  } catch (error) {
    console.error('Erro ao excluir produto:', error);
    if (error.code === '23503') return res.status(409).json({ error: 'Este produto está vinculado a um pedido e não pode ser excluído.' });
    res.status(500).json({ error: 'Não foi possível excluir o produto.' });
  }
};
