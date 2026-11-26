/*
CREATE TABLE public.pessoa (
  cpf_pessoa varchar(20) NOT NULL,
  nome_pessoa varchar(60) NULL,
  data_nascimento_pessoa date NULL,
  endereco_pessoa varchar(150) NULL,
  senha_pessoa varchar(50) NULL,
  email_pessoa varchar(75) NULL,
  CONSTRAINT pessoa_pkey PRIMARY KEY (cpf_pessoa),
  CONSTRAINT pessoa_unique UNIQUE (email_pessoa)
);
*/
const db = require('../database');
const { query } = db;
const { hashPassword } = require('../utils/password');
// Funções do controller

const path = require('path');

exports.abrirCrudPessoa = (req, res) => {
  //  console.log('pessoaController - Rota /abrirCrudPessoa - abrir o crudPessoa');
  
  const usuario = req.cookies.usuarioLogado; // O cookie deve conter o nome/ID do usuário
  
  // Se o cookie 'usuario' existe (o valor é uma string/nome do usuário)
  if (usuario) {
   res.sendFile(path.join(__dirname, '../../frontend/pessoa/pessoa.html'));
    
  } else {
    // Cookie não existe. Usuário NÃO está logado.
    res.redirect('/login');
  }

}

exports.listarPessoas = async (req, res) => {
  try {
    const result = await query('SELECT cpf_pessoa, nome_pessoa, data_nascimento_pessoa, endereco_pessoa, email_pessoa FROM pessoas ORDER BY cpf_pessoa');
    // console.log('Resultado do SELECT:', result.rows);//verifica se está retornando algo
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar pessoas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

exports.criarPessoa = async (req, res) => {
  //  console.log('Criando pessoa com dados:', req.body);
  try {
    const { cpf_pessoa, nome_pessoa, data_nascimento_pessoa, endereco_pessoa, senha_pessoa, email_pessoa } = req.body;

    // Validação básica
    if (!nome_pessoa || !endereco_pessoa || !senha_pessoa || !email_pessoa) {
      return res.status(400).json({
        error: 'Nome, email, endereço e senha são obrigatórios'
      });
    }

    // Validação de email básica
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email_pessoa)) {
      return res.status(400).json({
        error: 'Formato de email inválido'
      });
    }

    const result = await query(
      'INSERT INTO pessoas (cpf_pessoa, nome_pessoa, data_nascimento_pessoa,endereco_pessoa,senha_pessoa, email_pessoa ) VALUES ($1, $2, $3, $4, $5,$6) RETURNING *',
      [cpf_pessoa, nome_pessoa, data_nascimento_pessoa, endereco_pessoa, senha_pessoa, email_pessoa]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar pessoa:', error);

    // Verifica se é erro de email duplicado (constraint unique violation)
    if (error.code === '23505' && error.constraint === 'pessoa_unique') {
      return res.status(400).json({
        error: 'Email já está em uso'
      });
    }

    // Verifica se é erro de violação de constraint NOT NULL
    if (error.code === '23502') {
      return res.status(400).json({
        error: 'Dados obrigatórios não fornecidos'
      });
    }

    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

exports.obterPessoa = async (req, res) => {
  try {
    const id = String(req.params.id || "").trim();

    if (!id) {
      return res.status(400).json({ error: 'CPF deve ser um número válido' });
    }

    const result = await query(
      'SELECT cpf_pessoa, nome_pessoa, data_nascimento_pessoa, endereco_pessoa, email_pessoa FROM pessoas WHERE cpf_pessoa = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pessoa não encontrada' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao obter pessoa:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

exports.atualizarPessoa = async (req, res) => {
  //console.log('Atualizando pessoa com dados:', req.body);

  try {
    const id = String(req.params.id || "").trim();
    const { nome_pessoa, data_nascimento_pessoa, endereco_pessoa, senha_pessoa, email_pessoa } = req.body;

    // Validação de email se fornecido
    if (email_pessoa) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email_pessoa)) {
        return res.status(400).json({
          error: 'Formato de email inválido'
        });
      }
    }
    // Verifica se a pessoa existe
    const existingPersonResult = await query(
      'SELECT cpf_pessoa, nome_pessoa, data_nascimento_pessoa, endereco_pessoa, email_pessoa FROM pessoas WHERE cpf_pessoa = $1',
      [id]
    );

    if (existingPersonResult.rows.length === 0) {
      return res.status(404).json({ error: 'Pessoa não encontrada' });
    }

    // Constrói a query de atualização dinamicamente para campos não nulos
    const currentPerson = existingPersonResult.rows[0];
    const updatedFields = {
      nome_pessoa: nome_pessoa !== undefined ? nome_pessoa : currentPerson.nome_pessoa,
      data_nascimento_pessoa: data_nascimento_pessoa !== undefined ? data_nascimento_pessoa : currentPerson.data_nascimento_pessoa,
      endereco_pessoa: endereco_pessoa !== undefined ? endereco_pessoa : currentPerson.endereco_pessoa,
      
      email_pessoa: email_pessoa !== undefined ? email_pessoa : currentPerson.email_pessoa
    };

    //cpf_pessoa, nome_pessoa, data_nascimento_pessoa,endereco_pessoa,senha_pessoa, email_pessoa
    // Atualiza a pessoa
    const updateResult = await query(
      'UPDATE pessoas SET nome_pessoa = $1, data_nascimento_pessoa = $2, endereco_pessoa = $3, email_pessoa = $4 WHERE cpf_pessoa = $5 RETURNING cpf_pessoa, nome_pessoa, data_nascimento_pessoa, endereco_pessoa, email_pessoa',
      [updatedFields.nome_pessoa, updatedFields.data_nascimento_pessoa, updatedFields.endereco_pessoa, updatedFields.email_pessoa, id]
    );

    res.json(updateResult.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar pessoa:', error);

    // Verifica se é erro de email duplicado
    if (error.code === '23505' && error.constraint === 'pessoa_unique') {
      return res.status(400).json({
        error: 'Email já está em uso por outra pessoa'
      });
    }

    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

exports.deletarPessoa = async (req, res) => {
  try {
    const id = String(req.params.id || "").trim();
    // Verifica se a pessoa existe
    const existingPersonResult = await query(
      'SELECT cpf_pessoa, nome_pessoa, data_nascimento_pessoa, endereco_pessoa, email_pessoa FROM pessoas WHERE cpf_pessoa = $1',
      [id]
    );

    if (existingPersonResult.rows.length === 0) {
      return res.status(404).json({ error: 'Pessoa não encontrada' });
    }

    // Deleta a pessoa (as constraints CASCADE cuidarão das dependências)
    await query(
      'DELETE FROM pessoas WHERE cpf_pessoa = $1',
      [id]
    );

    res.status(204).send();
  } catch (error) {
    console.error('Erro ao deletar pessoa:', error);

    // Verifica se é erro de violação de foreign key (dependências)
    if (error.code === '23503') {
      return res.status(400).json({
        error: 'Não é possível deletar pessoa com dependências associadas (essa pessoa é cliente ou funcionário)'
      });
    }

    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

// Função adicional para buscar pessoa por email
exports.obterPessoaPorEmail = async (req, res) => {
  try {
    const { email_pessoa } = req.params;

    if (!email_pessoa) {
      return res.status(400).json({ error: 'Email é obrigatório' });
    }

    const result = await query(
      'SELECT cpf_pessoa, nome_pessoa, data_nascimento_pessoa, endereco_pessoa, email_pessoa FROM pessoas WHERE email_pessoa = $1',
      [email_pessoa]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pessoa não encontrada' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao obter pessoa por email:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

// Função para atualizar apenas a senha
exports.atualizarSenha = async (req, res) => {
  return res.status(403).json({ error: 'Senhas não podem ser consultadas ou alteradas pelo CRUD administrativo. O próprio usuário deve usar a recuperação segura.' });
};
