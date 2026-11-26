const db = require('../database.js');


const path = require('path');
const { hashPassword, verifyPassword } = require('../utils/password');
const crypto = require('crypto');
const codigosRecuperacao = new Map();

exports.abrirTelaLogin = (req, res) => {
  // console.log('loginController - Rota /login - Acessando login.html');
  res.sendFile(path.join(__dirname, '../../frontend/login/login.html'));
};

exports.abrirVisaoCliente = (req, res) => {
  console.log('loginController - Rota /login - visão do cliente');
  res.sendFile(path.join(__dirname, '../../frontend/visaoCliente/inicio/inicio.html'));
};

exports.abrirVisaoClienteCarrinho = (req, res) => {
  console.log('loginController - Rota /login - visão do cliente - carrinho');
  res.sendFile(path.join(__dirname, '../../frontend/visaoCliente/carrinho/carrinho.html'));

};

exports.abrirVisaoClienteFinalizar = (req, res) => {
  console.log('loginController - Rota /login - visão do cliente - finalizar');
  res.sendFile(path.join(__dirname, '../../frontend/visaoCliente/finalizar/finalizar.html'));

};


exports.abrirVisaoClientePagamento = (req, res) => {
  console.log('loginController - Rota /login - visão do cliente - pagamento');
  res.sendFile(path.join(__dirname, '../../frontend/visaoCliente/pagamento/pagamento.html'));

};


exports.verificaSeUsuarioEstaLogado = (req, res) => {
  try {
    const valorCookie = req.cookies.usuarioLogado;
    if (!valorCookie) return res.status(401).json({ status: 'nao_logado' });

    const usuario = typeof valorCookie === 'string' ? JSON.parse(valorCookie) : valorCookie;
    if (!usuario || !usuario.cpf_pessoa) {
      return res.status(401).json({ status: 'nao_logado' });
    }

    return res.json({ status: 'ok', usuario });
  } catch (error) {
    console.error('Erro ao consultar sessão:', error);
    return res.status(401).json({ status: 'nao_logado' });
  }
};

// Altera a senha da pessoa autenticada usando o CPF armazenado na sessão.
exports.alterarSenhaLogado = async (req, res) => {
  try {
    const valorCookie = req.cookies.usuarioLogado;
    if (!valorCookie) return res.status(401).json({ error: 'Faça login para alterar sua senha.' });

    const usuario = typeof valorCookie === 'string' ? JSON.parse(valorCookie) : valorCookie;
    const cpf = usuario && usuario.cpf_pessoa;
    const { senha_atual, nova_senha } = req.body;

    if (!cpf) return res.status(401).json({ error: 'Sessão inválida. Entre novamente.' });
    if (!senha_atual || !nova_senha) return res.status(400).json({ error: 'Informe a senha atual e a nova senha.' });
    if (String(nova_senha).length < 5) return res.status(400).json({ error: 'A nova senha deve ter pelo menos 5 caracteres.' });

    const pessoa = await db.query(
      'SELECT senha_pessoa FROM pessoas WHERE cpf_pessoa = $1', [cpf]
    );
    if (!pessoa.rows.length) return res.status(404).json({ error: 'Conta não encontrada.' });
    if (!(await verifyPassword(senha_atual, pessoa.rows[0].senha_pessoa))) {
      return res.status(400).json({ error: 'A senha atual está incorreta.' });
    }

    const senhaHash = await hashPassword(nova_senha);
    await db.query('UPDATE pessoas SET senha_pessoa = $1 WHERE cpf_pessoa = $2', [senhaHash, cpf]);
    return res.json({ status: 'ok', mensagem: 'Senha alterada com sucesso!' });
  } catch (error) {
    console.error('Erro ao alterar senha da sessão:', error);
    return res.status(500).json({ error: 'Não foi possível alterar a senha.' });
  }
};

exports.abrirEscolhaArea = (req, res) => {
  const cookie = req.cookies.usuarioLogado;
  if (!cookie) return res.redirect('/login');
  res.sendFile(path.join(__dirname, '../../frontend/login/escolher-area.html'));
};

