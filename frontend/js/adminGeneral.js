document.addEventListener("DOMContentLoaded", () => {
    const user = JSON.parse(localStorage.getItem("user"));

    if (!user) {
        alert("Debes iniciar sesión.");
        window.location.href = "index1.html";
        return;
    }
});

const API_BUSINESSES = "/api/businesses";
const API_URL = "/api/users";

// Cargar negocios
async function cargarNegocios() {
    try {
        const res = await fetch(API_BUSINESSES);
        const negocios = await res.json();

        const contenedor = document.getElementById("lista-negocios");
        contenedor.innerHTML = "";

        negocios.forEach(n => {
            const div = document.createElement("div");
            div.className = "negocio";
            div.innerHTML = `
            <span><b>${n.nombre}</b> (ID: ${n.id})</span>
          `;
            contenedor.appendChild(div);
        });
    } catch (err) {
        console.error("Error cargando negocios:", err);
    }
};

// Cargar lista de usuarios
async function cargarUsuarios() {
    try {
        const res = await fetch(API_URL);
        const usuarios = await res.json();

        const contenedor = document.getElementById("usuarios-lista");
        contenedor.innerHTML = "";

        usuarios.forEach(u => {
            const div = document.createElement("div");
            div.className = "usuario";
            div.innerHTML = `
        <span><b>${u.nombre}</b> (${u.email}) - Negocio ID: ${u.negocio_id || 'N/A'}</span>
        <div class="btn-usuarios-actions">
            <button class="btn-editar" onclick="editarUsuario(${u.id})">Editar</button>
            <button class="btn-eliminar" onclick="eliminarUsuario(${u.id})">Eliminar</button>
        </div>
    `;
            contenedor.appendChild(div);
        });
    } catch (err) {
        console.error("Error cargando usuarios:", err);
    }
}

// Actualizar rol
async function actualizarRol(id) {
    const select = document.getElementById(`rol-${id}`);
    const role = select.value;

    try {
        const res = await fetch(`${API_URL}/${id}/role`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ role })
        });

        if (res.ok) {
            alert("Rol actualizado con éxito.");
            cargarUsuarios();
        } else {
            alert("Error al actualizar rol.");
        }
    } catch (err) {
        console.error("Error:", err);
    }
}

// Eliminar usuario
async function eliminarUsuario(id) {
    if (!confirm("¿Seguro que deseas eliminar este usuario?")) return;

    try {
        const res = await fetch(`${API_URL}/${id}`, { method: "DELETE" });

        if (res.ok) {
            alert("Usuario eliminado.");
            cargarUsuarios();
        } else {
            alert("Error al eliminar usuario.");
        }
    } catch (err) {
        console.error("Error:", err);
    }
}

//Inicializar
cargarNegocios();
cargarUsuarios();
