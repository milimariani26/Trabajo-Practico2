// checkout.js - renderiza la página de pago usando sessionStorage

function formatMoney(n){
  return Number(n).toLocaleString();
}

function cargarCarritoSesion(){
  try{
    return JSON.parse(sessionStorage.getItem('carrito')) || [];
  }catch(e){
    return [];
  }
}

function renderCheckoutPage(){
  const root = document.getElementById('checkoutRoot');
  if (!root) return;
  const carrito = cargarCarritoSesion();
  if (!carrito || carrito.length === 0){
    root.innerHTML = '<p>Tu carrito está vacío. <a href="index.html">Volver al inicio</a></p>';
    return;
  }

  const total = carrito.reduce((acc,p) => acc + ((Number(p.precio)||0) * (Number(p.cantidad)||0)), 0);

  const container = document.createElement('div');
  container.className = 'checkout-grid page-grid';

  const left = document.createElement('div');
  left.className = 'checkout-summary';
  let listHtml = '<div class="checkout-items-list">';
  carrito.forEach(item => {
    listHtml += `<div class="checkout-item"><img src="images/${item.codigo}.jpg" alt="${item.producto}"><div class="meta"><strong>${item.producto}</strong><div>${item.cantidad} x $${formatMoney(item.precio)}</div></div><div class="line-price">$${formatMoney((Number(item.precio)||0)*(Number(item.cantidad)||0))}</div></div>`;
  });
  listHtml += '</div>';
  left.innerHTML = '<h2>Resumen de tu compra</h2>' + listHtml + `<div class="checkout-total">Total: $${formatMoney(total)}</div>`;

  const right = document.createElement('div');
  right.className = 'checkout-form';
  right.innerHTML = `
    <h2>Datos y pago</h2>
    <form id="checkoutFormPage">
      <label>Nombre completo<br><input type="text" id="cf-name" required></label>
      <label>Email<br><input type="email" id="cf-email" required></label>
      <label>DNI<br><input type="text" id="cf-DNI"></label>
      
      <h4>Método de pago</h4>
        <div class="metodo-pago">
        <label class="opcion-pago">
        <input type="radio" name="cf-pay" value="mercadopago" checked>
            <span class="titulo-pago">Mercado Pago</span>
            <br>
            <small>(Te enviaremos un mail con los datos para la transferencia)</small>
        </label>

        <label class="opcion-pago">
            <input type="radio" name="cf-pay" value="tarjeta">
            <span class="titulo-pago">Tarjeta de crédito o débito</span>
                <div id="cardFields" style="display:none; margin-top:.5rem;">
                <label>Número de tarjeta<br><input type="text" id="card-number"></label>
                <label>Vencimiento<br><input type="text" id="card-exp"></label>
                <label>CVV<br><input type="text" id="card-cvv"></label>
                <label>DNI<br><input type="text" id="text-cvv"></label>
                <label>Nombre y apellido<br><input type="text" id="text-cvv"></label>
      </div>
         </label>
        </div>

    <h4>Método de entrega</h4>
  <label><input type="radio" name="entrega" value="local" checked> Retirar en el local</label><br>
  <label><input type="radio" name="entrega" value="envio"> Envío a domicilio</label>
  <div id="direccionCampos" class="direccion-oculta">
    <label>Calle y número<br><input type="text" id="cf-calle" placeholder="Ej: Av. Santa Fe 3200"></label>
    <label>Provincia<br><input type="text" id="cf-provincia" placeholder="Ej: Buenos Aires"></label>
    <label>Código postal<br><input type="text" id="cf-cp" placeholder="Ej: 1640"></label>
  </div>


      <div class="checkout-actions">
        <button type="submit" class="btn-primary">Pagar $${formatMoney(total)}</button>
      </div>
    </form>
  `;

  container.appendChild(left);
  container.appendChild(right);
  root.innerHTML = '';
  root.appendChild(container);

  // mostrar campos de tarjeta si se selecciona tarjeta
  const form = document.getElementById('checkoutFormPage');
  const cardFields = document.getElementById('cardFields');
  form.querySelectorAll('input[name="cf-pay"]').forEach(r => {
    r.addEventListener('change', () => {
      if (r.value === 'tarjeta' && r.checked) cardFields.style.display = 'block';
      else cardFields.style.display = 'none';
    });
  });
 // Mostrar campos de dirección solo si se elige "Envío a domicilio"
    const entregaRadios = form.querySelectorAll('input[name="entrega"]');
    const direccionCampos = form.querySelector('#direccionCampos');

    entregaRadios.forEach(radio => {
    radio.addEventListener("change", () => {
        if (radio.value === "envio" && radio.checked) {
            direccionCampos.style.display = "block";
        } else {
            direccionCampos.style.display = "none";
        }
    });
    });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('cf-name')?.value?.trim();
    const email = document.getElementById('cf-email')?.value?.trim();
    const payMethod = form.querySelector('input[name="cf-pay"]:checked')?.value;
    if (!name || !email || !payMethod){
      alert('Por favor completa tu nombre, email y selecciona un método de pago.');
      return;
    }

    // Si eligió tarjeta, validar campos simples
    if (payMethod === 'tarjeta'){
      const num = document.getElementById('card-number')?.value?.trim();
      const exp = document.getElementById('card-exp')?.value?.trim();
      const cvv = document.getElementById('card-cvv')?.value?.trim();
      if (!num || !exp || !cvv){
        alert('Por favor completa los datos de la tarjeta.');
        return;
      }
    }
    
    //si elijo envio a domicilio si no completas los campos no te deja finalizar la compra
    const entrega = form.querySelector('input[name="entrega"]:checked')?.value;
if (entrega === 'envio') {
  const calle = document.getElementById('cf-calle')?.value?.trim();
  const provincia = document.getElementById('cf-provincia')?.value?.trim();
  const cp = document.getElementById('cf-cp')?.value?.trim();
  if (!calle || !provincia || !cp) {
    alert('Por favor completá los datos de envío.');
    return;
  }
}

// --- ENVIAR CORREO DE CONFIRMACIÓN ---
    const serviceID = "service_yy32ehe";
    const templateID = "template_pluvwpb";
    const publicKey = "aOMpAI6_MlRNFld0S";

    // 1. Preparamos la lista de productos COMO UN ARRAY
    const productList = carrito.map(p =>
      `${p.producto} (${p.cantidad} x $${p.precio.toLocaleString()})`
    );

    // 2. Inicializamos emailjs
    emailjs.init(publicKey);

    // 3. Enviamos el ARRAY y MANEJAMOS LA REDIRECCIÓN
    emailjs.send(serviceID, templateID, {
      user_name: name,
      user_email: email,
      product_list: productList
    }).then(() => {
      // --- ÉXITO ---
      // El correo se envió, AHORA sí podemos
      // mostrar el éxito y redirigir.
      console.log("✅ Correo enviado al comprador");
      alert('Compra realizada con éxito');
      
      // Vaciar carrito y redirigir
      try { sessionStorage.removeItem('carrito'); } catch(e) {}
      window.location.href = 'index.html';

    }).catch((error) => {
      // --- FALLO ---
      // El correo falló, avisamos al usuario y 
      // (para este caso) igual lo dejamos avanzar.
      console.error("❌ Error al enviar el correo:", error);
      alert('Tu compra fue realizada, pero hubo un error al enviar el email de confirmación.');
      
      // Igual vaciamos el carrito y redirigimos
      try { sessionStorage.removeItem('carrito'); } catch(e) {}
      window.location.href = 'index.html';
    });
    
  }); // Este es el cierre del form.addEventListener
} // Este es el cierre de renderCheckoutPage()


// inicializar
window.addEventListener('DOMContentLoaded', renderCheckoutPage);


