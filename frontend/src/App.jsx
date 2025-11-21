import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { 
  Trophy, Calendar, Clock, CheckCircle, XCircle, Users, Plus, 
  Activity, Pencil, Save, XSquare, BarChart2, DollarSign, Trash2 
} from 'lucide-react';
import './App.css';

function App() {
  // CAMBIA ESTO POR TU URL REAL DE RENDER CUANDO DESPLIEGUES
  const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const API_URL = `${BASE_URL}/api`; 
  
  // Fecha de hoy para bloquear días pasados en el calendario
  const hoy = new Date().toISOString().split('T')[0];

  const [vistaAdmin, setVistaAdmin] = useState(false);

  const [canchas, setCanchas] = useState([]);
  const [reservas, setReservas] = useState([]);
  
  // Estado para estadísticas (KPIs + Detalle por cancha)
  const [stats, setStats] = useState({ total: 0, aprobadas: 0, pendientes: 0, porCancha: [] });
  
  const [filtroEstado, setFiltroEstado] = useState('todas');
  const [formReserva, setFormReserva] = useState({ cancha_id: '', usuario_nombre: '', fecha: '', hora_inicio: '' });
  
  const [formCancha, setFormCancha] = useState({ nombre: '', deporte: '', precio: '' });
  const [editCanchaId, setEditCanchaId] = useState(null);

  // --- HELPER: ICONOS ---
  const getDeporteIcon = (deporte) => {
    const d = deporte.toLowerCase();
    if (d.includes('fut') || d.includes('fút')) return '⚽';
    if (d.includes('bas') || d.includes('bás')) return '🏀';
    if (d.includes('tenis')) return '🎾';
    if (d.includes('voley')) return '🏐';
    return '🏅';
  };

  // --- CARGA DE DATOS ---
  const cargarDatos = async () => {
    try {
      const resC = await fetch(`${API_URL}/canchas`);
      setCanchas(await resC.json());
      
      const resR = await fetch(`${API_URL}/reservas`);
      setReservas(await resR.json());

      // Solo cargamos estadísticas si estamos en modo admin
      if(vistaAdmin) {
        const resS = await fetch(`${API_URL}/estadisticas`);
        const dataS = await resS.json();
        setStats(dataS);
      }
    } catch (error) { console.error(error); }
  };

  useEffect(() => { cargarDatos(); }, [vistaAdmin]);

  // --- ACCIÓN 1: CREAR RESERVA (Ciudadano) ---
  const crearReserva = async (e) => {
    e.preventDefault();
    try {
        const res = await fetch(`${API_URL}/reservas`, {
            method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(formReserva)
        });
        const data = await res.json();
        if(res.ok) {
            Swal.fire({ title: '¡Reserva Solicitada!', text: 'Pendiente de aprobación.', icon: 'success', timer: 3000 });
            setFormReserva({ cancha_id: '', usuario_nombre: '', fecha: '', hora_inicio: '' });
            cargarDatos();
        } else {
            Swal.fire('No disponible', data.message, 'warning');
        }
    } catch (error) { Swal.fire('Error', 'No se pudo conectar al servidor', 'error'); }
  };

  // --- ACCIÓN 2: CAMBIAR ESTADO (Aprobar/Cancelar) ---
  const cambiarEstado = async (id, accion, esCiudadano = false) => {
    if (esCiudadano) {
        const confirm = await Swal.fire({
            title: '¿Cancelar tu reserva?',
            text: "Al ser ciudadano, solo puedes cancelar tus solicitudes pendientes.",
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sí, cancelar'
        });
        if (!confirm.isConfirmed) return;
    }

    await fetch(`${API_URL}/reservas/${id}/${accion}`, { method: 'PUT' });
    cargarDatos();
    
    const msg = accion === 'aprobar' ? 'Reserva Aprobada' : 'Reserva Cancelada';
    Swal.fire({
      title: msg,
      icon: accion === 'aprobar' ? 'success' : 'info',
      toast: true, position: 'top-end', showConfirmButton: false, timer: 2000
    });
  };

  // --- ACCIÓN 3: ELIMINAR FÍSICAMENTE (Solo Admin) ---
  const eliminarReserva = async (id) => {
    const result = await Swal.fire({
      title: '¿Eliminar registro?',
      text: "Esto borrará la reserva de la base de datos permanentemente.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Borrar'
    });

    if (result.isConfirmed) {
      try {
        await fetch(`${API_URL}/reservas/${id}`, { method: 'DELETE' });
        cargarDatos();
        Swal.fire('Eliminado', '', 'success');
      } catch (e) { Swal.fire('Error', 'Fallo de conexión', 'error'); }
    }
  };

  // --- ACCIÓN 4: GESTIÓN CANCHAS (Crear/Editar) ---
  const guardarCancha = async (e) => {
    e.preventDefault();
    const method = editCanchaId ? 'PUT' : 'POST';
    const url = editCanchaId ? `${API_URL}/canchas/${editCanchaId}` : `${API_URL}/canchas`;

    try {
        const res = await fetch(url, {
            method: method, headers: {'Content-Type':'application/json'}, body: JSON.stringify(formCancha)
        });
        
        // Manejo robusto de respuesta
        const contentType = res.headers.get("content-type");
        let data;
        if (contentType && contentType.indexOf("application/json") !== -1) {
             data = await res.json();
        } else {
             data = { message: await res.text() };
        }

        if(res.ok) {
            Swal.fire(editCanchaId ? 'Actualizado' : 'Creado', '', 'success');
            setFormCancha({ nombre: '', deporte: '', precio: '' });
            setEditCanchaId(null);
            cargarDatos();
        } else {
            console.error("Error Backend:", data);
            Swal.fire('Error', data.message || 'Fallo al guardar', 'error');
        }
    } catch (error) { 
        console.error("Error Red:", error);
        Swal.fire('Error de Conexión', 'Revisa el backend', 'error'); 
    }
  };

  const iniciarEdicionCancha = (c) => {
    setEditCanchaId(c.id);
    setFormCancha({ nombre: c.nombre, deporte: c.deporte, precio: c.precio });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelarEdicionCancha = () => {
    setEditCanchaId(null);
    setFormCancha({ nombre: '', deporte: '', precio: '' });
  };

  // Filtros y cálculos
  const reservasFiltradas = filtroEstado === 'todas' ? reservas : reservas.filter(r => r.estado === filtroEstado);
  const maxReservas = stats.porCancha && stats.porCancha.length > 0 ? Math.max(...stats.porCancha.map(c => c.total_reservas)) : 1;

  return (
    <div className="container">
      {/* HEADER */}
      <div className="header">
        <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
            <div className="header-icon-box"><Trophy size={32}/></div>
            <div>
                <h1>Club Deportivo</h1>
                <span style={{color:'var(--accent-color)', fontWeight:'bold'}}>Sistema de Reservas</span>
            </div>
        </div>
        <div>
            <button className={`btn ${vistaAdmin ? 'btn-secondary' : 'btn-primary'}`} onClick={() => setVistaAdmin(!vistaAdmin)}>
                {vistaAdmin ? <Users size={18}/> : <Activity size={18}/>}
                {vistaAdmin ? 'Modo Ciudadano' : 'Modo Admin'}
            </button>
        </div>
      </div>

      {/* --- VISTA CIUDADANO --- */}
      {!vistaAdmin && (
        <>
            <div className="layout-grid">
                {/* Formulario */}
                <div className="card">
                    <h3 style={{marginTop:0}}>📅 Reservar Cancha</h3>
                    <form onSubmit={crearReserva}>
                        <div className="form-grid">
                            <div className="input-group full-width">
                                <label>Cancha</label>
                                <select value={formReserva.cancha_id} onChange={e=>setFormReserva({...formReserva, cancha_id:e.target.value})} required>
                                    <option value="">-- Seleccionar --</option>
                                    {canchas.map(c => (
                                      <option key={c.id} value={c.id}>{getDeporteIcon(c.deporte)} {c.nombre} — ${c.precio}/h</option>
                                    ))}
                                </select>
                            </div>
                            <div className="input-group"><label>Tu Nombre</label><input value={formReserva.usuario_nombre} onChange={e=>setFormReserva({...formReserva, usuario_nombre:e.target.value})} required/></div>
                            <div className="input-group"><label>Fecha</label><input type="date" min={hoy} value={formReserva.fecha} onChange={e=>setFormReserva({...formReserva, fecha:e.target.value})} required/></div>
                            <div className="input-group"><label>Hora (07-23)</label><input type="number" min="7" max="23" value={formReserva.hora_inicio} onChange={e=>setFormReserva({...formReserva, hora_inicio:e.target.value})} required/></div>
                        </div>
                        <button className="btn btn-primary" style={{marginTop:'20px', width:'100%', justifyContent:'center'}}>Confirmar Reserva</button>
                    </form>
                </div>

                {/* Lista Visual */}
                <div className="card-list">
                  <h4 style={{margin:'0 0 10px 0', color:'var(--text-secondary)'}}>Canchas Disponibles</h4>
                  {canchas.map(c => (
                    <div key={c.id} className="mini-card">
                      <div className="icon-circle">{getDeporteIcon(c.deporte)}</div>
                      <div><div style={{fontWeight:'bold'}}>{c.nombre}</div><span className="badge-outline">{c.deporte}</span></div>
                      <div className="price-tag">${c.precio}</div>
                    </div>
                  ))}
                </div>
            </div>

            {/* TABLA PÚBLICA CON CANCELAR */}
            <div className="card" style={{marginTop:'24px'}}>
                <h3>📋 Mis Reservas (Público)</h3>
                <p style={{fontSize:'0.85rem', color:'gray'}}>Puedes cancelar tus reservas si aún están pendientes.</p>
                <div className="table-container">
                    <table>
                        <thead><tr><th>Cancha</th><th>Usuario</th><th>Fecha</th><th>Estado</th><th>Acción</th></tr></thead>
                        <tbody>
                            {reservas.map(r => (
                                <tr key={r.id} style={{opacity: r.estado==='cancelada'?0.5:1}}>
                                    <td><b>{r.cancha_nombre}</b></td>
                                    <td>{r.usuario_nombre}</td>
                                    <td>{r.fecha.split('T')[0]} {r.hora_inicio}:00</td>
                                    <td><span className={`badge ${r.estado}`}>{r.estado}</span></td>
                                    <td>
                                        {r.estado === 'pendiente' && (
                                            <button 
                                                className="btn-icon danger" 
                                                onClick={()=>cambiarEstado(r.id, 'cancelar', true)} 
                                                title="Cancelar mi reserva"
                                            >
                                                <XCircle size={18}/> Cancelar
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
      )}

      {/* --- VISTA ADMIN --- */}
      {vistaAdmin && (
        <>
            {/* ESTADÍSTICAS KPI */}
            <div className="stats-grid">
                <div className="stat-card"><div className="stat-icon blue"><Activity/></div><div><h3>{stats.total}</h3><p>Total</p></div></div>
                <div className="stat-card"><div className="stat-icon green"><CheckCircle/></div><div><h3>{stats.aprobadas}</h3><p>Aprobadas</p></div></div>
                <div className="stat-card"><div className="stat-icon orange"><Clock/></div><div><h3>{stats.pendientes}</h3><p>Pendientes</p></div></div>
            </div>

            {/* ESTADÍSTICAS VISUALES */}
            <div className="card" style={{marginTop:'20px'}}>
                <h3 style={{display:'flex', alignItems:'center', gap:'10px'}}><BarChart2 color="var(--accent-color)"/> Rendimiento Financiero</h3>
                <div className="stats-list">
                    {stats.porCancha && stats.porCancha.map((c, index) => (
                        <div key={index} className="stat-row">
                            <div className="stat-info">
                                <span className="stat-name">{getDeporteIcon(c.deporte)} {c.nombre}</span>
                                <span className="stat-values">
                                    <span className="reserva-count"> { c.total_reservas} res.</span>
                                    <span className="income-count" style={{color: 'var(--accent-color)', fontWeight:'bold', display:'flex', alignItems:'center'}}>
                                        <DollarSign size={14}/> {c.ingresos}
                                    </span>
                                </span>
                            </div>
                            <div className="progress-bg">
                                <div className="progress-bar" style={{width: `${(c.total_reservas / (maxReservas || 1)) * 100}%`, minWidth: '5px'}}></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* GESTIÓN CANCHAS */}
            <div className="card" style={{marginTop:'24px', border: editCanchaId ? '2px solid var(--accent-color)' : ''}}>
                <h3 style={{display:'flex', justifyContent:'space-between'}}>
                   {editCanchaId ? '✏️ Editando' : '➕ Nueva Cancha'}
                   {editCanchaId && <button className="btn-icon danger" onClick={cancelarEdicionCancha}><XSquare/></button>}
                </h3>
                <form onSubmit={guardarCancha} style={{display:'flex', gap:'10px', flexWrap:'wrap'}}>
                    <input placeholder="Nombre" value={formCancha.nombre} onChange={e=>setFormCancha({...formCancha, nombre:e.target.value})} required className="flex-input"/>
                    <input placeholder="Deporte" value={formCancha.deporte} onChange={e=>setFormCancha({...formCancha, deporte:e.target.value})} required className="flex-input"/>
                    <input type="number" placeholder="Precio" value={formCancha.precio} onChange={e=>setFormCancha({...formCancha, precio:e.target.value})} required className="flex-input"/>
                    <button className="btn btn-primary">{editCanchaId ? 'Actualizar' : 'Guardar'}</button>
                </form>
            </div>

            {/* GESTIÓN RESERVAS (ADMIN) */}
            <div className="card" style={{marginTop:'24px'}}>
                <div className="toolbar">
                  <h3>Control de Reservas</h3>
                  <div>
                    <button className={`btn-secondary ${filtroEstado==='todas'?'':'btn-primary'}`} onClick={()=>setFiltroEstado('todas')} style={{fontSize:'0.8rem', marginRight:5}}>Todas</button>
                    <button className={`btn-secondary ${filtroEstado==='pendiente'?'':'btn-primary'}`} onClick={()=>setFiltroEstado('pendiente')} style={{fontSize:'0.8rem'}}>Pendientes</button>
                  </div>
                </div>
                <div className="table-container">
                    <table>
                        <thead><tr><th>Usuario</th><th>Cancha</th><th>Horario</th><th>Estado</th><th>Acciones Admin</th></tr></thead>
                        <tbody>
                            {reservasFiltradas.map(r => (
                                <tr key={r.id}>
                                    <td>{r.usuario_nombre}</td><td><b>{r.cancha_nombre}</b></td><td>{r.fecha.split('T')[0]} {r.hora_inicio}:00</td>
                                    <td><span className={`badge ${r.estado}`}>{r.estado}</span></td>
                                    <td>
                                        <div style={{display:'flex', gap:'10px'}}>
                                            {r.estado === 'pendiente' && (
                                                <>
                                                    <button className="btn-icon success" onClick={()=>cambiarEstado(r.id, 'aprobar')} title="Aprobar"><CheckCircle/></button>
                                                    <button className="btn-icon danger" onClick={()=>cambiarEstado(r.id, 'cancelar')} title="Rechazar"><XCircle/></button>
                                                </>
                                            )}
                                            <button className="btn-icon danger" onClick={()=>eliminarReserva(r.id)} title="Eliminar Físico"><Trash2 size={18}/></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            
            {/* LISTA CANCHAS ADMIN */}
            <div className="card" style={{marginTop:'24px'}}>
                <h3>Inventario de Canchas</h3>
                <div className="table-container">
                    <table>
                        <thead><tr><th>Nombre</th><th>Deporte</th><th>Precio</th><th>Editar</th></tr></thead>
                        <tbody>
                            {canchas.map(c => (
                                <tr key={c.id}><td>{c.nombre}</td><td>{c.deporte}</td><td>${c.precio}</td><td><button className="btn-icon" onClick={()=>iniciarEdicionCancha(c)}><Pencil size={16}/></button></td></tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
      )}
    </div>
  )
}

export default App;