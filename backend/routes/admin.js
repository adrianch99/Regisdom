const express = require('express');
const router = express.Router();
const pool = require('../db');

// Obtener lista de clientes
router.get('/clients', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM clients');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ message: 'Error al obtener clientes.' });
    }
});

// Obtener lista de préstamos
router.get('/loans', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM loans');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ message: 'Error al obtener préstamos.' });
    }
});

// Obtener lista de cartulinas
router.get('/cartulinas', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM cartulinas');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ message: 'Error al obtener cartulinas.' });
    }
});

module.exports = router;