exports.selecionarArea = async (req, res) => {
  try {
    const cookie = req.cookies.usuarioLogado;
    if (!cookie) return res.status(401).json({ error: 'Faça login para continuar.' });
    const usuario = typeof cookie === 'string' ? JSON.parse(cookie) : cookie;
    const area = req.body.area;
    const acessoCliente = await db.query('SELECT 1 FROM clientes WHERE pessoa_cpf_pessoa = $1', [usuario.cpf_pessoa]);
    const acessoAdmin = await db.query('SELECT 1 FROM funcionarios WHERE pessoa_cpf_pessoa = $1', [usuario.cpf_pessoa]);

    if (area === 'administracao' && !acessoAdmin.rows.length) {
      return res.status(403).json({ error: 'Sua conta não possui acesso administrativo.' });
    }
    if (area === 'cliente' && !acessoCliente.rows.length) {
      return res.status(403).json({ error: 'Sua conta não possui acesso à área do cliente.' });
    }
    if (!['cliente', 'administracao'].includes(area)) {
      return res.status(400).json({ error: 'Área inválida.' });
    }

    usuario.areaAtual = area;
    usuario.ehAdministrador = acessoAdmin.rows.length > 0;
    res.cookie('usuarioLogado', JSON.stringify(usuario), {
      sameSite: 'Lax', secure: process.env.NODE_ENV === 'production',
      httpOnly: true, path: '/', maxAge: 2 * 60 * 60 * 1000
    });
    return res.json({ status: 'ok', destino: area === 'administracao' ? '/administrador' : '/loja' });
  } catch (error) {
    console.error('Erro ao selecionar área:', error);
    return res.status(500).json({ error: 'Não foi possível abrir a área escolhida.' });
  }
};

exports.verificarEmail = async (req, res) => {
  const { email } = req.body;

  const sql = 'SELECT nome_pessoa FROM pessoas WHERE email_pessoa = $1'; // Postgres usa $1, $2...

  console.log('rota verificarEmail: ', sql, email);

  try {
    const result = await db.query(sql, [email]); // igual listarPessoas

    if (result.rows.length > 0) {
      return res.json({ status: 'existe', nome: result.rows[0].nome_pessoa });
    }

    res.json({ status: 'nao_encontrado' });
  } catch (err) {
    console.error('Erro em verificarEmail:', err);
    res.status(500).json({ status: 'erro', mensagem: err.message });
  }
};


