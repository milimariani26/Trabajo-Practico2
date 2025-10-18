// BASE DE DATOS DE PRODUCTOS
// Estructura simple para que la búsqueda pueda funcionar sin backend
let productos = []; // acá se van a guardar los productos del CSV
// === CARGAR PRODUCTOS DESDE CSV ===
async function cargarProductos() {
  try {
    const resp = await fetch("productos.csv");
    const data = await resp.text();

    const filas = data.trim().split("\n");
    const encabezado = filas[0].split(",");
    productos = filas.slice(1).map(linea => {
      const [
        codigo, marca, producto, color, uso, descripcion, precio, descuento, stock, categoria
      ] = linea.split(",");
      return {
        codigo,
        marca,
        producto,
        color,
        uso,
        descripcion,
        precio: parseFloat(precio),
        descuento: parseFloat(descuento),
        stock: parseInt(stock),
        categoria
      };
    });

    mostrarProductos(productos);
    return productos
  } catch (error) {
    console.error("Error cargando productos:", error);
  }
}

// === MOSTRAR PRODUCTOS EN EL CATÁLOGO ===
function mostrarProductos(lista) {
  const contenedor = document.getElementById("productos-container");
  if (!contenedor) return;
  contenedor.innerHTML = "";

  lista.forEach(p => {
    const card = document.createElement("div");
    card.classList.add("producto-card");

    const precioFinal = p.precio - (p.precio * p.descuento / 100);
    const tieneDescuento = p.descuento > 0;
    const sinStock = p.stock <= 0;

    card.innerHTML = `
      ${tieneDescuento ? `<span class="badge-descuento">${p.descuento}% OFF</span>` : ""}

      <img src="images/${p.codigo}.jpg" alt="${p.producto}">
      <div class="producto-info">
        <h3>${p.producto}</h3>
        <p>${p.marca}</p>
        ${p.color && p.color !== "-" ? `<p>Color: ${p.color}</p>` : ""}
        ${p.uso ? `<p>Uso: ${p.uso}</p>` : ""}
        ${tieneDescuento
          ? `<p class="precio-anterior">$${p.precio.toLocaleString()}</p>
             <p class="precio">$${precioFinal.toLocaleString()}</p>`
          : `<p class="precio">$${p.precio.toLocaleString()}</p>`
        }
      </div>
    `;
    card.addEventListener("click", () => {
      window.location.href = `producto.html?codigo=${p.codigo}`;
    });
    contenedor.appendChild(card);
  });
}

document.addEventListener("DOMContentLoaded", cargarProductos);


// Referencias del DOM (se asignan cuando el DOM está listo)
let suggestions = null;
let cartCount = null;

// === SISTEMA DE CARRITO (unificado) ===
// Usamos sessionStorage para que el carrito sobreviva a recargas, pero se pierda
// cuando el usuario cierra la pestaña/ventana (cumple el requisito pedido).
let carrito = JSON.parse(sessionStorage.getItem("carrito")) || [];

function guardarCarrito() {
  try {
    sessionStorage.setItem("carrito", JSON.stringify(carrito));
  } catch (e) {
    console.warn('No se pudo guardar el carrito en sessionStorage:', e);
  }
}

function actualizarContadorCarrito() {
  const cartCountEl = document.getElementById("cartCount");
  if (!cartCountEl) return;
  const total = carrito.reduce((acc, item) => acc + (Number(item.cantidad) || 0), 0);
  // si total es 0 dejamos el badge vacío para que CSS :empty lo oculte
  cartCountEl.textContent = total > 0 ? String(total) : '';
}

function agregarAlCarrito(producto, cantidad = 1) {
  if (!producto) return;
  // soporta objetos con keys en minúsculas (desde CSV) o en mayúsculas (desde otras partes)
  const codigo = producto.codigo || producto.CODIGO || producto.codigo === 0 ? String(producto.codigo || producto.CODIGO) : null;
  if (!codigo) return;

  const existente = carrito.find(p => String(p.codigo) === String(codigo));

  const precioBase = Number(producto.precio);
  const descuento = Number(producto.descuento) || 0;
  const precioFinal = precioBase - (precioBase * descuento / 100);
  if (existente) {
    existente.cantidad = (Number(existente.cantidad) || 0) + Number(cantidad);
  } else {
    carrito.push({
      codigo: codigo,
      producto: producto.producto || producto.PRODUCTO || '',
      marca: producto.marca || producto.MARCA || '',
      precio: precioFinal,
      descuento: Number(producto.descuento || producto.DESCUENTO) || 0,
      cantidad: Number(cantidad) || 1
    });
  }

  guardarCarrito();
  actualizarContadorCarrito();
}

