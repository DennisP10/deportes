const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/deporteController');

// Canchas
router.get('/canchas', ctrl.getCanchas);
router.post('/canchas', ctrl.createCancha);
router.put('/canchas/:id', ctrl.updateCancha);

// Reservas
router.get('/reservas', ctrl.getReservas);
router.post('/reservas', ctrl.createReserva);
router.put('/reservas/:id/aprobar', ctrl.aprobarReserva);
router.put('/reservas/:id/cancelar', ctrl.cancelarReserva);
router.get('/estadisticas', ctrl.getEstadisticas);

// ...
router.post('/canchas', ctrl.createCancha);
router.put('/canchas/:id', ctrl.updateCancha); // <--- AGREGAR ESTA LÍNEA
// ...

// ... (otras rutas de reservas)
router.post('/reservas', ctrl.createReserva);
router.put('/reservas/:id/aprobar', ctrl.aprobarReserva);
router.put('/reservas/:id/cancelar', ctrl.cancelarReserva);

// 👇 AGREGA ESTA LÍNEA NUEVA 👇
router.delete('/reservas/:id', ctrl.deleteReserva); 

router.get('/estadisticas', ctrl.getEstadisticas);
// ...

module.exports = router;