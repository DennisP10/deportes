const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/deporteController');

// --- RUTAS DE CANCHAS ---
router.get('/canchas', ctrl.getCanchas);
router.post('/canchas', ctrl.createCancha);
router.put('/canchas/:id', ctrl.updateCancha);

// --- RUTAS DE RESERVAS ---
router.get('/reservas', ctrl.getReservas);
router.post('/reservas', ctrl.createReserva);

// Aprobar reserva (Solo Admin)
router.put('/reservas/:id/aprobar', ctrl.aprobarReserva);

// 1. CANCELAR (Lógico): Cambia estado a 'cancelada'
// Usado por el Usuario (botón "Cancelar") y Admin (botón X)
router.put('/reservas/:id/cancelar', ctrl.cancelarReserva);

// 2. ELIMINAR (Físico): Borra de la base de datos
// Usado solo por Admin (botón Basura)
router.delete('/reservas/:id', ctrl.deleteReserva);

// --- ESTADÍSTICAS ---
router.get('/estadisticas', ctrl.getEstadisticas);

router.delete('/reservas/:id', ctrl.deleteReserva);

module.exports = router;