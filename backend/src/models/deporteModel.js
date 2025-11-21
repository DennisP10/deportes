const db = require('../../db');

const DeporteModel = {
    // --- CANCHAS ---
    obtenerCanchas: async () => {
        const [rows] = await db.query('SELECT * FROM canchas');
        return rows;
    },
    crearCancha: async (data) => {
        const [res] = await db.query('INSERT INTO canchas (nombre, deporte, precio) VALUES (?,?,?)', [data.nombre, data.deporte, data.precio]);
        return res.insertId;
    },
    // Función para EDITAR cancha (La agregamos en el paso anterior)
    actualizarCancha: async (id, data) => {
        const [res] = await db.query(
            'UPDATE canchas SET nombre = ?, deporte = ?, precio = ? WHERE id = ?',
            [data.nombre, data.deporte, data.precio, id]
        );
        return res.affectedRows;
    },

    // --- RESERVAS ---
    obtenerReservas: async () => {
        // Traemos también el nombre de la cancha usando JOIN
        const query = `
            SELECT r.*, c.nombre as cancha_nombre, c.deporte 
            FROM reservas r 
            JOIN canchas c ON r.cancha_id = c.id 
            ORDER BY r.fecha DESC, r.hora_inicio ASC`;
        const [rows] = await db.query(query);
        return rows;
    },
    
    // Validar si ya existe reserva en esa cancha/fecha/hora
    validarDisponibilidad: async (cancha_id, fecha, hora) => {
        const [rows] = await db.query(
            'SELECT * FROM reservas WHERE cancha_id = ? AND fecha = ? AND hora_inicio = ? AND estado != "cancelada"',
            [cancha_id, fecha, hora]
        );
        return rows.length === 0; // Retorna true si está libre
    },

    crearReserva: async (data) => {
        const [res] = await db.query(
            'INSERT INTO reservas (cancha_id, usuario_nombre, fecha, hora_inicio) VALUES (?,?,?,?)',
            [data.cancha_id, data.usuario_nombre, data.fecha, data.hora_inicio]
        );
        return res.insertId;
    },

    cambiarEstadoReserva: async (id, estado) => {
        const [res] = await db.query('UPDATE reservas SET estado = ? WHERE id = ?', [estado, id]);
        return res.affectedRows;
    },

    eliminarReserva: async (id) => {
        const [res] = await db.query('DELETE FROM reservas WHERE id = ?', [id]);
        return res.affectedRows;
    },

    // --- ESTADÍSTICAS (NUEVO) ---
    // Nota la coma anterior, es vital.
    obtenerEstadisticasPorCancha: async () => {
        const query = `
            SELECT 
                c.nombre, 
                c.deporte, 
                COUNT(r.id) as total_reservas, 
                COALESCE(SUM(c.precio), 0) as ingresos
            FROM canchas c
            LEFT JOIN reservas r ON c.id = r.cancha_id AND r.estado != 'cancelada'
            GROUP BY c.id, c.nombre, c.deporte
            ORDER BY total_reservas DESC
        `;
        const [rows] = await db.query(query);
        return rows;
    }

};

module.exports = DeporteModel;