# Ajustes desta versão

- Carrinho: removido o cabeçalho antigo CandyShop, o seletor Usuário/Sair, os links Sobre/Contato e o link duplicado de retorno.
- Loja: botão Minha conta agora abre uma página própria.
- Minha conta: consulta e edição dos dados pessoais, alteração de senha e saída da sessão; o acesso administrativo aparece para funcionários cadastrados.
- Backend: adicionadas rotas de consulta/atualização do perfil e corrigida a consulta de funcionários para usar os nomes de tabelas do projeto.
- CRUDs Produto, Pessoa, Cargo e Pedido: aplicado o tema rosa inspirado em Categorias & Catálogo e incluído botão de retorno ao menu quando faltava.

## Configuração local
O arquivo `backend/.env` não foi incluído nesta cópia para não distribuir credenciais locais. Copie `backend/.env.example` para `backend/.env` e preencha os dados do seu PostgreSQL.

## Observações de teste
Os arquivos JavaScript alterados passaram na verificação de sintaxe (`node --check`). Ainda é necessário testar as rotas com o PostgreSQL local, pois o banco e as credenciais da máquina não estão incluídos no ZIP.


## Ajustes no checkout (23/11/2026)
- Corrigida a leitura da sessão na página de conferência: a API já retorna `usuario` como objeto, então não deve ser passado por `JSON.parse` quando já é objeto.
- Após login iniciado pelo carrinho, clientes são encaminhados diretamente à conferência; usuários com acesso às duas áreas escolhem a área e, ao escolher Cliente, continuam o checkout.
- Removidos os links sem destino (Início, Sobre e Contato) do cabeçalho das páginas de conferência e pagamento.
- A conferência agora solicita CEP, consulta o endereço pelo ViaCEP e apresenta produtos, frete e total final.
- **Frete demonstrativo:** o valor está configurado em `FRETE_FIXO` no arquivo `frontend/visaoCliente/finalizar/finalizar.js` (R$ 15,00). Para cobrança real, substitua por tabela ou serviço de frete da loja.
- Após pagamento confirmado, o carrinho é limpo e o usuário retorna à loja.
