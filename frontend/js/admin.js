// Define la URL base dependiendo del entorno
const BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3001' // Desarrollo
    : 'https://regisdom.onrender.com'; // Producción

const API_URL = `${BASE_URL}/api/clients`;
const API_BUSINESS_DASHBOARD = `${BASE_URL}/api/businesses/dashboard`;
const API_CLIENTES = `${BASE_URL}/api/clients`;
const API_LOANS = `${BASE_URL}/api/loans`;
const API_CARTULINAS = `${BASE_URL}/api/cartulinas`;
const API_COBRADORES = `${BASE_URL}/api/cobradores`;

let user = null;

document.addEventListener("DOMContentLoaded", async () => {
    user = JSON.parse(localStorage.getItem("user"));

    if (!user) {
        alert("Debes iniciar sesión.");
        window.location.href = "index1.html";
        return;
    }

    try {
        // Obtener datos del negocio y asociados
        const res = await fetch(`${API_BUSINESS_DASHBOARD}?admin_id=${user.id}`);
        if (!res.ok) {
            throw new Error(`Error al cargar datos del negocio: ${res.statusText}`);
        }

        const data = await res.json();
        mostrarDatosEnTabs(data);
        actualizarEstadisticas(data);

        // Cargar datos específicos para cada tab
        cargarClientes();
        cargarPrestamos();
        cargarCartulinas();
    } catch (err) {
        console.error("Error:", err);
        alert("Error al conectar con el servidor.");
    }
});

// Mostrar datos en las pestañas
function mostrarDatosEnTabs(data) {
    const { negocio, clientes, prestamos, cartulinas } = data;

    // Mostrar datos del negocio
    const negocioNombre = document.getElementById("negocio-nombre");
    if (negocioNombre) {
        negocioNombre.textContent = negocio.nombre;
    }
}

// Actualizar estadísticas
async function actualizarEstadisticas(data) {
    const { clientes } = data;

    // Contar clientes registrados
    const totalClientes = clientes.length;

    // Obtener número de préstamos activos directamente desde la base de datos
    let prestamosActivos = 0;
    try {
        const res = await fetch(`${API_LOANS}/count?estado=aceptado`);
        if (res.ok) {
            const { count } = await res.json();
            prestamosActivos = count;
        } else {
            console.error("Error al contar préstamos activos:", await res.text());
        }
    } catch (err) {
        console.error("Error al conectar con el servidor para contar préstamos activos:", err);
    }

    // Obtener número de cobradores (necesitarías una API para esto)
    try {
        const res = await fetch(API_COBRADORES);
        const cobradores = await res.json();
        const totalCobradores = cobradores.length;

        // Actualizar estadísticas en el DOM
        document.getElementById("prestamos-activos").textContent = prestamosActivos;
        document.getElementById("clientes-registrados").textContent = totalClientes;
        document.getElementById("total-cobradores").textContent = totalCobradores;
    } catch (err) {
        console.error("Error cargando cobradores:", err);

        // Actualizar estadísticas en el DOM con valores predeterminados
        document.getElementById("prestamos-activos").textContent = prestamosActivos;
        document.getElementById("clientes-registrados").textContent = totalClientes;
        document.getElementById("total-cobradores").textContent = "0";
    }
}