function mostrarCarrito() {
  if (!carrito || carrito.length === 0) {
    // abrir modal vacío
    openCartModal();
    renderCartPanel();
    return;
  }
  openCartModal();
  renderCartPanel();
}

/* ---- Cart modal UI ---- */
const cartModal = document.getElementById('cartModal');
const cartBackdrop = document.getElementById('cartBackdrop');
const cartClose = document.getElementById('cartClose');
const cartItemsEl = document.getElementById('cartItems');
const cartTotalEl = document.getElementById('cartTotal');

function openCartModal(){
  if (!cartModal) return;
  cartModal.classList.add('open');
  cartModal.setAttribute('aria-hidden','false');
}

function closeCartModal(){
  if (!cartModal) return;
  cartModal.classList.remove('open');
  cartModal.setAttribute('aria-hidden','true');
}

if (cartBackdrop) cartBackdrop.addEventListener('click', closeCartModal);
if (cartClose) cartClose.addEventListener('click', closeCartModal);

function renderCartPanel(){
  if (!cartItemsEl) return;
  cartItemsEl.innerHTML = '';
  if (!carrito || carrito.length === 0){
    cartItemsEl.innerHTML = '<p>Tu carrito está vacío</p>';
    cartTotalEl.textContent = 'Total: $0';
    return;
  }
  carrito.forEach((item, idx) => {
    const row = document.createElement('div');
    row.className = 'cart-item';
    row.innerHTML = `
      <img src="images/${item.codigo}.jpg" alt="${item.producto}">
      <div class="meta">
        <h4>${item.producto}</h4>
        <p>${item.marca || ''}</p>
        <div class="qty-controls">
          <button class="qty-decrease" data-idx="${idx}">-</button>
          <span class="qty-num">${item.cantidad}</span>
          <button class="qty-increase" data-idx="${idx}">+</button>
          <button class="cart-remove" data-idx="${idx}">Eliminar</button>
        </div>
      </div>
      <div class="precio">$${((Number(item.precio)||0) * (Number(item.cantidad)||0)).toLocaleString()}</div>
    `;
    cartItemsEl.appendChild(row);
  });

  // attach handlers
  cartItemsEl.querySelectorAll('.qty-increase').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const i = Number(e.currentTarget.dataset.idx);
      carrito[i].cantidad = (Number(carrito[i].cantidad) || 0) + 1;
      guardarCarrito();
      renderCartPanel();
      actualizarContadorCarrito();
    });
  });
  cartItemsEl.querySelectorAll('.qty-decrease').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const i = Number(e.currentTarget.dataset.idx);
      if ((Number(carrito[i].cantidad) || 0) > 1) carrito[i].cantidad = Number(carrito[i].cantidad) - 1;
      else carrito.splice(i,1);
      guardarCarrito();
      renderCartPanel();
      actualizarContadorCarrito();
    });
  });
  cartItemsEl.querySelectorAll('.cart-remove').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const i = Number(e.currentTarget.dataset.idx);
      carrito.splice(i,1);
      guardarCarrito();
      renderCartPanel();
      actualizarContadorCarrito();
    });
  });

  const total = carrito.reduce((acc,p) => acc + ((Number(p.precio)||0) * (Number(p.cantidad)||0)), 0);
  cartTotalEl.textContent = `Total: $${total.toLocaleString()}`;
}

