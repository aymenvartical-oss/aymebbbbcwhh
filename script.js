/* =====================================================================
   SAC DIAMANT — script.js (نسخة مطوّرة مع جميع الميزات)
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
  orderBy,
  getDocs,
  where
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// ============================================================
// 2. إعداد Firebase
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
// ============================================================
const CLOUDINARY_CLOUD_NAME = 'n9xuxykp';
const CLOUDINARY_UPLOAD_PRESET = 'sac_diamant';
const CLOUDINARY_API_KEY = 'f74f2K2eVN6HRaHOEezQqu4OnoU';

// ============================================================
// 4. إعدادات التواصل
// ============================================================
const WHATSAPP_NUMBER = '213000000000';
const FACEBOOK_USERNAME = 'https://www.facebook.com/sac.diamant';
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
    <div class="order-row">
      <span class="order-label">اطلبي عبر:</span>
      <a class="icon-btn" href="${links.whatsapp}" target="_blank" rel="noopener" title="اطلب عبر واتساب">${ICONS.whatsapp}</a>
      <a class="icon-btn" href="${links.facebook}" target="_blank" rel="noopener" title="تواصل عبر فيسبوك">${ICONS.facebook}</a>
      <a class="icon-btn" href="${links.instagram}" target="_blank" rel="noopener" title="تواصل عبر إنستغرام">${ICONS.instagram}</a>
    </div>
  `;
}

// ============================================================
// 5. دوال مساعدة
// ============================================================
function formatPrice(price) {
  return Number(price).toLocaleString('ar-DZ') + ' د.ج';
}

function escapeHTML(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function escapeAttr(str) {
  return escapeHTML(str).replace(/"/g, '&quot;');
}

// ============================================================
// 6. دوال Firebase
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

function listenToReviews(callback) {
  const q = query(collection(db, "reviews"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    const reviews = [];
    snapshot.forEach((doc) => {
      reviews.push({ id: doc.id, ...doc.data() });
    });
    callback(reviews);
  });
}

function listenToContestants(callback) {
  const q = query(collection(db, "contestants"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    const contestants = [];
    snapshot.forEach((doc) => {
      contestants.push({ id: doc.id, ...doc.data() });
    });
    callback(contestants);
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

async function addReview(reviewData) {
  try {
    await addDoc(collection(db, "reviews"), {
      ...reviewData,
      createdAt: new Date().toISOString()
    });
    return { success: true };
  } catch (error) {
    console.error("خطأ في إضافة التقييم:", error);
    return { success: false, error: error.message };
  }
}

async function addContestant(contestantData) {
  try {
    await addDoc(collection(db, "contestants"), {
      ...contestantData,
      createdAt: new Date().toISOString()
    });
    return { success: true };
  } catch (error) {
    console.error("خطأ في إضافة المشترك:", error);
    return { success: false, error: error.message };
  }
}

async function addOrder(orderData) {
  try {
    await addDoc(collection(db, "orders"), {
      ...orderData,
      createdAt: new Date().toISOString(),
      status: 'جديد'
    });
    return { success: true };
  } catch (error) {
    console.error("خطأ في إضافة الطلب:", error);
    return { success: false, error: error.message };
  }
}

// ============================================================
// 7. دوال رفع الصور - Cloudinary (متعددة الصور)
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

async function uploadImagesToCloudinary(imagesDataUrls) {
  const uploadedUrls = [];
  for (const imageDataUrl of imagesDataUrls) {
    try {
      const compressed = await compressImage(imageDataUrl, 600, 600, 0.7);
      const formData = new FormData();
      formData.append('file', compressed);
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
      formData.append('api_key', CLOUDINARY_API_KEY);
      
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: 'POST', body: formData }
      );
      
      const data = await response.json();
      if (data.secure_url) {
        uploadedUrls.push(data.secure_url);
      }
    } catch (error) {
      console.error('خطأ في رفع صورة:', error);
    }
  }
  return uploadedUrls;
}

async function uploadImage(productId, imageDataUrl) {
  const result = await uploadImagesToCloudinary([imageDataUrl]);
  return result.length > 0 ? { success: true, url: result[0] } : { success: false, error: 'فشل رفع الصورة' };
}

async function deleteImage(productId) {
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
}

// ============================================================
// 9. المتجر (index.html)
// ============================================================
function renderStorefront(products) {
  const grid = document.getElementById('product-grid');
  if (!grid) return;
  const emptyState = document.getElementById('empty-state');

  grid.innerHTML = '';
  if (!products || !products.length) {
    if (emptyState) emptyState.hidden = false;
    return;
  }
  if (emptyState) emptyState.hidden = true;

  products.forEach(p => {
    const card = document.createElement('article');
    card.className = 'product-card';

    // عرض الصور - الصورة الأولى كرئيسية
    let imagesHTML = '';
    if (p.images && p.images.length > 0) {
      imagesHTML = `
        <div class="product-gallery">
          <img src="${p.images[0]}" alt="${escapeHTML(p.name)}" class="gallery-main" loading="lazy">
          ${p.images.length > 1 ? `
            <div class="gallery-thumbs">
              ${p.images.map(img => `<img src="${img}" alt="${escapeHTML(p.name)}" loading="lazy">`).join('')}
            </div>
          ` : ''}
        </div>
      `;
    } else {
      imagesHTML = `<span class="diamond-icon-lg" aria-hidden="true"></span>`;
    }

    const descHTML = p.shortDescription
      ? `<p class="product-desc">${escapeHTML(p.shortDescription)}</p>`
      : '';

    const starsHTML = p.averageRating
      ? `<div class="product-rating">⭐ ${p.averageRating.toFixed(1)}</div>`
      : '';

    const links = buildOrderLinks(p);

    card.innerHTML = `
      <div class="product-image">${imagesHTML}</div>
      <div class="product-info">
        <h3>${escapeHTML(p.name)}</h3>
        <p class="price">${formatPrice(p.price)}</p>
        ${starsHTML}
        ${descHTML}
        <div class="product-actions">
          ${orderRowHTML(links)}
          <button class="btn btn-gold btn-small quick-order-btn" data-product="${escapeHTML(p.name)}">اطلب الآن</button>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });

  // تفعيل أزرار الطلب السريع
  document.querySelectorAll('.quick-order-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const productName = btn.dataset.product;
      const orderInput = document.getElementById('order-product');
      if (orderInput) {
        orderInput.value = productName;
        document.getElementById('contact').scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
}

function renderContactLinks() {
  const el = document.getElementById('contact-links');
  if (!el) return;
  el.innerHTML = orderRowHTML(buildOrderLinks(null));
}

// ============================================================
// 10. التقييمات
// ============================================================
function renderReviews(reviews) {
  const list = document.getElementById('reviews-list');
  if (!list) return;

  list.innerHTML = '';
  if (!reviews || !reviews.length) {
    list.innerHTML = '<p class="no-reviews">لا توجد تقييمات بعد — كوني أول من يقيّم! 🌟</p>';
    return;
  }

  reviews.forEach(r => {
    const item = document.createElement('div');
    item.className = 'review-item';
    const stars = '⭐'.repeat(r.stars) + '☆'.repeat(5 - r.stars);
    item.innerHTML = `
      <div class="review-header">
        <strong>${escapeHTML(r.name)}</strong>
        <span class="review-stars">${stars}</span>
      </div>
      <p>${escapeHTML(r.text)}</p>
      <small>${new Date(r.createdAt).toLocaleDateString('ar-EG')}</small>
    `;
    list.appendChild(item);
  });
}

function initReviewForm() {
  const form = document.getElementById('review-form');
  if (!form) return;

  // نظام النجوم
  const starsContainer = document.getElementById('stars-input');
  const starsInput = document.getElementById('review-stars');
  if (starsContainer) {
    starsContainer.querySelectorAll('[data-star]').forEach(el => {
      el.addEventListener('click', () => {
        const val = parseInt(el.dataset.star);
        starsInput.value = val;
        starsContainer.querySelectorAll('[data-star]').forEach(s => {
          s.style.opacity = parseInt(s.dataset.star) <= val ? '1' : '0.3';
        });
      });
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('review-name').value.trim();
    const text = document.getElementById('review-text').value.trim();
    const stars = parseInt(starsInput.value) || 5;

    if (!name || !text) {
      alert('الرجاء إدخال الاسم والتقييم');
      return;
    }

    const result = await addReview({ name, text, stars });
    if (result.success) {
      form.reset();
      alert('شكراً لكِ على تقييمك! 🌟');
    } else {
      alert('حدث خطأ في نشر التقييم: ' + result.error);
    }
  });
}

// ============================================================
// 11. المسابقات
// ============================================================
function initContestForm() {
  const form = document.getElementById('contest-form');
  if (!form) return;

  // عرض الفائزة السابقة
  const winnerEl = document.getElementById('contest-winner');
  const winnerNameEl = document.getElementById('winner-name');
  // يمكن تحميل اسم الفائزة من Firebase لاحقاً

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('contest-name').value.trim();
    const email = document.getElementById('contest-email').value.trim();
    const phone = document.getElementById('contest-phone').value.trim();
    const answer = document.getElementById('contest-answer').value.trim();

    if (!name || !email || !answer) {
      alert('الرجاء ملء جميع الحقول المطلوبة');
      return;
    }

    const result = await addContestant({ name, email, phone, answer });
    if (result.success) {
      form.reset();
      alert('🎉 تم الاشتراك في المسابقة! حظاً موفقاً!');
    } else {
      alert('حدث خطأ: ' + result.error);
    }
  });
}

// ============================================================
// 12. الطلب السريع
// ============================================================
function initQuickOrderForm() {
  const form = document.getElementById('quick-order-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('order-name').value.trim();
    const product = document.getElementById('order-product').value.trim();
    const note = document.getElementById('order-note').value.trim();

    if (!name || !product) {
      alert('الرجاء إدخال اسمك والمنتج المطلوب');
      return;
    }

    const result = await addOrder({ name, product, note });
    if (result.success) {
      form.reset();
      alert('📩 تم استلام طلبك! سأتواصل معك قريباً 💕');
    } else {
      alert('حدث خطأ: ' + result.error);
    }
  });
}

// ============================================================
// 13. لوحة التحكم
// ============================================================
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
    loadDashboardReviews();
    loadDashboardContestants();
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
    try {
      await signInWithEmailAndPassword(auth, emailInput.value, passwordInput.value);
      loginError.hidden = true;
    } catch (error) {
      loginError.hidden = false;
      console.error("خطأ في تسجيل الدخول:", error);
    }
  });

  // تسجيل خروج
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      signOut(auth);
    });
  }

  // نموذج إضافة منتج
  const form = document.getElementById('product-form');
  const nameInput = document.getElementById('p-name');
  const priceInput = document.getElementById('p-price');
  const shortDescInput = document.getElementById('p-short-desc');
  const descInput = document.getElementById('p-desc');
  const imagesInput = document.getElementById('p-images');
  const imagesPreview = document.getElementById('images-preview');
  const removeImagesBtn = document.getElementById('remove-images-btn');

  let pendingImages = [];

  imagesInput.addEventListener('change', async () => {
    const files = Array.from(imagesInput.files);
    if (files.length > 3) {
      alert('يمكنك اختيار 3 صور كحد أقصى');
      imagesInput.value = '';
      return;
    }

    pendingImages = [];
    imagesPreview.innerHTML = '';

    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        alert('الصورة كبيرة جداً');
        continue;
      }
      const reader = new FileReader();
      const dataUrl = await new Promise((resolve) => {
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsDataURL(file);
      });
      pendingImages.push(dataUrl);
      const img = document.createElement('img');
      img.src = dataUrl;
      img.alt = 'معاينة الصورة';
      imagesPreview.appendChild(img);
    }
    removeImagesBtn.disabled = pendingImages.length === 0;
  });

  removeImagesBtn.addEventListener('click', () => {
    pendingImages = [];
    imagesInput.value = '';
    imagesPreview.innerHTML = `<span class="preview-placeholder">لا توجد صور</span>`;
    removeImagesBtn.disabled = true;
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const productData = {
      name: nameInput.value.trim(),
      price: Number(priceInput.value) || 0,
      shortDescription: shortDescInput.value.trim(),
      description: descInput.value.trim(),
      images: []
    };

    if (!productData.name) {
      alert('الرجاء إدخال اسم المنتج');
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'جاري الإضافة...';
    submitBtn.disabled = true;

    try {
      // 1. رفع الصور إلى Cloudinary
      let uploadedUrls = [];
      if (pendingImages.length > 0) {
        uploadedUrls = await uploadImagesToCloudinary(pendingImages);
      }
      productData.images = uploadedUrls;

      // 2. إضافة المنتج إلى Firestore
      const result = await addProduct(productData);
      if (!result.success) {
        alert('حدث خطأ في إضافة المنتج: ' + result.error);
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
        return;
      }

      form.reset();
      pendingImages = [];
      imagesPreview.innerHTML = `<span class="preview-placeholder">لا توجد صور</span>`;
      removeImagesBtn.disabled = true;
      alert('تم إضافة المنتج بنجاح! ✨');
    } catch (error) {
      console.error('خطأ:', error);
      alert('حدث خطأ غير متوقع: ' + error.message);
    } finally {
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }
  });
}

// ============================================================
// 14. لوحة التحكم - عرض المنتجات
// ============================================================
function loadDashboardProducts() {
  const list = document.getElementById('dash-product-list');
  const emptyState = document.getElementById('dash-empty-state');

  listenToProducts((products) => {
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

      const thumbHTML = p.images && p.images.length > 0
        ? `<img src="${p.images[0]}" alt="${escapeHTML(p.name)}">`
        : `<span class="diamond-icon-lg" aria-hidden="true"></span>`;

      row.innerHTML = `
        <div class="dash-thumb">${thumbHTML}</div>
        <div class="dash-item-fields">
          <input type="text" data-field="name" value="${escapeAttr(p.name)}" aria-label="اسم المنتج">
          <input type="text" data-field="shortDescription" value="${escapeAttr(p.shortDescription || '')}" aria-label="وصف قصير" placeholder="وصف قصير">
          <div class="field-inline">
            <input type="number" data-field="price" value="${p.price}" min="0" aria-label="السعر">
          </div>
          <span class="save-flash" data-role="flash">تم الحفظ ✓</span>
        </div>
        <div class="dash-item-actions">
          <button type="button" class="btn btn-outline-danger btn-small" data-action="delete">حذف</button>
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

    const nameInput = row.querySelector('[data-field="name"]');
    nameInput.addEventListener('change', async () => {
      const val = nameInput.value.trim();
      if (!val) return;
      await updateProduct(id, { name: val });
      flashSaved();
    });

    const shortDescInput = row.querySelector('[data-field="shortDescription"]');
    shortDescInput.addEventListener('change', async () => {
      await updateProduct(id, { shortDescription: shortDescInput.value.trim() });
      flashSaved();
    });

    const priceInput = row.querySelector('[data-field="price"]');
    priceInput.addEventListener('change', async () => {
      await updateProduct(id, { price: Number(priceInput.value) || 0 });
      flashSaved();
    });

    row.querySelector('[data-action="delete"]').addEventListener('click', async () => {
      if (!confirm('حذف هذا المنتج نهائياً؟')) return;
      await deleteProduct(id);
    });
  });
}

// ============================================================
// 15. لوحة التحكم - عرض التقييمات
// ============================================================
function loadDashboardReviews() {
  const list = document.getElementById('dash-reviews-list');
  const emptyState = document.getElementById('dash-reviews-empty');
  if (!list) return;

  listenToReviews((reviews) => {
    list.innerHTML = '';
    if (!reviews.length) {
      if (emptyState) emptyState.hidden = false;
      return;
    }
    if (emptyState) emptyState.hidden = true;

    reviews.forEach(r => {
      const item = document.createElement('div');
      item.className = 'dash-review-item';
      const stars = '⭐'.repeat(r.stars) + '☆'.repeat(5 - r.stars);
      item.innerHTML = `
        <strong>${escapeHTML(r.name)}</strong>
        <span>${stars}</span>
        <p>${escapeHTML(r.text)}</p>
        <small>${new Date(r.createdAt).toLocaleDateString('ar-EG')}</small>
      `;
      list.appendChild(item);
    });
  });
}

// ============================================================
// 16. لوحة التحكم - عرض مشتركي المسابقة
// ============================================================
function loadDashboardContestants() {
  const list = document.getElementById('dash-contestants-list');
  const emptyState = document.getElementById('dash-contestants-empty');
  const pickBtn = document.getElementById('pick-winner-btn');
  if (!list) return;

  listenToContestants((contestants) => {
    list.innerHTML = '';
    if (!contestants.length) {
      if (emptyState) emptyState.hidden = false;
      if (pickBtn) pickBtn.hidden = true;
      return;
    }
    if (emptyState) emptyState.hidden = true;
    if (pickBtn) pickBtn.hidden = false;

    contestants.forEach(c => {
      const item = document.createElement('div');
      item.className = 'dash-contestant-item';
      item.innerHTML = `
        <strong>${escapeHTML(c.name)}</strong>
        <span>${escapeHTML(c.email)}</span>
        <p>${escapeHTML(c.answer)}</p>
        <small>${new Date(c.createdAt).toLocaleDateString('ar-EG')}</small>
      `;
      list.appendChild(item);
    });

    // زر اختيار فائز عشوائي
    if (pickBtn) {
      pickBtn.onclick = () => {
        if (contestants.length === 0) return;
        const winner = contestants[Math.floor(Math.random() * contestants.length)];
        document.getElementById('winner-name').textContent = winner.name;
        document.getElementById('contest-winner').hidden = false;
        alert(`🎉 الفائزة هي: ${winner.name}! تهانينا! 🎉`);
        // يمكن حفظ الفائزة في قاعدة البيانات
      };
    }
  });
}

// ============================================================
// 17. تشغيل كل شيء
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  initShared();
  renderContactLinks();
  initReviewForm();
  initContestForm();
  initQuickOrderForm();
  initDashboard();

  const isDashboard = document.querySelector('.dashboard-body');
  if (!isDashboard) {
    // صفحة المتجر
    listenToProducts((products) => {
      renderStorefront(products);
    });
    listenToReviews((reviews) => {
      renderReviews(reviews);
    });
  }
});
