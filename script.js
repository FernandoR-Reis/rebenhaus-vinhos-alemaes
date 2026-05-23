(function() {
  // v2 isolates the current boutique collection schema from older local data used before the dedicated /produtos and /admin pages.
  var STORAGE_KEY_PRODUCTS = 'rebenhaus_products_v2';
  var SUPABASE_TABLE_PRODUCTS = 'products';
  var SUPABASE_TABLE_PROFILES = 'profiles';
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
  // Keep in sync with styles.css mobile media queries (max-width: 768px).
  var MOBILE_BREAKPOINT_PX = 768;
  // Keep in sync with the collapsed navigation media query in styles.css (max-width: 900px).
  var NAV_COLLAPSE_BREAKPOINT_PX = 900;
  // Intentional mix: direct classes and scoped descendants for blocks that do not expose dedicated text classes.
  var MOBILE_READ_MORE_SELECTORS = Object.freeze([
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
  ]);
  // 40 chars prevents awkwardly short previews while still preferring whole-word truncation.
  var MOBILE_READ_MORE_MIN_CHAR_BOUNDARY = 40;
  var MOBILE_READ_MORE_LIMIT_TESTIMONIAL = 128;
  var MOBILE_READ_MORE_LIMIT_PRODUCT_NOTES = 110;
  var MOBILE_READ_MORE_LIMIT_STORY = 150;
  var MOBILE_READ_MORE_LIMIT_WHY = 128;
  var MOBILE_READ_MORE_LIMIT_DEFAULT = 138;
  var defaultProducts = Array.isArray(window.REBENHAUS_DEFAULT_PRODUCTS)
    ? window.REBENHAUS_DEFAULT_PRODUCTS.map(normalizeProduct)
    : [];
  var productsPageController = null;
  var cloudHydrationPromise = null;

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
    if (!Object.prototype.hasOwnProperty.call(routeMap, routeName)) return '#';
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

  function getSupabaseState() {
    return window.REBENHAUS_SUPABASE || {
      enabled: false,
      client: null,
      error: ''
    };
  }

  function isSupabaseReady() {
    var state = getSupabaseState();
    return Boolean(state.enabled && state.client);
  }

  function getSupabaseClient() {
    var state = getSupabaseState();
    return state.client || null;
  }

  function waitForSupabaseInitialization(timeoutMs) {
    var timeout = Math.max(0, Number(timeoutMs) || 0);
    if (isSupabaseReady()) return Promise.resolve(true);

    return new Promise(function(resolve) {
      var settled = false;
      var timer = null;

      function done(value) {
        if (settled) return;
        settled = true;
        window.removeEventListener('rebenhaus:supabase-ready', onReady);
        window.removeEventListener('rebenhaus:supabase-error', onError);
        if (timer) {
          window.clearTimeout(timer);
        }
        resolve(value);
      }

      function onReady() {
        done(true);
      }

      function onError() {
        done(false);
      }

      window.addEventListener('rebenhaus:supabase-ready', onReady);
      window.addEventListener('rebenhaus:supabase-error', onError);
      if (timeout > 0) {
        timer = window.setTimeout(function() {
          done(false);
        }, timeout);
      }
    });
  }

  function readProductsFromSupabase() {
    if (!isSupabaseReady()) {
      return Promise.resolve(null);
    }

    return getSupabaseClient()
      .from(SUPABASE_TABLE_PRODUCTS)
      .select('*')
      .order('created_at', { ascending: false })
      .then(function(response) {
        if (response.error || !Array.isArray(response.data)) {
          return null;
        }
        return response.data.map(normalizeProduct);
      })
      .catch(function() {
        return null;
      });
  }

  function saveProducts(products) {
    localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(products.map(normalizeProduct)));
  }

  function replaceStoredProducts(products) {
    saveProducts(Array.isArray(products) ? products : []);
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

  function getSupabaseUser() {
    if (!isSupabaseReady()) {
      return Promise.resolve(null);
    }

    return getSupabaseClient().auth.getUser()
      .then(function(response) {
        if (response.error) return null;
        return response.data && response.data.user ? response.data.user : null;
      })
      .catch(function() {
        return null;
      });
  }

  function getCurrentProfile() {
    if (!isSupabaseReady()) {
      return Promise.resolve(null);
    }

    return getSupabaseUser().then(function(user) {
      if (!user || !user.id) return null;
      return getSupabaseClient()
        .from(SUPABASE_TABLE_PROFILES)
        .select('id, role')
        .eq('id', user.id)
        .maybeSingle()
        .then(function(response) {
          if (response.error) return null;
          return response.data || null;
        })
        .catch(function() {
          return null;
        });
    });
  }

  function isAdminProfile(profile) {
    return Boolean(profile && String(profile.role || '').toLowerCase() === 'admin');
  }

  function hasActiveAdminSession() {
    return waitForSupabaseInitialization(4000)
      .then(function(isReady) {
        if (!isReady || !isSupabaseReady()) return false;
        return getCurrentProfile().then(function(profile) {
          return isAdminProfile(profile);
        });
      })
      .catch(function() {
        return false;
      });
  }

  function signInAdmin(email, password) {
    return waitForSupabaseInitialization(4000)
      .then(function(isReady) {
        if (!isReady || !isSupabaseReady()) {
          throw new Error('Supabase não está configurado neste ambiente.');
        }

        return getSupabaseClient().auth.signInWithPassword({
          email: email,
          password: password
        }).then(function(response) {
          if (response.error) {
            throw response.error;
          }

          return getCurrentProfile().then(function(profile) {
            if (!isAdminProfile(profile)) {
              return getSupabaseClient().auth.signOut().then(function() {
                throw new Error('Acesso permitido apenas para administradores.');
              });
            }

            return response.data;
          });
        });
      });
  }

  function signOutAdmin() {
    if (!isSupabaseReady()) {
      return Promise.resolve();
    }

    return getSupabaseClient().auth.signOut().then(function() {
      return undefined;
    }).catch(function() {
      return undefined;
    });
  }

  function normalizeStatus(status) {
    var normalizedStatus = String(status || '').trim().toLowerCase();
    if (normalizedStatus !== 'ativo' && normalizedStatus !== 'inativo') {
      throw new Error('Status inválido.');
    }
    return normalizedStatus;
  }

  function parsePrecoNumber(precoInput) {
    var value = typeof precoInput === 'number'
      ? precoInput
      : Number(String(precoInput || '').replace(',', '.'));
    if (Number.isNaN(value)) {
      throw new Error('Preço inválido.');
    }
    return value;
  }

  function parseEstoqueInt(estoqueInput) {
    var value = typeof estoqueInput === 'number'
      ? estoqueInput
      : parseInt(String(estoqueInput || ''), 10);
    if (!Number.isFinite(value)) {
      throw new Error('Estoque inválido.');
    }
    return value;
  }

  function createSupabaseProduct(product) {
    if (!isSupabaseReady()) {
      return Promise.reject(new Error('Supabase não está configurado neste ambiente.'));
    }

    return getSupabaseClient()
      .from(SUPABASE_TABLE_PRODUCTS)
      .insert(normalizeProduct(product))
      .select('*')
      .then(function(response) {
        if (response.error) {
          throw response.error;
        }
        return Array.isArray(response.data) && response.data[0]
          ? normalizeProduct(response.data[0])
          : null;
      });
  }

  function updateSupabaseProduct(id, updates) {
    if (!isSupabaseReady()) {
      return Promise.reject(new Error('Supabase não está configurado neste ambiente.'));
    }

    return getSupabaseClient()
      .from(SUPABASE_TABLE_PRODUCTS)
      .update(normalizeProduct(Object.assign({ id: id }, updates)))
      .eq('id', id)
      .select('*')
      .then(function(response) {
        if (response.error) {
          throw response.error;
        }
        return Array.isArray(response.data) && response.data[0]
          ? normalizeProduct(response.data[0])
          : null;
      });
  }

  function deleteSupabaseProduct(id) {
    if (!isSupabaseReady()) {
      return Promise.reject(new Error('Supabase não está configurado neste ambiente.'));
    }

    return getSupabaseClient()
      .from(SUPABASE_TABLE_PRODUCTS)
      .delete()
      .eq('id', id)
      .select('id')
      .then(function(response) {
        if (response.error) {
          throw response.error;
        }
        return true;
      });
  }

  function seedProductsIfNeeded() {
    if (!getStoredProducts() && defaultProducts.length) {
      saveProducts(defaultProducts);
    }
  }

  function hydrateProductsFromCloud() {
    if (cloudHydrationPromise) return cloudHydrationPromise;

    cloudHydrationPromise = waitForSupabaseInitialization(4000)
      .then(function(isReady) {
        var localProducts = getStoredProducts();
        if (!isReady || !isSupabaseReady()) return false;

        return readProductsFromSupabase().then(function(remoteProducts) {
          if (Array.isArray(remoteProducts)) {
            var remoteSerialized = JSON.stringify(remoteProducts);
            var localSerialized = JSON.stringify((localProducts || []).map(normalizeProduct));
            if (remoteSerialized !== localSerialized) {
              replaceStoredProducts(remoteProducts);
              return true;
            }
            return false;
          }

          return false;
        });
      })
      .catch(function() {
        return false;
      })
      .finally(function() {
        cloudHydrationPromise = null;
      });

    return cloudHydrationPromise;
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

    var featuredLimit = isMobileViewport() ? 2 : 4;
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
      '      <p class="admin-subtitle">Gerencie a coleção exibida em <strong>/produtos</strong> com persistência em nuvem e atualização automática.</p>',
      '    </div>',
      '    <div class="admin-actions-top">',
      '      <a class="admin-link" href="' + escapeHtml(getRouteHref('produtos')) + '">Abrir vitrine</a>',
      '      <button id="adminLogoutBtn" type="button" class="admin-button admin-button-secondary">Sair</button>',
      '    </div>',
      '  </div>',
      '  <section id="adminLogin" class="admin-login" style="display:none;">',
      '    <h2>Acesso oculto</h2>',
      '    <p>Entre com seu usuário administrador do Supabase para gerenciar a coleção boutique.</p>',
      '    <form id="adminLoginForm" class="admin-login-form">',
      '      <input id="adminEmail" type="email" class="admin-input" placeholder="E-mail" required>',
      '      <input id="adminPassword" type="password" class="admin-input" placeholder="Senha" required>',
      '      <button type="submit" class="admin-button">Entrar</button>',
      '    </form>',
      '    <p id="adminLoginError" class="admin-login-error" style="display:none;">Credenciais inválidas.</p>',
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
    var loginEmailEl = document.getElementById('adminEmail');
    var loginPasswordEl = document.getElementById('adminPassword');
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

    function setLoginError(message) {
      if (!message) {
        loginErrorEl.style.display = 'none';
        loginErrorEl.textContent = 'Credenciais inválidas.';
        return;
      }
      loginErrorEl.textContent = message;
      loginErrorEl.style.display = 'block';
    }

    function buildProductPayload() {
      var products = getProducts();
      var nextId = String(idEl.value || generateProductId(products)).trim();
      if (!nextId) {
        throw new Error('ID do produto é obrigatório.');
      }

      return normalizeProduct({
        id: nextId,
        nome: nomeEl.value.trim(),
        subtitulo: subtituloEl.value.trim(),
        descricao: descricaoEl.value.trim(),
        categoria: categoriaEl.value.trim(),
        harmonizacao: harmonizacaoEl.value.trim(),
        preco: parsePrecoNumber(precoEl.value),
        imagem: uploadedImageData || imagemEl.value.trim(),
        destaque: destaqueEl.value.trim(),
        estoque: Math.max(0, parseEstoqueInt(estoqueEl.value)),
        status: normalizeStatus(statusEl.value)
      });
    }

    function mergeProductLocally(product) {
      var products = getProducts();
      var exists = products.some(function(item) {
        return item.id === product.id;
      });
      var nextProducts = exists
        ? products.map(function(item) {
            return item.id === product.id ? normalizeProduct(product) : item;
          })
        : [normalizeProduct(product)].concat(products);

      saveProductsSafely(nextProducts);
      return nextProducts;
    }

    function removeProductLocally(productId) {
      var nextProducts = getProducts().filter(function(product) {
        return product.id !== productId;
      });
      saveProductsSafely(nextProducts);
      return nextProducts;
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
      setLoginError('');
      loginEl.style.display = 'none';
      appEl.style.display = 'block';
      renderList();
      resetForm();
    }

    function showLogin() {
      appEl.style.display = 'none';
      loginEl.style.display = 'block';
      resetForm();
    }

    document.getElementById('adminLoginForm').addEventListener('submit', function(event) {
      event.preventDefault();
      setLoginError('');
      signInAdmin(String(loginEmailEl.value || '').trim(), String(loginPasswordEl.value || ''))
        .then(function() {
          return hydrateProductsFromCloud();
        })
        .then(function() {
          renderList();
          loginPasswordEl.value = '';
          showApp();
        })
        .catch(function(error) {
          setLoginError(error && error.message ? error.message : 'Não foi possível entrar.');
        });
    });

    logoutBtn.addEventListener('click', function() {
      signOutAdmin().finally(function() {
        loginPasswordEl.value = '';
        showLogin();
      });
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

      var existingProduct = getProducts().find(function(product) {
        return product.id === idEl.value;
      });

      var payload;
      try {
        payload = buildProductPayload();
        if (!payload.imagem && existingProduct && existingProduct.imagem) {
          payload.imagem = existingProduct.imagem;
        }
      } catch (error) {
        window.alert(error && error.message ? error.message : 'Revise os campos do produto.');
        return;
      }

      var request = existingProduct
        ? updateSupabaseProduct(payload.id, payload)
        : createSupabaseProduct(payload);

      request.then(function(savedProduct) {
        mergeProductLocally(savedProduct || payload);
        renderList();
        resetForm();
      }).catch(function(error) {
        window.alert(error && error.message ? error.message : 'Não foi possível salvar o produto no Supabase.');
      });
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
        deleteSupabaseProduct(productId)
          .then(function() {
            removeProductLocally(productId);
            renderList();
            if (idEl.value === productId) resetForm();
          })
          .catch(function(error) {
            window.alert(error && error.message ? error.message : 'Não foi possível remover o produto.');
          });
        return;
      }

      if (action === 'toggle') {
        var toggledProduct = normalizeProduct(Object.assign({}, targetProduct, {
          status: targetProduct.status === 'ativo' ? 'inativo' : 'ativo'
        }));
        updateSupabaseProduct(productId, toggledProduct)
          .then(function(savedProduct) {
            mergeProductLocally(savedProduct || toggledProduct);
            renderList();
          })
          .catch(function(error) {
            window.alert(error && error.message ? error.message : 'Não foi possível atualizar o status.');
          });
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

    hasActiveAdminSession().then(function(isAdmin) {
      if (isAdmin) {
        hydrateProductsFromCloud().then(function() {
          renderList();
          showApp();
        });
      } else {
        showLogin();
      }
    });
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

  function initMobileNav() {
    var nav = document.getElementById('mainNav');
    if (!nav) return;

    var navToggle = nav.querySelector('.nav-toggle');
    var navLinks = nav.querySelector('.nav-links');
    if (!navToggle || !navLinks) return;

    function closeMenu() {
      nav.classList.remove('mobile-open');
      document.body.classList.remove('mobile-nav-open');
      navToggle.setAttribute('aria-expanded', 'false');
      navToggle.setAttribute('aria-label', 'Abrir menu');
    }

    function openMenu() {
      if (!isCollapsedNavViewport()) return;
      nav.classList.add('mobile-open');
      document.body.classList.add('mobile-nav-open');
      navToggle.setAttribute('aria-expanded', 'true');
      navToggle.setAttribute('aria-label', 'Fechar menu');
    }

    function toggleMenu() {
      var isOpen = nav.classList.contains('mobile-open');
      if (isOpen) {
        closeMenu();
      } else {
        openMenu();
      }
    }

    navToggle.addEventListener('click', function() {
      toggleMenu();
    });

    navLinks.addEventListener('click', function(event) {
      var target = event.target.closest('a');
      if (target) {
        closeMenu();
      }
    });

    document.addEventListener('click', function(event) {
      if (!nav.classList.contains('mobile-open')) return;
      if (nav.contains(event.target)) return;
      closeMenu();
    });

    document.addEventListener('keydown', function(event) {
      if (event.key === 'Escape') {
        closeMenu();
      }
    });

    window.addEventListener('resize', function() {
      if (!isCollapsedNavViewport()) {
        closeMenu();
      }
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

  function normalizeWhitespace(text) {
    return String(text || '').replace(/\s+/g, ' ').trim();
  }

  function buildCollapsedText(text, maxChars) {
    var cleanText = normalizeWhitespace(text);
    if (cleanText.length <= maxChars) return cleanText;
    var trimmed = cleanText.slice(0, maxChars);
    var lastSpace = trimmed.lastIndexOf(' ');
    if (lastSpace > MOBILE_READ_MORE_MIN_CHAR_BOUNDARY) {
      trimmed = trimmed.slice(0, lastSpace);
    }
    return trimmed + '…';
  }

  function getMobileReadMoreLimit(element) {
    if (element.classList.contains('testimonial-text')) return MOBILE_READ_MORE_LIMIT_TESTIMONIAL;
    if (element.classList.contains('product-notes')) return MOBILE_READ_MORE_LIMIT_PRODUCT_NOTES;
    if (element.classList.contains('story-text')) return MOBILE_READ_MORE_LIMIT_STORY;
    if (element.classList.contains('why-text')) return MOBILE_READ_MORE_LIMIT_WHY;
    return MOBILE_READ_MORE_LIMIT_DEFAULT;
  }

  function isMobileViewport() {
    return window.matchMedia('(max-width: ' + MOBILE_BREAKPOINT_PX + 'px)').matches;
  }

  function isCollapsedNavViewport() {
    return window.matchMedia('(max-width: ' + NAV_COLLAPSE_BREAKPOINT_PX + 'px)').matches;
  }

  function applyMobileReadMore(scope) {
    if (!isMobileViewport()) return;
    if (currentPage !== 'home' && currentPage !== 'produtos') return;

    var root = scope || document;
    var selector = MOBILE_READ_MORE_SELECTORS.join(',');
    var candidates = root.querySelectorAll(selector);

    Array.prototype.forEach.call(candidates, function(element) {
      if (!element || element.dataset.mobileReadReady === '1') return;
      // Preserve existing HTML-rich blocks by applying read-more only to plain-text nodes.
      if (element.children && element.children.length > 0) return;

      var originalText = normalizeWhitespace(element.textContent || '');
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
      updateReadMoreState(element, button, false);

      button.addEventListener('click', function() {
        var expanded = button.getAttribute('aria-expanded') === 'true';
        updateReadMoreState(element, button, !expanded);
      });

      element.insertAdjacentElement('afterend', button);
    });
  }

  function updateReadMoreState(element, button, isExpanded) {
    element.textContent = isExpanded ? element.dataset.mobileReadOriginal : element.dataset.mobileReadCollapsed;
    button.textContent = isExpanded ? 'Ler menos' : 'Ler mais';
    button.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
    button.setAttribute('aria-label', isExpanded ? 'Recolher texto' : 'Expandir texto');
  }

  function init() {
    seedProductsIfNeeded();
    applyInternalLinks();
    initAgeGate();
    initNavScroll();
    initMobileNav();

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

    function rerenderCurrentPage() {
      if (currentPage === 'produtos') {
        renderProductsPage();
      } else if (currentPage === 'home') {
        renderHomeProducts();
      } else if (currentPage === 'admin') {
        renderAdminPage();
      }
    }

    hydrateProductsFromCloud().then(function(changed) {
      if (changed) {
        rerenderCurrentPage();
      }
    });

    window.addEventListener('rebenhaus:supabase-ready', function() {
      hydrateProductsFromCloud().then(function(changed) {
        if (changed) {
          rerenderCurrentPage();
        }
      });
    });

    applyRevealAnimations();
    applyMobileReadMore(document);
  }

  init();
})();