// === CHECKOUT / PAGO ===
function renderCheckoutForm(){
  if (!cartItemsEl) return;
  if (!carrito || carrito.length === 0){
    alert('El carrito está vacío. Agrega productos antes de pagar.');
    return;
  }

  // construir resumen de la izquierda y formulario a la derecha
  const total = carrito.reduce((acc,p) => acc + ((Number(p.precio)||0) * (Number(p.cantidad)||0)), 0);

  const container = document.createElement('div');
  container.className = 'checkout-grid';

  const left = document.createElement('div');
  left.className = 'checkout-summary';
  const list = document.createElement('div');
  list.className = 'checkout-items-list';
  carrito.forEach(item => {
    const row = document.createElement('div');
    row.className = 'checkout-item';
    row.innerHTML = `
      <img src="images/${item.codigo}.jpg" alt="${item.producto}">
      <div class="meta">
        <strong>${item.producto}</strong>
        <div>${item.cantidad} x $${(Number(item.precio)||0).toLocaleString()}</div>
      </div>
      <div class="line-price">$${(((Number(item.precio)||0) * (Number(item.cantidad)||0))).toLocaleString()}</div>
    `;
    list.appendChild(row);
  });
  const tot = document.createElement('div');
  tot.className = 'checkout-total';
  tot.textContent = `Total: $${total.toLocaleString()}`;
  left.appendChild(list);
  left.appendChild(tot);

  const right = document.createElement('div');
  right.className = 'checkout-form';
  right.innerHTML = `
    <form id="checkoutForm">
      <h3>Datos del comprador</h3>
      <label>Nombre completo<br><input type="text" id="cf-name" required></label>
      <label>Email<br><input type="email" id="cf-email" required></label>
      <label>Dirección<br><input type="text" id="cf-address"></label>
      <h4>Método de pago</h4>
      <label><input type="radio" name="cf-pay" value="mercadopago" checked> Mercado Pago</label><br>
      <label><input type="radio" name="cf-pay" value="tarjeta"> Tarjeta</label>
      <div class="checkout-actions">
        <button type="submit" id="cf-pay-btn" class="btn-primary">Pagar</button>
      </div>
    </form>
  `;

  container.appendChild(left);
  container.appendChild(right);

  cartItemsEl.innerHTML = '';
  cartItemsEl.appendChild(container);
  // actualizar total visual
  if (cartTotalEl) cartTotalEl.textContent = `Total: $${total.toLocaleString()}`;

  // bind form submit
  const form = document.getElementById('checkoutForm');
  if (form){
    form.addEventListener('submit', function(e){
      e.preventDefault();
      const name = document.getElementById('cf-name')?.value?.trim();
      const email = document.getElementById('cf-email')?.value?.trim();
      const payMethod = form.querySelector('input[name="cf-pay"]:checked')?.value;
      if (!name || !email || !payMethod){
        alert('Por favor completa tu nombre, email y selecciona un método de pago.');
        return;
      }

      // Simular pago exitoso
      alert('Compra realizada con éxito');

      // Vaciar carrito (sessionStorage) y actualizar UI
      carrito = [];
      try { sessionStorage.removeItem('carrito'); } catch(e){}
      guardarCarrito();
      actualizarContadorCarrito();

      // Cerrar modal y redireccionar al inicio
      closeCartModal();
      window.location.href = 'index.html';
    });
  }
}


// abrir carrito al hacer click en el icono
document.querySelectorAll('.icon-btn[aria-label="Ver carrito"]').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    openCartModal();
    renderCartPanel();
  });
});

// Inicialización relacionada con el DOM
document.addEventListener('DOMContentLoaded', () => {
  // asignar referencias dependientes del DOM
  suggestions = document.getElementById('suggestions');
  cartCount = document.getElementById('cartCount');
  // configurar handlers de búsqueda y actualizar contador
  setupSearchHandlers();
  actualizarContadorCarrito();
  // enlazar botón de checkout dentro del modal
  const cartCheckoutBtn = document.getElementById('cartCheckout');
  if (cartCheckoutBtn) {
    cartCheckoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      // Abrir la página de checkout en la misma pestaña
      window.location.href = 'checkout.html';
    });
  }
});

// --- BÚSQUEDA CON SUGERENCIAS ---
let suggestionIndex = -1;
let currentSuggestions = [];

function setupSearchHandlers(){
  const searchInput = document.getElementById('searchInput');
  if (!searchInput) return;

  searchInput.addEventListener('input', onSearchInput);
  searchInput.addEventListener('keydown', onSearchKeyDown);
}