// Verificar senha
exports.verificarSenha = async (req, res) => {
  const { email, senha } = req.body;

  const sqlPessoa = `
    SELECT cpf_pessoa, nome_pessoa, senha_pessoa
    FROM pessoas
    WHERE email_pessoa = $1
  `;
  const sqlCliente = `
    SELECT * 
    FROM clientes 
    WHERE pessoa_cpf_pessoa = $1
  `;

  const sqlFuncionario = `
    SELECT c.id_cargo, c.nome_cargo
    FROM funcionarios f
    LEFT JOIN cargo c ON c.id_cargo = f.cargo_id_cargo
    WHERE f.pessoa_cpf_pessoa = $1;`;

  //console.log('Rota verificarSenha:', sqlPessoa, email, senha);

  try {
    // 1. Verifica se existe pessoa com email/senha
    const resultPessoa = await db.query(sqlPessoa, [email]);

    if (resultPessoa.rows.length === 0 || !(await verifyPassword(senha, resultPessoa.rows[0].senha_pessoa))) {
      return res.json({ status: 'senha_incorreta' });
    }

    const { cpf_pessoa, nome_pessoa } = resultPessoa.rows[0];
    if (!String(resultPessoa.rows[0].senha_pessoa).startsWith('scrypt$')) {
      const hash = await hashPassword(senha);
      await db.query('UPDATE pessoas SET senha_pessoa = $1 WHERE cpf_pessoa = $2', [hash, cpf_pessoa]);
    }
    console.log('loginController -> Usuário encontrado:', resultPessoa.rows[0]);

    // 2. Verifica se é cliente
    const resultCliente = await db.query(sqlCliente, [cpf_pessoa]);

    let ehCliente = null;
    if (resultCliente.rows.length === 0) {
      ehCliente = false;
    } else {
      ehCliente = true;
    }

    // 2b. Verifica se é funcionário
    const resultFuncionario = await db.query(sqlFuncionario, [cpf_pessoa]);


    let funcionario = {};
    if (resultFuncionario.rows.length > 0) {
      funcionario = resultFuncionario.rows[0];
      console.log('Usuário é funcionário:', funcionario);
      console.log(`Cargo do funcionário: ID=${funcionario.id_cargo}, Nome=${funcionario.nome_cargo}`);
    } else {
      // Se não for funcionário, cria um objeto padrão 
      funcionario = {        
        id_cargo: -1,
        nome_cargo: 'Cliente'
      };

      console.log('loginController -> Usuário não é funcionário.');
    }


    //console.log(`loginController -> verificaSenha - Tipo de usuário - Cliente: ${ehCliente}`);
      
    
      
    const dadosUsuario = {
      cpf_pessoa,
      nome: nome_pessoa,
      ehCliente,
      ehFuncionario: funcionario,
      ehAdministrador: resultFuncionario.rows.length > 0,
      areaAtual: resultFuncionario.rows.length > 0 && !ehCliente ? 'administracao' : 'cliente'
    };

    // 3. Define cookie
    res.cookie('usuarioLogado', JSON.stringify(dadosUsuario), {
      sameSite: 'Lax',
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      path: '/',
      maxAge: 2 * 60 * 60 * 1000, // 2 horas conforme requisito da loja
    });

    console.log("Cookie 'usuarioLogado' definido com sucesso");

    // 4. Retorna dados para o frontend, o cookie será enviado ao frontend
    const temAcessoCliente = ehCliente;
    const temAcessoAdmin = resultFuncionario.rows.length > 0;
    let destino = '/loja';
    if (temAcessoAdmin && temAcessoCliente) destino = '/login/escolher-area';
    else if (temAcessoAdmin) destino = '/administrador';
    else destino = '/loja';

    return res.json({ status: 'ok', nome: nome_pessoa, ehCliente: temAcessoCliente, ehAdministrador: temAcessoAdmin, destino });

  } catch (err) {
    console.error('Erro ao verificar senha:', err);
    return res.status(500).json({ status: 'erro', mensagem: err.message });
  }
}


// Recuperação por código de uso único. Configure SMTP_HOST, SMTP_PORT, SMTP_USER e SMTP_PASS no .env.
exports.solicitarCodigoRecuperacao = async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    if (!email) return res.status(400).json({ error: 'Informe seu e-mail.' });
    const pessoa = await db.query('SELECT cpf_pessoa FROM pessoas WHERE LOWER(email_pessoa) = $1', [email]);
    // Resposta neutra para não revelar se o e-mail está cadastrado.
    if (!pessoa.rows.length) return res.json({ status: 'ok', mensagem: 'Se o e-mail estiver cadastrado, enviaremos um código.' });
    const smtpConfigurado = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS && !/seuprovedor|seu-email|sua-senha/i.test([process.env.SMTP_HOST, process.env.SMTP_USER, process.env.SMTP_PASS].join(' '));
    if (!smtpConfigurado) {
      return res.status(503).json({ error: 'Envio de e-mail não configurado. Configure as variáveis SMTP no servidor.' });
    }
    const nodemailer = require('nodemailer');
    const codigo = String(crypto.randomInt(100000, 1000000));
    codigosRecuperacao.set(email, { codigo, cpf: pessoa.rows[0].cpf_pessoa, expira: Date.now() + 10 * 60 * 1000 });
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT || 587),
      secure: String(process.env.SMTP_SECURE || 'false') === 'true',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    });
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER, to: email,
      subject: 'Código para redefinir sua senha - Cerâmica & Cia',
      text: `Seu código de recuperação é ${codigo}. Ele expira em 10 minutos. Se você não solicitou, ignore este e-mail.`
    });
    return res.json({ status: 'ok', mensagem: 'Se o e-mail estiver cadastrado, enviaremos um código.' });
  } catch (error) {
    console.error('Erro ao enviar código de recuperação:', error);
    return res.status(500).json({ error: 'Não foi possível enviar o código agora.' });
  }
};

