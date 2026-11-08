// Controlador de equipos (catálogo público).
import { TIPOS_EQUIPO, parsearId } from '../domain/reglas.js';

const TREINTA_DIAS = 30 * 24 * 60 * 60 * 1000;

export function crearEquiposController({ servicioEquipos, config }) {
  return {
    listar(req, res) {
      let tipo;
      const pedido = req.query.tipo;

      if (pedido === 'todos') {
        res.clearCookie('tipoPreferido'); // el usuario quita su preferencia
      } else if (TIPOS_EQUIPO.includes(pedido)) {
        tipo = pedido;
        // Cookie de PREFERENCIAS: solo sirve para el filtro inicial, nunca para permisos
        res.cookie('tipoPreferido', tipo, {
          httpOnly: true,
          sameSite: 'lax',
          secure: config.produccion,
          maxAge: TREINTA_DIAS,
        });
      } else {
        // Sin filtro en la URL: usamos la cookie, pero la VALIDAMOS (el cliente puede manipularla)
        const guardada = req.cookies?.tipoPreferido;
        tipo = TIPOS_EQUIPO.includes(guardada) ? guardada : undefined;
      }

      const soloOperativos = req.query.operativos === 'true';
      const equipos = servicioEquipos.listar({ tipo, soloOperativos });
      res.render('index', { titulo: 'Equipos', equipos, filtros: { tipo: tipo ?? '', soloOperativos } });
    },

    detalle(req, res) {
      const equipo = servicioEquipos.obtener(parsearId(req.params.id)); // 404 si no existe
      res.render('detalle-equipo', { titulo: equipo.nombre, equipo });
    },
  };
}
