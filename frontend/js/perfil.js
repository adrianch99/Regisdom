document.addEventListener("DOMContentLoaded", () => {
    const user = JSON.parse(localStorage.getItem("user"));

    if (!user) {
        window.location.href = "index1.html";
        return;
    }

    // Pintar datos en pantalla
    const nombreUsuario = user.nombre || "Usuario";
    document.getElementById("nombre").textContent = nombreUsuario;
    document.getElementById("email").textContent = user.email || "Sin correo";
    document.getElementById("rol").textContent = user.role || "usuario";

    // Generar avatar dinámico
    const iniciales = obtenerIniciales(nombreUsuario);
    const color = generarColorDesdeTexto(nombreUsuario);
    
    const avatarUrl = `https://api.dicebear.com/7.x/initials/png?seed=${encodeURIComponent(iniciales)}&backgroundColor=${color}&textColor=ffffff&size=100`;
    
    document.getElementById("foto-perfil").src = avatarUrl;
    document.getElementById("foto-perfil").alt = `Avatar de ${nombreUsuario}`;
});

// Función para obtener iniciales del nombre
function obtenerIniciales(nombre) {
    if (!nombre) return "US";
    
    return nombre
        .split(' ')
        .map(palabra => palabra.charAt(0).toUpperCase())
        .join('')
        .slice(0, 2);
}

// Función para generar color consistente desde el texto
function generarColorDesdeTexto(texto) {
    let hash = 0;
    for (let i = 0; i < texto.length; i++) {
        hash = texto.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const colores = ['4f46e5', '059669', 'dc2626', '7c3aed', 'db2777', 'ea580c'];
    return colores[Math.abs(hash) % colores.length];
}

function logout() {
    localStorage.removeItem("user");
    window.location.href = "index1.html";
}