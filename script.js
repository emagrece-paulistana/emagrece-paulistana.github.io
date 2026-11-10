// Emagrece Paulistana
// Produtos, fotos, preços, textos e o link do grupo vêm do banco de dados e são editados no painel (/admin/).
const CONFIG = {
  // Link do grupo do WhatsApp. Pode ficar vazio aqui e ser preenchido no painel (aba "Informações do site").
  // Exemplo: "https://chat.whatsapp.com/XXXXXXXX"
  GROUP_LINK: "",
  // Banco de dados (Supabase). Enquanto SUPABASE_URL estiver vazio, o site mostra os produtos de exemplo abaixo.
  // A chave é pública por natureza: quem protege os dados são as regras do banco.
  SUPABASE_URL: "https://cyvsqgxgtlqkjnauizkx.supabase.co",
  SUPABASE_KEY: "sb_publishable_5mn30FH4hv9iXPUvvoi-FA_Iq8U5Zpm",
};

// Só aparecem enquanto o banco não está configurado.
const DEMO_PRODUCTS = [
  { name: "Protocolo 30 dias", description: "Protocolo completo de 30 dias, com acompanhamento durante todo o processo.", price: 270, promo_price: null, image_path: null },
  { name: "Protocolo 15 dias", description: "Protocolo de teste de 15 dias, com acompanhamento durante todo o processo.", price: 170, promo_price: null, image_path: null },
];

const GROUP_RE = /^https:\/\/(chat\.whatsapp\.com|wa\.me|api\.whatsapp\.com|whatsapp\.com)\//;
const DB = Boolean(CONFIG.SUPABASE_URL && CONFIG.SUPABASE_KEY);
let groupLink = GROUP_RE.test(CONFIG.GROUP_LINK) ? CONFIG.GROUP_LINK : "";

/* ---------- botões do grupo ---------- */
const toast = document.querySelector(".toast");
let toastTimer;

function bindGroupButtons(root) {
  root.querySelectorAll("[data-group-link]").forEach((btn) => {
    if (btn.dataset.bound) return;
    btn.dataset.bound = "1";
    // Sem link ainda: o botão avisa em vez de levar a lugar nenhum.
    btn.addEventListener("click", (event) => {
      if (groupLink) return;
      event.preventDefault();
      toast.textContent = "O link do grupo ainda não foi configurado.";
      toast.hidden = false;
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => { toast.hidden = true; }, 3500);
    });
  });
}

function applyGroupLink() {
  document.querySelectorAll("[data-group-link]").forEach((btn) => {
    if (groupLink) {
      btn.href = groupLink;
      btn.target = "_blank";
      btn.rel = "noopener";
    } else {
      btn.href = "#grupo";
      btn.removeAttribute("target");
      btn.removeAttribute("rel");
    }
  });
}

bindGroupButtons(document);
applyGroupLink();

// O botão fixo do celular some quando o bloco do grupo está na tela.
const floatBtn = document.getElementById("flutuante");
const vip = document.getElementById("grupo");
if (floatBtn && vip && "IntersectionObserver" in window) {
  new IntersectionObserver((entries) => {
    floatBtn.classList.toggle("is-hidden", entries[0].isIntersecting);
  }, { threshold: 0.35 }).observe(vip);
}

/* ---------- utilidades ---------- */
// Todo texto vindo do banco entra na página com textContent, nunca como HTML.
const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

function photoUrl(path) {
  return CONFIG.SUPABASE_URL + "/storage/v1/object/public/products/" + encodeURIComponent(path);
}

async function dbGet(path) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const res = await fetch(CONFIG.SUPABASE_URL + "/rest/v1/" + path, {
      headers: { apikey: CONFIG.SUPABASE_KEY },
      signal: controller.signal,
    });
    if (!res.ok) throw new Error("HTTP " + res.status);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

