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

    contenedor.appendChild(card);
  });
}

document.addEventListener("DOMContentLoaded", cargarProductos);


// Referencias del DOM

const suggestions = document.getElementById('suggestions');
const cartCount = document.getElementById('cartCount');

// Contador simple de carrito (solo demostración)
let carrito = [];

// Escucha la caja de búsqueda y filtra en tiempo real
const searchInput = document.getElementById('searchInput');
searchInput.addEventListener('input', function() {
  const termino = this.value.toLowerCase();
  const resultados = productos.filter(p =>
    p.producto.toLowerCase().includes(termino) ||
    p.marca.toLowerCase().includes(termino) ||
    (p.color && p.color.toLowerCase().includes(termino))
  );

  mostrarProductos(resultados);
});


function mostrarSugerencias(items) {
  suggestions.innerHTML = '';
  if (!items || items.length === 0) {
    suggestions.innerHTML = '<div class="suggestion-item">No se encontraron productos</div>';
    suggestions.classList.add('active');
    return;
  }

  items.forEach(p => {
    const div = document.createElement('div');
    div.className = 'suggestion-item';
    div.innerHTML = `<div class="suggestion-name">${p.producto}</div><div class="suggestion-info">${p.marca} • $${p.precio.toLocaleString()}</div>`;
    div.addEventListener('click', () => seleccionarProducto(p));
    suggestions.appendChild(div);
  });
  suggestions.classList.add('active');
}

function seleccionarProducto(p) {
  // Demo: agregamos al carrito y cerramos sugerencias
  carrito.push(p);
  actualizarContadorCarrito(carrito.length);
  searchInput.value = '';
  suggestions.classList.remove('active');
  alert(`Agregaste al carrito:\n${p.producto} - $${p.precio.toLocaleString()}`);
}

function mostrarCarrito() {
  if (carrito.length === 0) {
    alert('El carrito está vacío');
    return;
  }
  let texto = '🛒 Carrito:\n\n';
  carrito.forEach((p, i) => texto += `${i+1}. ${p.producto} - $${p.precio.toLocaleString()}\n`);
  alert(texto);
}


function actualizarContadorCarrito(n) {
  if (!cartCount) return;
  if (!n || n === 0) {
    // dejar vacío para que CSS :empty lo oculte
    cartCount.textContent = '';
  } else {
    cartCount.textContent = String(n);
  }
}

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

