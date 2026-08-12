/* =====================================================================
   SAC DIAMANT — script.js (تكامل شامل وتطبيق الخصائص الجديدة)
   ===================================================================== */

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
// Firebase & Cloudinary Settings
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

const CLOUDINARY_CLOUD_NAME = 'n9xuxykp';
const CLOUDINARY_UPLOAD_PRESET = 'sac_diamant';
const CLOUDINARY_API_KEY = 'f74f2K2eVN6HRaHOEezQqu4OnoU';

const WHATSAPP_NUMBER    = '213000000000';
const FACEBOOK_USERNAME  = 'https://www.facebook.com/sac.diamant';
const INSTAGRAM_USERNAME = 'sac_diamant';

const ICONS = {
  whatsapp: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20l1.3-3.9A8 8 0 1 1 8.9 19.7L4 20Z"/><path d="M8.5 9.5c0 3 2.5 5.5 5.5 5.5.6 0 1-.4 1-1v-1l-2-1-1 1a5 5 0 0 1-2.5-2.5l1-1-1-2H9c-.6 0-.5.4-.5 1Z"/></svg>',
  facebook: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 9h2V6h-2c-1.7 0-3 1.3-3 3v2H9v3h2v6h3v-6h2.2l.8-3H14V9.3c0-.2.1-.3.3-.3Z"/><circle cx="12" cy="12" r="9.5"/></svg>',
  instagram: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="3.6"/><circle cx="17" cy="7" r="0.6" fill="currentColor" stroke="none"/></svg>'
};

// ============================================================
// Helpers
// ============================================================
function formatPrice(price) {
  return Number(price).toLocaleString('ar-DZ') + ' د.ج';
}

function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

function buildOrderLinks(product) {
  const message = encodeURIComponent(
    product ? `مرحباً، أرغب باستفسار أو طلب: ${product.name} — ${formatPrice(product.price)}` : 'مرحباً، أرغب بالاستفسار عن المنتجات'
  );
  return {
    whatsapp: `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`,
    facebook: `https://m.me/${FACEBOOK_USERNAME}`,
    instagram: `https://instagram.com/${INSTAGRAM_USERNAME}`
  };
}

// ============================================================
// Firestore Handlers
// ============================================================
function listenToProducts(callback) {
  const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    const products = [];
    snapshot.forEach((doc) => { products.push({ id: doc.id, ...doc.data() }); });
    callback(products);
  });
}

function listenToReviews(callback) {
  const q = query(collection(db, "reviews"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    const reviews = [];
    snapshot.forEach((doc) => { reviews.push({ id: doc.id, ...doc.data() }); });
    callback(reviews);
  });
}

function listenToOrders(callback) {
  const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    const orders = [];
    snapshot.forEach((doc) => { orders.push({ id: doc.id, ...doc.data() }); });
    callback(orders);
  });
}

async function uploadImageToCloudinary(imageDataUrl) {
  try {
    const formData = new FormData();
    formData.append('file', imageDataUrl);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('api_key', CLOUDINARY_API_KEY);
    
    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
      method: 'POST',
      body: formData
    });
    const data = await response.json();
    return data.secure_url ? { success: true, url: data.secure_url } : { success: false, error: data.error?.message };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ============================================================
