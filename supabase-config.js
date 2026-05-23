(function() {
  var runtimeConfig = window.REBENHAUS_SUPABASE_CONFIG || {};
  var SUPABASE_URL = 'https://trjasxlvwyhjwmdtqcqh.supabase.co';
  var SUPABASE_ANON_KEY = 'sb_publishable_MVSqZEdYDp-IDT9q5IbffQ_qHSHu-Lz';
  var supabaseState = {
    enabled: false,
    client: null,
    error: ''
  };

  var supabaseConfig = {
    url: String(runtimeConfig.url || SUPABASE_URL),
    anonKey: String(runtimeConfig.anonKey || SUPABASE_ANON_KEY)
  };

  var hasPlaceholders = Object.keys(supabaseConfig).some(function(key) {
    return String(supabaseConfig[key]).indexOf('COLE_AQUI') === 0;
  });

  function setState(statePatch) {
    supabaseState = Object.assign({}, supabaseState, statePatch || {});
    window.REBENHAUS_SUPABASE = supabaseState;
  }

  function loadSupabaseClient() {
    if (window.supabase && typeof window.supabase.createClient === 'function') {
      return Promise.resolve(window.supabase);
    }

    return new Promise(function(resolve, reject) {
      var script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
      script.async = true;
      script.onload = function() {
        if (window.supabase && typeof window.supabase.createClient === 'function') {
          resolve(window.supabase);
        } else {
          reject(new Error('Biblioteca Supabase carregada sem createClient.'));
        }
      };
      script.onerror = function() {
        reject(new Error('Falha ao carregar biblioteca Supabase.'));
      };
      document.head.appendChild(script);
    });
  }

  if (hasPlaceholders) {
    setState({
      error: 'Configuração do Supabase pendente em supabase-config.js'
    });
    return;
  }

  setState({});

  loadSupabaseClient()
    .then(function(supabaseLib) {
      var client = supabaseLib.createClient(supabaseConfig.url, supabaseConfig.anonKey);
      setState({
        enabled: true,
        client: client,
        error: ''
      });
      window.dispatchEvent(new CustomEvent('rebenhaus:supabase-ready'));
    })
    .catch(function(error) {
      setState({
        enabled: false,
        client: null,
        error: error && error.message ? error.message : 'Falha ao inicializar Supabase.'
      });
      window.dispatchEvent(new CustomEvent('rebenhaus:supabase-error'));
    });
})();