// Cargar lista de clientes
async function cargarClientes() {
    try {
        const user = JSON.parse(localStorage.getItem("user"));
        if (!user) return;

        // Obtener el negocio del administrador
        const negocioRes = await fetch(`${API_BUSINESS_DASHBOARD}?admin_id=${user.id}`);
        if (!negocioRes.ok) {
            throw new Error('Error al obtener datos del negocio');
        }

        const negocioData = await negocioRes.json();
        const negocioId = negocioData.negocio.id;

        // Obtener los clientes del negocio
        const res = await fetch(`${API_CLIENTES}?negocio_id=${negocioId}`);
        if (!res.ok) {
            throw new Error('Error al cargar clientes');
        }

        const clientes = await res.json();
        const contenedor = document.getElementById("lista-clientes");
        contenedor.innerHTML = "";

        if (clientes.length === 0) {
            contenedor.innerHTML = "<p>No hay clientes registrados en este negocio.</p>";
            return;
        }

        clientes.forEach(c => {
            const div = document.createElement("div");
            div.className = "card-clientes";
            div.innerHTML = `
                <p><strong>${c.nombre}</strong> (${c.email || "Sin correo"})</p>
                <p>Teléfono: ${c.telefono || "No especificado"}</p>
                <p>Dirección: ${c.direccion || "No especificada"}</p>
                <div class="btn-clientes-actions">
                    <button class="btn-editar" onclick="abrirModalEditar(${c.id}, '${c.nombre}', '${c.email || ''}', ${c.negocio_id})">Editar</button>
                    <button class="btn-eliminar" onclick="eliminarCliente(${c.id})">Eliminar</button>
                </div>
            `;
            contenedor.appendChild(div);
        });
    } catch (err) {
        console.error("Error cargando clientes:", err);
        const contenedor = document.getElementById("lista-clientes");
        contenedor.innerHTML = `<p class="error">Error al cargar clientes: ${err.message}</p>`;
    }
}

// Cargar préstamos con subtabs
async function cargarPrestamos() {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) return;

    try {
        // Obtener el negocio del administrador
        const negocioRes = await fetch(`${API_BUSINESS_DASHBOARD}?admin_id=${user.id}`);
        if (!negocioRes.ok) {
            throw new Error('Error al obtener datos del negocio');
        }

        const negocioData = await negocioRes.json();
        const negocioId = negocioData.negocio.id;

        // Cargar préstamos pendientes, activos y todos los préstamos del negocio
        await cargarPrestamosPendientes(negocioId);
        await cargarPrestamosActivos(negocioId);
        await cargarTodosLosPrestamos(negocioId);
    } catch (err) {
        console.error("Error cargando préstamos:", err);
    }
}

// Cargar préstamos pendientes
async function cargarPrestamosPendientes(negocioId) {
    try {
        const res = await fetch(`${API_LOANS}?estado=pendiente&negocio_id=${negocioId}`);
        const prestamos = await res.json();
        const contenedor = document.getElementById("lista-prestamos-pendientes");
        contenedor.innerHTML = "";

        if (prestamos.length === 0) {
            contenedor.innerHTML = "<p>No hay préstamos pendientes.</p>";
            return;
        }

        prestamos.forEach(p => {
            const div = document.createElement("div");
            div.className = "card-prestamos";
            div.innerHTML = `
                <div class="prestamo-info">
                    <p><strong>Préstamo ID:</strong> ${p.id}</p>
                    <p><strong>Cliente:</strong> ${p.cliente_nombre || "Sin nombre"}</p>
                    <p><strong>Monto:</strong> $${p.monto}</p>
                    <p><strong>Fecha Solicitud:</strong> ${new Date(p.fecha_solicitud).toLocaleDateString()}</p>
                    <p><strong>Estado:</strong> <span class="estado-${p.estado}">${p.estado.toUpperCase()}</span></p>
                </div>
                <div class="btn-prestamos-actions">
                    <button class="btn-aceptar-prestamo" onclick="abrirModalAceptar(${p.id}, '${p.cliente_nombre || "Sin nombre"}')">Aceptar</button>
                    <button class="btn-rechazar-prestamo" onclick="rechazarPrestamo(${p.id})">Rechazar</button>
                </div>
            `;
            contenedor.appendChild(div);
        });
    } catch (err) {
        console.error("Error cargando préstamos pendientes:", err);
        const contenedor = document.getElementById("lista-prestamos-pendientes");
        contenedor.innerHTML = `<p class="error">Error al cargar préstamos pendientes</p>`;
    }
}

