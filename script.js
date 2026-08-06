/* =====================================================================
   SAC DIAMANT — script.js
   يدير هذا الملف: بيانات المنتجات (تخزين محلي)، عرض المتجر، ولوحة التحكم.
   ===================================================================== */

const STORAGE_KEY   = 'sacDiamantProducts';
const ADMIN_PASSWORD = 'diamant2026'; // غيّري كلمة المرور هذه إلى ما تناسبك
const AUTH_KEY = 'sacDiamantAdminAuth';
const MAX_IMAGE_MB = 1.5;

/* ---------------------------------------------------------------------
   روابط التواصل — عدّلي القيم الثلاث هذه فقط، وستُطبَّق تلقائياً
   على كل بطاقة منتج وعلى قسم التواصل في أسفل الصفحة.
   --------------------------------------------------------------------- */
const WHATSAPP_NUMBER    = '213000000000'; // رقم الواتساب بصيغة دولية بدون + أو 00
const FACEBOOK_USERNAME  = 'sac.diamant';  // اسم المستخدم في فيسبوك (يفتح محادثة ماسنجر مباشرة)
const INSTAGRAM_USERNAME = 'sac.diamant';  // اسم المستخدم في إنستغرام (يفتح الصفحة الشخصية)

/* أيقونات بسيطة (SVG) لكل منصة */
const ICONS = {
  whatsapp: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20l1.3-3.9A8 8 0 1 1 8.9 19.7L4 20Z"/><path d="M8.5 9.5c0 3 2.5 5.5 5.5 5.5.6 0 1-.4 1-1v-1l-2-1-1 1a5 5 0 0 1-2.5-2.5l1-1-1-2H9c-.6 0-.5.4-.5 1Z"/></svg>',
  facebook: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 9h2V6h-2c-1.7 0-3 1.3-3 3v2H9v3h2v6h3v-6h2.2l.8-3H14V9.3c0-.2.1-.3.3-.3Z"/><circle cx="12" cy="12" r="9.5"/></svg>',
  instagram: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="3.6"/><circle cx="17" cy="7" r="0.6" fill="currentColor" stroke="none"/></svg>'
};

function buildOrderLinks(product) {
  const message = encodeURIComponent(
    product ? `مرحباً، أرغب بطلب: ${product.name} — ${formatPrice(product.price)}` : 'مرحباً، أرغب بالاستفسار عن منتجاتكم'
  );
  return {
    whatsapp: `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`,
    facebook: `https://m.me/${FACEBOOK_USERNAME}`,
    instagram: `https://instagram.com/${INSTAGRAM_USERNAME}`
  };
}

function orderRowHTML(links) {
  return `
    <div class="order-row">
      <span class="order-label">اطلبي عبر:</span>
      <a class="icon-btn" href="${links.whatsapp}" target="_blank" rel="noopener" title="اطلب عبر واتساب" aria-label="اطلب عبر واتساب">${ICONS.whatsapp}</a>
      <a class="icon-btn" href="${links.facebook}" target="_blank" rel="noopener" title="تواصل عبر فيسبوك" aria-label="تواصل عبر فيسبوك">${ICONS.facebook}</a>
      <a class="icon-btn" href="${links.instagram}" target="_blank" rel="noopener" title="تواصل عبر إنستغرام" aria-label="تواصل عبر إنستغرام">${ICONS.instagram}</a>
    </div>
  `;
}

/* ---------------------------------------------------------------------
   بيانات تجريبية تظهر أول مرة فقط (احذفيها من لوحة التحكم متى شئتِ)
   --------------------------------------------------------------------- */
const SAMPLE_PRODUCTS = [
  {
    id: 'sample-1',
    name: 'حقيبة يد جلدية — تصميم كلاسيكي',
    price: 8500,
    description: 'حقيبة جلد طبيعي بلمسة ذهبية، قياس متوسط يناسب الاستعمال اليومي.',
    image: null
  },
  {
    id: 'sample-2',
    name: 'إكسسوار ذهبي مطلي',
    price: 2200,
    description: 'قطعة أنيقة تكمل أي إطلالة، مقاومة للاسوداد.',
    image: null
  }
];

/* ---------------------------------------------------------------------
   طبقة التخزين
   --------------------------------------------------------------------- */
function getProducts() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === null) {
    // أول زيارة: نزرع منتجات تجريبية حتى لا يظهر المتجر فارغاً
    saveProducts(SAMPLE_PRODUCTS);
    return SAMPLE_PRODUCTS;
  }
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.error('تعذّرت قراءة بيانات المنتجات', e);
    return [];
  }
}

function saveProducts(products) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
    return true;
  } catch (e) {
    console.error('تعذّر حفظ المنتجات (قد تكون المساحة ممتلئة)', e);
    alert('تعذّر الحفظ — على الأرجح المساحة المحلية ممتلئة. جرّبي صورة أصغر حجماً.');
    return false;
  }
}

