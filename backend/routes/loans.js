const express = require('express');
const router = express.Router();
const pool = require('../db');

// Listar préstamos
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT loans.*, users.nombre AS cliente_nombre
            FROM loans
            JOIN users ON loans.cliente_id = users.id
        `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ message: 'Error en el servidor.' });
    }
});

// Crear préstamo
router.post('/', async (req, res) => {
    const { monto, cliente_id, cobrador_id, negocio_id, fecha, estado } = req.body;

    console.log("Datos recibidos en el backend:", req.body);

    try {
        // Verificar si el cliente existe en la tabla users
        const cliente = await pool.query('SELECT id FROM users WHERE id = $1', [cliente_id]);
        if (cliente.rows.length === 0) {
            return res.status(400).json({ message: 'El cliente no existe.' });
        }

        // Verificar si el negocio existe en la tabla businesses
        const negocio = await pool.query('SELECT id FROM businesses WHERE id = $1', [negocio_id]);
        if (negocio.rows.length === 0) {
            return res.status(400).json({ message: 'El negocio no existe.' });
        }

        // Crear el préstamo con el negocio_id
        await pool.query(
            'INSERT INTO loans (monto, cliente_id, cobrador_id, negocio_id, fecha, estado) VALUES ($1, $2, $3, $4, $5, $6)',
            [
                monto,
                cliente_id,
                cobrador_id || null,
                negocio_id,
                fecha || new Date(),
                estado || 'pendiente',
            ]
        );
        res.status(201).json({ message: 'Préstamo creado.' });
    } catch (err) {
        res.status(500).json({ message: 'Error en el servidor.' });
    }
});

// Eliminar préstamo
router.delete('/:id', async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM loans WHERE id = $1', [req.params.id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Préstamo no encontrado.' });
        }
        res.json({ message: 'Préstamo eliminado correctamente.' });
    } catch (err) {
        res.status(500).json({ message: 'Error en el servidor.' });
    }
});

// Aceptar préstamo
router.put('/aceptar/:id', async (req, res) => {
    const { direccion, telefono, cobrador_id } = req.body;
    try {
        const prestamo = await pool.query(
            `SELECT loans.id, loans.negocio_id, loans.monto, users.id AS cliente_id, users.nombre AS cliente_nombre 
             FROM loans 
             JOIN users ON loans.cliente_id = users.id 
             WHERE loans.id = $1`,
            [req.params.id]
        );

        if (prestamo.rows.length === 0) {
            return res.status(404).json({ message: 'Préstamo o cliente no encontrado' });
        }

        const { cliente_id, cliente_nombre, negocio_id, monto } = prestamo.rows[0];

        // Verificar si el negocio_id es válido
        if (!negocio_id) {
            return res.status(400).json({ message: 'El préstamo no tiene un negocio asociado.' });
        }

        // Actualizar préstamo
        await pool.query(
            'UPDATE loans SET estado = $1, cobrador_id = $2 WHERE id = $3',
            ['aceptado', cobrador_id, req.params.id]
        );

        // Actualizar usuario (asignar negocio_id y cambiar role a 'cliente')
        await pool.query(
            'UPDATE users SET negocio_id = $1, role = $2 WHERE id = $3',
            [negocio_id, 'cliente', cliente_id]
        );

        // Responder con datos para generar cartulina
        res.json({
            message: "Préstamo aceptado",
            prestamo: {
                id: req.params.id,
                cliente: cliente_nombre,
                direccion,
                telefono,
                cobrador_id,
                monto
            }
        });
    } catch (err) {
        console.error("Error aceptando préstamo:", err);
        res.status(500).json({ message: "Error en el servidor." });
    }
});

// Rechazar préstamo
router.put('/rechazar/:id', async (req, res) => {
    try {
        await pool.query(
            'UPDATE loans SET estado = $1 WHERE id = $2',
            ['rechazado', req.params.id]
        );
        res.json({ message: "Préstamo rechazado" });
    } catch (err) {
        res.status(500).json({ message: "Error en el servidor." });
    }
});

module.exports = router;
