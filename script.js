/* =====================================================================
   SAC DIAMANT — script.js (مع Firebase + FreeImage.Host)
   ===================================================================== */

// ============================================================
// 1. استيراد Firebase
// ============================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getFirestore, 
  collection, 
  getDocs, 
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
// 3. إعدادات FreeImage.Host
// ============================================================
const FREEIMAGE_API_KEY = '6d207e02198a847aa98d0a2a901485a5';

// ============================================================
// 4. إعدادات التواصل
// ============================================================
const WHATSAPP_NUMBER    = '213000000000';
const FACEBOOK_USERNAME  = 'sac.diamant';
const INSTAGRAM_USERNAME = 'sac.diamant';

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
  const div = document.createElement('div');
  div.textContent = str ?? '';
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
// 7. دوال رفع الصور - باستخدام FreeImage.Host
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

async function uploadImageToFreeImage(imageDataUrl) {
  try {
    const compressedImage = await compressImage(imageDataUrl, 500, 500, 0.6);
    const base64Data = compressedImage.split(',')[1];
    
    const formData = new FormData();
    formData.append('key', FREEIMAGE_API_KEY);
    formData.append('image', base64Data);
    formData.append('format', 'json');
    
    const response = await fetch('https://freeimage.host/api/1/upload', {
      method: 'POST',
      body: formData
    });
    
    const data = await response.json();
    
    if (data.status_code === 200) {
      return { 
        success: true, 
        url: data.image.url
      };
    } else {
      console.error('خطأ FreeImage.Host:', data);
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
  return await uploadImageToFreeImage(imageDataUrl);
}

async function deleteImage(productId) {
  console.log('تم تجاهل حذف الصورة (FreeImage.Host لا يدعم الحذف عبر API)');
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

// ============================================================
// 10. لوحة التحكم (dashboard.html)
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
  }

  function hideDashboard() {
    loginGate.hidden = false;
    dashboardMain.hidden = true;
  }

  onAuthStateChanged(auth, (user) => {
    if (user) {
      showDashboard();
    } else {
      hideDashboard();
    }
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
  const descInput = document.getElementById('p-desc');
  const imageInput = document.getElementById('p-image');
  const imagePreview = document.getElementById('image-preview');
  const removeImageBtn = document.getElementById('remove-image-btn');

  let pendingImage = null;

  imageInput.addEventListener('change', async () => {
    const file = imageInput.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('الصورة كبيرة جداً — يفضّل أقل من 5 ميغابايت');
      imageInput.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const compressed = await compressImage(e.target.result, 600, 600, 0.7);
        pendingImage = compressed;
        imagePreview.innerHTML = `<img src="${compressed}" alt="معاينة الصورة">`;
        removeImageBtn.disabled = false;
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
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const productData = {
      name: nameInput.value.trim(),
      price: Number(priceInput.value) || 0,
      description: descInput.value.trim(),
      image: null
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
      const result = await addProduct(productData);
      
      if (!result.success) {
        alert('حدث خطأ في إضافة المنتج: ' + result.error);
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
        return;
      }

      const productId = result.id;

      if (pendingImage) {
        const uploadResult = await uploadImage(productId, pendingImage);
        if (uploadResult.success) {
          await updateProduct(productId, { image: uploadResult.url });
        } else {
          console.warn('تم إضافة المنتج لكن فشل رفع الصورة:', uploadResult.error);
          alert('تم إضافة المنتج ولكن فشل رفع الصورة. يمكنك إعادة محاولة رفع الصورة لاحقاً.');
        }
      }

      form.reset();
      pendingImage = null;
      imagePreview.innerHTML = `<span class="preview-placeholder">لا توجد صورة</span>`;
      removeImageBtn.disabled = true;

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
// 11. تحميل المنتجات في لوحة التحكم
// ============================================================
let dashboardProducts = [];

function loadDashboardProducts() {
  const list = document.getElementById('dash-product-list');
  const emptyState = document.getElementById('dash-empty-state');

  listenToProducts((products) => {
    dashboardProducts = products;
    
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

    const priceInput = row.querySelector('[data-field="price"]');
    priceInput.addEventListener('change', async () => {
      await updateProduct(id, { price: Number(priceInput.value) || 0 });
      flashSaved();
    });

    const imageFileInput = row.querySelector('[data-field="image-file"]');
    imageFileInput.addEventListener('change', async () => {
      const file = imageFileInput.files[0];
      if (!file) return;
      
      if (file.size > 5 * 1024 * 1024) {
        alert('الصورة كبيرة جداً');
        imageFileInput.value = '';
        return;
      }

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const compressed = await compressImage(e.target.result, 600, 600, 0.7);
          const result = await uploadImage(id, compressed);
          if (result.success) {
            await updateProduct(id, { image: result.url });
            flashSaved();
            loadDashboardProducts();
          } else {
            alert('فشل رفع الصورة: ' + result.error);
          }
        } catch (error) {
          console.error('خطأ:', error);
          alert('حدث خطأ في رفع الصورة');
        }
      };
      reader.readAsDataURL(file);
    });

    const removeBtn = row.querySelector('[data-action="remove-image"]');
    removeBtn.addEventListener('click', async () => {
      await deleteImage(id);
      await updateProduct(id, { image: null });
      flashSaved();
      loadDashboardProducts();
    });

    const deleteBtn = row.querySelector('[data-action="delete"]');
    deleteBtn.addEventListener('click', async () => {
      if (!confirm('حذف هذا المنتج نهائياً؟')) return;
      await deleteProduct(id);
      await deleteImage(id);
      loadDashboardProducts();
    });
  });
}

// ============================================================
// 12. تشغيل كل شيء
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  initShared();
  renderContactLinks();
  initDashboard();

  const isDashboard = document.querySelector('.dashboard-body');
  if (!isDashboard) {
    listenToProducts((products) => {
      renderStorefront(products);
    });
  }
});
