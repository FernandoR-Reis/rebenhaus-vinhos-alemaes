(function() {
  var STORAGE_KEY_PRODUCTS = 'rebenhaus_products_v1';
  var STORAGE_KEY_ADMIN_AUTH = 'rebenhaus_admin_auth_v1';
  var ADMIN_PASSWORD = 'rebenhaus@2026';
  var MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024;

  var defaultProducts = [
    {
      id: 'st-michael-riesling-nahe-2023',
      nome: 'St. Michael Riesling Nahe 2023',
      subtitulo: 'Nahe · Branco · Suave',
      descricao: 'Notas cítricas vibrantes, mineralidade elegante e final refrescante.',
      preco: 124.9,
      categoria: 'Branco',
      imagem: '',
      harmonizacao: 'Frutos do mar · Sushi · Peixe grelhado',
      destaque: 'Mais popular',
      estoque: 12,
      status: 'ativo',
      url: 'https://rebenhaus.com.br/produtos/riesling/'
    },
    {
      id: 'villa-wolf-pinot-noir-pfalz-2024',
      nome: 'Villa Wolf Pinot Noir Pfalz 2024',
      subtitulo: 'Pfalz · Tinto · Seco',
      descricao: 'Cereja fresca, framboesa e especiarias sutis. Taninos sedosos e corpo médio.',
      preco: 147.3,
      categoria: 'Tinto',
      imagem: '',
      harmonizacao: 'Churrasco · Pato · Queijos macios',
      destaque: 'Tinto elegante',
      estoque: 8,
      status: 'ativo',
      url: 'https://rebenhaus.com.br/produtos/vinho-tinto-villa-wolf-pinot-noir-seco-2024-11lvo/'
    },
    {
      id: 'st-michael-pinot-blanc-nahe-2021',
      nome: 'St. Michael Pinot Blanc Nahe 2021',
      subtitulo: 'Nahe · Branco · Semi-seco',
      descricao: 'Floral e elegante, com frescor perfeito para o clima tropical.',
      preco: 115.9,
      categoria: 'Branco',
      imagem: '',
      harmonizacao: 'Moqueca · Camarão · Saladas',
      destaque: 'Curadoria',
      estoque: 10,
      status: 'ativo',
      url: 'https://rebenhaus.com.br/produtos/vinho-branco-st-michael-pinot-blanc-nahe-2021/'
    },
    {
      id: 'villa-wolf-gewurztraminer-2024',
      nome: 'Villa Wolf Gewürztraminer 2024',
      subtitulo: 'Pfalz · Branco · Semi-seco',
      descricao: 'Aromático, lichia e rosa — um vinho que seduz antes mesmo do primeiro gole.',
      preco: 159.9,
      categoria: 'Branco',
      imagem: '',
      harmonizacao: 'Culinária asiática · Especiarias · Sobremesas',
      destaque: '5% OFF',
      estoque: 6,
      status: 'ativo',
      url: 'https://rebenhaus.com.br/produtos/vinho-branco-villa-wolf-gewuertztraminer-pfalz-semi-seco-2024-7wrks/'
    }
  ];

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatBRL(value) {
    var number = Number(value || 0);
    return number.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  function getStoredProducts() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY_PRODUCTS);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : null;
    } catch (error) {
      return null;
    }
  }

  function saveProducts(products) {
    localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(products));
  }

  function saveProductsSafely(products) {
    try {
      saveProducts(products);
      return true;
    } catch (error) {
      window.alert('Não foi possível salvar. Reduza o tamanho da imagem ou use uma URL externa.');
      return false;
    }
  }

  function seedProductsIfNeeded() {
    if (!getStoredProducts()) {
      saveProducts(defaultProducts);
    }
  }

  function getProducts() {
    return getStoredProducts() || defaultProducts;
  }

  function isAdminRoute() {
    var path = window.location.pathname.replace(/\/+$/, '').toLowerCase();
    var hash = (window.location.hash || '').toLowerCase();
    return (
      path.endsWith('/admin') ||
      path.endsWith('/dashboard-produtos') ||
      hash === '#/admin' ||
      hash === '#/dashboard-produtos'
    );
  }

  function buildProductCard(product, index) {
    var preco = Number(product.preco || 0);
    var precoPix = preco * 0.97;
    var estoque = Number(product.estoque || 0);
    var imageMarkup = product.imagem
      ? '<img src="' + escapeHtml(product.imagem) + '" alt="' + escapeHtml(product.nome) + '" loading="lazy" style="width:100%;height:100%;object-fit:cover;display:block;">'
      : '<div class="product-img-placeholder"><div class="css-bottle"><div class="css-bottle-neck"></div><div class="css-bottle-shoulder"></div><div class="css-bottle-body"></div></div></div>';

    var badgeClass = /popular|curadoria/i.test(product.destaque || '') ? ' gold' : '';

    return [
      '<a href="' + escapeHtml(product.url || '#') + '" class="product-card" data-anim data-anim-delay="' + String(index + 1) + '">',
      '  <div class="product-img-wrap">',
      '    ' + imageMarkup,
      product.destaque ? '    <div class="product-badge' + badgeClass + '">' + escapeHtml(product.destaque) + '</div>' : '',
      '    <div class="product-hover-cta">Adicionar ao carrinho</div>',
      '  </div>',
      '  <div class="product-info">',
      '    <span class="product-region">' + escapeHtml(product.subtitulo || product.categoria || '') + '</span>',
      '    <h3 class="product-name">' + escapeHtml(product.nome) + '</h3>',
      '    <p class="product-notes">' + escapeHtml(product.descricao || '') + '</p>',
      '    <div class="product-pairing">',
      '      <span class="pairing-label">Harmoniza:</span>',
      '      <span>' + escapeHtml(product.harmonizacao || '-') + '</span>',
      '    </div>',
      '    <div class="product-footer">',
      '      <div>',
      '        <span class="product-price">' + escapeHtml(formatBRL(preco)) + '</span>',
      '        <span class="product-price-pix">' + escapeHtml(formatBRL(precoPix)) + ' no Pix</span>',
      '      </div>',
      estoque > 0
        ? '      <button class="btn-add" aria-label="Adicionar ao carrinho">+</button>'
        : '      <button class="btn-add" aria-label="Sem estoque" disabled>•</button>',
      '    </div>',
      '  </div>',
      '</a>'
    ].join('\n');
  }

  function renderPublicProducts() {
    var grid = document.getElementById('productsGrid');
    if (!grid) return;

    var products = getProducts().filter(function(product) {
      return String(product.status || '').toLowerCase() === 'ativo';
    });

    grid.innerHTML = products.map(buildProductCard).join('\n');
  }

  function renderAdminPage() {
    document.body.innerHTML = [
      '<main style="min-height:100vh;background:#0d0f0d;color:#f7f3ec;font-family:Jost,Arial,sans-serif;padding:32px 20px;">',
      '  <div style="max-width:1120px;margin:0 auto;">',
      '    <div style="display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap;margin-bottom:24px;">',
      '      <h1 style="margin:0;font-family:Cormorant Garamond,serif;font-size:42px;font-weight:500;">Dashboard de Produtos</h1>',
      '      <button id="adminLogoutBtn" style="border:1px solid rgba(247,243,236,.35);background:transparent;color:#f7f3ec;padding:10px 14px;border-radius:10px;cursor:pointer;">Sair</button>',
      '    </div>',
      '    <div id="adminLogin" style="display:none;max-width:420px;background:#131713;border:1px solid rgba(184,145,58,.4);border-radius:16px;padding:24px;">',
      '      <h2 style="margin:0 0 8px;font-size:28px;font-family:Cormorant Garamond,serif;">Acesso restrito</h2>',
      '      <p style="margin:0 0 18px;opacity:.85;">Digite a senha para administrar a vitrine.</p>',
      '      <form id="adminLoginForm">',
      '        <input id="adminPassword" type="password" placeholder="Senha" required style="width:100%;padding:12px;border-radius:10px;border:1px solid #303530;background:#0f120f;color:#f7f3ec;margin-bottom:12px;">',
      '        <button type="submit" style="width:100%;padding:12px;border:none;border-radius:10px;background:#b8913a;color:#101010;font-weight:600;cursor:pointer;">Entrar</button>',
      '      </form>',
      '      <p id="adminLoginError" style="display:none;color:#ff8080;margin:10px 0 0;">Senha inválida.</p>',
      '    </div>',
      '    <div id="adminApp" style="display:none;">',
      '      <div style="display:grid;grid-template-columns:minmax(300px,1fr) minmax(420px,1.4fr);gap:18px;align-items:start;">',
      '        <section style="background:#131713;border:1px solid rgba(184,145,58,.4);border-radius:16px;padding:18px;">',
      '          <h2 style="margin:0 0 14px;font-family:Cormorant Garamond,serif;font-size:30px;">Adicionar / editar</h2>',
      '          <form id="productForm" style="display:grid;gap:10px;">',
      '            <input type="hidden" id="productId">',
      '            <input id="productNome" required placeholder="Nome" style="padding:10px;border-radius:10px;border:1px solid #303530;background:#0f120f;color:#f7f3ec;">',
      '            <input id="productSubtitulo" required placeholder="Subtítulo" style="padding:10px;border-radius:10px;border:1px solid #303530;background:#0f120f;color:#f7f3ec;">',
      '            <textarea id="productDescricao" required placeholder="Descrição" rows="3" style="padding:10px;border-radius:10px;border:1px solid #303530;background:#0f120f;color:#f7f3ec;resize:vertical;"></textarea>',
      '            <input id="productPreco" required type="number" min="0" step="0.01" placeholder="Preço" style="padding:10px;border-radius:10px;border:1px solid #303530;background:#0f120f;color:#f7f3ec;">',
      '            <input id="productCategoria" required placeholder="Categoria" style="padding:10px;border-radius:10px;border:1px solid #303530;background:#0f120f;color:#f7f3ec;">',
      '            <input id="productImagem" placeholder="URL da imagem" style="padding:10px;border-radius:10px;border:1px solid #303530;background:#0f120f;color:#f7f3ec;">',
      '            <input id="productImagemFile" type="file" accept="image/*" style="padding:8px;border-radius:10px;border:1px dashed #434b43;background:#0f120f;color:#f7f3ec;">',
      '            <input id="productHarmonizacao" placeholder="Harmonização" style="padding:10px;border-radius:10px;border:1px solid #303530;background:#0f120f;color:#f7f3ec;">',
      '            <input id="productDestaque" placeholder="Destaque (badge)" style="padding:10px;border-radius:10px;border:1px solid #303530;background:#0f120f;color:#f7f3ec;">',
      '            <input id="productEstoque" required type="number" min="0" step="1" placeholder="Estoque" style="padding:10px;border-radius:10px;border:1px solid #303530;background:#0f120f;color:#f7f3ec;">',
      '            <select id="productStatus" style="padding:10px;border-radius:10px;border:1px solid #303530;background:#0f120f;color:#f7f3ec;">',
      '              <option value="ativo">Ativo</option>',
      '              <option value="inativo">Inativo</option>',
      '            </select>',
      '            <div style="display:flex;gap:10px;">',
      '              <button type="submit" style="flex:1;padding:12px;border:none;border-radius:10px;background:#b8913a;color:#101010;font-weight:600;cursor:pointer;">Salvar</button>',
      '              <button id="cancelEditBtn" type="button" style="padding:12px 14px;border:1px solid rgba(247,243,236,.35);border-radius:10px;background:transparent;color:#f7f3ec;cursor:pointer;">Limpar</button>',
      '            </div>',
      '          </form>',
      '        </section>',
      '        <section style="background:#131713;border:1px solid rgba(184,145,58,.4);border-radius:16px;padding:18px;">',
      '          <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:12px;">',
      '            <h2 style="margin:0;font-family:Cormorant Garamond,serif;font-size:30px;">Produtos cadastrados</h2>',
      '            <a href="/" style="text-decoration:none;color:#f7f3ec;border:1px solid rgba(247,243,236,.35);padding:8px 12px;border-radius:10px;">Abrir vitrine</a>',
      '          </div>',
      '          <div id="productsAdminList" style="display:grid;gap:10px;"></div>',
      '        </section>',
      '      </div>',
      '    </div>',
      '  </div>',
      '</main>'
    ].join('');

    var loginEl = document.getElementById('adminLogin');
    var appEl = document.getElementById('adminApp');
    var loginErrorEl = document.getElementById('adminLoginError');
    var listEl = document.getElementById('productsAdminList');
    var formEl = document.getElementById('productForm');
    var idEl = document.getElementById('productId');
    var nomeEl = document.getElementById('productNome');
    var subtituloEl = document.getElementById('productSubtitulo');
    var descricaoEl = document.getElementById('productDescricao');
    var precoEl = document.getElementById('productPreco');
    var categoriaEl = document.getElementById('productCategoria');
    var imagemEl = document.getElementById('productImagem');
    var imagemFileEl = document.getElementById('productImagemFile');
    var harmonizacaoEl = document.getElementById('productHarmonizacao');
    var destaqueEl = document.getElementById('productDestaque');
    var estoqueEl = document.getElementById('productEstoque');
    var statusEl = document.getElementById('productStatus');
    var cancelEditBtn = document.getElementById('cancelEditBtn');
    var logoutBtn = document.getElementById('adminLogoutBtn');
    var uploadedImageData = '';

    function isAuthenticated() {
      return sessionStorage.getItem(STORAGE_KEY_ADMIN_AUTH) === '1';
    }

    function setAuthenticated(value) {
      if (value) {
        sessionStorage.setItem(STORAGE_KEY_ADMIN_AUTH, '1');
      } else {
        sessionStorage.removeItem(STORAGE_KEY_ADMIN_AUTH);
      }
    }

    function resetForm() {
      idEl.value = '';
      formEl.reset();
      statusEl.value = 'ativo';
      uploadedImageData = '';
    }

    function safeParseNumber(value, fallback) {
      var number = Number(value);
      return Number.isFinite(number) ? number : fallback;
    }

    function renderList() {
      var products = getProducts();
      if (!products.length) {
        listEl.innerHTML = '<div style="opacity:.8;padding:14px;border:1px dashed #394239;border-radius:10px;">Nenhum produto cadastrado.</div>';
        return;
      }

      listEl.innerHTML = products.map(function(product) {
        var statusText = String(product.status || '').toLowerCase() === 'ativo' ? 'Ativo' : 'Inativo';
        return [
          '<article style="border:1px solid #2b312b;border-radius:12px;padding:12px;background:#0f120f;">',
          '  <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;">',
          '    <div>',
          '      <strong style="font-size:16px;display:block;">' + escapeHtml(product.nome) + '</strong>',
          '      <span style="font-size:13px;opacity:.8;">' + escapeHtml(product.subtitulo || product.categoria || '') + '</span>',
          '      <div style="font-size:13px;opacity:.8;margin-top:4px;">Preço: ' + escapeHtml(formatBRL(product.preco)) + ' · Estoque: ' + escapeHtml(product.estoque) + ' · ' + statusText + '</div>',
          '    </div>',
          '    <div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end;">',
          '      <button data-action="edit" data-id="' + escapeHtml(product.id) + '" style="border:none;background:#b8913a;color:#101010;padding:8px 10px;border-radius:8px;cursor:pointer;">Editar</button>',
          '      <button data-action="toggle" data-id="' + escapeHtml(product.id) + '" style="border:1px solid #485148;background:transparent;color:#f7f3ec;padding:8px 10px;border-radius:8px;cursor:pointer;">' + (statusText === 'Ativo' ? 'Desativar' : 'Ativar') + '</button>',
          '      <button data-action="remove" data-id="' + escapeHtml(product.id) + '" style="border:1px solid #5f2f2f;background:transparent;color:#ffb3b3;padding:8px 10px;border-radius:8px;cursor:pointer;">Remover</button>',
          '    </div>',
          '  </div>',
          '</article>'
        ].join('');
      }).join('');
    }

    function showApp() {
      loginEl.style.display = 'none';
      appEl.style.display = 'block';
      renderList();
      resetForm();
    }

    function showLogin() {
      appEl.style.display = 'none';
      loginEl.style.display = 'block';
    }

    document.getElementById('adminLoginForm').addEventListener('submit', function(event) {
      event.preventDefault();
      var typedPassword = document.getElementById('adminPassword').value;
      if (typedPassword === ADMIN_PASSWORD) {
        setAuthenticated(true);
        loginErrorEl.style.display = 'none';
        showApp();
      } else {
        loginErrorEl.style.display = 'block';
      }
    });

    logoutBtn.addEventListener('click', function() {
      setAuthenticated(false);
      showLogin();
    });

    cancelEditBtn.addEventListener('click', function() {
      resetForm();
    });

    imagemFileEl.addEventListener('change', function() {
      var file = imagemFileEl.files && imagemFileEl.files[0];
      if (!file) {
        uploadedImageData = '';
        return;
      }
      if (!file.type || file.type.indexOf('image/') !== 0) {
        uploadedImageData = '';
        return;
      }
      if (file.size > MAX_IMAGE_SIZE_BYTES) {
        uploadedImageData = '';
        imagemFileEl.value = '';
        window.alert('Imagem muito grande. Limite: 2MB.');
        return;
      }

      var reader = new FileReader();
      reader.onload = function(e) {
        uploadedImageData = e.target && e.target.result ? String(e.target.result) : '';
      };
      reader.readAsDataURL(file);
    });

    formEl.addEventListener('submit', function(event) {
      event.preventDefault();

      var products = getProducts();
      var existing = products.find(function(product) {
        return product.id === idEl.value;
      });

      var nextProduct = {
        id: idEl.value || ('produto-' + Date.now()),
        nome: nomeEl.value.trim(),
        subtitulo: subtituloEl.value.trim(),
        descricao: descricaoEl.value.trim(),
        preco: safeParseNumber(precoEl.value, 0),
        categoria: categoriaEl.value.trim(),
        imagem: uploadedImageData || imagemEl.value.trim() || (existing ? existing.imagem : ''),
        harmonizacao: harmonizacaoEl.value.trim(),
        destaque: destaqueEl.value.trim(),
        estoque: Math.max(0, parseInt(estoqueEl.value, 10) || 0),
        status: statusEl.value === 'inativo' ? 'inativo' : 'ativo',
        url: existing ? existing.url : '#'
      };

      var updatedProducts = existing
        ? products.map(function(product) {
            return product.id === nextProduct.id ? nextProduct : product;
          })
        : [nextProduct].concat(products);

      if (!saveProductsSafely(updatedProducts)) return;
      renderList();
      resetForm();
    });

    listEl.addEventListener('click', function(event) {
      var button = event.target.closest('button[data-action]');
      if (!button) return;

      var action = button.getAttribute('data-action');
      var productId = button.getAttribute('data-id');
      var products = getProducts();
      var targetProduct = products.find(function(product) { return product.id === productId; });
      if (!targetProduct) return;

      if (action === 'remove') {
        var nextProducts = products.filter(function(product) { return product.id !== productId; });
        if (!saveProductsSafely(nextProducts)) return;
        renderList();
        if (idEl.value === productId) resetForm();
        return;
      }

      if (action === 'toggle') {
        var toggledProducts = products.map(function(product) {
          if (product.id !== productId) return product;
          return Object.assign({}, product, { status: product.status === 'ativo' ? 'inativo' : 'ativo' });
        });
        if (!saveProductsSafely(toggledProducts)) return;
        renderList();
        return;
      }

      if (action === 'edit') {
        idEl.value = targetProduct.id;
        nomeEl.value = targetProduct.nome || '';
        subtituloEl.value = targetProduct.subtitulo || '';
        descricaoEl.value = targetProduct.descricao || '';
        precoEl.value = Number(targetProduct.preco || 0);
        categoriaEl.value = targetProduct.categoria || '';
        imagemEl.value = targetProduct.imagem || '';
        harmonizacaoEl.value = targetProduct.harmonizacao || '';
        destaqueEl.value = targetProduct.destaque || '';
        estoqueEl.value = Number(targetProduct.estoque || 0);
        statusEl.value = targetProduct.status === 'inativo' ? 'inativo' : 'ativo';
        uploadedImageData = '';
      }
    });

    if (isAuthenticated()) {
      showApp();
    } else {
      showLogin();
    }
  }

  seedProductsIfNeeded();

  if (isAdminRoute()) {
    renderAdminPage();
    return;
  }

  renderPublicProducts();

  window.addEventListener('storage', function(event) {
    if (event.key === STORAGE_KEY_PRODUCTS) {
      renderPublicProducts();
    }
  });

  var nav = document.getElementById('mainNav');
  if (nav) {
    window.addEventListener('scroll', function() {
      nav.classList.toggle('scrolled', window.scrollY > 40);
    });
  }

  var animEls = document.querySelectorAll('[data-anim]');
  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    animEls.forEach(function(el) { observer.observe(el); });
  } else {
    animEls.forEach(function(el) { el.classList.add('visible'); });
  }

  var ageGate = document.getElementById('ageGate');
  var ageYesBtn = document.getElementById('ageYesBtn');
  var ageNoBtn = document.getElementById('ageNoBtn');

  if (sessionStorage.getItem('age_verified') && ageGate) {
    ageGate.style.display = 'none';
  }

  if (ageYesBtn && ageGate) {
    ageYesBtn.addEventListener('click', function() {
      sessionStorage.setItem('age_verified', '1');
      ageGate.style.display = 'none';
    });
  }

  if (ageNoBtn) {
    ageNoBtn.addEventListener('click', function() {
      window.location.href = 'https://google.com';
    });
  }
})();
