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
                        a.fecha AS fecha_abono,
                        a.monto AS monto_abono,
                        c.nombre AS nombre_cliente,
                        c.cedula AS cedula_cliente,
                        v.fecha AS fecha_venta_credito
                    FROM abonos_credito a
                    JOIN creditos cr ON cr.id = a.id_credito
                    JOIN ventas v ON v.id = cr.id_venta
                    JOIN clientes c ON c.id = v.cliente_id
                    WHERE DATE(a.fecha) BETWEEN ? AND ?
                    ORDER BY a.fecha ASC;
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