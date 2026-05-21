(function() {
  // v2 isolates the current boutique collection schema from older local data used before the dedicated /produtos and /admin pages.
  var STORAGE_KEY_PRODUCTS = 'rebenhaus_products_v2';
  var STORAGE_KEY_ADMIN_AUTH = 'rebenhaus_admin_auth_v1';
  var ADMIN_PASSWORD = '0812';
  var MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024;
  var WHATSAPP_NUMBER = '5512974019009';
  var GOLD_BADGE_PATTERN = /popular|curadoria|editorial/i;
  var currentPage = document.body ? (document.body.getAttribute('data-page') || 'home') : 'home';
  var currentDepth = document.body ? Math.max(0, parseInt(document.body.getAttribute('data-depth'), 10) || 0) : 0;
  var basePrefix = currentDepth ? new Array(currentDepth + 1).join('../') : './';
  var routeMap = {
    home: '',
    produtos: 'produtos/',
    sobre: 'sobre/',
    experiencia: 'experiencia/',
    contato: 'contato/',
    admin: 'admin/'
  };
  var MOBILE_READ_MORE_SELECTORS = [
    '.hero-sub',
    '.section-desc',
    '.why-text',
    '.line-desc',
    '.story-text',
    '.testimonial-text',
    '.cta-sub',
    '.newsletter-sub',
    '.page-hero-subtitle',
    '.editorial-note p',
    '.products-institutional-card p',
    '.product-notes'
  ];
  var MOBILE_READ_MORE_MIN_WORD_BOUNDARY = 40;
  var defaultProducts = Array.isArray(window.REBENHAUS_DEFAULT_PRODUCTS)
    ? window.REBENHAUS_DEFAULT_PRODUCTS.map(normalizeProduct)
    : [];
  var productsPageController = null;

  function normalizeProduct(product) {
    var normalized = product || {};
    var status = String(normalized.status || '').toLowerCase() === 'inativo' ? 'inativo' : 'ativo';
    return {
      id: String(normalized.id || ''),
      nome: String(normalized.nome || ''),
      subtitulo: String(normalized.subtitulo || ''),
      descricao: String(normalized.descricao || ''),
      categoria: String(normalized.categoria || ''),
      harmonizacao: String(normalized.harmonizacao || ''),
      preco: Number(normalized.preco || 0),
      imagem: String(normalized.imagem || ''),
      destaque: String(normalized.destaque || ''),
      estoque: Math.max(0, parseInt(normalized.estoque, 10) || 0),
      status: status
    };
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatBRL(value) {
    return Number(value || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  }

  function getRouteHref(routeName) {
    if (!routeMap[routeName]) return '#';
    return basePrefix + routeMap[routeName];
  }

  function buildWhatsAppLink(message) {
    return 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(message);
  }

  function applyInternalLinks() {
    var routeLinks = document.querySelectorAll('[data-route]');
    Array.prototype.forEach.call(routeLinks, function(link) {
      var routeName = link.getAttribute('data-route');
      if (!routeName) return;
      link.setAttribute('href', getRouteHref(routeName));
      if (routeName === currentPage) {
        link.classList.add('is-active');
      }
    });

    var productLinks = document.querySelectorAll('[data-products-category]');
    Array.prototype.forEach.call(productLinks, function(link) {
      var category = link.getAttribute('data-products-category');
      var href = getRouteHref('produtos');
      if (category) {
        href += '?categoria=' + encodeURIComponent(category);
      }
      link.setAttribute('href', href);
    });

    var whatsappLinks = document.querySelectorAll('[data-whatsapp-message]');
    Array.prototype.forEach.call(whatsappLinks, function(link) {
      link.setAttribute('href', buildWhatsAppLink(link.getAttribute('data-whatsapp-message') || 'Olá, gostaria de falar com um especialista da Rebenhaus.'));
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');
    });
  }

  function getStoredProducts() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY_PRODUCTS);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.map(normalizeProduct) : null;
    } catch (error) {
      return null;
    }
  }

  function saveProducts(products) {
    localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(products.map(normalizeProduct)));
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
    if (!getStoredProducts() && defaultProducts.length) {
      saveProducts(defaultProducts);
    }
  }

  function getProducts() {
    return getStoredProducts() || defaultProducts;
  }

  function getActiveProducts() {
    return getProducts().filter(function(product) {
      return product.status === 'ativo';
    });
  }

  function sortProducts(products) {
    return products.slice().sort(function(a, b) {
      var aFeatured = a.destaque ? 1 : 0;
      var bFeatured = b.destaque ? 1 : 0;
      if (aFeatured !== bFeatured) return bFeatured - aFeatured;
      return a.nome.localeCompare(b.nome, 'pt-BR');
    });
  }

  function generateProductId(products) {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
      var uuid = 'produto-' + window.crypto.randomUUID();
      if (!products.some(function(product) { return product.id === uuid; })) return uuid;
    }

    var id = '';
    do {
      id = 'produto-' + Date.now() + '-' + Math.floor(Math.random() * 1000000000);
    } while (products.some(function(product) { return product.id === id; }));
    return id;
  }

  function buildProductCard(product, index) {
    var price = Number(product.preco || 0);
    var stock = Number(product.estoque || 0);
    var badgeClass = GOLD_BADGE_PATTERN.test(product.destaque || '') ? ' gold' : '';
    var whatsappMessage = 'Olá, gostaria de receber detalhes sobre o rótulo ' + product.nome + '.';
    var imageMarkup = product.imagem
      ? '<img src="' + escapeHtml(product.imagem) + '" alt="' + escapeHtml(product.nome) + '" loading="lazy" class="product-photo">'
      : '<div class="product-img-placeholder"><div class="css-bottle"><div class="css-bottle-neck"></div><div class="css-bottle-shoulder"></div><div class="css-bottle-body"></div></div></div>';

    return [
      '<article class="product-card" data-anim data-anim-delay="' + String((index % 4) + 1) + '">',
      '  <div class="product-img-wrap">',
      '    ' + imageMarkup,
      product.destaque ? '    <div class="product-badge' + badgeClass + '">' + escapeHtml(product.destaque) + '</div>' : '',
      '    <div class="product-hover-cta">Curadoria boutique</div>',
      '  </div>',
      '  <div class="product-info">',
      '    <div class="product-meta-row">',
      '      <span class="product-region">' + escapeHtml(product.categoria || 'Seleção') + '</span>',
      stock > 0 ? '      <span class="product-stock">Estoque ' + escapeHtml(String(stock)) + '</span>' : '      <span class="product-stock is-muted">Sob consulta</span>',
      '    </div>',
      '    <p class="product-subtitle">' + escapeHtml(product.subtitulo || '') + '</p>',
      '    <h3 class="product-name">' + escapeHtml(product.nome) + '</h3>',
      '    <p class="product-notes">' + escapeHtml(product.descricao || '') + '</p>',
      '    <div class="product-pairing">',
      '      <span class="pairing-label">Harmonização</span>',
      '      <span>' + escapeHtml(product.harmonizacao || '-') + '</span>',
      '    </div>',
      '    <div class="product-footer">',
      '      <div>',
      '        <span class="product-price">' + escapeHtml(formatBRL(price)) + '</span>',
      '        <span class="product-price-pix">Condição especial para atendimento consultivo</span>',
      '      </div>',
      '      <a class="btn-collection" href="' + escapeHtml(buildWhatsAppLink(whatsappMessage)) + '" target="_blank" rel="noopener noreferrer">Solicitar rótulo</a>',
      '    </div>',
      '  </div>',
      '</article>'
    ].join('\n');
  }

  function renderHomeProducts() {
    var grid = document.getElementById('productsGrid');
    if (!grid) return;

    var featuredLimit = window.matchMedia('(max-width: 768px)').matches ? 2 : 4;
    var featuredProducts = sortProducts(getActiveProducts()).slice(0, featuredLimit);
    grid.innerHTML = featuredProducts.map(buildProductCard).join('\n');
    applyMobileReadMore(document);
  }

  function createProductsPageController() {
    var grid = document.getElementById('productsPageGrid');
    if (!grid) return null;

    var chips = document.getElementById('productsCategoryFilters');
    var search = document.getElementById('productsSearch');
    var availability = document.getElementById('productsAvailability');
    var featuredOnly = document.getElementById('productsFeatured');
    var resultCount = document.getElementById('productsResultCount');
    var resultLabel = document.getElementById('productsResultLabel');
    var emptyState = document.getElementById('productsEmpty');
    var initialCategory = new URLSearchParams(window.location.search).get('categoria') || 'Todos';
    var state = {
      category: initialCategory,
      search: '',
      availability: 'todos',
      featuredOnly: false
    };

    function getCategories(products) {
      var map = {};
      products.forEach(function(product) {
        if (product.categoria) {
          map[product.categoria] = true;
        }
      });
      return ['Todos'].concat(Object.keys(map).sort(function(a, b) {
        return a.localeCompare(b, 'pt-BR');
      }));
    }

    function renderCategoryFilters(products) {
      var categories = getCategories(products);
      if (categories.indexOf(state.category) === -1) {
        state.category = 'Todos';
      }

      chips.innerHTML = categories.map(function(category) {
        return '<button type="button" class="filter-chip' + (category === state.category ? ' is-active' : '') + '" data-category="' + escapeHtml(category) + '">' + escapeHtml(category) + '</button>';
      }).join('');
    }

    function getFilteredProducts() {
      return sortProducts(getActiveProducts()).filter(function(product) {
        var matchesCategory = state.category === 'Todos' || product.categoria === state.category;
        var matchesSearch = !state.search || (product.nome + ' ' + product.subtitulo + ' ' + product.descricao + ' ' + product.harmonizacao).toLowerCase().indexOf(state.search) !== -1;
        var matchesAvailability = state.availability === 'todos' || (state.availability === 'pronta-entrega' ? product.estoque > 0 : product.estoque === 0);
        var matchesFeatured = !state.featuredOnly || Boolean(product.destaque);
        return matchesCategory && matchesSearch && matchesAvailability && matchesFeatured;
      });
    }

    function syncQuery() {
      var url = new URL(window.location.href);
      if (state.category && state.category !== 'Todos') {
        url.searchParams.set('categoria', state.category);
      } else {
        url.searchParams.delete('categoria');
      }
      window.history.replaceState({}, '', url.toString());
    }

    function render() {
      var activeProducts = getActiveProducts();
      var filteredProducts = getFilteredProducts();
      renderCategoryFilters(activeProducts);
      resultCount.textContent = String(filteredProducts.length);
      resultLabel.textContent = filteredProducts.length === 1 ? 'rótulo disponível na coleção' : 'rótulos disponíveis na coleção';
      grid.innerHTML = filteredProducts.map(buildProductCard).join('\n');
      emptyState.hidden = filteredProducts.length > 0;
      syncQuery();
      applyRevealAnimations();
      applyMobileReadMore(document);
    }

    chips.addEventListener('click', function(event) {
      var button = event.target.closest('button[data-category]');
      if (!button) return;
      state.category = button.getAttribute('data-category') || 'Todos';
      render();
    });

    if (search) {
      search.addEventListener('input', function() {
        state.search = String(search.value || '').trim().toLowerCase();
        render();
      });
    }

    if (availability) {
      availability.addEventListener('change', function() {
        state.availability = availability.value || 'todos';
        render();
      });
    }

    if (featuredOnly) {
      featuredOnly.addEventListener('change', function() {
        state.featuredOnly = Boolean(featuredOnly.checked);
        render();
      });
    }

    return {
      render: render
    };
  }

  function renderProductsPage() {
    if (!productsPageController) {
      productsPageController = createProductsPageController();
    }
    if (productsPageController) {
      productsPageController.render();
    }
  }

  function renderAdminPage() {
    var mount = document.getElementById('adminRoot');
    if (!mount) return;

    mount.innerHTML = [
      '<main class="admin-shell">',
      '  <div class="admin-header">',
      '    <div>',
      '      <span class="section-label">Área reservada</span>',
      '      <h1 class="admin-title">Dashboard de Produtos</h1>',
      '      <p class="admin-subtitle">Gerencie a coleção exibida em <strong>/produtos</strong> com persistência local e atualização automática.</p>',
      '    </div>',
      '    <div class="admin-actions-top">',
      '      <a class="admin-link" href="' + escapeHtml(getRouteHref('produtos')) + '">Abrir vitrine</a>',
      '      <button id="adminLogoutBtn" type="button" class="admin-button admin-button-secondary">Sair</button>',
      '    </div>',
      '  </div>',
      '  <section id="adminLogin" class="admin-login" style="display:none;">',
      '    <h2>Acesso oculto</h2>',
      '    <p>Digite a senha para administrar a coleção boutique.</p>',
      '    <form id="adminLoginForm" class="admin-login-form">',
      '      <input id="adminPassword" type="password" class="admin-input" placeholder="Senha" required>',
      '      <button type="submit" class="admin-button">Entrar</button>',
      '    </form>',
      '    <p id="adminLoginError" class="admin-login-error" style="display:none;">Senha inválida.</p>',
      '  </section>',
      '  <div id="adminApp" style="display:none;">',
      '    <div class="admin-grid">',
      '      <section class="admin-panel">',
      '        <div class="admin-panel-header">',
      '          <h2>Adicionar / editar</h2>',
      '          <button id="adminNewProductBtn" type="button" class="admin-button admin-button-secondary">Adicionar produto</button>',
      '        </div>',
      '        <form id="productForm" class="admin-form-grid">',
      '          <input type="hidden" id="productId">',
      '          <label class="admin-field"><span>Nome</span><input id="productNome" class="admin-input" required></label>',
      '          <label class="admin-field"><span>Subtítulo</span><input id="productSubtitulo" class="admin-input" required></label>',
      '          <label class="admin-field admin-field-full"><span>Descrição</span><textarea id="productDescricao" class="admin-input admin-textarea" rows="4" required></textarea></label>',
      '          <label class="admin-field"><span>Categoria</span><input id="productCategoria" class="admin-input" required></label>',
      '          <label class="admin-field"><span>Harmonização</span><input id="productHarmonizacao" class="admin-input" required></label>',
      '          <label class="admin-field"><span>Preço</span><input id="productPreco" class="admin-input" type="number" min="0" step="0.01" required></label>',
      '          <label class="admin-field"><span>Estoque</span><input id="productEstoque" class="admin-input" type="number" min="0" step="1" required></label>',
      '          <label class="admin-field"><span>Destaque</span><input id="productDestaque" class="admin-input" placeholder="Ex.: Curadoria da casa"></label>',
      '          <label class="admin-field"><span>Status</span><select id="productStatus" class="admin-input admin-select"><option value="ativo">Ativo</option><option value="inativo">Inativo</option></select></label>',
      '          <label class="admin-field admin-field-full"><span>Imagem (URL)</span><input id="productImagem" class="admin-input" placeholder="https://..."></label>',
      '          <label class="admin-field admin-field-full"><span>Imagem (upload)</span><input id="productImagemFile" class="admin-input admin-file" type="file" accept="image/*"></label>',
      '          <div class="admin-image-preview-wrap admin-field-full">',
      '            <div id="adminImagePreview" class="admin-image-preview">Prévia da imagem</div>',
      '          </div>',
      '          <div class="admin-form-actions admin-field-full">',
      '            <button type="submit" class="admin-button">Salvar produto</button>',
      '            <button id="cancelEditBtn" type="button" class="admin-button admin-button-secondary">Limpar</button>',
      '          </div>',
      '        </form>',
      '      </section>',
      '      <section class="admin-panel">',
      '        <div class="admin-panel-header">',
      '          <div>',
      '            <h2>Produtos cadastrados</h2>',
      '            <p>Ative, edite ou remova os rótulos que compõem a coleção pública.</p>',
      '          </div>',
      '          <span id="adminCount" class="admin-count"></span>',
      '        </div>',
      '        <div id="productsAdminList" class="admin-list"></div>',
      '      </section>',
      '    </div>',
      '  </div>',
      '</main>'
    ].join('');

    var loginEl = document.getElementById('adminLogin');
    var appEl = document.getElementById('adminApp');
    var loginErrorEl = document.getElementById('adminLoginError');
    var listEl = document.getElementById('productsAdminList');
    var countEl = document.getElementById('adminCount');
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
    var previewEl = document.getElementById('adminImagePreview');
    var cancelEditBtn = document.getElementById('cancelEditBtn');
    var logoutBtn = document.getElementById('adminLogoutBtn');
    var newProductBtn = document.getElementById('adminNewProductBtn');
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

    function updatePreview(value) {
      if (value) {
        previewEl.innerHTML = '<img src="' + escapeHtml(value) + '" alt="Prévia do produto">';
      } else {
        previewEl.textContent = 'Prévia da imagem';
      }
    }

    function resetForm() {
      idEl.value = '';
      formEl.reset();
      statusEl.value = 'ativo';
      uploadedImageData = '';
      updatePreview('');
    }

    function safeParseNumber(value, fallback) {
      var number = Number(value);
      return Number.isFinite(number) ? number : fallback;
    }

    function renderList() {
      var products = sortProducts(getProducts());
      countEl.textContent = products.length === 1 ? '1 rótulo' : products.length + ' rótulos';
      if (!products.length) {
        listEl.innerHTML = '<div class="admin-empty-state">Nenhum produto cadastrado no momento.</div>';
        return;
      }

      listEl.innerHTML = products.map(function(product) {
        var statusClass = product.status === 'ativo' ? 'is-active' : 'is-inactive';
        return [
          '<article class="admin-list-item">',
          '  <div class="admin-list-media">',
          product.imagem ? '    <img src="' + escapeHtml(product.imagem) + '" alt="' + escapeHtml(product.nome) + '" class="admin-product-thumb">' : '    <div class="admin-product-thumb admin-product-thumb-placeholder">Sem imagem</div>',
          '  </div>',
          '  <div class="admin-list-content">',
          '    <div class="admin-list-top">',
          '      <div>',
          '        <h3>' + escapeHtml(product.nome) + '</h3>',
          '        <p>' + escapeHtml(product.subtitulo || product.categoria || '') + '</p>',
          '      </div>',
          '      <span class="admin-status-pill ' + statusClass + '">' + escapeHtml(product.status) + '</span>',
          '    </div>',
          '    <div class="admin-list-meta">',
          '      <span>' + escapeHtml(product.categoria) + '</span>',
          '      <span>' + escapeHtml(formatBRL(product.preco)) + '</span>',
          '      <span>Estoque ' + escapeHtml(String(product.estoque)) + '</span>',
          '    </div>',
          '    <p class="admin-list-description">' + escapeHtml(product.descricao) + '</p>',
          '    <div class="admin-list-actions">',
          '      <button data-action="edit" data-id="' + escapeHtml(product.id) + '" type="button" class="admin-button">Editar</button>',
          '      <button data-action="toggle" data-id="' + escapeHtml(product.id) + '" type="button" class="admin-button admin-button-secondary">' + (product.status === 'ativo' ? 'Desativar' : 'Ativar') + '</button>',
          '      <button data-action="remove" data-id="' + escapeHtml(product.id) + '" type="button" class="admin-button admin-button-danger">Remover</button>',
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

    newProductBtn.addEventListener('click', function() {
      resetForm();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    cancelEditBtn.addEventListener('click', function() {
      resetForm();
    });

    imagemEl.addEventListener('input', function() {
      if (!uploadedImageData) {
        updatePreview(imagemEl.value.trim());
      }
    });

    imagemFileEl.addEventListener('change', function() {
      var file = imagemFileEl.files && imagemFileEl.files[0];
      if (!file) {
        uploadedImageData = '';
        updatePreview(imagemEl.value.trim());
        return;
      }
      if (!file.type || file.type.indexOf('image/') !== 0) {
        uploadedImageData = '';
        return;
      }
      if (file.size > MAX_IMAGE_SIZE_BYTES) {
        uploadedImageData = '';
        imagemFileEl.value = '';
        window.alert('Imagem muito grande. Limite: ' + (MAX_IMAGE_SIZE_BYTES / (1024 * 1024)) + 'MB.');
        return;
      }

      var reader = new FileReader();
      reader.onload = function(event) {
        uploadedImageData = event.target && event.target.result ? String(event.target.result) : '';
        updatePreview(uploadedImageData);
      };
      reader.readAsDataURL(file);
    });

    formEl.addEventListener('submit', function(event) {
      event.preventDefault();

      var products = getProducts();
      var existing = products.find(function(product) {
        return product.id === idEl.value;
      });

      var nextProduct = normalizeProduct({
        id: idEl.value || generateProductId(products),
        nome: nomeEl.value.trim(),
        subtitulo: subtituloEl.value.trim(),
        descricao: descricaoEl.value.trim(),
        categoria: categoriaEl.value.trim(),
        harmonizacao: harmonizacaoEl.value.trim(),
        preco: safeParseNumber(precoEl.value, 0),
        imagem: uploadedImageData || imagemEl.value.trim() || (existing ? existing.imagem : ''),
        destaque: destaqueEl.value.trim(),
        estoque: Math.max(0, parseInt(estoqueEl.value, 10) || 0),
        status: statusEl.value === 'inativo' ? 'inativo' : 'ativo'
      });

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
      var targetProduct = products.find(function(product) {
        return product.id === productId;
      });
      if (!targetProduct) return;

      if (action === 'remove') {
        var nextProducts = products.filter(function(product) {
          return product.id !== productId;
        });
        if (!saveProductsSafely(nextProducts)) return;
        renderList();
        if (idEl.value === productId) resetForm();
        return;
      }

      if (action === 'toggle') {
        var toggledProducts = products.map(function(product) {
          if (product.id !== productId) return product;
          return normalizeProduct(Object.assign({}, product, {
            status: product.status === 'ativo' ? 'inativo' : 'ativo'
          }));
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
        updatePreview(targetProduct.imagem || '');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });

    if (isAuthenticated()) {
      showApp();
    } else {
      showLogin();
    }
  }

  function applyRevealAnimations() {
    var animEls = document.querySelectorAll('[data-anim]');
    Array.prototype.forEach.call(animEls, function(el) {
      if (el.dataset.revealReady === '1') return;
      el.dataset.revealReady = '1';
    });

    if (!('IntersectionObserver' in window)) {
      Array.prototype.forEach.call(animEls, function(el) {
        el.classList.add('visible');
      });
      return;
    }

    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    Array.prototype.forEach.call(animEls, function(el) {
      if (!el.classList.contains('visible')) {
        observer.observe(el);
      }
    });
  }

  function initNavScroll() {
    var nav = document.getElementById('mainNav');
    if (!nav) return;
    window.addEventListener('scroll', function() {
      nav.classList.toggle('scrolled', window.scrollY > 40);
    });
  }

  function initAgeGate() {
    var ageGate = document.getElementById('ageGate');
    var ageYesBtn = document.getElementById('ageYesBtn');
    var ageNoBtn = document.getElementById('ageNoBtn');

    if (!ageGate) return;

    if (sessionStorage.getItem('age_verified')) {
      ageGate.style.display = 'none';
    }

    if (ageYesBtn) {
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
  }

  function buildCollapsedText(text, maxChars) {
    var cleanText = String(text || '').replace(/\s+/g, ' ').trim();
    if (cleanText.length <= maxChars) return cleanText;
    var trimmed = cleanText.slice(0, maxChars);
    var lastSpace = trimmed.lastIndexOf(' ');
    if (lastSpace > MOBILE_READ_MORE_MIN_WORD_BOUNDARY) {
      trimmed = trimmed.slice(0, lastSpace);
    }
    return trimmed + '…';
  }

  function getMobileReadMoreLimit(element) {
    if (element.classList.contains('testimonial-text')) return 128;
    if (element.classList.contains('product-notes')) return 110;
    if (element.classList.contains('story-text')) return 150;
    if (element.classList.contains('why-text')) return 128;
    return 138;
  }

  function applyMobileReadMore(scope) {
    if (!window.matchMedia('(max-width: 768px)').matches) return;
    if (currentPage !== 'home' && currentPage !== 'produtos') return;

    var root = scope || document;
    var selector = MOBILE_READ_MORE_SELECTORS.join(',');
    var candidates = root.querySelectorAll(selector);

    Array.prototype.forEach.call(candidates, function(element) {
      if (!element || element.dataset.mobileReadReady === '1') return;

      var originalText = String(element.textContent || '').replace(/\s+/g, ' ').trim();
      var maxChars = getMobileReadMoreLimit(element);
      if (!originalText || originalText.length <= maxChars) return;

      var collapsedText = buildCollapsedText(originalText, maxChars);
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'mobile-readmore-btn';
      button.textContent = 'Ler mais';
      button.setAttribute('aria-expanded', 'false');
      button.setAttribute('aria-label', 'Expandir texto');

      element.dataset.mobileReadReady = '1';
      element.dataset.mobileReadOriginal = originalText;
      element.dataset.mobileReadCollapsed = collapsedText;
      element.textContent = collapsedText;

      button.addEventListener('click', function() {
        var expanded = button.getAttribute('aria-expanded') === 'true';
        if (expanded) {
          element.textContent = element.dataset.mobileReadCollapsed || collapsedText;
          button.textContent = 'Ler mais';
          button.setAttribute('aria-expanded', 'false');
          button.setAttribute('aria-label', 'Expandir texto');
          return;
        }

        element.textContent = element.dataset.mobileReadOriginal || originalText;
        button.textContent = 'Ler menos';
        button.setAttribute('aria-expanded', 'true');
        button.setAttribute('aria-label', 'Recolher texto');
      });

      element.insertAdjacentElement('afterend', button);
    });
  }

  function init() {
    seedProductsIfNeeded();
    applyInternalLinks();
    initAgeGate();
    initNavScroll();

    if (currentPage === 'admin') {
      renderAdminPage();
    } else if (currentPage === 'produtos') {
      renderProductsPage();
    } else {
      renderHomeProducts();
    }

    window.addEventListener('storage', function(event) {
      if (event.key !== STORAGE_KEY_PRODUCTS) return;
      if (currentPage === 'produtos') {
        renderProductsPage();
      } else if (currentPage === 'home') {
        renderHomeProducts();
      }
    });

    applyRevealAnimations();
    applyMobileReadMore(document);
  }

  init();
})();
