const express = require('express');
const router = express.Router();
const loginController = require('../controllers/loginController');


//no server.js
// const loginRoutes = require('./routes/loginRoutes');
// app.use('/login', loginRoutes);

// Rotas de autenticação

router.get('/', loginController.abrirTelaLogin);
router.get('/escolher-area', loginController.abrirEscolhaArea);
router.post('/selecionar-area', loginController.selecionarArea);
router.get('/visaocliente', loginController.abrirVisaoCliente);
router.get('/visaoclientecarrinho', loginController.abrirVisaoClienteCarrinho);
router.get('/visaoclientefinalizar', loginController.abrirVisaoClienteFinalizar);
router.get('/visaoclientepagamento', loginController.abrirVisaoClientePagamento);



router.post('/verificarEmail', loginController.verificarEmail);
router.post('/verificarSenha', loginController.verificarSenha);
router.post('/solicitarCodigoRecuperacao', loginController.solicitarCodigoRecuperacao);
router.post('/redefinirSenhaComCodigo', loginController.redefinirSenhaComCodigo);
router.get('/verificaSeUsuarioEstaLogado', loginController.verificaSeUsuarioEstaLogado);
router.get('/perfil', loginController.perfilLogado);
router.put('/alterarDados', loginController.alterarDadosLogado);
router.post('/alterarSenha', loginController.alterarSenhaLogado);
router.get('/logout', loginController.logout);

// Rotas 
//router.get('/', loginController.listarPessoas);
router.post('/', loginController.criarPessoa);
router.get('/:id', loginController.obterPessoa);
// router.put('/:id', loginController.atualizarPessoa);
// router.delete('/:id', loginController.deletarPessoa);

module.exports = router;
