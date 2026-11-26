//import { query } from '../database.js';
const { query } = require('../database');
// Funções do controller

const path = require('path');

exports.abrirCrudPedido = (req, res) => {
  // console.log('pedidoController - Rota /abrirCrudPedido - abrir o crudPedido');
  
  const usuario = req.cookies.usuarioLogado; // O cookie deve conter o nome/ID do usuário
  
  // Se o cookie 'usuario' existe (o valor é uma string/nome do usuário)
  if (usuario) {
   res.sendFile(path.join(__dirname, '../../frontend/pedido/pedido.html'));   
  } else {
    // Cookie não existe. Usuário NÃO está logado.
    res.redirect('/login');
  }
  
}

exports.listarPedidos = async (req, res) => {
  try {
    const result = await query('SELECT * FROM pedido ORDER BY id_pedido');
    //  console.log('Resultado do SELECT:', result.rows);//verifica se está retornando algo
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar pedidos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}


exports.criarPedido = async (req, res) => {
    console.log('Criando pedido visao gerente com dados:', req.body);
  try {
    const { id_pedido, data_pedido, cliente_pessoa_cpf_pessoa, funcionario_pessoa_cpf_pessoa } = req.body;

    const result = await query(
      'INSERT INTO pedido (id_pedido, data_pedido, cliente_pessoa_cpf_pessoa, funcionario_pessoa_cpf_pessoa) VALUES ($1, $2, $3,$4) RETURNING *',
      [id_pedido, data_pedido, cliente_pessoa_cpf_pessoa, funcionario_pessoa_cpf_pessoa]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar pedido:', error);



    // Verifica se é erro de violação de constraint NOT NULL
    if (error.code === '23502') {
      return res.status(400).json({
        error: 'Dados obrigatórios não fornecidos'
      });
    }

    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

// FUNÇÃO 2: CRIAR PEDIDO ONLINE (E-COMMERCE - Utiliza CPF de Funcionário Padrão)
exports.criarPedidoOnline = async (req, res) => {
  const { data_pedido, cliente_pessoa_cpf_pessoa, itens } = req.body;
  if (!cliente_pessoa_cpf_pessoa || !Array.isArray(itens) || !itens.length) {
    return res.status(400).json({ error: 'Cliente e itens do pedido são obrigatórios.' });
  }
  // A loja não calcula frete nesta versão: o pedido considera somente os produtos.
  const frete = 0;
  try {
    const resultado = await require('../database').transaction(async client => {
      let totalProdutos = 0;
      const itensValidados = [];
      for (const item of itens) {
        const produtoId = Number(item.id_produto);
        const quantidade = Number(item.quantidade);
        if (!Number.isInteger(produtoId) || !Number.isInteger(quantidade) || quantidade < 1) {
          throw new Error('Um dos itens do pedido possui quantidade ou produto inválido.');
        }
        const consulta = await client.query(
          'SELECT id_produto, preco_produto, estoque_produto FROM public.produtos WHERE id_produto = $1 FOR UPDATE',
          [produtoId]
        );
        if (!consulta.rowCount) throw new Error(`Produto ${produtoId} não encontrado.`);
        const produto = consulta.rows[0];
        if (Number(produto.estoque_produto) < quantidade) throw new Error(`Estoque insuficiente para o produto ${produtoId}.`);
        const preco = Number(produto.preco_produto);
        totalProdutos += preco * quantidade;
        itensValidados.push({ produtoId, quantidade, preco });
      }
      const pedido = await client.query(
        `INSERT INTO public.pedidos
         (cliente_cpf_pessoa, data_pedido, status_pedido, valor_total_pedido, endereco_entrega_pedido)
         VALUES ($1, COALESCE($2::timestamp, CURRENT_TIMESTAMP), 'Aguardando pagamento', $3, $4)
         RETURNING id_pedido, valor_total_pedido`,
        [String(cliente_pessoa_cpf_pessoa).trim(), data_pedido || null, totalProdutos + frete, null]
      );
      const id = pedido.rows[0].id_pedido;
      for (const item of itensValidados) {
        await client.query(
          `INSERT INTO public.pedido_has_produto (pedido_id, produto_id, quantidade_produto, preco_unitario)
           VALUES ($1, $2, $3, $4)`,
          [id, item.produtoId, item.quantidade, item.preco]
        );
        await client.query('UPDATE public.produtos SET estoque_produto = estoque_produto - $1 WHERE id_produto = $2', [item.quantidade, item.produtoId]);
      }
      return { ...pedido.rows[0], valor_produtos: totalProdutos, valor_frete: frete };
    });
    return res.status(201).json(resultado);
  } catch (error) {
    console.error('Erro ao criar pedido online:', error);
    if (error.code === '23503') return res.status(400).json({ error: 'Cliente ou produto não encontrado nas tabelas originais do banco.' });
    return res.status(400).json({ error: error.message || 'Não foi possível criar o pedido.' });
  }
};

exports.obterPedido = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    // console.log("estou no obter pedido id="+ id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID deve ser um número válido' });
    }

    const result = await query(
      'SELECT * FROM pedido WHERE id_pedido = $1',
      [id]
    );

    //console.log(result)

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao obter pedido:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

exports.atualizarPedido = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

    const { data_pedido, cliente_pessoa_cpf_pessoa, funcionario_pessoa_cpf_pessoa } = req.body;

    // Verifica se o pedido existe
    const existing = await query('SELECT * FROM pedido WHERE id_pedido = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }
    // Atualiza o pedido
    const sql = `
      UPDATE pedido
      SET data_pedido = $1,
          cliente_pessoa_cpf_pessoa = $2,
          funcionario_pessoa_cpf_pessoa = $3
      WHERE id_pedido = $4
      RETURNING *
    `;
    const values = [data_pedido, cliente_pessoa_cpf_pessoa, funcionario_pessoa_cpf_pessoa, id];

    const updateResult = await query(sql, values);
    return res.json(updateResult.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar pedido:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};


exports.deletarPedido = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    // Verifica se a pedido existe
    const existingPersonResult = await query(
      'SELECT * FROM pedido WHERE id_pedido = $1',
      [id]
    );

    if (existingPersonResult.rows.length === 0) {
      return res.status(404).json({ error: 'Pedido não encontrada' });
    }

    // Deleta a pedido (as constraints CASCADE cuidarão das dependências)
    await query(
      'DELETE FROM pedido WHERE id_pedido = $1',
      [id]
    );

    res.status(204).send();
  } catch (error) {
    console.error('Erro ao deletar pedido:', error);

    // Verifica se é erro de violação de foreign key (dependências)
    if (error.code === '23503') {
      return res.status(400).json({
        error: 'Não é possível deletar pedido com dependências associadas'
      });
    }

    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}


