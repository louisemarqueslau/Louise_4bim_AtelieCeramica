let valorTotal = 0;
const moeda = v => Number(v || 0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
async function obterCpfUsuario(){
  const r=await fetch('/login/verificaSeUsuarioEstaLogado',{credentials:'include',cache:'no-store'});
  const d=await r.json(); if(d.status!=='ok') throw new Error('Faça login para continuar.');
  const u=typeof d.usuario==='string'?JSON.parse(d.usuario):d.usuario; return u?.cpf_pessoa;
}
function carregarFinalizar(){
  const tbody=document.getElementById('listaFinalizar'); let carrinho=[];
  try{carrinho=JSON.parse(localStorage.getItem('carrinho')||'[]')}catch{}
  tbody.replaceChildren(); valorTotal=0;
  if(!carrinho.length){tbody.innerHTML='<tr><td colspan="5">Seu carrinho está vazio. Volte e adicione itens.</td></tr>';document.getElementById('btn-finalizar').disabled=true;}
  else{
    carrinho.forEach(item=>{
      const preco=Number(item.preco)||0, quantidade=Number(item.quantidade)||0, subtotal=preco*quantidade; valorTotal+=subtotal;
      const tr=document.createElement('tr');
      [item.id??item.codigo??'—',item.nome||'Produto',moeda(preco),`${quantidade} un.`,moeda(subtotal)].forEach(txt=>{const td=document.createElement('td');td.textContent=txt;tr.appendChild(td)});
      tbody.appendChild(tr);
    });
    document.getElementById('btn-finalizar').disabled=false;
  }
  document.getElementById('valor-produtos').textContent=moeda(valorTotal);
  document.getElementById('total-final').textContent=moeda(valorTotal);
}
async function enviarDadosParaBD(){
  const carrinho=JSON.parse(localStorage.getItem('carrinho')||'[]');
  if(!carrinho.length){alert('Seu carrinho está vazio.');return;}
  let cpf; try{cpf=await obterCpfUsuario()}catch{alert('Faça login para continuar com a compra.');location.href='/login?redirect=finalizar';return;}
  const pedido={data_pedido:new Date().toISOString(),cliente_pessoa_cpf_pessoa:cpf,valor_produtos:valorTotal,valor_frete:0,itens:carrinho.map(i=>({id_produto:i.id||i.codigo,quantidade:Number(i.quantidade),preco_unitario:Number(i.preco)}))};
  const botao=document.getElementById('btn-finalizar');botao.disabled=true;
  try{
    const r=await fetch('/pedido/online',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify(pedido)});
    const d=await r.json();if(!r.ok)throw new Error(d.error||'Não foi possível criar o pedido.');
    const valorProdutos=Number(d.valor_produtos??valorTotal), total=Number(d.valor_total_pedido??valorProdutos);
    localStorage.setItem('dadosPagamento',JSON.stringify({id_pedido:d.id_pedido,valor_produtos:valorProdutos,valor_frete:0,valor_total:total}));
    location.href='/login/visaoclientepagamento';
  }catch(e){alert(e.message||'Ocorreu um erro ao finalizar o pedido.');botao.disabled=false;}
}
document.getElementById('btn-finalizar').addEventListener('click',enviarDadosParaBD);
carregarFinalizar();
