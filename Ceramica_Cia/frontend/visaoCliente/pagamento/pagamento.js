document.addEventListener('DOMContentLoaded', async () => {
  const dados=JSON.parse(localStorage.getItem('dadosPagamento')||'null');
  const idPedido=dados?.id_pedido;
  const valorProdutos=Number(dados?.valor_produtos??dados?.valor_total??0);
  const valorTotal=Number(dados?.valor_total??valorProdutos);
  const moeda=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  document.getElementById('valor-produtos-pagamento').textContent=moeda(valorProdutos);
  document.getElementById('valor-total').textContent=moeda(valorTotal);
  const select=document.getElementById('forma-pagamento');
  const detalhes=document.getElementById('detalhes-pagamento');
  const form=document.getElementById('form-pagamento');
  const botao=document.getElementById('btn-finalizar');
  if(!idPedido||valorTotal<=0){alert('Não encontramos os dados deste pedido. Volte ao carrinho e tente novamente.');botao.disabled=true;return;}
  const fallback=[['pix','PIX'],['cartao','Cartão'],['boleto','Boleto']];
  try{
    const r=await fetch('/forma_pagamento/');
    if(!r.ok)throw Error('API indisponível');
    const lista=await r.json();
    if (!Array.isArray(lista) || !lista.length) throw Error('Nenhuma forma cadastrada');
    lista.forEach(f=>{const nome=f.nome_forma_pagamento??f.nome_pagamento??f.nome??'';if(!nome)return;const op=document.createElement('option');op.value=String(nome);op.textContent=String(nome);op.dataset.tipo=String(nome).toLowerCase();select.append(op)});
  }catch{
    fallback.forEach(([v,n])=>{const op=document.createElement('option');op.value=v;op.textContent=n;select.append(op)});
  }
  select.addEventListener('change',()=>{
    const texto=(select.selectedOptions[0]?.textContent||'').toLowerCase();
    if(texto.includes('pix'))detalhes.innerHTML='<p>Após confirmar, o pedido ficará registrado como pago no sistema. O QR Code real depende da integração com um provedor de pagamentos.</p>';
    else if(texto.includes('cart'))detalhes.innerHTML='<p>Pagamento por cartão selecionado. Esta versão acadêmica registra a forma escolhida, mas não processa dados bancários nem cobra o cartão.</p>';
    else if(texto.includes('boleto'))detalhes.innerHTML='<p>Pagamento por boleto selecionado. A emissão bancária real depende de integração com um provedor de pagamentos.</p>';
    else detalhes.textContent='';
  });
  form.addEventListener('submit',async e=>{
    e.preventDefault();if(!select.value){alert('Selecione uma forma de pagamento.');return;}
    const tipo=select.value;botao.disabled=true;botao.textContent='Registrando pagamento...';
    try{
      const r=await fetch(`/pagamento/${idPedido}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({idPedido,valorTotal,formasPagamento:[{tipo,valor:valorTotal}]})});
      const d=await r.json();if(!r.ok)throw Error(d.error||'Não foi possível registrar o pagamento.');
      localStorage.removeItem('carrinho');localStorage.removeItem('dadosPagamento');alert('Pagamento registrado com sucesso!');location.href='/loja';
    }catch(err){alert(err.message);botao.disabled=false;botao.textContent='Confirmar pagamento';}
  });
});