// Cargar préstamos activos
async function cargarPrestamosActivos() {
    try {
        const res = await fetch(`${API_LOANS}?estado=activo`);
        const prestamos = await res.json();
        const contenedor = document.getElementById("lista-prestamos-activos");
        contenedor.innerHTML = "";

        if (prestamos.length === 0) {
            contenedor.innerHTML = "<p>No hay préstamos activos.</p>";
            return;
        }

        prestamos.forEach(p => {
            const div = document.createElement("div");
            div.className = "card-prestamos";
            div.innerHTML = `
                <div class="prestamo-info">
                    <p><strong>Préstamo ID:</strong> ${p.id}</p>
                    <p><strong>Cliente:</strong> ${p.cliente_nombre || "Sin nombre"}</p>
                    <p><strong>Monto:</strong> $${p.monto}</p>
                    <p><strong>Fecha Inicio:</strong> ${new Date(p.fecha_inicio).toLocaleDateString()}</p>
                    <p><strong>Estado:</strong> <span class="estado-${p.estado}">${p.estado.toUpperCase()}</span></p>
                    ${p.cobrador_nombre ? `<p><strong>Cobrador:</strong> ${p.cobrador_nombre}</p>` : ''}
                </div>
                <div class="btn-prestamos-actions">
                    <button class="btn-ver-cartulina" onclick="verCartulinaPrestamo(${p.id})">Ver Cartulina</button>
                </div>
            `;
            contenedor.appendChild(div);
        });
    } catch (err) {
        console.error("Error cargando préstamos activos:", err);
    }
}

// Cargar todos los préstamos
async function cargarTodosLosPrestamos() {
    try {
        const res = await fetch(API_LOANS);
        const prestamos = await res.json();
        const contenedor = document.getElementById("lista-prestamos-todos");
        contenedor.innerHTML = "";

        if (prestamos.length === 0) {
            contenedor.innerHTML = "<p>No hay préstamos registrados.</p>";
            return;
        }

        prestamos.forEach(p => {
            const div = document.createElement("div");
            div.className = "card-prestamos";
            div.innerHTML = `
                <div class="prestamo-info">
                    <p><strong>Préstamo ID:</strong> ${p.id}</p>
                    <p><strong>Cliente:</strong> ${p.cliente_nombre || "Sin nombre"}</p>
                    <p><strong>Monto:</strong> $${p.monto}</p>
                    <p><strong>Estado:</strong> <span class="estado-${p.estado}">${p.estado.toUpperCase()}</span></p>
                    <p><strong>Fecha:</strong> ${new Date(p.fecha_solicitud || p.fecha_inicio).toLocaleDateString()}</p>
                    ${p.cobrador_nombre ? `<p><strong>Cobrador:</strong> ${p.cobrador_nombre}</p>` : ''}
                </div>
                <div class="btn-prestamos-actions">
                    ${p.estado === 'pendiente' ?
                    `<button class="btn-aceptar-prestamo" onclick="abrirModalAceptar(${p.id}, '${p.cliente_nombre || "Sin nombre"}')">Aceptar</button>
                         <button class="btn-rechazar-prestamo" onclick="rechazarPrestamo(${p.id})">Rechazar</button>` :
                    `<button class="btn-ver-cartulina" onclick="verCartulinaPrestamo(${p.id})">Ver Cartulina</button>`
                }
                </div>
            `;
            contenedor.appendChild(div);
        });
    } catch (err) {
        console.error("Error cargando todos los préstamos:", err);
    }
}

