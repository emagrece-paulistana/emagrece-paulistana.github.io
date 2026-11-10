# Emagrece Paulistana

Landing page de catálogo, tudo leva ao grupo do WhatsApp, com painel de administração. HTML, CSS e JS estáticos (GitHub Pages), com banco, login e fotos no Supabase.

## Como funciona
- **Site** (`index.html`, `script.js`): lê produtos e textos do Supabase. Mostra só produtos ativos, na ordem do painel. Enquanto o Supabase não está configurado (`SUPABASE_URL` vazio), mostra 2 produtos de exemplo.
- **Painel** (`admin/`): endereço `/admin/`, sem link no site. Login com e-mail e senha. Duas abas:
  - **Produtos:** cadastrar, editar, esconder, apagar, reordenar; foto, preço e preço promocional.
  - **Informações do site:** link do grupo, título e texto do topo, foto do topo (dentro da cápsula), bloco do grupo, Instagram e rodapé.
- **Banco** (`supabase/setup.sql`): tabelas `products` e `site_settings` e pasta de fotos `products`. Qualquer pessoa lê; só a conta de administrador altera.
- A chave do Supabase em `script.js` e `admin/admin.js` é pública (publishable). A segurança vem das regras do banco. Nunca colocar no código a chave `secret` nem a `service_role`.

## Como rodar
```bash
python -m http.server 5178
```
Abra http://localhost:5178 (site) e http://localhost:5178/admin/ (painel).

## Configuração do Supabase (uma vez)
1. Criar um projeto novo no Supabase (região São Paulo). Não reaproveitar o de outro cliente: a conta de admin seria a mesma.
2. Rodar `supabase/setup.sql` no SQL Editor.
3. Em Authentication, desligar "Allow new users to sign up".
4. Em Authentication > Users, criar o administrador (e-mail e senha) com "Auto Confirm User".
5. Copiar a URL do projeto e a chave `publishable` para `script.js` (`SUPABASE_URL`, `SUPABASE_KEY`) e para `admin/admin.js` (`URL`, `KEY`).

## Como editar
- **Produtos, fotos, preços, textos e link do grupo:** pelo painel `/admin/`.
- **Layout e textos padrão:** `index.html` e `style.css`. Os textos do painel só sobrescrevem os que têm `data-s` no HTML.

## Pendências (dependem do cliente)
- Link do grupo do WhatsApp (colar no painel, aba "Informações do site").
- Logo em alta resolução (a do Instagram é de 150 px; a marca do site é provisória).
- Conferir os preços e os dois produtos de partida (vieram do Instagram).
- Foto do topo (opcional) e fotos dos produtos.
- Regras de publicidade: suplemento alimentar não pode prometer emagrecimento, cura ou resultado garantido (Anvisa), e vender "garantia de resultado" ou mostrar antes e depois pode ser problema. O site foi escrito sem essas promessas; peça ao cliente para revisar o que colocar pelo painel.
- Domínio próprio.

## Avisos
- O projeto gratuito do Supabase pausa após cerca de 1 semana sem acessos. Visitas normais ao site mantêm o projeto ativo; se pausar, reativar no painel do Supabase.
- Fotos são reduzidas para 1200 px e convertidas para WebP no navegador, antes do envio.
