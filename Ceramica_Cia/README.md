# Cerâmica & Cia

Projeto integrado do ateliê de cerâmica, com **uma única aplicação frontend**, **um único backend Node.js/Express** e **uma única conexão PostgreSQL**.

## Estrutura

- `frontend/administrador/`: módulos administrativos (produtos, categorias, pessoas, cargos, pedidos e menu).
- `frontend/visaoCliente/`: loja, carrinho, finalização e pagamento.
- `frontend/login/`: telas e scripts de login.
- `frontend/imagens/`: imagens usadas pela interface.
- `imagens/produto/`: imagens servidas pela rota `/imagens-produtos`.
- `backend/`: servidor, conexão com o banco, controllers e routes.
- `documentacao/`: scripts SQL e materiais do projeto.

A visão administrativa e a visão do cliente utilizam o mesmo servidor e o mesmo banco de dados.

## Como executar

1. Instale o Node.js e o PostgreSQL.
2. Na pasta principal do projeto, execute:

   ```bash
   npm install
   ```

3. Copie `backend/.env.example` para `backend/.env`.
4. Preencha no arquivo `backend/.env` os dados da sua instalação PostgreSQL, especialmente `DB_PASSWORD` e `DB_NAME`.
5. Confirme que o banco e as tabelas do projeto já foram criados usando o script SQL em `documentacao/`.
6. Inicie o servidor na pasta principal:

   ```bash
   npm start
   ```

7. Acesse:
   - Loja/visão do cliente: `http://localhost:3001/` ou `http://localhost:3001/loja`
   - Visão administrativa: `http://localhost:3001/administrador`
   - Verificação do servidor e banco: `http://localhost:3001/health`

## Observações

- Existe apenas um `backend/server.js` e um `backend/database.js`.
- O arquivo `backend/.env` é local e não deve ser enviado ao Git nem compartilhado. O modelo seguro está em `backend/.env.example`.
- `node_modules/` não está incluído no ZIP; ele é recriado com `npm install`.
- O servidor disponibiliza a pasta `frontend/` como conteúdo estático e mantém as rotas da API no mesmo processo.


## Configuração local e recuperação de senha

1. Copie `backend/.env.example` para `backend/.env`.
2. Preencha os dados locais do PostgreSQL. Não compartilhe o arquivo `.env`.
3. Para habilitar recuperação por e-mail, configure as variáveis `SMTP_*`. Em contas Gmail, use uma senha de app gerada na própria conta (não a senha normal).
4. Reinicie o servidor depois de alterar o `.env`. Sem credenciais SMTP válidas, o sistema informa que o envio não está configurado.

O checkout desta versão não calcula frete: o total considera somente os preços e quantidades dos produtos.
