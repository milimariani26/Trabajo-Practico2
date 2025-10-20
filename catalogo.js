document.addEventListener("DOMContentLoaded", async () => {
  const contenedor = document.querySelector(".productos-lista");
  const botonesFiltro = document.querySelectorAll(".filtros button");

  // Detectar si se pasó una categoría desde otra página
  const params = new URLSearchParams(window.location.search);
  let categoriaSeleccionada = params.get("categoria") || "todos";

const productos = await cargarProductos();

// Mezcla uniforme (Fisher–Yates) sin mutar el array original
function shuffled(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

  // Función para renderizar productos
function mostrarProductos(categoria) {
  contenedor.innerHTML = "";

  const filtrados = categoria === "todos"
    ? productos
    : productos.filter(p => p.categoria?.trim().toLowerCase() === categoria.toLowerCase());

  if (filtrados.length === 0) {
    contenedor.innerHTML = `<p class="sin-resultados">No hay productos en esta categoría.</p>`;
    return;
  }

  // 👇 Mezclamos el orden de lo que se va a mostrar
  const lista = shuffled(filtrados);

  lista.forEach(p => {
    const card = document.createElement("div");
    card.className = "producto-card";
    card.innerHTML = `
      <img src="images/${p.codigo}.jpg" onerror="this.onerror=null;this.src='images/${p.codigo}.png'" alt="${p.producto}">
      <div class="producto-info">
        <h3>${p.producto}</h3>
        <p>${p.marca}</p>
        <p>${p.color && p.color !== "-" ? `<p>Color: ${p.color}</p>` : ""}
        <p class="producto-precio">$${parseFloat(p.precio || 0).toLocaleString()}</p>
      </div>
    `;
    card.onclick = () => {
      window.location.href = `producto.html?codigo=${p.codigo}`;
    };
    contenedor.appendChild(card);
  });
}


  mostrarProductos(categoriaSeleccionada);

  // Filtro manual desde los botones laterales
  botonesFiltro.forEach(btn => {
    btn.addEventListener("click", () => {
      categoriaSeleccionada = btn.dataset.categoria || "todos";
      mostrarProductos(categoriaSeleccionada);
    });
  });
});

