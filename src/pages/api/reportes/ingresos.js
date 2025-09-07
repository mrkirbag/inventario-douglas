import { db } from '../db';

export async function GET({ request }) {
    const url = new URL(request.url);
    const desde = url.searchParams.get('desde');
    const hasta = url.searchParams.get('hasta');

    if (!desde || !hasta) {
        return new Response(JSON.stringify({ error: 'Fechas inválidas' }), { status: 400 });
    }
    if (hasta < desde) {
        return new Response(JSON.stringify({ error: 'Rango de fechas inválido' }), { status: 400 });
    }
    try {
        // Ventas contado (detalle)
        const ventasContadoDetalle = await db.execute(
            `SELECT v.id, v.fecha, c.nombre AS cliente, v.total_usd, v.tipo_pago, v.estado
                FROM ventas v
                JOIN clientes c ON c.id = v.cliente_id
                WHERE v.tipo_pago = 'contado' 
                AND v.estado IN ('completado', 'pendiente')
                AND DATE(v.fecha) BETWEEN ? AND ?
                ORDER BY v.fecha ASC`,
            [desde, hasta]
            );
        // Ventas crédito (detalle)
        const ventasCreditoDetalle = await db.execute(
            `SELECT v.id, v.fecha, c.nombre AS cliente, v.total_usd, v.tipo_pago, v.estado
            FROM ventas v
            JOIN clientes c ON c.id = v.cliente_id
            WHERE v.tipo_pago = 'credito' 
            AND v.estado IN ('completado', 'pendiente')
            AND DATE(v.fecha) BETWEEN ? AND ?
            ORDER BY v.fecha ASC`,
            [desde, hasta]
        );
        // Abonos realizados (detalle)
        const abonosDetalle = await db.execute(
            `SELECT a.id, a.fecha, a.monto, c.nombre AS cliente
            FROM abonos_credito a
            JOIN creditos cr ON cr.id = a.id_credito
            JOIN ventas v ON v.id = cr.id_venta
            JOIN clientes c ON c.id = v.cliente_id
            WHERE DATE(a.fecha) BETWEEN ? AND ?
            ORDER BY a.fecha ASC`,
            [desde, hasta]
        );
        // Totales y conteos
        const ventasContado = await db.execute(
            `SELECT COUNT(*) AS ventas_contado, SUM(total_usd) AS total_contado
            FROM ventas WHERE tipo_pago = 'contado' AND estado IN ('completado', 'pendiente') AND DATE(fecha) BETWEEN ? AND ?`,
            [desde, hasta]
        );
        const ventasCredito = await db.execute(
            `SELECT COUNT(*) AS ventas_credito, SUM(total_usd) AS total_credito
            FROM ventas WHERE tipo_pago = 'credito' AND estado IN ('completado', 'pendiente') AND DATE(fecha) BETWEEN ? AND ?`,
            [desde, hasta]
        );
        const abonos = await db.execute(
            `SELECT COUNT(*) AS abonos_realizados, SUM(monto) AS total_abonos
            FROM abonos_credito WHERE DATE(fecha) BETWEEN ? AND ?`,
            [desde, hasta]
        );
        const ganancia = await db.execute(
            `SELECT SUM((dv.precio_unitario - p.costo) * dv.cantidad) AS ganancia_neta
            FROM detalle_venta dv
            JOIN productos p ON p.codigo = dv.codigo_producto
            JOIN ventas v ON v.id = dv.id_venta
            WHERE v.estado IN ('completado') AND DATE(v.fecha) BETWEEN ? AND ?`,
            [desde, hasta]
        );
        // Respuesta estructurada
        const ventasContadoRow = ventasContado.rows[0];
        const ventasCreditoRow = ventasCredito.rows[0];
        const abonosRow = abonos.rows[0];
        const gananciaRow = ganancia.rows[0];
        const total_ventas_contado = ventasContadoRow.total_contado || 0;
        const total_ventas_credito = ventasCreditoRow.total_credito || 0;
        const total_abonos_realizados = abonosRow.total_abonos || 0;
        const total_en_caja = total_ventas_contado + total_abonos_realizados;
        return new Response(JSON.stringify({
            ventasContadoDetalle: ventasContadoDetalle.rows,
            ventasCreditoDetalle: ventasCreditoDetalle.rows,
            abonosDetalle: abonosDetalle.rows,
            resumen: {
                ventas_contado: ventasContadoRow.ventas_contado || 0,
                total_ventas_contado,
                margen_ganancia: gananciaRow.ganancia_neta || 0,
                ventas_credito: ventasCreditoRow.ventas_credito || 0,
                total_ventas_credito,
                abonos_realizados: abonosRow.abonos_realizados || 0,
                total_abonos_realizados,
                total_en_caja
            }
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (err) {
        console.error('Error en resumen de caja:', err);
        return new Response(JSON.stringify({ error: 'Error interno del servidor' }), { status: 500 });
    }
}