function formatPrice(price) {
  return Number(price).toLocaleString('ar-DZ') + ' د.ج';
}

function uid() {
  return 'p-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
}

/* ---------------------------------------------------------------------
   عناصر مشتركة (السنة في الفوتر + قائمة الجوال)
   --------------------------------------------------------------------- */
function initShared() {
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const menuToggle = document.getElementById('menuToggle');
  const mainNav = document.querySelector('.main-nav');
  if (menuToggle && mainNav) {
    menuToggle.addEventListener('click', () => {
      const isOpen = mainNav.classList.toggle('open');
      menuToggle.setAttribute('aria-expanded', String(isOpen));
    });
    mainNav.querySelectorAll('a').forEach(a =>
      a.addEventListener('click', () => {
        mainNav.classList.remove('open');
        menuToggle.setAttribute('aria-expanded', 'false');
      })
    );
  }
}

/* =======================================================================
   واجهة المتجر (index.html)
   ======================================================================= */
function renderStorefront() {
  const grid = document.getElementById('product-grid');
  if (!grid) return; // لسنا في صفحة المتجر

  const emptyState = document.getElementById('empty-state');
  const products = getProducts();

  grid.innerHTML = '';

  if (!products.length) {
    if (emptyState) emptyState.hidden = false;
    return;
  }
  if (emptyState) emptyState.hidden = true;

  products.forEach(p => {
    const card = document.createElement('article');
    card.className = 'product-card';

    const imageHTML = p.image
      ? `<img src="${p.image}" alt="${escapeHTML(p.name)}">`
      : `<span class="diamond-icon-lg" aria-hidden="true"></span>`;

    const descHTML = p.description
      ? `<p class="product-desc">${escapeHTML(p.description)}</p>`
      : '';

    const links = buildOrderLinks(p);

    card.innerHTML = `
      <div class="product-image">${imageHTML}</div>
      <div class="product-info">
        <h3>${escapeHTML(p.name)}</h3>
        <p class="price">${formatPrice(p.price)}</p>
        ${descHTML}
        ${orderRowHTML(links)}
      </div>
    `;
    grid.appendChild(card);
  });
}

function renderContactLinks() {
  const el = document.getElementById('contact-links');
  if (!el) return;
  el.innerHTML = orderRowHTML(buildOrderLinks(null));
}

function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

/* =======================================================================
   لوحة التحكم (dashboard.html)
   ======================================================================= */
function initDashboard() {
  const loginGate = document.getElementById('login-gate');
  const dashboardMain = document.getElementById('dashboard-main');
  if (!loginGate || !dashboardMain) return; // لسنا في صفحة اللوحة

  /* ---- تسجيل الدخول (حماية بسيطة من جهة المتصفح فقط، وليست حماية حقيقية) ---- */
  const loginForm = document.getElementById('login-form');
  const loginError = document.getElementById('login-error');

  function showDashboard() {
    loginGate.hidden = true;
    dashboardMain.hidden = false;
    renderDashboardList();
  }

  if (sessionStorage.getItem(AUTH_KEY) === 'true') {
    showDashboard();
  }

  loginForm.addEventListener('submit', e => {
    e.preventDefault();
    const val = document.getElementById('login-password').value;
    if (val === ADMIN_PASSWORD) {
      sessionStorage.setItem(AUTH_KEY, 'true');
      loginError.hidden = true;
      showDashboard();
    } else {
      loginError.hidden = false;
    }
  });

  /* ---- نموذج إضافة منتج ---- */
  const form = document.getElementById('product-form');
  const nameInput = document.getElementById('p-name');
  const priceInput = document.getElementById('p-price');
  const descInput = document.getElementById('p-desc');
  const imageInput = document.getElementById('p-image');
  const imagePreview = document.getElementById('image-preview');
  const removeImageBtn = document.getElementById('remove-image-btn');

  let pendingImage = null;

  imageInput.addEventListener('change', () => {
    const file = imageInput.files[0];
    if (!file) return;

    if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
      alert(`الصورة كبيرة جداً — يفضّل أقل من ${MAX_IMAGE_MB} ميغابايت لتفادي امتلاء التخزين المحلي.`);
      imageInput.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      pendingImage = reader.result;
      imagePreview.innerHTML = `<img src="${pendingImage}" alt="معاينة الصورة">`;
      removeImageBtn.disabled = false;
    };
    reader.readAsDataURL(file);
  });

  removeImageBtn.addEventListener('click', () => {
    pendingImage = null;
    imageInput.value = '';
    imagePreview.innerHTML = `<span class="preview-placeholder">لا توجد صورة</span>`;
    removeImageBtn.disabled = true;
  });

  form.addEventListener('submit', e => {
    e.preventDefault();

    const newProduct = {
      id: uid(),
      name: nameInput.value.trim(),
      price: Number(priceInput.value) || 0,
      description: descInput.value.trim(),
      image: pendingImage
    };

    if (!newProduct.name) return;

    const products = getProducts();
    products.unshift(newProduct);
    if (!saveProducts(products)) return;

    form.reset();
    pendingImage = null;
    imagePreview.innerHTML = `<span class="preview-placeholder">لا توجد صورة</span>`;
    removeImageBtn.disabled = true;

    renderDashboardList();
  });

  renderDashboardList();
}