exports.redefinirSenhaComCodigo = async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const codigo = String(req.body.codigo || '').trim();
    const novaSenha = String(req.body.nova_senha || '');
    const registro = codigosRecuperacao.get(email);
    if (!registro || registro.expira < Date.now() || registro.codigo !== codigo) {
      codigosRecuperacao.delete(email);
      return res.status(400).json({ error: 'Código inválido ou expirado. Solicite outro.' });
    }
    if (novaSenha.length < 5) return res.status(400).json({ error: 'A nova senha deve ter pelo menos 5 caracteres.' });
    const hash = await hashPassword(novaSenha);
    await db.query('UPDATE pessoas SET senha_pessoa = $1 WHERE cpf_pessoa = $2', [hash, registro.cpf]);
    codigosRecuperacao.delete(email);
    return res.json({ status: 'ok', mensagem: 'Senha redefinida com sucesso.' });
  } catch (error) {
    console.error('Erro ao redefinir senha:', error);
    return res.status(500).json({ error: 'Não foi possível redefinir a senha.' });
  }
};

// Logout
exports.logout = (req, res) => {
  res.clearCookie('usuarioLogado', {
    sameSite: 'Lax',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    path: '/',
  });
  console.log("Cookie 'usuarioLogado' removido com sucesso");
  res.json({ status: 'deslogado' });
}



exports.perfilLogado = async (req, res) => {
  try {
    const cookie = req.cookies.usuarioLogado;
    if (!cookie) return res.status(401).json({error:'Faça login.'});
    const usuario = typeof cookie === 'string' ? JSON.parse(cookie) : cookie;
    const pessoa = await db.query(
      'SELECT cpf_pessoa, nome_pessoa, email_pessoa, endereco_pessoa, data_nascimento_pessoa FROM pessoas WHERE cpf_pessoa = $1',
      [usuario.cpf_pessoa]
    );
    if (!pessoa.rows.length) return res.status(404).json({error:'Conta não encontrada.'});
    const funcionario = await db.query('SELECT 1 FROM funcionarios WHERE pessoa_cpf_pessoa = $1',[usuario.cpf_pessoa]);
    return res.json({...pessoa.rows[0], ehFuncionario: funcionario.rows.length > 0});
  } catch (error) {
    console.error('Erro ao carregar perfil:', error);
    return res.status(500).json({error:'Não foi possível carregar os dados.'});
  }
};

exports.alterarDadosLogado = async (req, res) => {
  try {
    const cookie = req.cookies.usuarioLogado;
    if (!cookie) return res.status(401).json({error:'Faça login.'});
    const usuario = typeof cookie === 'string' ? JSON.parse(cookie) : cookie;
    const {nome_pessoa,email_pessoa,endereco_pessoa,data_nascimento_pessoa} = req.body;
    if (!nome_pessoa || !email_pessoa) return res.status(400).json({error:'Nome e e-mail são obrigatórios.'});
    const atualizado = await db.query(
      'UPDATE pessoas SET nome_pessoa=$1,email_pessoa=$2,endereco_pessoa=$3,data_nascimento_pessoa=$4 WHERE cpf_pessoa=$5 RETURNING nome_pessoa,email_pessoa,endereco_pessoa,data_nascimento_pessoa',
      [nome_pessoa,email_pessoa,endereco_pessoa || null,data_nascimento_pessoa || null,usuario.cpf_pessoa]
    );
    if (!atualizado.rows.length) return res.status(404).json({error:'Conta não encontrada.'});
    usuario.nome = nome_pessoa;
    res.cookie('usuarioLogado', JSON.stringify(usuario), {sameSite:'Lax',secure:process.env.NODE_ENV==='production',httpOnly:true,path:'/',maxAge:2*60*60*1000});
    return res.json({status:'ok',usuario:atualizado.rows[0]});
  } catch(error) {
    if (error.code === '23505') return res.status(400).json({error:'Este e-mail já está cadastrado.'});
    console.error('Erro ao atualizar perfil:',error);
    return res.status(500).json({error:'Não foi possível atualizar os dados.'});
  }
};