/* ---------- informações do site (textos, link do grupo, foto do topo) ---------- */
async function loadSettings() {
  if (!DB) return;
  try {
    const rows = await dbGet("site_settings?select=key,value");
    const s = Object.fromEntries(rows.map((r) => [r.key, (r.value || "").trim()]));

    document.querySelectorAll("[data-s]").forEach((node) => {
      const value = s[node.dataset.s];
      if (value) node.textContent = value;
    });

    if (GROUP_RE.test(s.group_link || "")) {
      groupLink = s.group_link;
      applyGroupLink();
    }

    const insta = (s.instagram || "").replace(/^@/, "").replace(/[^A-Za-z0-9._]/g, "");
    const link = document.getElementById("instagram");
    if (insta && link) {
      link.href = "https://www.instagram.com/" + insta;
      link.textContent = "Instagram @" + insta;
    }

    if (s.hero_image) {
      const cap = document.getElementById("capsula");
      const img = document.createElement("img");
      img.src = photoUrl(s.hero_image);
      img.alt = "";
      img.decoding = "async";
      img.addEventListener("load", () => cap.classList.add("has-photo"));
      cap.appendChild(img);
    }
  } catch {
    /* sem rede ou banco fora do ar: ficam os textos que já estão na página */
  }
}

/* ---------- catálogo ---------- */
function priceBlock(p) {
  const box = el("div", "price");
  if (p.price == null) {
    box.textContent = "Consulte no grupo";
    return box;
  }
  if (p.promo_price != null) {
    box.append(
      el("span", "sr", "De "),
      el("s", "price__old", money.format(p.price)),
      el("span", "sr", " por "),
      el("span", "price__now", money.format(p.promo_price))
    );
  } else {
    box.append(el("span", "price__now", money.format(p.price)));
  }
  return box;
}

function buildCard(p, index) {
  const li = el("li", "card");

  const media = el("div", "media");
  if (p.image_path) {
    const img = document.createElement("img");
    img.src = photoUrl(p.image_path);
    img.alt = p.name;
    img.decoding = "async";
    img.loading = index < 3 ? "eager" : "lazy";
    media.appendChild(img);
  }
  li.appendChild(media);

  const body = el("div", "card__body");
  body.appendChild(el("h3", null, p.name));
  if (p.description) body.appendChild(el("p", null, p.description));

  const foot = el("div", "card__foot");
  foot.appendChild(priceBlock(p));
  const btn = el("a", "btn btn--block", "Pedir no grupo");
  btn.href = "#grupo";
  btn.setAttribute("data-group-link", "");
  btn.appendChild(el("span", "sr", ": " + p.name));
  foot.appendChild(btn);
  body.appendChild(foot);

  li.appendChild(body);
  return li;
}

function renderProducts(products) {
  const list = document.getElementById("produtos");
  const status = document.getElementById("status");
  list.textContent = "";
  products.forEach((p, i) => list.appendChild(buildCard(p, i)));
  bindGroupButtons(list);
  applyGroupLink();
  if (products.length) status.hidden = true;
  else {
    status.hidden = false;
    status.textContent = "Novos produtos em breve. Entre no grupo para saber primeiro.";
  }
}

async function loadCatalog() {
  const status = document.getElementById("status");
  if (!document.getElementById("produtos") || !status) return;

  if (!DB) return renderProducts(DEMO_PRODUCTS);

  try {
    renderProducts(await dbGet(
      "products?select=id,name,description,price,promo_price,image_path&order=position.asc,created_at.asc"
    ));
  } catch {
    status.hidden = false;
    status.textContent = "Não foi possível carregar o catálogo agora. Tente de novo em instantes.";
    const retry = el("button", "btn btn--sm", "Tentar de novo");
    retry.type = "button";
    retry.addEventListener("click", () => {
      status.textContent = "Carregando o catálogo...";
      loadCatalog();
    });
    status.appendChild(retry);
  }
}

loadSettings();
loadCatalog();