function renderDashboardList() {
  const list = document.getElementById('dash-product-list');
  if (!list) return;

  const emptyState = document.getElementById('dash-empty-state');
  const products = getProducts();

  list.innerHTML = '';

  if (!products.length) {
    if (emptyState) emptyState.hidden = false;
    return;
  }
  if (emptyState) emptyState.hidden = true;

  products.forEach(p => {
    const row = document.createElement('div');
    row.className = 'dash-product-item';
    row.dataset.id = p.id;

    const thumbHTML = p.image
      ? `<img src="${p.image}" alt="${escapeHTML(p.name)}">`
      : `<span class="diamond-icon-lg" aria-hidden="true"></span>`;

    row.innerHTML = `
      <div class="dash-thumb">${thumbHTML}</div>
      <div class="dash-item-fields">
        <input type="text" data-field="name" value="${escapeAttr(p.name)}" aria-label="اسم المنتج">
        <div class="field-inline">
          <input type="number" data-field="price" value="${p.price}" min="0" aria-label="السعر">
          <label class="btn btn-ghost btn-small" style="cursor:pointer;">
            تغيير الصورة
            <input type="file" accept="image/*" data-field="image-file" hidden>
          </label>
          <button type="button" class="btn btn-outline-danger btn-small" data-action="remove-image" ${p.image ? '' : 'disabled'}>إزالة الصورة</button>
        </div>
        <span class="save-flash" data-role="flash">تم الحفظ ✓</span>
      </div>
      <div class="dash-item-actions">
        <button type="button" class="btn btn-outline-danger btn-small" data-action="delete">حذف المنتج</button>
      </div>
    `;
    list.appendChild(row);
  });

  attachRowListeners(list);
}

function attachRowListeners(list) {
  list.querySelectorAll('.dash-product-item').forEach(row => {
    const id = row.dataset.id;
    const flash = row.querySelector('[data-role="flash"]');

    function flashSaved() {
      if (!flash) return;
      flash.classList.add('show');
      clearTimeout(flash._t);
      flash._t = setTimeout(() => flash.classList.remove('show'), 1200);
    }

    function updateProduct(mutator) {
      const products = getProducts();
      const idx = products.findIndex(p => p.id === id);
      if (idx === -1) return;
      mutator(products[idx]);
      if (saveProducts(products)) flashSaved();
    }

    const nameInput = row.querySelector('[data-field="name"]');
    nameInput.addEventListener('change', () => {
      const val = nameInput.value.trim();
      if (!val) { nameInput.value = getProducts().find(p => p.id === id)?.name || ''; return; }
      updateProduct(p => { p.name = val; });
    });

    const priceInput = row.querySelector('[data-field="price"]');
    priceInput.addEventListener('change', () => {
      updateProduct(p => { p.price = Number(priceInput.value) || 0; });
    });

    const imageFileInput = row.querySelector('[data-field="image-file"]');
    imageFileInput.addEventListener('change', () => {
      const file = imageFileInput.files[0];
      if (!file) return;
      if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
        alert(`الصورة كبيرة جداً — يفضّل أقل من ${MAX_IMAGE_MB} ميغابايت.`);
        imageFileInput.value = '';
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        updateProduct(p => { p.image = reader.result; });
        renderDashboardList();
      };
      reader.readAsDataURL(file);
    });

    row.querySelector('[data-action="remove-image"]').addEventListener('click', () => {
      updateProduct(p => { p.image = null; });
      renderDashboardList();
    });

    row.querySelector('[data-action="delete"]').addEventListener('click', () => {
      if (!confirm('حذف هذا المنتج نهائياً؟')) return;
      const products = getProducts().filter(p => p.id !== id);
      saveProducts(products);
      renderDashboardList();
    });
  });
}

function escapeAttr(str) {
  return escapeHTML(str).replace(/"/g, '&quot;');
}

/* =======================================================================
   نقطة الانطلاق
   ======================================================================= */
document.addEventListener('DOMContentLoaded', () => {
  initShared();
  renderStorefront();
  renderContactLinks();
  initDashboard();
});