exports.criarPessoa = async (req, res) => {
  try {
    const { cpf_pessoa, nome_pessoa, email_pessoa, senha_pessoa, endereco_pessoa, data_nascimento_pessoa } = req.body;
    if (!cpf_pessoa || !nome_pessoa || !email_pessoa || !senha_pessoa || !endereco_pessoa) {
      return res.status(400).json({ error: 'CPF, nome, e-mail, senha e endereço são obrigatórios.' });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email_pessoa)) return res.status(400).json({ error: 'Formato de e-mail inválido.' });
    const senhaHash = await hashPassword(senha_pessoa);
    const result = await db.query(
      'INSERT INTO pessoas (cpf_pessoa, nome_pessoa, email_pessoa, senha_pessoa, endereco_pessoa, data_nascimento_pessoa) VALUES ($1, $2, $3, $4, $5, $6) RETURNING cpf_pessoa, nome_pessoa, email_pessoa',
      [String(cpf_pessoa).trim(), nome_pessoa, email_pessoa, senhaHash, endereco_pessoa, data_nascimento_pessoa || null]
    );
    return res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar pessoa:', error);
    if (error.code === '23505') return res.status(400).json({ error: 'CPF ou e-mail já cadastrado.' });
    if (error.code === '23502') return res.status(400).json({ error: 'Preencha todos os dados obrigatórios.' });
    return res.status(500).json({ error: 'Erro interno ao criar cadastro.' });
  }
};

exports.obterPessoa = async (req, res) => {
  try {
    const id = String(req.params.id || '').trim();

    if (isNaN(id)) {
      return res.status(400).json({ error: 'loginController-obterPessoa - ID deve ser um número válido' });
    }

    const result = await db.query(
      'SELECT cpf_pessoa, nome_pessoa, email_pessoa, endereco_pessoa, data_nascimento_pessoa FROM pessoas WHERE cpf_pessoa = $1',
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
};


// Função adicional para buscar pessoa por email
exports.obterPessoaPorEmail = async (req, res) => {
  try {
    const { email } = req.params;

    if (!email) {
      return res.status(400).json({ error: 'Email é obrigatório' });
    }

    const result = await db.query(
      'SELECT cpf_pessoa, nome_pessoa, email_pessoa, endereco_pessoa, data_nascimento_pessoa FROM pessoas WHERE email_pessoa = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pessoa não encontrada' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao obter pessoa por email:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Função para atualizar apenas a senha
exports.atualizarSenha = async (req, res) => {
  try {
    const id = String(req.params.id || '').trim();
    const { senha_atual, nova_senha } = req.body;

    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID deve ser um número válido' });
    }

    if (!senha_atual || !nova_senha) {
      return res.status(400).json({
        error: 'Senha atual e nova senha são obrigatórias'
      });
    }

    // Verifica se a pessoa existe e a senha atual está correta
    const personResult = await db.query(
      'SELECT cpf_pessoa, nome_pessoa, email_pessoa, endereco_pessoa, data_nascimento_pessoa FROM pessoas WHERE cpf_pessoa = $1',
      [id]
    );

    if (personResult.rows.length === 0) {
      return res.status(404).json({ error: 'Pessoa não encontrada' });
    }

    const person = personResult.rows[0];

    // Verificação básica da senha atual (em produção, use hash)
    if (person.senha_pessoa !== senha_atual) {
      return res.status(400).json({ error: 'Senha atual incorreta' });
    }

    // Atualiza apenas a senha
    const updateResult = await db.query(
      'UPDATE pessoas SET senha_pessoa = $1 WHERE cpf_pessoa = $2 RETURNING cpf_pessoa, nome_pessoa, email_pessoa, primeiro_acesso_pessoa, data_nascimento',
      [nova_senha, id]
    );

    res.json(updateResult.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar senha:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

