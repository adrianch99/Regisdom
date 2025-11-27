const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const passport = require('passport');
const FacebookStrategy = require('passport-facebook').Strategy;
const jwt = require('jsonwebtoken');

const saltRounds = 10;

// Configuración del transporter para emails
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Verificar configuración al iniciar
console.log('Email config - User:', process.env.EMAIL_USER ? 'Configurado' : 'NO CONFIGURADO');
console.log('Email config - Pass:', process.env.EMAIL_PASS ? 'Configurado' : 'NO CONFIGURADO');

// Registro de usuario
router.post('/register', async (req, res) => {
    const { nombre, email, password } = req.body;

    if (!nombre || !email || !password) {
        return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
    }

    try {
        // Verificar si el usuario existe
        const exists = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (exists.rows.length > 0) {
            return res.status(409).json({ message: 'El usuario ya existe.' });
        }

        // Encriptar contraseña
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Insertar usuario con contraseña encriptada
        await pool.query(
            'INSERT INTO users (nombre, email, password, role) VALUES ($1, $2, $3, $4)',
            [nombre, email, hashedPassword, 'usuario']
        );

        res.status(201).json({ message: 'Usuario registrado correctamente.' });
    } catch (err) {
        res.status(500).json({ message: 'Error en el servidor.', error: err.message });
    }
});

// Inicio de sesión
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Buscar usuario por email
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

        if (result.rows.length === 0) {
            return res.status(401).json({ message: 'Credenciales incorrectas.' });
        }

        const user = result.rows[0];

        // Verificar contraseña
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Credenciales incorrectas.' });
        }

        // Eliminar password del objeto user antes de enviarlo
        const { password: _, ...userWithoutPassword } = user;

        res.json({
            message: 'Inicio de sesión exitoso.',
            user: userWithoutPassword
        });
    } catch (err) {
        res.status(500).json({ message: 'Error en el servidor.', error: err.message });
    }
});

// Solicitar recuperación de contraseña
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;

    try {
        console.log('Solicitud de recuperación para:', email);

        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

        if (result.rows.length === 0) {
            console.log('Email no encontrado:', email);
            return res.status(404).json({ message: 'No existe una cuenta con este email.' });
        }

        const user = result.rows[0];
        const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

        console.log('Token generado para:', user.nombre);

        // Guardar token temporal en la base de datos (válido por 1 hora)
        await pool.query(
            'UPDATE users SET reset_token = $1, reset_token_expiry = $2 WHERE email = $3',
            [resetToken, new Date(Date.now() + 3600000), email]
        );

        // Verificar configuración de email
        console.log('Configuración email - User:', process.env.EMAIL_USER);

        const mailOptions = {
            from: process.env.EMAIL_USER || 'noreply@regisdom.com',
            to: email,
            subject: 'Recuperación de contraseña - Regisdom',
            html: `
                <h2>Recuperación de contraseña</h2>
                <p>Hola ${user.nombre},</p>
                <p>Has solicitado restablecer tu contraseña. Haz clic en el siguiente enlace:</p>
                <a href="http://localhost:3001/reset-password.html?token=${resetToken}" style="background: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Restablecer contraseña</a>
                <p>Este enlace expirará en 1 hora.</p>
                <p>Si no solicitaste este cambio, ignora este email.</p>
            `
        };

        console.log('Intentando enviar email...');
        await transporter.sendMail(mailOptions);
        console.log('Email enviado exitosamente');

        res.json({ message: 'Se ha enviado un enlace de recuperación a tu email.' });
    } catch (err) {
        console.error('Error completo en forgot-password:', err);
        res.status(500).json({
            message: 'Error al procesar la solicitud.',
            error: err.message,
            details: 'Verifica la configuración del servidor de email'
        });
    }
});

// Restablecer contraseña
router.post('/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;

    try {
        // Verificar token y expiración
        const result = await pool.query(
            'SELECT * FROM users WHERE reset_token = $1 AND reset_token_expiry > $2',
            [token, new Date()]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({ message: 'Token inválido o expirado.' });
        }

        const user = result.rows[0];

        // Encriptar nueva contraseña
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

        // Actualizar contraseña y limpiar token
        await pool.query(
            'UPDATE users SET password = $1, reset_token = NULL, reset_token_expiry = NULL WHERE email = $2',
            [hashedPassword, user.email]
        );

        res.json({ message: 'Contraseña restablecida correctamente.' });
    } catch (err) {
        res.status(500).json({ message: 'Error al restablecer la contraseña.', error: err.message });
    }
});

// Configurar Facebook Strategy
passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: "http://localhost:3001/api/auth/facebook/callback",
    profileFields: ['id', 'displayName', 'emails', 'picture.type(large)']
}, async (accessToken, refreshToken, profile, done) => {
    try {
        const email = profile.emails && profile.emails[0]?.value;
        const nombre = profile.displayName;
        const foto = profile.photos && profile.photos[0]?.value;

        if (!email) {
            return done(new Error('No se pudo obtener el correo electrónico de Facebook'), null);
        }

        // Buscar usuario en la base de datos
        const exists = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

        if (exists.rows.length > 0) {
            return done(null, exists.rows[0]);
        }

        // Si no existe, crearlo
        const result = await pool.query(
            'INSERT INTO users (nombre, email, password, role, foto) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [nombre, email, null, 'cliente', foto]
        );

        return done(null, result.rows[0]);
    } catch (err) {
        return done(err, null);
    }
}));

// Ruta para redirigir a Facebook
router.get('/facebook', passport.authenticate('facebook', { scope: ['email'], session: false }));

router.get('/facebook/callback',
    passport.authenticate('facebook', { failureRedirect: '/index1.html', session: false }),
    (req, res) => {
        const user = req.user;

        // Generar token JWT
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Redirigir al frontend con el token
        res.redirect(`http://localhost:5500/cliente.html?token=${token}`);
    }
);


// Middleware para verificar token
const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(401).json({ error: 'Token requerido' });

    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Token inválido' });

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Token inválido o expirado' });
        req.user = user;
        next();
    });
};

// Ruta para devolver datos del usuario logueado
router.get('/me', verifyToken, async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT id, nombre, email, role, foto FROM users WHERE id = $1",
            [req.user.id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener usuario' });
    }
});


module.exports = router;