document.addEventListener("DOMContentLoaded", () => {
    const user = JSON.parse(localStorage.getItem("user"));

    if (!user) {
        alert("Debes iniciar sesión.");
        window.location.href = "index1.html";
        return;
    }
});

const API_CLIENTES = "http://localhost:3001/api/clients";
const API_LOANS = "http://localhost:3001/api/loans";
const API_CARTULINAS = "http://localhost:3001/api/cartulinas";
const user = JSON.parse(localStorage.getItem("user")); // cobrador logueado

// Cargar clientes
async function cargarClientes() {
    try {
        const res = await fetch(API_CLIENTES);
        if (!res.ok) throw new Error("Error al cargar clientes");
        const clientes = await res.json();

        const contenedor = document.getElementById("lista-clientes");
        contenedor.innerHTML = ""; // Limpiar contenido previo

        if (clientes.length === 0) {
            contenedor.innerHTML = "<p>No hay clientes registrados.</p>";
            return;
        }

        clientes.forEach(c => {
            const div = document.createElement("div");
            div.className = "card-clientes";
            div.innerHTML = `
                <p><strong>${c.nombre}</strong> (${c.email || "Sin correo"})</p>
                <p>Negocio ID: ${c.negocio_id}</p>
            `;
            contenedor.appendChild(div);
        });
    } catch (err) {
        console.error("Error cargando clientes:", err);
        document.getElementById("lista-clientes").innerHTML = "<p>Error al cargar clientes.</p>";
    }
}

// Cargar préstamos pendientes
async function cargarPrestamos() {
    try {
        const res = await fetch(`${API_LOANS}?estado=pendiente`);
        if (!res.ok) throw new Error("Error al cargar préstamos");
        const prestamos = await res.json();

        const cont = document.getElementById("lista-prestamos");
        cont.innerHTML = ""; // Limpiar contenido previo

        if (prestamos.length === 0) {
            cont.innerHTML = "<p>No hay préstamos pendientes.</p>";
            return;
        }

        prestamos.forEach(p => {
            const div = document.createElement("div");
            div.className = "card-prestamos";
            div.innerHTML = `
                <p>Préstamo ID: ${p.id} - Cliente: ${p.cliente_nombre || "Sin nombre"} - Monto: ${p.monto}</p>
                <div class="btn-prestamos-actions">
                    <button class="btn-aceptar-prestamo" onclick="abrirModal(${p.id}, '${p.cliente_nombre || "Sin nombre"}')">Aceptar</button>
                    <button class="btn-rechazar-prestamo" onclick="rechazarPrestamo(${p.id})">Rechazar</button>
                </div>
            `;
            cont.appendChild(div);
        });
    } catch (err) {
        console.error("Error cargando préstamos:", err);
        document.getElementById("lista-prestamos").innerHTML = "<p>Error al cargar préstamos.</p>";
    }
}

// Abrir modal de aceptar
function abrirModal(prestamoId, nombreCliente) {
    document.getElementById("modal-aceptar").style.display = "flex";
    document.getElementById("prestamo-id").value = prestamoId;
    document.getElementById("nombre-cliente").innerText = nombreCliente;
}

// Cerrar modal
function cerrarModal() {
    document.getElementById("modal-aceptar").style.display = "none";
}

