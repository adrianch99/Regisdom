const express = require('express');
const router = express.Router();
const pool = require('../db');

// Crear cartulina
router.post('/', async (req, res) => {
    const { prestamo_id, cliente, direccion, telefono, cobrador_id, monto } = req.body;
    try {
        await pool.query(
            'INSERT INTO cartulinas (prestamo_id, cliente, direccion, telefono, cobrador_id, monto) VALUES ($1, $2, $3, $4, $5, $6)',
            [prestamo_id, cliente, direccion, telefono, cobrador_id, monto]
        );
        res.status(201).json({ message: 'Cartulina creada exitosamente.' });
    } catch (err) {
        res.status(500).json({ message: 'Error en el servidor.' });
    }
});

// Listar cartulinas
router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM cartulinas');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ message: 'Error en el servidor.' });
    }
});

// Guardar registro de cobro diario
router.post('/cobros', async (req, res) => {
    const { cartulina_id, fecha, abono, resta } = req.body;
    if (!cartulina_id || !fecha || !abono || !resta) {
        return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
    }

    try {
        await pool.query(
            'INSERT INTO cobros (cartulina_id, fecha, abono, resta) VALUES ($1, $2, $3, $4)',
            [cartulina_id, fecha, abono, resta]
        );
        res.status(201).json({ message: 'Cobro registrado exitosamente.' });
    } catch (err) {
        res.status(500).json({ message: 'Error en el servidor.' });
    }
});

// Obtener cobros de una cartulina
router.get('/:id/cobros', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM cobros WHERE cartulina_id = $1 ORDER BY fecha ASC',
            [req.params.id]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ message: 'Error en el servidor.' });
    }
});

module.exports = router;