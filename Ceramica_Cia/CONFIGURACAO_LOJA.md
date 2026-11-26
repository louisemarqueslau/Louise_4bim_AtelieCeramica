# Cerâmica & Cia — atualização da loja

## O que foi atualizado
- Menu da loja com logo, categorias, login e carrinho no topo.
- Banner rotativo de divulgação e vitrine conectada ao cadastro de produtos já utilizado pela administração.
- Detalhe do produto com seleção de quantidade e inclusão no carrinho.
- Carrinho persistido em `localStorage`, portanto não é apagado ao sair da página ou abandonar a finalização.
- Login com verificação de e-mail, formulário de cadastro para novos clientes e retorno à loja após autenticação.
- Link para a área administrativa exibido na loja quando a sessão autenticada é de funcionário.
- Aviso de cookies com escolha armazenada no navegador.
- Paleta rosa suave na loja, login e carrinho.

## Como executar
1. Configure PostgreSQL e crie/importe o banco `projeto2_dw` com as tabelas usadas pelo projeto.
2. Edite `backend/.env` com os dados locais do seu PostgreSQL. O arquivo contém apenas valores de exemplo; informe sua própria senha.
3. O backend usa as variáveis `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` e `PORT`. Exporte-as no ambiente antes de iniciar o Node (o projeto não carrega `.env` automaticamente).
4. Na pasta do projeto, execute `npm install` e depois `node backend/server.js`.
5. Acesse `http://localhost:3001/loja`.

## Observações importantes
- A integração pressupõe as tabelas singulares já utilizadas pelos controllers (`pessoa`, `cliente`, `funcionario`, `cargo` e `produto`). Confira se o banco local possui esses nomes e colunas.
- O cadastro cria a pessoa e tenta vinculá-la como cliente pela rota `/cliente`.
- O controle de sessão atual do projeto usa cookie HTTP-only e comparação de senha existente no banco. Para uso real em produção, substitua por senhas com hash (bcrypt/argon2), sessão segura e validação/autorização no servidor em todas as rotas administrativas e de pedidos.
- O aviso de cookies implementa consentimento/preferência no navegador; adapte o texto e a política de privacidade às tecnologias efetivamente utilizadas no site.


## CEP de origem do ateliê

O CEP de origem configurado no checkout é **87300-270** (`CEP_ORIGEM_ATELIE` em `frontend/visaoCliente/finalizar/finalizar.js`). O checkout ainda utiliza frete fixo demonstrativo de R$ 15,00. O CEP de origem fica registrado para a futura integração de cotação real; apenas informar o CEP não permite calcular uma tarifa real sem tabela de preços ou integração autenticada com Correios/transportadora.
