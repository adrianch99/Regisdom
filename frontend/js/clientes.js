// Define la URL base dependiendo del entorno
const BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3001' // Desarrollo
    : 'https://regisdom.onrender.com'; // Producción

const API_URL = `${BASE_URL}/api/clients`;

document.addEventListener("DOMContentLoaded", () => {
    const user = JSON.parse(localStorage.getItem("user"));

    if (!user) {
        alert("Debes iniciar sesión.");
        window.location.href = "index1.html";
        return;
    }
});

// Cargar lista de clientes
async function cargarClientes() {
    try {
        const res = await fetch(API_URL);
        const clientes = await res.json();
        const contenedor = document.getElementById("clientes-lista");
        contenedor.innerHTML = "";

        clientes.forEach(c => {
            const div = document.createElement("div");
            div.className = "card-clientes";
            div.innerHTML = `
        <strong>${c.nombre}</strong> (${c.email || 'Sin email'})
        <div class="btn-clientes-actions">
        <button class="btn-editar" onclick="abrirModal(${c.id}, '${c.nombre}', '${c.email || ''}', ${c.negocio_id || ''})">Editar</button>
        <button class="btn-eliminar" onclick="eliminarCliente(${c.id})">Eliminar</button>
        </div>
      `;
            contenedor.appendChild(div);
        });
    } catch (err) {
        console.error("Error cargando clientes:", err);
    }
}

// Abrir modal de edición
function abrirModal(id, nombre, email, negocio_id) {
    document.getElementById("editar-id").value = id;
    document.getElementById("editar-nombre").value = nombre;
    document.getElementById("editar-email").value = email;
    document.getElementById("editar-negocio-id").value = negocio_id || "";
    document.getElementById("modal-editar").style.display = "flex";
}

// Cerrar modal
function cerrarModal() {
    document.getElementById("modal-editar").style.display = "none";
}

// Editar cliente
document.getElementById("form-editar").addEventListener("submit", async (e) => {
    e.preventDefault();

    const id = document.getElementById("editar-id").value;
    const nombre = document.getElementById("editar-nombre").value;
    const email = document.getElementById("editar-email").value;
    const negocio_id = document.getElementById("editar-negocio-id").value;

    try {
        await fetch(`${API_URL}/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nombre, email, negocio_id })
        });
        cerrarModal();
        cargarClientes();
    } catch (err) {
        console.error("Error editando cliente:", err);
    }
});

// Eliminar cliente
async function eliminarCliente(id) {
    if (confirm("¿Seguro que deseas eliminar este cliente?")) {
        try {
            await fetch(`${API_URL}/${id}`, { method: "DELETE" });
            cargarClientes();
        } catch (err) {
            console.error("Error eliminando cliente:", err);
        }
    }
}

// Inicializar
cargarClientes();