function onSearchInput(e){
  const q = e.target.value.toLowerCase().trim();
  if (!q){
    if (suggestions) suggestions.classList.remove('active');
    currentSuggestions = [];
    suggestionIndex = -1;
    return;
  }

  // buscar por nombre, marca o código
  currentSuggestions = productos.filter(p =>
    (p.producto && p.producto.toLowerCase().includes(q)) ||
    (p.marca && p.marca.toLowerCase().includes(q)) ||
    (p.codigo && String(p.codigo).toLowerCase().includes(q))
  ).slice(0,8);

  mostrarSugerencias(currentSuggestions);
  suggestionIndex = -1;
}

function onSearchKeyDown(e){
  if (!suggestions.classList.contains('active')){
    if (e.key === 'Enter'){
      // sin sugerencias visibles, navegar al primer resultado si existe
      const q = e.target.value.toLowerCase().trim();
      if (!q) return;
      const res = productos.filter(p => (p.producto && p.producto.toLowerCase().includes(q)) || (p.marca && p.marca.toLowerCase().includes(q)) || (p.codigo && String(p.codigo).toLowerCase().includes(q)));
      if (res && res.length > 0) window.location.href = `producto.html?codigo=${res[0].codigo}`;
    }
    return;
  }

  const max = currentSuggestions.length - 1;
  if (e.key === 'ArrowDown'){
    e.preventDefault();
    suggestionIndex = Math.min(suggestionIndex + 1, max);
    updateSuggestionFocus();
    return;
  }
  if (e.key === 'ArrowUp'){
    e.preventDefault();
    suggestionIndex = Math.max(suggestionIndex - 1, 0);
    updateSuggestionFocus();
    return;
  }
  if (e.key === 'Enter'){
    e.preventDefault();
    if (suggestionIndex >= 0 && currentSuggestions[suggestionIndex]){
      window.location.href = `producto.html?codigo=${currentSuggestions[suggestionIndex].codigo}`;
    } else if (currentSuggestions.length > 0){
      window.location.href = `producto.html?codigo=${currentSuggestions[0].codigo}`;
    }
    return;
  }
  if (e.key === 'Escape'){
    suggestions.classList.remove('active');
    suggestionIndex = -1;
  }
}

function updateSuggestionFocus(){
  const items = suggestions.querySelectorAll('.suggestion-item');
  items.forEach((it, idx) => {
    it.classList.toggle('focused', idx === suggestionIndex);
    it.setAttribute('aria-selected', idx === suggestionIndex ? 'true' : 'false');
    if (idx === suggestionIndex) it.scrollIntoView({block: 'nearest'});
  });
}

function mostrarSugerencias(items) {
  if (!suggestions) return;
  suggestions.innerHTML = '';
  suggestions.classList.add('active');
  if (!items || items.length === 0) {
    suggestions.innerHTML = '<div class="suggestion-list"><div class="suggestion-item">No se encontraron productos</div></div>';
    return;
  }


  // Heading
  const popular = document.createElement('div');
  popular.className = 'suggestion-heading';
  popular.textContent = 'Productos';
  suggestions.appendChild(popular);

  const list = document.createElement('div');
  list.className = 'suggestion-list';

  items.forEach((p, idx) => {
    const div = document.createElement('div');
    div.className = 'suggestion-item product-suggestion';
    div.setAttribute('role','option');
    div.setAttribute('data-codigo', p.codigo);
    div.innerHTML = `
      <img src="images/${p.codigo}.jpg" alt="${p.producto}">
      <div class="meta">
        <h4>${p.producto}</h4>
        <p>${p.marca} • $${(Number(p.precio)||0).toLocaleString()}</p>
      </div>
    `;
    div.addEventListener('click', () => window.location.href = `producto.html?codigo=${p.codigo}`);
    div.addEventListener('mouseover', () => { suggestionIndex = idx; updateSuggestionFocus(); });
    list.appendChild(div);
  });

  suggestions.appendChild(list);
}

// set up search handlers after products are loaded
// Nota: mantenemos el setup de búsqueda en su propio listener más abajo

function seleccionarProducto(p) {
  // Agrega el producto usando la función unificada y cierra sugerencias
  agregarAlCarrito(p, 1);
  const searchInput = document.getElementById('searchInput');
  if (searchInput) searchInput.value = '';
  if (suggestions) suggestions.classList.remove('active');
  alert(`Agregaste al carrito:\n${p.producto} - $${(Number(p.precio)||0).toLocaleString()}`);
}


