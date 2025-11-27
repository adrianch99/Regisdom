const express = require('express');
const router = express.Router();
const pool = require('../db');

// Obtener todos los clientes o filtrar por negocio_id
router.get('/', async (req, res) => {
    const { negocio_id } = req.query;

    try {
        let query = 'SELECT * FROM users WHERE role = $1';
        let params = ['cliente'];

        if (negocio_id) {
            query += ' AND negocio_id = $2';
            params.push(negocio_id);
        }

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error('Error obteniendo clientes:', err);
        res.status(500).json({ message: 'Error en el servidor.' });
    }
});

// Obtener cliente por ID
router.get('/:id', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM users WHERE id = $1 AND role = $2',
            [req.params.id, 'cliente']
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Cliente no encontrado.' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error obteniendo cliente:', err);
        res.status(500).json({ message: 'Error en el servidor.' });
    }
});

// Actualizar cliente
router.put('/:id', async (req, res) => {
    const { nombre, email, negocio_id } = req.body;

    try {
        const result = await pool.query(
            'UPDATE users SET nombre = $1, email = $2, negocio_id = $3 WHERE id = $4 AND role = $5 RETURNING *',
            [nombre, email, negocio_id, req.params.id, 'cliente']
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Cliente no encontrado.' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error actualizando cliente:', err);
        res.status(500).json({ message: 'Error en el servidor.' });
    }
});

// Eliminar cliente
router.delete('/:id', async (req, res) => {
    try {
        const result = await pool.query(
            'DELETE FROM users WHERE id = $1 AND role = $2 RETURNING *',
            [req.params.id, 'cliente']
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Cliente no encontrado.' });
        }

        res.json({ message: 'Cliente eliminado correctamente.' });
    } catch (err) {
        console.error('Error eliminando cliente:', err);
        res.status(500).json({ message: 'Error en el servidor.' });
    }
});

module.exports = router;