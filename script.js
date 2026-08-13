/* =====================================================================
   SAC DIAMANT — script.js (Firebase + Cloudinary + سلة تسوق)
   ===================================================================== */

// ============================================================
// 1. استيراد Firebase
// ============================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  onSnapshot,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// ============================================================
// 2. إعداد Firebase — بدون أي تغيير
// ============================================================
const firebaseConfig = {
  apiKey: "AIzaSyDmDukDO-iVEOwaE2XF9PxwbFg9elplIqM",
  authDomain: "sacdiamant-d0727.firebaseapp.com",
  projectId: "sacdiamant-d0727",
  storageBucket: "sacdiamant-d0727.firebasestorage.app",
  messagingSenderId: "294321157087",
  appId: "1:294321157087:web:c658d30429bff3e0620a6a",
  measurementId: "G-G4J1RM3VQ6"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// ============================================================
// 3. إعدادات Cloudinary
//    مهم: الرفع هنا "Unsigned" عبر upload_preset فقط —
//    لا تضيفي أبداً API Key أو API Secret هنا، فهذا الملف
//    مرئي للجميع في المتصفح ولا داعي لهما إطلاقاً بهذه الطريقة.
// ============================================================
const CLOUDINARY_CLOUD_NAME = 'n9xuxykp';
const CLOUDINARY_UPLOAD_PRESET = 'sac_diamant';

// ============================================================
// 4. إعدادات التواصل
// ============================================================
const WHATSAPP_NUMBER    = '213000000000';
const FACEBOOK_USERNAME  = 'https://www.facebook.com/sac.diamant';
const INSTAGRAM_USERNAME = 'sac_diamant';

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
    <span class="order-label">اطلبي عبر:</span>
    <a class="icon-btn" href="${links.whatsapp}" target="_blank" rel="noopener" title="اطلب عبر واتساب">${ICONS.whatsapp}</a>
    <a class="icon-btn" href="${links.facebook}" target="_blank" rel="noopener" title="تواصل عبر فيسبوك">${ICONS.facebook}</a>
    <a class="icon-btn" href="${links.instagram}" target="_blank" rel="noopener" title="تواصل عبر إنستغرام">${ICONS.instagram}</a>
  `;
}

// ============================================================
// 5. دوال مساعدة
// ============================================================
function formatPrice(price) {
  return Number(price).toLocaleString('ar-DZ') + ' د.ج';
}

function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

function escapeAttr(str) {
  return escapeHTML(str).replace(/"/g, '&quot;');
}

// ============================================================
// 5.1 إشعارات (Toast) — تحل محل alert() في أغلب الحالات
// ============================================================
function toast(message, type = 'info') {
  const stack = document.getElementById('toastStack');
  if (!stack) return;
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = message;
  stack.appendChild(el);
  setTimeout(() => el.remove(), 3800);
}

// ============================================================
// 6. دوال Firebase — بدون أي تغيير في المنطق
// ============================================================
function listenToProducts(callback) {
  const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    const products = [];
    snapshot.forEach((doc) => {
      products.push({ id: doc.id, ...doc.data() });
    });
    callback(products);
  });
}

async function addProduct(productData) {
  try {
    const docRef = await addDoc(collection(db, "products"), {
      ...productData,
      createdAt: new Date().toISOString()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("خطأ في إضافة المنتج:", error);
    return { success: false, error: error.message };
  }
}

async function updateProduct(productId, data) {
  try {
    await updateDoc(doc(db, "products", productId), data);
    return { success: true };
  } catch (error) {
    console.error("خطأ في تحديث المنتج:", error);
    return { success: false, error: error.message };
  }
}

async function deleteProduct(productId) {
  try {
    await deleteDoc(doc(db, "products", productId));
    return { success: true };
  } catch (error) {
    console.error("خطأ في حذف المنتج:", error);
    return { success: false, error: error.message };
  }
}

// ============================================================
// 7. دوال رفع الصور — Cloudinary (Unsigned فقط)
//    تم دمج الكود من deepseek_javascript_20260812_f8d0cc.js
// ============================================================
function compressImage(dataUrl, maxWidth, maxHeight, quality) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}

async function uploadImageToCloudinary(imageDataUrl) {
  try {
    const compressedImage = await compressImage(imageDataUrl, 600, 600, 0.7);

    const formData = new FormData();
    formData.append('file', compressedImage);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData
      }
    );

    const data = await response.json();

    if (data.secure_url) {
      return {
        success: true,
        url: data.secure_url
      };
    } else {
      console.error('خطأ Cloudinary:', data);
      return {
        success: false,
        error: data.error?.message || 'فشل رفع الصورة'
      };
    }
  } catch (error) {
    console.error("خطأ في رفع الصورة:", error);
    return { success: false, error: error.message };
  }
}

async function uploadImage(productId, imageDataUrl) {
  return await uploadImageToCloudinary(imageDataUrl);
}

async function deleteImage(productId) {
  console.log('تم تجاهل حذف الصورة (Cloudinary يتطلب API Secret للحذف)');
  return { success: true };
}

// ============================================================
// 8. عناصر مشتركة
// ============================================================
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

  const searchToggle = document.getElementById('searchToggle');
  const searchBox = document.getElementById('searchBox');
  const headerSearchInput = document.getElementById('searchInput');
  if (searchToggle && searchBox) {
    searchToggle.addEventListener('click', () => {
      const isOpen = searchBox.classList.toggle('open');
      if (isOpen && headerSearchInput) headerSearchInput.focus();
    });
  }
}

// ============================================================
// 9. سلة التسوق
// ============================================================
const CART_KEY = 'sacDiamantCart';
let cart = [];

function loadCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    cart = raw ? JSON.parse(raw) : [];
  } catch {
    cart = [];
  }
}

function saveCart() {
  try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch { /* تجاهل */ }
}

function cartSubtotal() {
  return cart.reduce((sum, item) => sum + (Number(item.price) || 0) * item.qty, 0);
}

function addToCart(product, qty = 1) {
  const existing = cart.find(i => i.id === product.id);
  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({ id: product.id, name: product.name, price: product.price, image: product.image || null, qty });
  }
  saveCart();
  renderCartUI();
  toast(`تمت إضافة "${product.name}" للسلة ✓`, 'success');
}

function changeCartQty(id, delta) {
  const item = cart.find(i => i.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) cart = cart.filter(i => i.id !== id);
  saveCart();
  renderCartUI();
}

function removeFromCart(id) {
  cart = cart.filter(i => i.id !== id);
  saveCart();
  renderCartUI();
}

function renderCartUI() {
  const countEl = document.getElementById('cartCount');
  const itemsEl = document.getElementById('cartItems');
  const subtotalEl = document.getElementById('cartSubtotal');
  if (!itemsEl) return;

  const totalQty = cart.reduce((s, i) => s + i.qty, 0);
  if (countEl) {
    countEl.textContent = String(totalQty);
    countEl.hidden = totalQty === 0;
  }

  if (!cart.length) {
    itemsEl.innerHTML = `<div class="cart-empty">سلتك فارغة حالياً<br>أضيفي قطعة من المجموعة ✨</div>`;
  } else {
    itemsEl.innerHTML = cart.map(item => `
      <div class="cart-item" data-id="${item.id}">
        <div class="cart-item-thumb">${item.image ? `<img src="${item.image}" alt="${escapeAttr(item.name)}">` : `<span class="diamond-icon-lg" style="width:26px;height:26px;"></span>`}</div>
        <div class="cart-item-info">
          <h4>${escapeHTML(item.name)}</h4>
          <p class="price">${formatPrice(item.price)}</p>
          <div class="qty-stepper">
            <button type="button" data-action="dec" aria-label="إنقاص">−</button>
            <span>${item.qty}</span>
            <button type="button" data-action="inc" aria-label="زيادة">+</button>
          </div>
        </div>
        <button type="button" class="cart-item-remove" data-action="remove">إزالة</button>
      </div>
    `).join('');
  }

  if (subtotalEl) subtotalEl.textContent = formatPrice(cartSubtotal());
}

function openCart() {
  document.getElementById('cartDrawer')?.classList.add('open');
  document.getElementById('cartOverlay')?.classList.add('open');
}
function closeCart() {
  document.getElementById('cartDrawer')?.classList.remove('open');
  document.getElementById('cartOverlay')?.classList.remove('open');
}

function checkoutViaWhatsApp() {
  if (!cart.length) {
    toast('سلتك فارغة — أضيفي قطعة أولاً', 'error');
    return;
  }
  const lines = cart.map(i => `• ${i.name} × ${i.qty} — ${formatPrice((Number(i.price) || 0) * i.qty)}`).join('\n');
  const message = encodeURIComponent(`مرحباً، أرغب بطلب:\n${lines}\n\nالمجموع: ${formatPrice(cartSubtotal())}`);
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank', 'noopener');
}

function initCart() {
  const cartItemsEl = document.getElementById('cartItems');
  if (!cartItemsEl) return; // صفحة لا تحتوي سلة (لوحة التحكم)

  loadCart();
  renderCartUI();

  document.getElementById('cartToggle')?.addEventListener('click', openCart);
  document.getElementById('cartClose')?.addEventListener('click', closeCart);
  document.getElementById('cartOverlay')?.addEventListener('click', closeCart);
  document.getElementById('checkoutBtn')?.addEventListener('click', checkoutViaWhatsApp);

  cartItemsEl.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const id = btn.closest('.cart-item')?.dataset.id;
    if (!id) return;
    if (btn.dataset.action === 'inc') changeCartQty(id, 1);
    if (btn.dataset.action === 'dec') changeCartQty(id, -1);
    if (btn.dataset.action === 'remove') removeFromCart(id);
  });
}

// ============================================================
// 10. المتجر (index.html)
// ============================================================
let storefrontProducts = [];
let currentCategory = 'الكل';
let currentSearchTerm = '';

function buildCategoryList(products) {
  const set = new Set();
  products.forEach(p => { if (p.category && p.category.trim()) set.add(p.category.trim()); });
  return ['الكل', ...Array.from(set)];
}

function renderCategoryChips(products) {
  const wrap = document.getElementById('categoryChips');
  if (!wrap) return;
  const categories = buildCategoryList(products);
  if (!categories.includes(currentCategory)) currentCategory = 'الكل';

  wrap.innerHTML = categories.map(cat =>
    `<button type="button" class="chip${cat === currentCategory ? ' active' : ''}" data-cat="${escapeAttr(cat)}">${escapeHTML(cat)}</button>`
  ).join('');

  wrap.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      currentCategory = chip.dataset.cat;
      renderCategoryChips(storefrontProducts);
      applyStorefrontFilters();
    });
  });
}

function applyStorefrontFilters() {
  const term = currentSearchTerm.trim().toLowerCase();
  const filtered = storefrontProducts.filter(p => {
    const matchesCategory = currentCategory === 'الكل' || (p.category || '').trim() === currentCategory;
    const matchesSearch = !term ||
      p.name.toLowerCase().includes(term) ||
      (p.description || '').toLowerCase().includes(term);
    return matchesCategory && matchesSearch;
  });
  renderProductGrid(filtered);
}

function renderProductGrid(products) {
  const grid = document.getElementById('product-grid');
  if (!grid) return;
  const emptyState = document.getElementById('empty-state');

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
      ? `<img src="${p.image}" alt="${escapeAttr(p.name)}" loading="lazy">`
      : `<span class="diamond-icon-lg" aria-hidden="true"></span>`;

    const catHTML = p.category ? `<span class="product-cat">${escapeHTML(p.category)}</span>` : '';

    card.innerHTML = `
      <div class="product-image" data-action="view">${imageHTML}</div>
      <div class="product-info">
        ${catHTML}
        <h3>${escapeHTML(p.name)}</h3>
        <p class="price">${formatPrice(p.price)}</p>
        <div class="product-card-actions">
          <button type="button" class="btn btn-gold add-to-cart-btn" data-action="add">أضيفي للسلة</button>
          <button type="button" class="details-link" data-action="view">التفاصيل</button>
        </div>
      </div>
    `;

    card.querySelector('[data-action="add"]').addEventListener('click', (e) => {
      e.stopPropagation();
      addToCart(p, 1);
    });
    card.querySelectorAll('[data-action="view"]').forEach(el =>
      el.addEventListener('click', () => openQuickView(p))
    );

    grid.appendChild(card);
  });
}

function renderStorefront(products) {
  storefrontProducts = products || [];
  renderCategoryChips(storefrontProducts);
  applyStorefrontFilters();
}

function renderContactLinks() {
  const el = document.getElementById('contact-links');
  if (!el) return;
  el.innerHTML = orderRowHTML(buildOrderLinks(null));
}

// ---- Quick view modal ----
function openQuickView(product) {
  const overlay = document.getElementById('quickView');
  if (!overlay) return;

  document.getElementById('qvImage').src = product.image || '';
  document.getElementById('qvImage').alt = product.name;
  document.getElementById('qvCat').textContent = product.category || '';
  document.getElementById('qvName').textContent = product.name;
  document.getElementById('qvPrice').textContent = formatPrice(product.price);
  document.getElementById('qvDesc').textContent = product.description || '';
  document.getElementById('qvOrderRow').innerHTML = orderRowHTML(buildOrderLinks(product));

  const addBtn = document.getElementById('qvAddToCart');
  addBtn.onclick = () => addToCart(product, 1);

  overlay.classList.add('open');
}

function closeQuickView() {
  document.getElementById('quickView')?.classList.remove('open');
}

function initQuickView() {
  const overlay = document.getElementById('quickView');
  if (!overlay) return;
  document.getElementById('qvClose')?.addEventListener('click', closeQuickView);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeQuickView();
  });
}

function initStorefrontSearch() {
  const headerInput = document.getElementById('searchInput');
  const catalogInput = document.getElementById('catalogSearch');
  if (!headerInput && !catalogInput) return;

  function onSearchInput(value, source) {
    currentSearchTerm = value;
    if (source !== headerInput && headerInput) headerInput.value = value;
    if (source !== catalogInput && catalogInput) catalogInput.value = value;
    applyStorefrontFilters();
  }

  headerInput?.addEventListener('input', () => onSearchInput(headerInput.value, headerInput));
  catalogInput?.addEventListener('input', () => onSearchInput(catalogInput.value, catalogInput));
}

// ============================================================
// 11. لوحة التحكم (dashboard.html)
// ============================================================
function setUploadStatus(text, type) {
  const el = document.getElementById('upload-status');
  if (!el) return;
  el.textContent = text;
  el.className = `upload-status${type ? ' ' + type : ''}`;
}

function populateCategorySuggestions(products) {
  const datalist = document.getElementById('category-suggestions');
  if (!datalist) return;
  const set = new Set();
  products.forEach(p => { if (p.category && p.category.trim()) set.add(p.category.trim()); });
  datalist.innerHTML = Array.from(set).map(c => `<option value="${escapeAttr(c)}"></option>`).join('');
}

function initDashboard() {
  const loginGate = document.getElementById('login-gate');
  const dashboardMain = document.getElementById('dashboard-main');
  if (!loginGate || !dashboardMain) return;

  const loginForm = document.getElementById('login-form');
  const loginError = document.getElementById('login-error');
  const emailInput = document.getElementById('login-email');
  const passwordInput = document.getElementById('login-password');

  function showDashboard() {
    loginGate.hidden = true;
    dashboardMain.hidden = false;
    loadDashboardProducts();
  }

  function hideDashboard() {
    loginGate.hidden = false;
    dashboardMain.hidden = true;
  }

  onAuthStateChanged(auth, (user) => {
    if (user) showDashboard();
    else hideDashboard();
  });

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = emailInput.value;
    const password = passwordInput.value;
    try {
      await signInWithEmailAndPassword(auth, email, password);
      loginError.hidden = true;
    } catch (error) {
      loginError.textContent = 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
      loginError.hidden = false;
      console.error("خطأ في تسجيل الدخول:", error);
    }
  });

  const form = document.getElementById('product-form');
  const nameInput = document.getElementById('p-name');
  const priceInput = document.getElementById('p-price');
  const categoryInput = document.getElementById('p-category');
  const descInput = document.getElementById('p-desc');
  const imageInput = document.getElementById('p-image');
  const imagePreview = document.getElementById('image-preview');
  const removeImageBtn = document.getElementById('remove-image-btn');

  let pendingImage = null;

  imageInput.addEventListener('change', async () => {
    const file = imageInput.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast('الصورة كبيرة جداً — يفضّل أقل من 5 ميغابايت', 'error');
      imageInput.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const compressed = await compressImage(e.target.result, 700, 700, 0.75);
        pendingImage = compressed;
        imagePreview.innerHTML = `<img src="${compressed}" alt="معاينة الصورة">`;
        removeImageBtn.disabled = false;
        setUploadStatus('', '');
      } catch (error) {
        console.error('خطأ في ضغط الصورة:', error);
        pendingImage = e.target.result;
        imagePreview.innerHTML = `<img src="${pendingImage}" alt="معاينة الصورة">`;
        removeImageBtn.disabled = false;
      }
    };
    reader.readAsDataURL(file);
  });

  removeImageBtn.addEventListener('click', () => {
    pendingImage = null;
    imageInput.value = '';
    imagePreview.innerHTML = `<span class="preview-placeholder">لا توجد صورة</span>`;
    removeImageBtn.disabled = true;
    setUploadStatus('', '');
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const productData = {
      name: nameInput.value.trim(),
      price: Number(priceInput.value) || 0,
      category: categoryInput.value.trim(),
      description: descInput.value.trim(),
      image: null
    };

    if (!productData.name) {
      toast('الرجاء إدخال اسم المنتج', 'error');
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'جاري الإضافة...';
    submitBtn.disabled = true;

    try {
      const result = await addProduct(productData);

      if (!result.success) {
        toast('حدث خطأ في إضافة المنتج: ' + result.error, 'error');
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
        return;
      }

      const productId = result.id;

      if (pendingImage) {
        setUploadStatus('جاري رفع الصورة...', 'pending');
        const uploadResult = await uploadImage(productId, pendingImage);
        if (uploadResult.success) {
          await updateProduct(productId, { image: uploadResult.url });
          setUploadStatus('تم رفع الصورة ✓', 'success');
        } else {
          console.warn('تم إضافة المنتج لكن فشل رفع الصورة:', uploadResult.error);
          setUploadStatus('فشل رفع الصورة: ' + uploadResult.error, 'error');
          toast('تم إضافة المنتج لكن فشل رفع الصورة — يمكنك تغييرها من القائمة أدناه', 'error');
        }
      }

      form.reset();
      pendingImage = null;
      imagePreview.innerHTML = `<span class="preview-placeholder">لا توجد صورة</span>`;
      removeImageBtn.disabled = true;

      toast('تم إضافة المنتج بنجاح ✨', 'success');
    } catch (error) {
      console.error('خطأ:', error);
      toast('حدث خطأ غير متوقع: ' + error.message, 'error');
    } finally {
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }
  });
}

function loadDashboardProducts() {
  const list = document.getElementById('dash-product-list');
  const emptyState = document.getElementById('dash-empty-state');

  listenToProducts((products) => {
    populateCategorySuggestions(products);
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
        ? `<img src="${p.image}" alt="${escapeAttr(p.name)}">`
        : `<span class="diamond-icon-lg" aria-hidden="true"></span>`;

      row.innerHTML = `
        <div class="dash-thumb">${thumbHTML}</div>
        <div class="dash-item-fields">
          <input type="text" data-field="name" value="${escapeAttr(p.name)}" aria-label="اسم المنتج">
          <div class="field-inline">
            <input type="number" data-field="price" value="${p.price}" min="0" aria-label="السعر">
            <input type="text" data-field="category" value="${escapeAttr(p.category || '')}" list="category-suggestions" placeholder="القسم" aria-label="القسم">
          </div>
          <div class="field-inline">
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

    attachDashboardListeners(list);
  });
}