// Función para ver cartulina de un préstamo
async function verCartulinaPrestamo(prestamoId) {
    try {
        // Buscar la cartulina correspondiente al préstamo
        const cartulinasRes = await fetch(`${API_CARTULINAS}?prestamo_id=${prestamoId}`);
        const cartulinas = await cartulinasRes.json();

        if (cartulinas.length > 0) {
            // Si existe la cartulina, mostrar en la pestaña de cartulinas
            cambiarTab('cartulinas');
            // También puedes hacer scroll a la cartulina específica
            setTimeout(() => {
                const cartulinaElement = document.querySelector(`[data-prestamo-id="${prestamoId}"]`);
                if (cartulinaElement) {
                    cartulinaElement.scrollIntoView({ behavior: 'smooth' });
                }
            }, 100);
        } else {
            alert('No se encontró cartulina para este préstamo');
        }
    } catch (err) {
        console.error('Error buscando cartulina:', err);
        alert('Error al buscar la cartulina');
    }
}

// Cambiar entre tabs principales
function cambiarTab(tabName) {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(tc => tc.classList.remove("active"));

    document.querySelector(`[data-tab="${tabName}"]`).classList.add("active");
    document.getElementById(tabName).classList.add("active");
}

// Cargar cartulinas
async function cargarCartulinas() {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) return;

    try {
        // Obtener el negocio del administrador
        const negocioRes = await fetch(`${API_BUSINESS_DASHBOARD}?admin_id=${user.id}`);
        if (!negocioRes.ok) {
            throw new Error('Error al obtener datos del negocio');
        }

        const negocioData = await negocioRes.json();
        const negocioId = negocioData.negocio.id;

        // Obtener las cartulinas del negocio
        const res = await fetch(`${API_CARTULINAS}?negocio_id=${negocioId}`);
        const cartulinas = await res.json();
        const contenedor = document.getElementById("lista-cartulinas");
        contenedor.innerHTML = "";

        if (cartulinas.length === 0) {
            contenedor.innerHTML = "<p>No hay cartulinas registradas.</p>";
            return;
        }

        cartulinas.forEach(c => {
            const div = document.createElement("div");
            div.className = "cartulina";
            div.innerHTML = `
                <p><strong>Préstamo ID:</strong> ${c.prestamo_id}</p>
                <p><strong>Cliente:</strong> ${c.cliente}</p>
                <p><strong>Dirección:</strong> ${c.direccion}</p>
                <p><strong>Teléfono:</strong> ${c.telefono}</p>
                <p><strong>Cobrador:</strong> ${c.cobrador_id}</p>
            `;
            contenedor.appendChild(div);
        });
    } catch (err) {
        console.error("Error cargando cartulinas:", err);
        const contenedor = document.getElementById("lista-cartulinas");
        contenedor.innerHTML = `<p class="error">Error al cargar cartulinas</p>`;
    }
}

// Funcionalidades de préstamos (desde cobrador.js)
function abrirModalAceptar(prestamoId, nombreCliente) {
    document.getElementById("modal-aceptar").style.display = "flex";
    document.getElementById("prestamo-id").value = prestamoId;
    document.getElementById("nombre-cliente").innerText = nombreCliente;
}

async function rechazarPrestamo(id) {
    if (!confirm("¿Seguro que quieres rechazar este préstamo? Esto lo eliminará permanentemente.")) return;

    try {
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
    } catch (err) {
        console.error("Error rechazando préstamo:", err);
        alert("Error al rechazar el préstamo.");
    }
}

