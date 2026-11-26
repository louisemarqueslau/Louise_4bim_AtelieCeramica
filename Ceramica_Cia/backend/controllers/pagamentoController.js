//import { query } from '../database.js';
const { query } = require('../database');
// Funções do controller

const path = require('path');

exports.abrirTelaPagamento = (req, res) => {
  // console.log('pagamentoController - Rota /abrirTelaPagamento - abrir a tela de pagamento');
  const usuario = req.cookies.usuarioLogado; // O cookie deve conter o nome/ID do usuário

  console.log('Cookie usuarioLogado:', usuario);

  // Se o cookie 'usuario' existe (o valor é uma string/nome do usuário)
  if (usuario) {
    res.sendFile(path.join(__dirname, '../../frontend/visaoCliente/pagamento/pagamento.html'));
  } else {
    // Cookie não existe. Usuário NÃO está logado.
    res.redirect('/login');
  }
}

exports.abrirCrudPagamento = (req, res) => {
  // console.log('pagamentoController - Rota /abrirCrudPagamento - abrir o crudPagamento');
  const usuario = req.cookies.usuarioLogado; // O cookie deve conter o nome/ID do usuário

  // Se o cookie 'usuario' existe (o valor é uma string/nome do usuário)
  if (usuario) {
    res.sendFile(path.join(__dirname, '../../frontend/pagamento/pagamento.html'));
  } else {
    // Cookie não existe. Usuário NÃO está logado.
    res.redirect('/login');
  }
}