/* legacy actualizarContadorCarrito removed — use the unified implementation above */

// Cerrar sugerencias al hacer click fuera
document.addEventListener('click', function(e) {
  if (!e.target.closest('.search-container')) {
    suggestions.classList.remove('active');
  }
});

// --- Header shrink on scroll ---
const headerEl = document.querySelector('.site-header');
let lastScroll = 0;
window.addEventListener('scroll', () => {
  const y = window.scrollY || window.pageYOffset;
  if (y > 60) {
    headerEl.classList.add('header--small');
  } else {
    headerEl.classList.remove('header--small');
  }
  lastScroll = y;
});

// --- Dropdown toggle for touch / small screens ---
document.querySelectorAll('.has-dropdown > a').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    const parent = this.parentElement;
    // Prevent jump/navigation on click for both mobile and desktop; toggle dropdown instead
    e.preventDefault();
    const open = parent.classList.toggle('open');
    this.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
});

// Close dropdowns when clicking outside
document.addEventListener('click', function(e) {
  document.querySelectorAll('.has-dropdown.open').forEach(item => {
    if (!item.contains(e.target)) {
      item.classList.remove('open');
      const a = item.querySelector('a');
      if (a) a.setAttribute('aria-expanded', 'false');
    }
  });
});

// Smooth scroll with offset for internal anchor links (compensate header)
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', function(e) {
    const href = this.getAttribute('href');
    if (!href || href === '#') return;
    if (href.startsWith('#')) {
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        const headerOffset = document.querySelector('.site-header').offsetHeight;
        const rect = target.getBoundingClientRect();
        const scrollTop = window.pageYOffset + rect.top - headerOffset - 12; // 12px gap
        window.scrollTo({ top: scrollTop, behavior: 'smooth' });
      }
    }
  });
});

// === BANNER AUTOMÁTICO ===
let slideIndex = 0;
let slideTimer;

function showSlides(n) {
  const slides = document.querySelectorAll(".banner-slide");
  const dots = document.querySelectorAll(".dot");

  if (slides.length === 0) return;

  slides.forEach(s => s.style.display = "none");
  dots.forEach(d => d.classList.remove("active-dot"));

  slideIndex = (n + slides.length) % slides.length;
  slides[slideIndex].style.display = "block";
  dots[slideIndex].classList.add("active-dot");
}

function nextSlide() {
  showSlides(slideIndex + 1);
  resetTimer();
}

function prevSlide() {
  showSlides(slideIndex - 1);
  resetTimer();
}

function autoSlides() {
  showSlides(slideIndex + 1);
  slideTimer = setTimeout(autoSlides, 5000); // cambia cada 5s
}

function resetTimer() {
  clearTimeout(slideTimer);
  slideTimer = setTimeout(autoSlides, 5000);
}

// Inicialización
document.addEventListener("DOMContentLoaded", () => {
  showSlides(0);
  autoSlides();

  document.querySelector(".next").addEventListener("click", nextSlide);
  document.querySelector(".prev").addEventListener("click", prevSlide);

  document.querySelectorAll(".dot").forEach((dot, i) => {
    dot.addEventListener("click", () => {
      showSlides(i);
      resetTimer();
    });
  });
});

// === FLECHAS PARA MOVER EL SLIDER (3 productos por paso) ===
window.addEventListener("load", () => {
  const contenedor = document.getElementById("productos-container");
  const btnIzq = document.getElementById("btn-izquierda");
  const btnDer = document.getElementById("btn-derecha");

  if (!contenedor || !btnIzq || !btnDer) return;

  // función que calcula el desplazamiento dinámicamente
  const moverSlider = (direccion) => {
    const desplazamiento = contenedor.clientWidth * 0.9; // mueve casi una vista completa
    contenedor.scrollBy({ left: direccion * desplazamiento, behavior: "smooth" });
  };

  btnIzq.addEventListener("click", () => moverSlider(-1));
  btnDer.addEventListener("click", () => moverSlider(1));
});

// === MENÚ HAMBURGUESA ===
const menuBtn = document.getElementById("menuBtn");
const navMenu = document.querySelector(".nav-menu");

if (menuBtn && navMenu) {
  menuBtn.addEventListener("click", () => {
    navMenu.classList.toggle("open");
  });
}


