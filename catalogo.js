document.addEventListener("DOMContentLoaded", async () => {
  const contenedor = document.querySelector(".productos-lista");
  const botonesFiltro = document.querySelectorAll(".filtros button");

  // Detectar si se pasó una categoría desde otra página
  const params = new URLSearchParams(window.location.search);
  let categoriaSeleccionada = params.get("categoria") || "todos";

  // Cargar productos desde el CSV
  const respuesta = await fetch("productos.csv");
  const texto = await respuesta.text();
  const lineas = texto.split("\n").slice(1);
  const productos = lineas.map(l => {
    const [codigo, marca, producto, color, uso, descripcion, precio, descuento, stock, categoria] = l.split(",");
    return { codigo, marca, producto, color, uso, descripcion, precio, descuento, stock, categoria };
  });

  //hola 
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

    filtrados.forEach(p => {
      const card = document.createElement("div");
      card.className = "producto-card";
      card.innerHTML = `
        <img src="images/${p.codigo}.jpg" onerror="this.onerror=null;this.src='images/${p.codigo}.png'" alt="${p.producto}">
        <div class="producto-info">
          <h3>${p.producto}</h3>
          <p>${p.marca}</p>
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