exports.listarPagamentos = async (req, res) => {
  try {
    const result = await query('SELECT * FROM pagamento ORDER BY id_pagamento');
    //  console.log('Resultado do SELECT:', result.rows);//verifica se está retornando algo
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar pagamentos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}


exports.criarPagamento = async (req, res) => {
  //  console.log('Criando pagamento com dados:', req.body);
  try {
    const { id_pagamento, nome_pagamento } = req.body;

    // Validação básica
    if (!nome_pagamento) {
      return res.status(400).json({
        error: 'O nome do pagamento é obrigatório'
      });
    }

    const result = await query(
      'INSERT INTO pagamento (id_pagamento, nome_pagamento) VALUES ($1, $2) RETURNING *',
      [id_pagamento, nome_pagamento]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar pagamento:', error);



    // Verifica se é erro de violação de constraint NOT NULL
    if (error.code === '23502') {
      return res.status(400).json({
        error: 'Dados obrigatórios não fornecidos'
      });
    }

    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

exports.criarPagamentoParaPedido = async (req, res) => {
  try {
    const idPedido = Number(req.params.id || req.body.idPedido);
    const valorTotal = Number(req.body.valorTotal);
    const formas = req.body.formasPagamento;
    if (!Number.isInteger(idPedido) || idPedido < 1) return res.status(400).json({ error: 'Pedido inválido.' });
    if (!Number.isFinite(valorTotal) || valorTotal <= 0) return res.status(400).json({ error: 'Valor total inválido.' });
    if (!Array.isArray(formas) || !formas.length) return res.status(400).json({ error: 'Selecione uma forma de pagamento.' });
    const totalFormas = formas.reduce((s, f) => s + Number(f.valor || 0), 0);
    if (Math.abs(totalFormas - valorTotal) > 0.01) return res.status(400).json({ error: 'A soma das formas de pagamento deve corresponder ao total do pedido.' });
    const metodos = [...new Set(formas.map(f => String(f.tipo || '').trim()).filter(Boolean))];
    if (!metodos.length) return res.status(400).json({ error: 'Forma de pagamento inválida.' });
    const resultado = await require('../database').transaction(async client => {
      const pedido = await client.query('SELECT id_pedido FROM public.pedidos WHERE id_pedido = $1 FOR UPDATE', [idPedido]);
      if (!pedido.rowCount) throw Object.assign(new Error('Pedido não encontrado.'), { code: 'P0002' });
      const pagamento = await client.query(
        `INSERT INTO public.pagamentos (pedido_id, forma_pagamento, status_pagamento, valor_pagamento, data_pagamento)
         VALUES ($1, $2, 'Aprovado', $3, CURRENT_TIMESTAMP) RETURNING *`,
        [idPedido, metodos.join(' + '), valorTotal]
      );
      await client.query("UPDATE public.pedidos SET status_pedido = 'Pago' WHERE id_pedido = $1", [idPedido]);
      return pagamento.rows[0];
    });
    return res.status(201).json({ message: 'Pagamento criado com sucesso', pagamento: resultado });
  } catch (error) {
    console.error('Erro ao registrar pagamento:', error);
    if (error.code === 'P0002') return res.status(404).json({ error: error.message });
    if (error.code === '23505') return res.status(409).json({ error: 'Este pedido já possui pagamento registrado.' });
    return res.status(500).json({ error: error.message || 'Não foi possível registrar o pagamento.' });
  }
};

// exports.criarPagamentoParaPedido = async (req, res) => {
//   console.log('Criando pagamento com dados:', req.body);
  
//   try {
//     // PASSO 1: Recebe dados
//     const { idPedido, valorTotal, formasPagamento } = req.body;

//     // PASSO 2: Valida dados
//     if (!idPedido || !valorTotal || !formasPagamento?.length) {
//       return res.status(400).json({ 
//         sucesso: false,
//         mensagem: 'Dados incompletos' 
//       });
//     }

//     // PASSO 3: Cria pagamento principal
//     const pagamentoResult = await query(
//       `INSERT INTO pagamento (pedido_id_pedido, data_pagamento, valor_total_pagamento) 
//        VALUES ($1, $2, $3) RETURNING *`,
//       [idPedido, new Date().toISOString(), valorTotal]
//     );

//     // PASSO 4: Cria formas de pagamento
//     const formasCriadas = [];
    
//     for (const forma of formasPagamento) {
//       const result = await query(
//         `INSERT INTO pagamento_has_forma_pagamento 
//          (pagamento_id_pedido, forma_pagamento_id_forma_pagamento, valor_pago) 
//          VALUES ($1, $2, $3) RETURNING *`,
//         [idPedido, forma.tipo, forma.valor]
//       );
//       formasCriadas.push(result.rows[0]);
//     }

//     // PASSO 5: Retorna sucesso NO FORMATO QUE O FRONTEND ESPERA
//     res.status(201).json({
//       sucesso: true,
//       mensagem: 'Pagamento realizado com sucesso!',
//       dados: {
//         pagamento: pagamentoResult.rows[0],
//         formas_pagamento: formasCriadas
//       }
//     });

//   } catch (error) {
//     console.error('Erro:', error);
    
//     // PASSO 6: Trata erros NO FORMATO QUE O FRONTEND ESPERA
//     const mensagemErro = {
//       '23502': 'Dados obrigatórios faltando',
//       '23503': 'Pedido ou forma de pagamento não existe',
//       '23505': 'Pagamento já registrado'
//     }[error.code] || 'Erro interno no servidor';
    
//     res.status(error.code ? 400 : 500).json({ 
//       sucesso: false,
//       mensagem: mensagemErro 
//     });
//   }
// };

exports.obterPagamento = async (req, res) => {
  try {
    console.log(req.params.id);
    const id = parseInt(req.params.id);

    // console.log("estou no obter pagamento id="+ id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID deve ser um número válido' });
    }

    const result = await query(
      'SELECT * FROM pagamento WHERE id_pagamento = $1',
      [id]
    );

    //console.log(result)

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pagamento não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao obter pagamento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

exports.atualizarPagamento = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { nome_pagamento } = req.body;


    // Verifica se a pagamento existe
    const existingPersonResult = await query(
      'SELECT * FROM pagamento WHERE id_pagamento = $1',
      [id]
    );

    if (existingPersonResult.rows.length === 0) {
      return res.status(404).json({ error: 'Pagamento não encontrada' });
    }

    // Constrói a query de atualização dinamicamente para campos não nulos
    const currentPerson = existingPersonResult.rows[0];
    const updatedFields = {
      nome_pagamento: nome_pagamento !== undefined ? nome_pagamento : currentPerson.nome_pagamento
    };

    // Atualiza a pagamento
    const updateResult = await query(
      'UPDATE pagamento SET nome_pagamento = $1 WHERE id_pagamento = $2 RETURNING *',
      [updatedFields.nome_pagamento, id]
    );

    res.json(updateResult.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar pagamento:', error);


    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

exports.deletarPagamento = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    // Verifica se a pagamento existe
    const existingPersonResult = await query(
      'SELECT * FROM pagamento WHERE id_pagamento = $1',
      [id]
    );

    if (existingPersonResult.rows.length === 0) {
      return res.status(404).json({ error: 'Pagamento não encontrada' });
    }

    // Deleta a pagamento (as constraints CASCADE cuidarão das dependências)
    await query(
      'DELETE FROM pagamento WHERE id_pagamento = $1',
      [id]
    );

    res.status(204).send();
  } catch (error) {
    console.error('Erro ao deletar pagamento:', error);

    // Verifica se é erro de violação de foreign key (dependências)
    if (error.code === '23503') {
      return res.status(400).json({
        error: 'Não é possível deletar pagamento com dependências associadas'
      });
    }

    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}


