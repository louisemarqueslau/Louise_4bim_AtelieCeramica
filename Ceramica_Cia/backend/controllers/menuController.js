// Menu da área administrativa: somente funcionários autenticados podem acessá-lo.
const path = require('path');

exports.abrirMenu = (req, res) => {
  const cookie = req.cookies.usuarioLogado;
  if (!cookie) return res.redirect('/loja');

  try {
    const usuario = JSON.parse(cookie);
    const ehFuncionario = usuario.ehFuncionario && Number(usuario.ehFuncionario.id_cargo) !== -1;
    if (!ehFuncionario) return res.redirect('/loja');
    return res.sendFile(path.join(__dirname, '../../frontend/menu.html'));
  } catch (error) {
    return res.redirect('/loja');
  }
};

exports.logout = (req, res) => {
  res.clearCookie('usuarioLogado', { sameSite: 'Lax', secure: process.env.NODE_ENV === 'production', httpOnly: true, path: '/' });
  res.json({ status: 'deslogado' });
};
