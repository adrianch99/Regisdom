const express = require('express');
const router = express.Router();
const pool = require('../db');

// Obtener todos los cobradores
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM users WHERE role = $1',
            ['cobrador']
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error obteniendo cobradores:', err);
        res.status(500).json({ message: 'Error en el servidor.' });
    }
});

// Obtener cobrador por ID
router.get('/:id', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM users WHERE id = $1 AND role = $2',
            [req.params.id, 'cobrador']
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Cobrador no encontrado.' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error obteniendo cobrador:', err);
        res.status(500).json({ message: 'Error en el servidor.' });
    }
});

module.exports = router;