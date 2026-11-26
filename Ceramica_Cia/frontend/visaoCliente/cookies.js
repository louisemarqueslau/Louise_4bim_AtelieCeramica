(() => {
  const chave = 'preferenciaCookies';
  if (localStorage.getItem(chave)) return;
  const estilo = document.createElement('style');
  estilo.textContent = `
    .cc-cookies{position:fixed;z-index:9999;left:18px;right:18px;bottom:18px;max-width:850px;margin:auto;
      display:flex;align-items:center;gap:14px;padding:18px 20px;background:#fff;border:2px solid #fec5bb;
      border-radius:20px;box-shadow:0 12px 35px #84435324;color:#6b4d57;font:500 14px 'Quicksand',sans-serif}
    .cc-cookies p{flex:1;margin:0;line-height:1.5}.cc-cookies strong{color:#844353}
    .cc-cookies button{border:0;border-radius:12px;padding:11px 17px;background:#844353;color:#fff;font:700 13px 'Quicksand',sans-serif;cursor:pointer}
    .cc-cookies button.cc-recusar{background:#fcd5ce;color:#844353}
    @media(max-width:620px){.cc-cookies{flex-wrap:wrap}.cc-cookies p{flex-basis:100%}.cc-cookies button{flex:1}}
  `;
  document.head.appendChild(estilo);
  const caixa = document.createElement('aside');
  caixa.className = 'cc-cookies';
  caixa.setAttribute('role','dialog');
  caixa.setAttribute('aria-label','Preferências de cookies');
  caixa.innerHTML = `<p><strong>Sua experiência importa!</strong><br>Usamos cookies essenciais para o funcionamento da loja e para lembrar suas preferências. Você pode aceitar ou recusar cookies não essenciais.</p>
    <button type="button" data-escolha="aceitos">Aceitar</button><button type="button" class="cc-recusar" data-escolha="recusados">Recusar</button>`;
  caixa.addEventListener('click', e => {
    const botao = e.target.closest('button[data-escolha]');
    if (!botao) return;
    localStorage.setItem(chave, botao.dataset.escolha);
    caixa.remove();
  });
  document.body.appendChild(caixa);
})();
