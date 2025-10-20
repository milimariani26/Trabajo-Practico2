document.addEventListener("DOMContentLoaded", async () => {
  const codigo = new URLSearchParams(window.location.search).get("codigo");
  if (!codigo) return;

  const productos = await cargarProductos();
  const producto = productos.find(p => p.codigo === codigo);
  if (!producto) return;

  const tieneDescuento = producto.descuento > 0;
  const precioFinal = producto.precio - (producto.precio * producto.descuento / 100);

  // Mostrar datos del producto
  document.getElementById("nombre").textContent = producto.producto;
  document.getElementById("marca").textContent = `Marca: ${producto.marca}`;
  const colorElement = document.getElementById("color");
  if (producto.color && producto.color.trim() !== "" && producto.color.trim() !== "-") {
    colorElement.textContent = `Color: ${producto.color}`;
  } 
  document.getElementById("img-principal").src = `images/${producto.codigo}.jpg`;

  const precioContainer = document.getElementById("precio");
  precioContainer.innerHTML = `
    ${tieneDescuento
      ? `<p class="precio-anterior">$${producto.precio.toLocaleString()}</p>
         <p class="precio">$${precioFinal.toLocaleString()}</p>
         <span class="badge-descuento">${producto.descuento}% OFF</span>`
      : `<p class="precio">$${producto.precio.toLocaleString()}</p>`
      
    }
  `;
// Descripción del producto
if (producto.descripcion && producto.descripcion.trim() !== "") {
  const desc = document.createElement("p");
  desc.classList.add("descripcion-producto");

  const descFormateada = producto.descripcion.replaceAll(' - ', '<br>- ');
  
  desc.innerHTML = descFormateada; 

  document.querySelector(".info").appendChild(desc);
}

  // Control de cantidad
  const cantidad = document.getElementById("cantidad");
  document.getElementById("menos").onclick = () => {
    if (cantidad.value > 1) cantidad.value--;
  };
  document.getElementById("mas").onclick = () => cantidad.value++;

  // Agregar al carrito
  document.getElementById("agregar").onclick = () => {
    agregarAlCarrito(producto, parseInt(cantidad.value));
    alert("Producto agregado al carrito 🛒");
  };

  // Productos recomendados
  function tomar4Aleatorios(arr) {
  const n = Math.min(4, arr.length);
  const a = arr.slice();
  for (let i = 0; i < n; i++) {
    const j = i + Math.floor(Math.random() * (a.length - i));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, n);
}
  const recomendados = tomar4Aleatorios(productos.slice(0, productos.length));
  const contenedor = document.getElementById("grid-recomendados");
  contenedor.innerHTML = recomendados.map(p => `
    <div class="card-recomendado" onclick="window.location.href='producto.html?codigo=${p.codigo}'">
      <img src="images/${p.codigo}.jpg" alt="${p.producto}">
      <h4>${p.producto}</h4>
      <p>${p.color && p.color !== "-" ? `<p>Color: ${p.color}</p>` : ""}
      ${p.descuento > 0 ? `<p class="precio-anterior">$${p.precio.toLocaleString()}</p>` : ""}
      <p class="precio">$${(p.precio - (p.precio * (p.descuento || 0) / 100)).toLocaleString()}</p>
    </div>
  `).join("");
});