function attachDashboardListeners(list) {
  list.querySelectorAll('.dash-product-item').forEach(row => {
    const id = row.dataset.id;
    const flash = row.querySelector('[data-role="flash"]');

    function flashSaved() {
      if (!flash) return;
      flash.classList.add('show');
      clearTimeout(flash._t);
      flash._t = setTimeout(() => flash.classList.remove('show'), 1200);
    }

    row.querySelector('[data-field="name"]').addEventListener('change', async (e) => {
      const val = e.target.value.trim();
      if (!val) return;
      await updateProduct(id, { name: val });
      flashSaved();
    });

    row.querySelector('[data-field="price"]').addEventListener('change', async (e) => {
      await updateProduct(id, { price: Number(e.target.value) || 0 });
      flashSaved();
    });

    row.querySelector('[data-field="category"]').addEventListener('change', async (e) => {
      await updateProduct(id, { category: e.target.value.trim() });
      flashSaved();
    });

    const imageFileInput = row.querySelector('[data-field="image-file"]');
    imageFileInput.addEventListener('change', async () => {
      const file = imageFileInput.files[0];
      if (!file) return;

      if (file.size > 5 * 1024 * 1024) {
        toast('الصورة كبيرة جداً', 'error');
        imageFileInput.value = '';
        return;
      }

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const compressed = await compressImage(e.target.result, 700, 700, 0.75);
          toast('جاري رفع الصورة...', 'info');
          const result = await uploadImage(id, compressed);
          if (result.success) {
            await updateProduct(id, { image: result.url });
            flashSaved();
            toast('تم تحديث الصورة ✓', 'success');
          } else {
            toast('فشل رفع الصورة: ' + result.error, 'error');
          }
        } catch (error) {
          console.error('خطأ:', error);
          toast('حدث خطأ في رفع الصورة', 'error');
        }
      };
      reader.readAsDataURL(file);
    });

    row.querySelector('[data-action="remove-image"]').addEventListener('click', async () => {
      await deleteImage(id);
      await updateProduct(id, { image: null });
      flashSaved();
    });

    row.querySelector('[data-action="delete"]').addEventListener('click', async () => {
      if (!confirm('حذف هذا المنتج نهائياً؟')) return;
      await deleteProduct(id);
      await deleteImage(id);
    });
  });
}

// ============================================================
// 12. تشغيل كل شيء
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  initShared();
  renderContactLinks();
  initCart();
  initQuickView();
  initStorefrontSearch();
  initDashboard();

  const isDashboard = document.querySelector('.dashboard-body');
  if (!isDashboard) {
    listenToProducts((products) => {
      renderStorefront(products);
    });
  }
});
