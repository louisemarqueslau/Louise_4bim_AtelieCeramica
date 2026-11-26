# Integração da visão do cliente — Cerâmica & Cia

## O que foi integrado
- A página inicial criada em `visao_cliente_inicio` foi incorporada em `frontend/visaoCliente/inicio`.
- A rota `http://localhost:3001/loja` abre a página inicial da loja.
- A vitrine faz `fetch('/produto')`, reutilizando a rota GET já existente do cadastro administrativo.
- As imagens são carregadas pela rota existente `/view-image/:produtoId`; quando não houver imagem, a vitrine usa `/imagens-produtos/000.png`.
- A busca filtra os produtos pelo nome no navegador.

## Qual tabela alimenta a vitrine?
A vitrine utiliza a tabela singular `produto`, porque é a tabela consultada pelo CRUD do administrador (`produtoController.js`). A tabela plural `produtos` do SQL antigo não foi misturada automaticamente, para evitar duplicidade e divergência entre cadastros.

## Como testar
1. Mantenha a configuração local do PostgreSQL no `backend/database.js` correta para seu computador.
2. No terminal, entre na pasta do projeto e execute `npm install` (se ainda não instalou as dependências).
3. Inicie o servidor com o comando usado no seu projeto (`node backend/server.js`, se esse for seu ponto de entrada).
4. Abra `http://localhost:3001/loja`.
5. Cadastre um produto pela visão do administrador. Ele deverá aparecer na vitrine. Para a foto aparecer, envie a imagem pelo próprio cadastro administrativo.

## Observação sobre as duas tabelas
Como o projeto possui `produto` e `produtos`, mantenha a tabela singular como fonte da vitrine enquanto o administrador continuar usando o CRUD atual. Se decidir migrar para a tabela plural com categorias e descrições, será necessário adaptar o CRUD administrativo e os relacionamentos em conjunto.