// Storefront Rendering
// ============================================================
function renderStorefront(products) {
  const grid = document.getElementById('product-grid');
  if (!grid) return;
  grid.innerHTML = '';

  products.forEach(p => {
    const card = document.createElement('article');
    card.className = 'product-card';

    const images = (p.images && p.images.length > 0) ? p.images : (p.image ? [p.image] : []);
    
    let mainImgHTML = images.length > 0 
      ? `<img src="${images[0]}" class="main-card-img" id="img-${p.id}" alt="${escapeHTML(p.name)}">`
      : `<span class="diamond-icon-lg" aria-hidden="true"></span>`;

    let thumbsHTML = '';
    if (images.length > 1) {
      thumbsHTML = `<div class="product-thumbs">` + images.map((imgUrl, idx) => 
        `<img src="${imgUrl}" class="thumb-img ${idx===0?'active':''}" onclick="changeProductImage('${p.id}', '${imgUrl}', this)">`
      ).join('') + `</div>`;
    }

    const links = buildOrderLinks(p);

    card.innerHTML = `
      <div class="product-image">${mainImgHTML}</div>
      ${thumbsHTML}
      <div class="product-info">
        <h3>${escapeHTML(p.name)}</h3>
        <p class="price">${formatPrice(p.price)}</p>
        <p class="product-desc">${escapeHTML(p.description || '')}</p>
        <button class="btn btn-gold btn-block direct-btn" onclick="openOrderModal('${p.id}', '${escapeHTML(p.name)}', '${p.price}')">طلب مباشر من الموقع</button>
        <div class="order-row">
          <span class="order-label">تواصل عبر:</span>
          <a class="icon-btn" href="${links.whatsapp}" target="_blank">${ICONS.whatsapp}</a>
          <a class="icon-btn" href="${links.facebook}" target="_blank">${ICONS.facebook}</a>
          <a class="icon-btn" href="${links.instagram}" target="_blank">${ICONS.instagram}</a>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
}

window.changeProductImage = function(id, url, el) {
  const imgEl = document.getElementById(`img-${id}`);
  if (imgEl) imgEl.src = url;
  const parent = el.parentElement;
  parent.querySelectorAll('.thumb-img').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
};

// ============================================================
// Direct Order Modal
// ============================================================
window.openOrderModal = function(id, name, price) {
  document.getElementById('ord-product-id').value = id;
  document.getElementById('ord-product-name').value = name;
  document.getElementById('ord-product-price').value = formatPrice(price);
  document.getElementById('order-modal').hidden = false;
};

function initOrderModal() {
  const modal = document.getElementById('order-modal');
  const closeBtn = document.getElementById('close-modal');
  if (closeBtn) closeBtn.onclick = () => modal.hidden = true;

  const form = document.getElementById('direct-order-form');
  if (form) {
    form.onsubmit = async (e) => {
      e.preventDefault();
      const orderData = {
        productName: document.getElementById('ord-product-name').value,
        price: document.getElementById('ord-product-price').value,
        clientName: document.getElementById('ord-client-name').value,
        phone: document.getElementById('ord-client-phone').value,
        city: document.getElementById('ord-client-city').value,
        createdAt: new Date().toISOString()
      };
      await addDoc(collection(db, "orders"), orderData);
      alert('تم استلام طلبك بنجاح! سنتواصل معك قريباً لتأكيد الشحن. ✨');
      modal.hidden = true;
      form.reset();
    };
  }
}

// ============================================================
// Giveaway & Wheel Logic
// ============================================================
function initGiveaway() {
  const form = document.getElementById('giveaway-form');
  const wheel = document.getElementById('wheel');
  const resText = document.getElementById('giveaway-result');

  if (form && wheel) {
    form.onsubmit = async (e) => {
      e.preventDefault();
      const deg = Math.floor(2000 + Math.random() * 2000);
      wheel.style.transform = `rotate(${deg}deg)`;

      setTimeout(async () => {
        const prizes = ["حقيبة هدية فاخرة 🎉", "خصم 10% على أي طلب 🏷️", "حظ أفضل المرة القادمة ✨", "شحن مجاني لك 🚚", "خصم 20% 🌟"];
        const won = prizes[Math.floor(Math.random() * prizes.length)];
        resText.textContent = `مبارك! لقد فزت بـ: ${won}`;
        resText.hidden = false;

        await addDoc(collection(db, "giveaways"), {
          name: document.getElementById('g-name').value,
          phone: document.getElementById('g-phone').value,
          prize: won,
          createdAt: new Date().toISOString()
        });
      }, 4000);
    };
  }
}

// ============================================================
// Reviews Logic
// ============================================================
function initReviews() {
  const revForm = document.getElementById('review-form');
  const revGrid = document.getElementById('reviews-grid');

  if (revForm) {
    revForm.onsubmit = async (e) => {
      e.preventDefault();
      await addDoc(collection(db, "reviews"), {
        name: document.getElementById('rev-name').value,
        rating: document.getElementById('rev-rating').value,
        comment: document.getElementById('rev-comment').value,
        createdAt: new Date().toISOString()
      });
      alert('شكراً لكِ على تقديم رأيكِ التجريبي! ✨');
      revForm.reset();
    };
  }

  if (revGrid) {
    listenToReviews((reviews) => {
      revGrid.innerHTML = reviews.map(r => `
        <div class="review-card">
          <div class="rev-stars">${'⭐'.repeat(Number(r.rating))}</div>
          <p class="rev-comment">"${escapeHTML(r.comment)}"</p>
          <span class="rev-author">— ${escapeHTML(r.name)}</span>
        </div>
      `).join('');
    });
  }
}

// ============================================================
// Dashboard Initializer
// ============================================================
function initDashboard() {
  const loginGate = document.getElementById('login-gate');
  const dashboardMain = document.getElementById('dashboard-main');
  if (!loginGate || !dashboardMain) return;

  onAuthStateChanged(auth, (user) => {
    if (user) {
      loginGate.hidden = true;
      dashboardMain.hidden = false;
      loadAdminDashboardData();
    } else {
      loginGate.hidden = false;
      dashboardMain.hidden = true;
    }
  });

  document.getElementById('login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, document.getElementById('login-email').value, document.getElementById('login-password').value);
    } catch {
      document.getElementById('login-error').hidden = false;
    }
  });

  // Multiple image upload handling
  let pendingImages = [];
  const imgInput = document.getElementById('p-images');
  const imgPreview = document.getElementById('image-preview');

  if (imgInput) {
    imgInput.addEventListener('change', (e) => {
      pendingImages = Array.from(e.target.files);
      imgPreview.innerHTML = pendingImages.map(f => `<span class="badge">${f.name}</span>`).join(' ');
      document.getElementById('remove-image-btn').disabled = false;
    });

    document.getElementById('remove-image-btn').onclick = () => {
      pendingImages = [];
      imgInput.value = '';
      imgPreview.innerHTML = `<span class="preview-placeholder">لم يتم تحديد صور بعد</span>`;
      document.getElementById('remove-image-btn').disabled = true;
    };
  }

  document.getElementById('product-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const uploadedUrls = [];
    for (let file of pendingImages) {
      const reader = new FileReader();
      const url = await new Promise((res) => {
        reader.onload = (ev) => res(ev.target.result);
        reader.readAsDataURL(file);
      });
      const up = await uploadImageToCloudinary(url);
      if (up.success) uploadedUrls.push(up.url);
    }

    await addDoc(collection(db, "products"), {
      name: document.getElementById('p-name').value,
      price: Number(document.getElementById('p-price').value),
      description: document.getElementById('p-desc').value,
      images: uploadedUrls,
      createdAt: new Date().toISOString()
    });

    alert('تم إضافة المنتج بنجاح مع الصور الجديدة! ✨');
    e.target.reset();
    imgPreview.innerHTML = `<span class="preview-placeholder">لم يتم تحديد صور بعد</span>`;
  });
}

function loadAdminDashboardData() {
  listenToProducts((products) => {
    const list = document.getElementById('dash-product-list');
    if (!list) return;
    list.innerHTML = products.map(p => `
      <div class="dash-product-item">
        <div><strong>${escapeHTML(p.name)}</strong> — ${formatPrice(p.price)}</div>
        <button class="btn btn-outline-danger btn-small" onclick="deleteProductDoc('${p.id}')">حذف</button>
      </div>
    `).join('');
  });

  listenToOrders((orders) => {
    const oList = document.getElementById('orders-list');
    if (!oList) return;
    oList.innerHTML = orders.map(o => `
      <div class="order-card-dash">
        <p><strong>الزبون:</strong> ${escapeHTML(o.clientName)} | <strong>رقم الهاتف:</strong> ${escapeHTML(o.phone)}</p>
        <p><strong>المنتج:</strong> ${escapeHTML(o.productName)} | <strong>العنوان:</strong> ${escapeHTML(o.city)}</p>
      </div>
    `).join('');
  });
}

window.deleteProductDoc = async function(id) {
  if (confirm('هل أنت متأكدة من حذف هذا المنتج؟')) {
    await deleteDoc(doc(db, "products", id));
  }
};

// Initialization
document.addEventListener('DOMContentLoaded', () => {
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  initOrderModal();
  initGiveaway();
  initReviews();
  initDashboard();

  if (!document.querySelector('.dashboard-body')) {
    listenToProducts(renderStorefront);
  }
});
