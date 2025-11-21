const Model = require('../models/deporteModel');

const Controller = {
    // ... (tus funciones de canchas y getReservas siguen igual) ...
    getCanchas: async (req, res) => {
        try { res.json(await Model.obtenerCanchas()); } catch (e) { res.status(500).json({error: e.message}); }
    },
    createCancha: async (req, res) => {
        try { 
            await Model.crearCancha(req.body); 
            res.json({message: 'Cancha creada'}); 
        } catch (e) { res.status(500).json({error: e.message}); }
    },
    updateCancha: async (req, res) => {
        try {
            const result = await Model.actualizarCancha(req.params.id, req.body);
            if (result === 0) return res.status(404).json({ message: 'Cancha no encontrada' });
            res.json({ message: 'Cancha actualizada correctamente' });
        } catch (e) { res.status(500).json({ error: e.message }); }
    },
    getReservas: async (req, res) => {
        try { res.json(await Model.obtenerReservas()); } catch (e) { res.status(500).json({error: e.message}); }
    },
    createReserva: async (req, res) => {
        try {
            const { cancha_id, fecha, hora_inicio } = req.body;
            if (new Date(fecha).toISOString().split('T')[0] < new Date().toISOString().split('T')[0]) {
                 return res.status(400).json({ message: '⛔ Error: No puedes reservar en una fecha pasada.' });
            }
            const esHoy = new Date(fecha).toISOString().split('T')[0] === new Date().toISOString().split('T')[0];
            const horaActual = new Date().getHours();
            if (esHoy && parseInt(hora_inicio) <= horaActual) {
                 return res.status(400).json({ message: '⛔ Error: Esa hora ya pasó.' });
            }
            const disponible = await Model.validarDisponibilidad(cancha_id, fecha, hora_inicio);
            if (!disponible) {
                return res.status(400).json({ message: '❌ HORARIO OCUPADO: Ya existe una reserva.' });
            }
            await Model.crearReserva(req.body);
            res.json({ message: 'Reserva registrada con éxito' });
        } catch (e) { res.status(500).json({error: e.message}); }
    },
    getEstadisticas: async (req, res) => {
        try {
            const reservas = await Model.obtenerReservas();
            const total = reservas.length;
            const aprobadas = reservas.filter(r => r.estado === 'aprobada').length;
            const pendientes = reservas.filter(r => r.estado === 'pendiente').length;
            const porCancha = await Model.obtenerEstadisticasPorCancha();
            res.json({ total, aprobadas, pendientes, porCancha });
        } catch (e) { res.status(500).json({error: e.message}); }
    },
    aprobarReserva: async (req, res) => {
        try { await Model.cambiarEstadoReserva(req.params.id, 'aprobada'); res.json({message: 'Aprobada'}); } catch (e) { res.status(500).json({error: e.message}); }
    },

    // --- AQUÍ ESTÁ LA SEPARACIÓN ---

    // 1. CANCELAR (Lógico - Para el Usuario y Admin)
    cancelarReserva: async (req, res) => {
        try { 
            // Solo cambia el estado, NO borra el registro
            await Model.cambiarEstadoReserva(req.params.id, 'cancelada'); 
            res.json({message: 'Cancelada'}); 
        } catch (e) { res.status(500).json({error: e.message}); }
    },

    // 2. ELIMINAR (Físico - Solo Admin)
    deleteReserva: async (req, res) => {
        try {
            // Borra el registro de la base de datos
            const result = await Model.eliminarReserva(req.params.id);
            if (result === 0) {
                return res.status(404).json({ message: 'Reserva no encontrada' });
            }
            res.json({ message: 'Reserva eliminada permanentemente' });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    }
};

module.exports = Controller;