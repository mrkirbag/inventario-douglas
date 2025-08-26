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

    const query = `
                    SELECT 
                    v.fecha AS fecha_venta,
                    c.nombre AS nombre_cliente,
                    c.cedula AS cedula_cliente,
                    v.total_usd,
                    v.tipo_pago,
                    v.estado
                    FROM ventas v
                    JOIN clientes c ON c.id = v.cliente_id
                    WHERE DATE(v.fecha) BETWEEN ? AND ?
                    AND v.tipo_pago IN ('contado')
                    ORDER BY v.fecha ASC;
                `;

    try {
        const ventas = await db.execute(query, [desde, hasta]);

        return new Response(JSON.stringify(ventas.rows), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (err) {
        console.error('Error en ventasTotales:', err);
        return new Response(JSON.stringify({ error: 'Error interno del servidor' }), { status: 500 });
    }
}