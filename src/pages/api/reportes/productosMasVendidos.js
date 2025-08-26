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
                    vd.codigo_producto,
                    p.nombre AS nombre_producto,
                    SUM(vd.cantidad) AS cantidad_total,
                    SUM(vd.cantidad * vd.precio_unitario) AS total_usd
                    FROM detalle_venta vd
                    JOIN ventas v ON v.id = vd.id_venta
                    JOIN productos p ON p.codigo = vd.codigo_producto
                    WHERE v.estado = 'completado'
                    AND DATE(v.fecha) BETWEEN ? AND ?
                    GROUP BY vd.codigo_producto, p.nombre
                    ORDER BY SUM(vd.cantidad) DESC
                    LIMIT 50;
                `;

    try {
        const productos = await db.execute(query, [desde, hasta]);

        return new Response(JSON.stringify(productos.rows), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (err) {
        console.error('Error en productosMasVendidos:', err);
        return new Response(JSON.stringify({ error: 'Error interno del servidor' }), { status: 500 });
    }
}