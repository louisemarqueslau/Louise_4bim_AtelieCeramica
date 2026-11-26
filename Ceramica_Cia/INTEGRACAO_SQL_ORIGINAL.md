# Integração com o SQL original da Cerâmica & Cia

A aplicação iniciada pelo comando `npm start` usa `backend/server.js` na porta 3001.

A vitrine do cliente e o CRUD de produtos servido por esse backend agora consultam as tabelas originais do arquivo `documentacao/projetodw1.sql`:

- `public.produtos`: `id_produto`, `categoria_id`, `nome_produto`, `descricao_produto`, `preco_produto`, `estoque_produto`, `imagem_url`.
- `public.categorias`: `id_categoria`, `nome_categoria`, `descricao_categoria`.

## O que foi alterado

- A API `GET /produto` lista `public.produtos` e associa o nome da categoria.
- `GET /produto/:id`, `POST /produto`, `PUT /produto/:id` e `DELETE /produto/:id` usam a mesma tabela.
- Foi adicionada a rota `GET /categoria` para carregar as categorias cadastradas no SQL.
- O formulário administrativo principal permite selecionar categoria e editar descrição, preço e estoque.
- O upload de imagem registra `/view-image/:id` no campo `imagem_url` do produto.
- A vitrine do cliente lê os nomes de campos do SQL original e atualiza a listagem periodicamente.
- O carrinho local não é apagado durante a atualização da vitrine.

## Como executar

1. Preserve o seu arquivo `backend/.env` local; ele não é incluído neste pacote por conter credenciais.
2. Confirme que `DB_NAME` aponta para o banco `projeto2_dw` que recebeu o SQL original.
3. Na pasta raiz do projeto, execute `npm start`.
4. Acesse `http://localhost:3001/loja`.
5. A administração do backend principal permanece em `http://localhost:3001/menu` após login de funcionário.

Não execute novamente o SQL de criação: ele contém comandos `DROP TABLE` e apagaria tabelas existentes.

## Observações

A verificação feita nesta entrega foi estática (sintaxe JavaScript e correspondência dos nomes de tabelas/colunas com o SQL fornecido). A conexão ao PostgreSQL não foi executada neste ambiente. O campo `imagem_url` do SQL de exemplo contém URLs ilustrativas `exemplo.com`; para imagens reais, use o upload de imagem na administração ou cadastre URLs válidas.

A pasta `Visão Adm/backend` é um servidor separado. Como você confirmou que inicia o servidor principal, as telas e rotas alteradas para operação são as de `backend/` e `frontend/` na raiz do projeto.


## Ajustes desta versão (24/11/2026)

- O pedido online passou a gravar em `public.pedidos` e `public.pedido_has_produto`, exatamente com os nomes de colunas do SQL original.
- O backend consulta o preço e o estoque diretamente em `public.produtos`; não confia no preço enviado pelo navegador. O estoque é atualizado na mesma transação.
- O valor do pedido inclui frete demonstrativo fixo de R$ 15,00 para CEP válido. A tabela original `pedidos` não possui uma coluna separada para frete, então o frete é somado ao `valor_total_pedido`; os valores separados de produtos e frete são exibidos na tela e mantidos no resumo de pagamento no navegador.
- O pagamento é registrado em `public.pagamentos`. Como o SQL original não cria uma tabela `forma_pagamento`, a tela usa opções locais (PIX, cartão, dinheiro e transferência) e grava os nomes selecionados no campo `forma_pagamento`. Dados de cartão não são enviados para armazenamento.
- Senhas novas são armazenadas com hash scrypt e sal aleatório. No primeiro login, senhas antigas em texto puro são migradas automaticamente para hash. O CRUD de pessoas não retorna nem altera senha.
- A recuperação de senha por código exige configurar SMTP no arquivo `backend/.env` usando as variáveis documentadas em `backend/.env.example`. Instale as dependências com `npm install` após receber esta pasta. Os códigos são temporários (10 minutos) e mantidos em memória do servidor.
- A consulta de CPF usa texto, não campo numérico, preservando zeros à esquerda.
- A página individual do produto está em `/visaoCliente/produto/produto.html?id=ID`.

**Importante:** a verificação disponível nesta sessão é estática (sintaxe dos arquivos JavaScript e teste isolado do hash de senha). Não foi possível testar o fluxo completo contra seu PostgreSQL ou enviar e-mail real, pois isso depende do banco, das credenciais SMTP e das dependências instaladas na sua máquina.
