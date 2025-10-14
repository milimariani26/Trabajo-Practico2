document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const codigo = params.get("codigo");

  if (!codigo) return;

  // Leer CSV
  const res = await fetch("productos.csv");
  const texto = await res.text();
  const lineas = texto.split("\n").slice(1);
  const productos = lineas.map(l => {
    const [CODIGO, MARCA, PRODUCTO, COLOR, USO, DESCRIPCION, PRECIO, DESCUENTO, STOCK, CATEGORIA] = l.split(",");
    return { CODIGO, MARCA, PRODUCTO, COLOR, USO, DESCRIPCION, PRECIO, DESCUENTO, STOCK, CATEGORIA };
  });

  // Buscar producto actual
  const producto = productos.find(p => p.CODIGO === codigo);
  if (!producto) return;

  // Mostrar datos del producto
  document.getElementById("nombre").textContent = producto.PRODUCTO;
  document.getElementById("marca").textContent = `Marca: ${producto.MARCA}`;
  document.getElementById("precio").textContent = `$${parseFloat(producto.PRECIO).toLocaleString()}`;
  if (producto.COLOR != ''){
    document.getElementById('color').textContent = `Color: ${producto.COLOR}`}
  document.getElementById("img-principal").src = `image/${producto.CODIGO}.jpg`;

  // Control de cantidad
  const cantidad = document.getElementById("cantidad");
  document.getElementById("menos").onclick = () => {
    if (cantidad.value > 1) cantidad.value--;
  };
  document.getElementById("mas").onclick = () => cantidad.value++;

  // Agregar al carrito
  document.getElementById("agregar").onclick = () => {
    const carrito = JSON.parse(localStorage.getItem("carrito") || "[]");
    const existente = carrito.find(p => p.CODIGO === producto.CODIGO);
    const cantidadNueva = parseInt(cantidad.value);

    if (existente) {
      existente.CANTIDAD += cantidadNueva;
    } else {
      carrito.push({ ...producto, CANTIDAD: cantidadNueva });
    }

    localStorage.setItem("carrito", JSON.stringify(carrito));
    alert("Producto agregado al carrito 🛒");
  };

  // Productos recomendados
  const similares = productos
    .filter(p => p.CATEGORIA === producto.CATEGORIA && p.CODIGO !== producto.CODIGO)
    .slice(0, 4);

  const contenedor = document.getElementById("grid-recomendados");
  contenedor.innerHTML = similares.map(p => `
    <div class="card-recomendado" onclick="window.location.href='producto.html?codigo=${p.CODIGO}'">
      <img src="images/${p.CODIGO}.jpg" alt="${p.PRODUCTO}">
      <h4>${p.PRODUCTO}</h4>
      
      <p1>Color: ${p.COLOR} </p1>
      <p>$${parseFloat(p.PRECIO).toLocaleString()}</p>
    </div>
  `).join("");
});
