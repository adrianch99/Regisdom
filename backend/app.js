require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const businessRoutes = require('./routes/businesses');
const loanRoutes = require('./routes/loans');
const cartulinaRoutes = require('./routes/cartulinas');
const adminRoutes = require('./routes/admin');
const clientsRoutes = require('./routes/clients');
const cobradoresRoutes = require('./routes/cobradores');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Configuración para servir archivos estáticos
app.use(express.static(path.join(__dirname, '../frontend')));

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/businesses', businessRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/cartulinas', cartulinaRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/cobradores', cobradoresRoutes);

// Fallback para servir index.html en rutas no encontradas
app.use((req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

const PORT = process.env.PORT;
app.listen(PORT, () => {
    console.log(`Servidor backend escuchando en el puerto ${PORT}`);
});
