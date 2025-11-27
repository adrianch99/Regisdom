// ==== INICIO DE SESION ==== //
// Solo agregar event listener si el formulario de login existe
if (document.getElementById('login-form')) {
    document.getElementById('login-form').addEventListener('submit', async function (e) {
        e.preventDefault(); // Evitar el comportamiento predeterminado del formulario

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const message = document.getElementById('login-message');

        try {
            const response = await fetch('http://localhost:3001/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                // Guardar el token o redirigir al usuario
                localStorage.setItem('user', JSON.stringify(data.user));
                window.location.href = 'adminGeneral.html'; // Redirigir al dashboard
            } else {
                message.textContent = data.message || 'Error al iniciar sesión.';
                message.style.color = 'red';
            }
        } catch (err) {
            console.error('Error al iniciar sesión:', err);
            message.textContent = 'Error al conectar con el servidor.';
            message.style.color = 'red';
        }
    });
}

// ==== REGISTRO DE USUARIOS ==== //
// Solo agregar event listener si el formulario de registro existe
if (document.getElementById('register-form')) {
    document.getElementById('register-form').addEventListener('submit', async function (e) {
        e.preventDefault();
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        const message = document.getElementById('register-message');

        if (password !== confirmPassword) {
            message.textContent = "Las contraseñas no coinciden.";
            message.style.color = "red";
            return;
        }

        if (password.length < 6) {
            message.textContent = "La contraseña debe tener al menos 6 caracteres.";
            message.style.color = "red";
            return;
        }

        try {
            const res = await fetch('http://localhost:3001/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre: name, email, password })
            });

            const data = await res.json();

            if (res.ok) {
                message.textContent = data.message;
                message.style.color = 'green';
                setTimeout(() => {
                    window.location.href = "index1.html";
                }, 500);
            } else {
                message.textContent = data.message;
                message.style.color = 'red';
            }
        } catch (err) {
            message.textContent = 'Error de conexión.';
            message.style.color = 'red';
        }
    });
}

// ==== RECUPERACIÓN DE CONTRASEÑA ==== //
// Función para solicitar recuperación
async function forgotPassword(email) {
    try {
        const res = await fetch('http://localhost:3001/api/auth/forgot-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });

        const data = await res.json();
        return data;
    } catch (err) {
        return { message: 'Error de conexión.' };
    }
}

// Función para restablecer contraseña
async function resetPassword(token, newPassword) {
    try {
        const res = await fetch('http://localhost:3001/api/auth/reset-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, newPassword })
        });

        const data = await res.json();
        return data;
    } catch (err) {
        return { message: 'Error de conexión.' };
    }
}

// Event listener para el formulario de recuperación de contraseña
if (document.getElementById('forgot-password-form')) {
    document.getElementById('forgot-password-form').addEventListener('submit', async function (e) {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const message = document.getElementById('forgot-message');

        const data = await forgotPassword(email);

        message.textContent = data.message;
        message.style.color = data.message.includes('enviado') ? 'green' : 'red';
    });
}

// Event listener para el formulario de restablecer contraseña
if (document.getElementById('reset-password-form')) {
    document.getElementById('reset-password-form').addEventListener('submit', async function (e) {
        e.preventDefault();
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        const message = document.getElementById('reset-message');

        if (newPassword !== confirmPassword) {
            message.textContent = "Las contraseñas no coinciden.";
            message.style.color = "red";
            return;
        }

        if (!token) {
            message.textContent = "Token inválido.";
            message.style.color = "red";
            return;
        }

        const data = await resetPassword(token, newPassword);

        message.textContent = data.message;
        message.style.color = data.message.includes('correctamente') ? 'green' : 'red';

        if (data.message.includes('correctamente')) {
            setTimeout(() => {
                window.location.href = 'index1.html';
            }, 1000);
        }
    });
}