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
            // 1. Ventas de contado
            const ventasContado = await db.execute(
                `SELECT COUNT(*) AS ventas_contado, 
                        SUM(total_usd) AS total_contado
                FROM ventas
                WHERE tipo_pago = 'contado'
                AND DATE(fecha) BETWEEN ? AND ?`,
                [desde, hasta]
            );

            // 2. Abonos realizados
            const abonos = await db.execute(
                `SELECT COUNT(*) AS abonos_realizados, 
                        SUM(monto) AS total_abonos
                FROM abonos_credito
                WHERE DATE(fecha) BETWEEN ? AND ?`,
                [desde, hasta]
            );

            // 3. Ganancia neta
            const ganancia = await db.execute(
                `SELECT SUM((dv.precio_unitario - p.costo) * dv.cantidad) AS ganancia_neta
                FROM detalle_venta dv
                JOIN productos p ON p.codigo = dv.codigo_producto
                JOIN ventas v ON v.id = dv.id_venta
                WHERE v.estado IN ('completado', 'pendiente')
                AND DATE(v.fecha) BETWEEN ? AND ?`,
                [desde, hasta]
            );

        const ventasRow = ventasContado.rows[0];
        const abonosRow = abonos.rows[0];
        const gananciaRow = ganancia.rows[0];

        const total_ventas_contado = ventasRow.total_contado || 0;
        const total_abonos_realizados = abonosRow.total_abonos || 0;
        const ingresos_totales = total_ventas_contado + total_abonos_realizados;

        const response = {
            ventas_contado: ventasRow.ventas_contado || 0,
            total_ventas_contado,
            abonos_realizados: abonosRow.abonos_realizados || 0,
            total_abonos_realizados,
            ingresos_totales,
            ganancia_neta: gananciaRow.ganancia_neta || 0
        };

        return new Response(JSON.stringify(response), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (err) {
        console.error('Error en resumen de caja:', err);
        return new Response(JSON.stringify({ error: 'Error interno del servidor' }), { status: 500 });
    }
}