// Enviar aceptación de préstamo
document.getElementById("form-aceptar").addEventListener("submit", async e => {
    e.preventDefault();
    const prestamoId = document.getElementById("prestamo-id").value;
    const direccion = document.getElementById("direccion").value;
    const telefono = document.getElementById("telefono").value;

    try {
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
    } catch (err) {
        console.error("Error aceptando préstamo:", err);
        alert("Error al aceptar el préstamo.");
    }
});
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
    fetch("/api/cartulinas", {
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

// Funcionalidades existentes de admin.js
function abrirModalEditar(id, nombre, email, negocio_id) {
    document.getElementById("editar-id").value = id;
    document.getElementById("editar-nombre").value = nombre;
    document.getElementById("editar-email").value = email;
    document.getElementById("editar-negocio-id").value = negocio_id || "";
    document.getElementById("modal-editar").style.display = "flex";
}

function cerrarModal() {
    document.getElementById("modal-aceptar").style.display = "none";
}

function cerrarModalEditar() {
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
        const res = await fetch(`${API_CLIENTES}/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                nombre,
                email,
                negocio_id: parseInt(negocio_id)
            })
        });

        if (res.ok) {
            alert("Cliente actualizado correctamente");
            cerrarModalEditar();
            cargarClientes();
        } else {
            const error = await res.json();
            alert("Error al actualizar cliente: " + error.message);
        }
    } catch (err) {
        console.error("Error editando cliente:", err);
        alert("Error al actualizar cliente");
    }
});

// Eliminar cliente
async function eliminarCliente(id) {
    if (confirm("¿Seguro que deseas eliminar este cliente?")) {
        try {
            const res = await fetch(`${API_CLIENTES}/${id}`, {
                method: "DELETE"
            });

            if (res.ok) {
                alert("Cliente eliminado correctamente");
                cargarClientes();
            } else {
                const error = await res.json();
                alert("Error al eliminar cliente: " + error.message);
            }
        } catch (err) {
            console.error("Error eliminando cliente:", err);
            alert("Error al eliminar cliente");
        }
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

function logout() {
    localStorage.removeItem("user");
    window.location.href = "index1.html";
}

// Función temporal para debug
async function debugClientes() {
    try {
        const user = JSON.parse(localStorage.getItem("user"));
        console.log("Usuario logueado:", user);

        const negocioRes = await fetch(`${API_BUSINESS_DASHBOARD}?admin_id=${user.id}`);
        const negocioData = await negocioRes.json();
        console.log("Datos del negocio:", negocioData);

        const clientesRes = await fetch(API_CLIENTES);
        const todosClientes = await clientesRes.json();
        console.log("Todos los clientes:", todosClientes);

        const clientesNegocioRes = await fetch(`${API_CLIENTES}?negocio_id=${negocioData.negocio.id}`);
        const clientesNegocio = await clientesNegocioRes.json();
        console.log("Clientes del negocio:", clientesNegocio);

    } catch (err) {
        console.error("Error en debug:", err);
    }
}

// Función para probar conexión con la API
async function testAPI() {
    try {
        console.log("Probando conexión con la API...");

        // Probar endpoint básico
        const testRes = await fetch('/api/test');
        const testData = await testRes.json();
        console.log("Test API:", testData);

        // Probar businesses
        const businessRes = await fetch('/api/businesses');
        const businessData = await businessRes.json();
        console.log("Businesses:", businessData);

        // Probar clients
        const clientsRes = await fetch('/api/clients');
        const clientsData = await clientsRes.json();
        console.log("Clients:", clientsData);

    } catch (err) {
        console.error("Error en test API:", err);
    }
}

// Manejar subtabs de préstamos
document.addEventListener('click', function (e) {
    if (e.target.classList.contains('subtab-btn')) {
        // Remover active de todos los subtabs
        document.querySelectorAll('.subtab-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Remover active de todos los subtab-content
        document.querySelectorAll('.subtab-content').forEach(content => {
            content.classList.remove('active');
        });

        // Activar el subtab clickeado
        e.target.classList.add('active');
        const subtabId = e.target.getAttribute('data-subtab');
        document.getElementById(subtabId).classList.add('active');
    }
});

// Inicializar subtabs al cargar
document.addEventListener('DOMContentLoaded', function () {
    // Asegurarse de que el primer subtab esté activo
    const firstSubtab = document.querySelector('.subtab-btn');
    const firstSubtabContent = document.querySelector('.subtab-content');
    if (firstSubtab && firstSubtabContent) {
        firstSubtab.classList.add('active');
        firstSubtabContent.classList.add('active');
    }
});

// Ejecutar test al cargar
testAPI();

// Llama a esta función temporalmente
debugClientes();