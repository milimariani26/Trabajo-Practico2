document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const codigo = params.get("codigo");

  if (!codigo) return;

  const res = await fetch("productos.csv");
  const texto = await res.text();
  const lineas = texto.split("\n").slice(1);
  const productos = lineas.map(l => {
    const [CODIGO, MARCA, PRODUCTO, COLOR, USO, DESCRIPCION, PRECIO, DESCUENTO, STOCK, CATEGORIA] = l.split(",");
    return { CODIGO, MARCA, PRODUCTO, COLOR, USO, DESCRIPCION, PRECIO, DESCUENTO, STOCK, CATEGORIA };
  });

  const producto = productos.find(p => p.CODIGO === codigo);
  if (!producto) return;

  // --- Mostrar info del producto ---
  document.getElementById("nombre").textContent = producto.PRODUCTO;
  document.getElementById("marca").textContent = producto.MARCA;
  document.getElementById("precio").textContent = `$${parseFloat(producto.PRECIO).toLocaleString()}`;
  document.getElementById("img-principal").src = `img/${producto.CODIGO}_1.jpg`;

  // --- Miniaturas ---
  const miniaturas = document.getElementById("miniaturas");
  for (let i = 1; i <= 3; i++) {
    const img = document.createElement("img");
    img.src = `img/${producto.CODIGO}_${i}.jpg`;
    img.alt = producto.PRODUCTO;
    img.onclick = () => (document.getElementById("img-principal").src = img.src);
    miniaturas.appendChild(img);
  }

  // --- Control de cantidad ---
  const cantidad = document.getElementById("cantidad");
  document.getElementById("menos").onclick = () => {
    if (cantidad.value > 1) cantidad.value--;
  };
  document.getElementById("mas").onclick = () => cantidad.value++;

  // --- Agregar al carrito ---
  document.getElementById("agregar").onclick = () => {
    const carrito = JSON.parse(localStorage.getItem("carrito") || "[]");
    const existente = carrito.find(p => p.CODIGO === producto.CODIGO);
    if (existente) {
      existente.CANTIDAD += parseInt(cantidad.value);
    } else {
      carrito.push({ ...producto, CANTIDAD: parseInt(cantidad.value) });
    }
    localStorage.setItem("carrito", JSON.stringify(carrito));
    alert("Producto agregado al carrito 🛒");
  };

  // --- También te podría interesar ---
  const similares = productos
    .filter(p => p.CATEGORIA === producto.CATEGORIA && p.CODIGO !== producto.CODIGO)
    .slice(0, 4);

  const contenedor = document.getElementById("grid-recomendados");
  similares.forEach(p => {
    const card = document.createElement("div");
    card.className = "card-recomendado";
    card.innerHTML = `
      <img src="img/${p.CODIGO}_1.jpg" alt="${p.PRODUCTO}">
      <h4>${p.PRODUCTO}</h4>
      <p>$${parseFloat(p.PRECIO).toLocaleString()}</p>
    `;
    card.onclick = () => {
      window.location.href = `producto.html?codigo=${p.CODIGO}`;
    };
    contenedor.appendChild(card);
  });
});
