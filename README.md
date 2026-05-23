# Rebenhaus — Vinhos Alemães Premium

Landing page institucional e comercial da Rebenhaus, uma curadoria exclusiva de vinhos alemães para o mercado brasileiro.

## Visão geral

Este projeto é uma página estática construída com:

- HTML5
- CSS3
- JavaScript puro

A experiência inclui:

- verificação de idade
- hero premium com animações
- seções institucionais
- vitrine dinâmica de produtos
- página dedicada /produtos com filtros editoriais
- área administrativa oculta em /admin com Supabase Auth + persistência em Supabase (fallback local para vitrine)
- depoimentos
- newsletter
- CTA para WhatsApp e navegação interna

## Estrutura do projeto

- [index.html](index.html) — estrutura da página
- [styles.css](styles.css) — estilos visuais
- [products.js](products.js) — dados iniciais da coleção
- [script.js](script.js) — interações, renderização dinâmica e administração

## Como executar localmente

Basta abrir o arquivo [index.html](index.html) no navegador. As páginas internas também funcionam abrindo os arquivos em `/produtos`, `/admin`, `/sobre`, `/experiencia` e `/contato`.

Se preferir usar um servidor local simples, utilize qualquer extensão de Live Server no VS Code ou sirva a pasta com sua ferramenta de preferência.

## Configuração do Supabase

O projeto já está preparado para salvar e ler os produtos na nuvem via Supabase.

1. no Supabase, crie um projeto
2. abra o SQL Editor e execute o script [supabase/setup.sql](supabase/setup.sql)
3. em Authentication, crie o usuário administrador com e-mail e senha
4. copie o `id` desse usuário em `auth.users`
5. execute no SQL Editor: `update public.profiles set role = 'admin' where id = '<USER_UUID>';`
6. a configuração padrão já está definida em [supabase-config.js](supabase-config.js) para o ambiente atual
7. em produção, prefira injetar `window.REBENHAUS_SUPABASE_CONFIG = { url: '...', anonKey: '...' }` antes de carregar [supabase-config.js](supabase-config.js), para evitar versionar valores de ambiente diretamente no código
8. publique/recarregue o site

Se o Supabase estiver indisponível ou não inicializar, o site continua funcionando com fallback em localStorage.

### Observação de segurança

O script [supabase/setup.sql](supabase/setup.sql) libera leitura pública da vitrine, mas restringe `insert`, `update` e `delete` para usuários autenticados com `profiles.role = 'admin'`.

## Publicação

O projeto está publicado via GitHub Pages.

- Repositório: https://github.com/FernandoR-Reis/rebenhaus-vinhos-alemaes
- Site publicado: https://fernandor-reis.github.io/rebenhaus-vinhos-alemaes/

## Atualizações

Sempre que houver alteração no conteúdo, no layout ou nos links do projeto:

1. atualize os arquivos fonte
2. revise este README se necessário
3. faça commit e push para a branch `main`
4. aguarde a atualização automática do GitHub Pages

## Contato

- WhatsApp: https://wa.me/5512974019009
- Instagram: https://instagram.com/reben.haus

## Observação

Projeto desenvolvido para apresentar a marca com foco em experiência premium, conversão e curadoria de vinhos alemães.