// Enviar aceptación
document.getElementById("form-aceptar").addEventListener("submit", async e => {
    e.preventDefault();
    const prestamoId = document.getElementById("prestamo-id").value;
    const direccion = document.getElementById("direccion").value;
    const telefono = document.getElementById("telefono").value;

    const res = await fetch(`${API_LOANS}/aceptar/${prestamoId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ direccion, telefono, cobrador_id: user.id })
    });

    const data = await res.json();
    if (res.ok) {
        alert("Préstamo aceptado, generando cartulina...");
        generarCartulina(data.prestamo);
        cerrarModal();
        cargarPrestamos();
    } else {
        alert("Error: " + data.message);
    }
});

// Rechazar préstamo
async function rechazarPrestamo(id) {
    if (!confirm("¿Seguro que quieres rechazar este préstamo? Esto lo eliminará permanentemente.")) return;
    const res = await fetch(`${API_LOANS}/rechazar/${id}`, { method: "PUT" });
    if (res.ok) {
        // Eliminar el préstamo después de rechazarlo
        const deleteRes = await fetch(`${API_LOANS}/${id}`, { method: "DELETE" });
        if (deleteRes.ok) {
            alert("Préstamo rechazado y eliminado.");
            cargarPrestamos();
        } else {
            alert("Error al eliminar el préstamo.");
        }
    } else {
        alert("Error al rechazar el préstamo.");
    }
}
// Save daily payment data
async function guardarCobro(cartulinaId, fecha, abono, resta) {
    try {
        const res = await fetch(`${API_CARTULINAS}/cobros`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ cartulina_id: cartulinaId, fecha, abono, resta }),
        });

        if (!res.ok) {
            const error = await res.json();
            console.error("Error guardando cobro:", error.message);
        }
    } catch (err) {
        console.error("Error guardando cobro:", err);
    }
}

// Add event listeners to editable cells
function habilitarEdicionCartulina(tabla) {
    tabla.addEventListener("input", (e) => {
        const cell = e.target;
        const row = cell.parentElement;

        // Marcar la fila como modificada
        if (cell.contentEditable === "true") {
            row.dataset.modified = "true";
            console.log("Fila marcada como modificada"); // Para debug
        }
    });
}

async function guardarCambiosCartulina(cartulinaId, tabla) {
    const rows = tabla.querySelectorAll("tbody tr");
    let cambiosGuardados = false;

    console.log("Buscando filas modificadas..."); // Para debug

    for (const row of rows) {
        console.log("Fila:", row.innerHTML, "Modificada:", row.dataset.modified); // Para debug

        if (row.dataset.modified === "true") { // Guardar solo las filas modificadas
            const cells = row.querySelectorAll("td");
            const fecha = cells[0]?.innerText.trim();
            const abono = cells[1]?.innerText.trim();
            const resta = cells[2]?.innerText.trim();

            console.log("Datos encontrados:", { fecha, abono, resta }); // Para debug

            // Solo guardar si todos los campos tienen datos
            if (fecha && abono && resta) {
                console.log("Guardando cobro..."); // Para debug
                await guardarCobro(cartulinaId, fecha, abono, resta);
                cambiosGuardados = true;

                // Limpiar el estado de modificación y deshabilitar edición
                row.dataset.modified = "";
                cells.forEach(cell => {
                    cell.contentEditable = "false";
                    cell.style.backgroundColor = "#f0f0f0"; // Estilo para indicar que está guardado
                });
            }
        }
    }

    if (cambiosGuardados) {
        // Agregar una nueva fila vacía para nuevos datos
        const nuevaFila = document.createElement("tr");
        nuevaFila.innerHTML = `
            <td contenteditable="true"></td>
            <td contenteditable="true"></td>
            <td contenteditable="true"></td>
        `;
        tabla.querySelector("tbody").appendChild(nuevaFila);

        // IMPORTANTE: Re-aplicar el event listener a la nueva fila
        habilitarEdicionCartulina(tabla);

        alert("Cambios guardados correctamente.");
    } else {
        alert("No hay cambios para guardar.");
    }
}

// Generar cartulina para cobros diarios
function generarCartulina(prestamo) {
    const { id, cliente, direccion, telefono, cobrador_id, monto } = prestamo;

    // Crear tabla para la cartulina
    const tabla = document.createElement("table");
    tabla.border = "1";
    tabla.style.width = "100%";
    tabla.innerHTML = `
        <thead>
            <tr>
                <th>Fecha</th>
                <th>Abono</th>
                <th>Resta</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td contenteditable="true"></td>
                <td contenteditable="true"></td>
                <td contenteditable="true"></td>
            </tr>
        </tbody>
    `;

    // Habilitar edición en la tabla
    habilitarEdicionCartulina(tabla);

    // Crear contenedor de cartulina
    const contenedorCartulinas = document.getElementById("cartulinas");
    const divCartulina = document.createElement("div");
    divCartulina.className = "cartulina";
    divCartulina.innerHTML = `
        <h3>CARTULINA DE COBROS DIARIOS</h3>
        <p><strong>Préstamo ID:</strong> ${id}</p>
        <p><strong>Cliente:</strong> ${cliente}</p>
        <p><strong>Dirección:</strong> ${direccion}</p>
        <p><strong>Teléfono:</strong> ${telefono}</p>
        <p><strong>Monto:</strong> ${monto}</p>
        <p><strong>Cobrador ID:</strong> ${cobrador_id}</p>
    `;

    // Botón para guardar cambios
    const botonGuardar = document.createElement("button");
    botonGuardar.innerText = "Guardar Cambios";
    botonGuardar.className = "btn-guardar-cambios";
    botonGuardar.addEventListener("click", () => guardarCambiosCartulina(id, tabla));

    divCartulina.appendChild(tabla);
    divCartulina.appendChild(botonGuardar);
    contenedorCartulinas.appendChild(divCartulina);

    // Guardar cartulina en la base de datos
    fetch("http://localhost:3001/api/cartulinas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prestamo_id: id, cliente, direccion, telefono, cobrador_id })
    })
        .then(res => res.json())
        .then(data => {
            if (data.message) {
                console.log("Cartulina guardada en la base de datos.");
            }
        })
        .catch(err => console.error("Error guardando cartulina:", err));
}

// Cargar cartulinas guardadas con sus cobros
async function cargarCartulinas() {
    try {
        const res = await fetch(API_CARTULINAS);
        if (!res.ok) throw new Error("Error al cargar cartulinas");
        const cartulinas = await res.json();

        const cont = document.getElementById("cartulinas");
        cont.innerHTML = "<h2>Cartulinas generadas</h2>";

        if (cartulinas.length === 0) {
            cont.innerHTML += "<p>No hay cartulinas registradas.</p>";
            return;
        }

        for (const c of cartulinas) {
            const div = document.createElement("div");
            div.className = "cartulina";
            div.innerHTML = `
                <h3>CARTULINA</h3>
                <p><strong>Préstamo ID:</strong> ${c.prestamo_id}</p>
                <p><strong>Cliente:</strong> ${c.cliente}</p>
                <p><strong>Dirección:</strong> ${c.direccion}</p>
                <p><strong>Teléfono:</strong> ${c.telefono}</p>
                <p><strong>Cobrador:</strong> ${c.cobrador_id}</p>
            `;

            // Crear tabla para los cobros
            const tabla = document.createElement("table");
            tabla.border = "1";
            tabla.style.width = "100%";
            tabla.innerHTML = `
                <thead>
                    <tr>
                        <th>Fecha</th>
                        <th>Abono</th>
                        <th>Resta</th>
                    </tr>
                </thead>
                <tbody>
                </tbody>
            `;

            // Cargar cobros desde la base de datos
            const cobrosRes = await fetch(`${API_CARTULINAS}/${c.id}/cobros`);
            const cobros = await cobrosRes.json();

            const tbody = tabla.querySelector("tbody");
            cobros.forEach(cobro => {
                const fila = document.createElement("tr");
                fila.innerHTML = `
                    <td>${cobro.fecha}</td>
                    <td>${cobro.abono}</td>
                    <td>${cobro.resta}</td>
                `;
                tbody.appendChild(fila);
            });

            // Agregar una fila vacía para nuevos cobros
            const nuevaFila = document.createElement("tr");
            nuevaFila.innerHTML = `
                <td contenteditable="true"></td>
                <td contenteditable="true"></td>
                <td contenteditable="true"></td>
            `;
            tbody.appendChild(nuevaFila);

            // ✅ IMPORTANTE: Habilitar edición en la tabla después de agregar la fila
            habilitarEdicionCartulina(tabla);

            // Botón para guardar cambios
            const botonGuardar = document.createElement("button");
            botonGuardar.innerText = "Guardar Cambios";
            botonGuardar.className = "btn-guardar-cambios";
            botonGuardar.addEventListener("click", () => guardarCambiosCartulina(c.id, tabla));

            div.appendChild(tabla);
            div.appendChild(botonGuardar);
            cont.appendChild(div);
        }
    } catch (err) {
        console.error("Error cargando cartulinas:", err);
        document.getElementById("cartulinas").innerHTML = "<p>Error al cargar cartulinas.</p>";
    }
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
cargarClientes();
cargarPrestamos();
cargarCartulinas();

btn.addEventListener("click", () => {
    // quitar active de todos
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(tc => tc.classList.remove("active"));

    // activar el actual
    btn.classList.add("active");
    document.getElementById(btn.dataset.tab).classList.add("active");
});


// Inicializar
cargarClientes();
cargarPrestamos();
cargarCartulinas();
