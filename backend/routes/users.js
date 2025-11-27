const express = require('express');
const router = express.Router();
const pool = require('../db');

// Listar usuarios
router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT id, nombre, email, role, negocio_id FROM users');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ message: 'Error en el servidor.' });
    }
});

// Asignar/editar rol
router.put('/:id/role', async (req, res) => {
    const { role } = req.body;
    try {
        await pool.query('UPDATE users SET role = $1 WHERE id = $2', [role, req.params.id]);
        res.json({ message: 'Rol actualizado.' });
    } catch (err) {
        res.status(500).json({ message: 'Error en el servidor.' });
    }
});

// Actualizar usuario
router.put('/:id', async (req, res) => {
    const { nombre, email, role, negocio_id } = req.body;
    try {
        await pool.query(
            'UPDATE users SET nombre = $1, email = $2, role = $3, negocio_id = $4 WHERE id = $5',
            [nombre, email, role, negocio_id, req.params.id]
        );
        res.json({ message: 'Usuario actualizado.' });
    } catch (err) {
        res.status(500).json({ message: 'Error en el servidor.' });
    }
});

// Eliminar usuario
router.delete('/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM users WHERE id = $1', [req.params.id]);
        res.json({ message: 'Usuario eliminado.' });
    } catch (err) {
        res.status(500).json({ message: 'Error en el servidor.' });
    }
});

module.exports = router;
