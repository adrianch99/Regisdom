const express = require('express');
const router = express.Router();
const pool = require('../db');

// Listar negocios
router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM businesses');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ message: 'Error en el servidor.' });
    }
});

// Crear negocio
router.post('/', async (req, res) => {
    const { nombre, admin_id } = req.body;
    try {
        await pool.query('INSERT INTO businesses (nombre, admin_id) VALUES ($1, $2)', [nombre, admin_id]);
        res.status(201).json({ message: 'Negocio creado.' });
    } catch (err) {
        res.status(500).json({ message: 'Error en el servidor.' });
    }
});

// Editar negocio
router.put('/:id', async (req, res) => {
    const { nombre, admin_id } = req.body;
    try {
        await pool.query('UPDATE businesses SET nombre = $1, admin_id = $2 WHERE id = $3', [nombre, admin_id, req.params.id]);
        res.json({ message: 'Negocio actualizado.' });
    } catch (err) {
        res.status(500).json({ message: 'Error en el servidor.' });
    }
});

// Eliminar negocio
router.delete('/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM businesses WHERE id = $1', [req.params.id]);
        res.json({ message: 'Negocio eliminado.' });
    } catch (err) {
        res.status(500).json({ message: 'Error en el servidor.' });
    }
});

// Obtener datos del negocio, clientes, préstamos y cartulinas
router.get('/dashboard', async (req, res) => {
    const { admin_id } = req.query; // ID del administrador logueado

    try {
        // Obtener datos del negocio
        const negocioResult = await pool.query(
            'SELECT * FROM businesses WHERE admin_id = $1',
            [admin_id]
        );

        if (negocioResult.rows.length === 0) {
            return res.status(404).json({ message: 'No se encontró un negocio para este administrador.' });
        }

        const negocio = negocioResult.rows[0];

        // Obtener lista de clientes asociados al negocio
        const clientesResult = await pool.query(
            'SELECT * FROM users WHERE negocio_id = $1',
            [negocio.id]
        );

        // Obtener solicitudes de préstamos asociadas al negocio
        const prestamosResult = await pool.query(
            `SELECT loans.*, users.nombre AS cliente_nombre
             FROM loans
             JOIN users ON loans.cliente_id = users.id
             WHERE loans.negocio_id = $1`,
            [negocio.id]
        );

        // Obtener cartulinas asociadas al negocio
        const cartulinasResult = await pool.query(
            'SELECT * FROM cartulinas WHERE prestamo_id IN (SELECT id FROM loans WHERE negocio_id = $1)',
            [negocio.id]
        );

        res.json({
            negocio,
            clientes: clientesResult.rows,
            prestamos: prestamosResult.rows,
            cartulinas: cartulinasResult.rows
        });
    } catch (err) {
        console.error('Error obteniendo datos del dashboard:', err);
        res.status(500).json({ message: 'Error en el servidor.' });
    }
});

module.exports = router;
