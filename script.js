/* =====================================================================
   SAC DIAMANT — script.js (نسخة مطوّرة ومصححة)
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
  where,
  setDoc
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
// 6. دوال Firebase - الاستماع
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

function listenToOrders(callback) {
  const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    const orders = [];
    snapshot.forEach((doc) => {
      orders.push({ id: doc.id, ...doc.data() });
    });
    callback(orders);
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

function listenToContest(callback) {
  const q = query(collection(db, "contest"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    let contest = null;
    snapshot.forEach((doc) => {
      contest = { id: doc.id, ...doc.data() };
    });
    callback(contest);
  });
}

// ============================================================
// 7. دوال Firebase - الكتابة
// ============================================================
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

async function saveContest(contestData) {
  try {
    // حفظ المسابقة في مجموعة منفصلة
    const docRef = doc(db, "contest", "current");
    await setDoc(docRef, {
      ...contestData,
      updatedAt: new Date().toISOString()
    });
    return { success: true };
  } catch (error) {
    console.error("خطأ في حفظ المسابقة:", error);
    return { success: false, error: error.message };
  }
}

async function deleteContestant(contestantId) {
  try {
    await deleteDoc(doc(db, "contestants", contestantId));
    return { success: true };
  } catch (error) {
    console.error("خطأ في حذف المشترك:", error);
    return { success: false, error: error.message };
  }
}

// ============================================================
// 8. دوال رفع الصور - Cloudinary
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
      } else {
        console.warn('فشل رفع صورة:', data);
      }
    } catch (error) {
      console.error('خطأ في رفع صورة:', error);
    }
  }
  return uploadedUrls;
}

// ============================================================
// 9. عناصر مشتركة
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
// 10. المتجر - عرض المنتجات (مصحح)
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

    // عرض الصور - معرض
    let imagesHTML = '';
    if (p.images && p.images.length > 0) {
      imagesHTML = `
        <div class="product-gallery">
          <img src="${p.images[0]}" alt="${escapeHTML(p.name)}" class="gallery-main" loading="lazy" onerror="this.style.display='none'">
          ${p.images.length > 1 ? `
            <div class="gallery-thumbs">
              ${p.images.slice(0, 3).map(img => `<img src="${img}" alt="${escapeHTML(p.name)}" loading="lazy" onerror="this.style.display='none'" onclick="this.parentElement.parentElement.querySelector('.gallery-main').src=this.src">`).join('')}
            </div>
          ` : ''}
        </div>
      `;
    } else {
      imagesHTML = `<span class="diamond-icon-lg" aria-hidden="true"></span>`;
    }

    const descHTML = p.shortDescription
      ? `<p class="product-desc">${escapeHTML(p.shortDescription
