document.addEventListener("DOMContentLoaded", () => {
    const user = JSON.parse(localStorage.getItem("user"));

    if (!user) {
        alert("Debes iniciar sesión.");
        window.location.href = "index1.html";
        return;
    }

    window.user = user; // Hacer que `user` esté disponible globalmente
});

// Capturar token desde la URL
const params = new URLSearchParams(window.location.search);
const token = params.get("token");

if (token) {
    // Guardar en localStorage
    localStorage.setItem("token", token);

    // Limpiar la URL
    window.history.replaceState({}, document.title, window.location.pathname);

    // Obtener datos del usuario
    fetch("http://localhost:3001/api/auth/me", {
        headers: { "Authorization": "Bearer " + token }
    })
        .then(res => {
            if (!res.ok) throw new Error("Error al obtener datos del usuario");
            return res.json();
        })
        .then(user => {
            localStorage.setItem("user", JSON.stringify(user));
            console.log("Usuario logueado con Facebook:", user);

            // Mostrar en el dashboard
            document.getElementById("userName").textContent = user.nombre;
            document.getElementById("userEmail").textContent = user.email;
            document.getElementById("userPhoto").src = user.foto || "img/default-profile.png";
        })
        .catch(err => {
            console.error("Error:", err);
            alert("Hubo un problema al iniciar sesión con Facebook.");
        });
}


const API_BUSINESSES = "http://localhost:3001/api/businesses";
const API_PRESTAMOS = "http://localhost:3001/api/loans";

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
            <button class="solicitar-prestamo" onclick="abrirModal(${n.id})">Solicitar Préstamo</button>
          `;
            contenedor.appendChild(div);
        });
    } catch (err) {
        console.error("Error cargando negocios:", err);
    }
}

// Abrir modal
function abrirModal(negocioId) {
    document.getElementById("modal-prestamo").style.display = "flex";
    document.getElementById("negocio-id").value = negocioId;
}

// Cerrar modal
function cerrarModal() {
    document.getElementById("modal-prestamo").style.display = "none";
}

// Enviar solicitud de préstamo
document.getElementById("form-prestamo").addEventListener("submit", async e => {
    e.preventDefault();

    const negocioId = document.getElementById("negocio-id").value; // ID del negocio seleccionado
    const monto = document.getElementById("monto").value;

    console.log("Datos enviados:", { negocio_id: negocioId, monto, cliente_id: window.user.id });

    try {
        const res = await fetch(API_PRESTAMOS, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                negocio_id: negocioId,
                monto,
                cliente_id: window.user.id
            })
        });

        if (res.ok) {
            alert("Solicitud enviada con éxito.");
            cerrarModal();
            cargarPrestamos();
        } else {
            const errorData = await res.json();
            console.error("Error al enviar solicitud:", errorData);
            alert("Error al enviar solicitud.");
        }
    } catch (err) {
        console.error("Error:", err);
    }
});

// Cargar préstamos (aquí iría tu API de préstamos)
async function cargarPrestamos() {
    const contenedor = document.getElementById("lista-prestamos-cliente");
    contenedor.innerHTML = "<p>(Aquí se mostrarán los préstamos del cliente)</p>";
    // TODO: consumir /api/prestamos y listar
}

// Cambiar entre tabs
document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        // quitar active de todos
        document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
        document.querySelectorAll(".tab-content").forEach(tc => tc.classList.remove("active"));

        // activar el actual
        btn.classList.add("active");
        document.getElementById(btn.dataset.tab).classList.add("active");
    });
});

// Inicializar
cargarNegocios();
cargarPrestamos();
