/* =====================================================================
   SAC DIAMANT — script.js (مع Firebase)
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
  getStorage,
  ref,
  uploadString,
  getDownloadURL,
  deleteObject
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";
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
const storage = getStorage(app);
const auth = getAuth(app);

// ============================================================
// 3. إعدادات التواصل
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
// 4. دوال مساعدة
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
// 5. دوال Firebase
// ============================================================

// الاستماع المباشر للمنتجات
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

// إضافة منتج
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

// تحديث منتج
async function updateProduct(productId, data) {
  try {
    await updateDoc(doc(db, "products", productId), data);
    return { success: true };
  } catch (error) {
    console.error("خطأ في تحديث المنتج:", error);
    return { success: false, error: error.message };
  }
}

// حذف منتج
async function deleteProduct(productId) {
  try {
    await deleteDoc(doc(db, "products", productId));
    return { success: true };
  } catch (error) {
    console.error("خطأ في حذف المنتج:", error);
    return { success: false, error: error.message };
  }
}

// رفع صورة
async function uploadImage(productId, imageDataUrl) {
  try {
    const storageRef = ref(storage, `products/${productId}/image.jpg`);
    await uploadString(storageRef, imageDataUrl, 'data_url');
    const downloadURL = await getDownloadURL(storageRef);
    return { success: true, url: downloadURL };
  } catch (error) {
    console.error("خطأ في رفع الصورة:", error);
    return { success: false, error: error.message };
  }
}

// حذف صورة
async function deleteImage(productId) {
  try {
    const storageRef = ref(storage, `products/${productId}/image.jpg`);
    await deleteObject(storageRef);
    return { success: true };
  } catch (error) {
    console.error("خطأ في حذف الصورة:", error);
    return { success: false };
  }
}

// ============================================================
// 6. عناصر مشتركة
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
// 7. المتجر (index.html)
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
// 8. لوحة التحكم (dashboard.html)
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

  // التحقق من حالة تسجيل الدخول
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

  // --- نموذج إضافة منتج ---
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

    if (file.size > 1.5 * 1024 * 1024) {
      alert('الصورة كبيرة جداً — يفضّل أقل من 1.5 ميغابايت');
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

    // إضافة المنتج
    const result = await addProduct(productData);
    
    if (!result.success) {
      alert('حدث خطأ في إضافة المنتج: ' + result.error);
      return;
    }

    const productId = result.id;

    // رفع الصورة إن وجدت
    if (pendingImage) {
      const uploadResult = await uploadImage(productId, pendingImage);
      if (uploadResult.success) {
        await updateProduct(productId, { image: uploadResult.url });
      }
    }

    // إعادة تعيين النموذج
    form.reset();
    pendingImage = null;
    imagePreview.innerHTML = `<span class="preview-placeholder">لا توجد صورة</span>`;
    removeImageBtn.disabled = true;

    alert('تم إضافة المنتج بنجاح! ✨');
  });
}

// تحميل المنتجات في لوحة التحكم
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

    // تحديث الاسم
    const nameInput = row.querySelector('[data-field="name"]');
    nameInput.addEventListener('change', async () => {
      const val = nameInput.value.trim();
      if (!val) return;
      await updateProduct(id, { name: val });
      flashSaved();
    });

    // تحديث السعر
    const priceInput = row.querySelector('[data-field="price"]');
    priceInput.addEventListener('change', async () => {
      await updateProduct(id, { price: Number(priceInput.value) || 0 });
      flashSaved();
    });

    // تغيير الصورة
    const imageFileInput = row.querySelector('[data-field="image-file"]');
    imageFileInput.addEventListener('change', async () => {
      const file = imageFileInput.files[0];
      if (!file) return;
      
      if (file.size > 1.5 * 1024 * 1024) {
        alert('الصورة كبيرة جداً');
        imageFileInput.value = '';
        return;
      }

      const reader = new FileReader();
      reader.onload = async () => {
        const result = await uploadImage(id, reader.result);
        if (result.success) {
          await updateProduct(id, { image: result.url });
          flashSaved();
          loadDashboardProducts();
        }
      };
      reader.readAsDataURL(file);
    });

    // إزالة الصورة
    const removeBtn = row.querySelector('[data-action="remove-image"]');
    removeBtn.addEventListener('click', async () => {
      await deleteImage(id);
      await updateProduct(id, { image: null });
      flashSaved();
      loadDashboardProducts();
    });

    // حذف المنتج
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
// 9. تشغيل كل شيء
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  initShared();
  renderContactLinks();
  initDashboard();

  // تشغيل المتجر مع الاستماع المباشر
  const isDashboard = document.querySelector('.dashboard-body');
  if (!isDashboard) {
    listenToProducts((products) => {
      renderStorefront(products);
    });
  }
});
