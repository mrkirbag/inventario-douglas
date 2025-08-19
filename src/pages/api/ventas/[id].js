import { db } from '../db';

export async function GET({ params }) {
    try {

        const { id } = params;

        const ventaResult = await db.execute(`
                                                SELECT
                                                    c.nombre AS nombre_cliente,
                                                    c.cedula AS cedula_cliente,
                                                    c.telefono AS telefono_cliente,
                                                    v.fecha,
                                                    v.total_usd,
                                                    v.tipo_pago
                                                FROM ventas v
                                                JOIN clientes c ON v.cliente_id = c.id
                                                WHERE v.id = ?
                                            `, [id]);

        // Validar si no hay resultados para ese id
        if (ventaResult.rows.length === 0) {
            return new Response(JSON.stringify({ message: 'Venta no encontrada' }), {
                headers: { 'Content-Type': 'application/json' },
                status: 404
            });
        }

        const ventaData = ventaResult.rows[0];

        const productosResult = await db.execute(`
                                                    SELECT
                                                        codigo_producto,
                                                        nombre_producto,
                                                        precio_unitario,
                                                        cantidad,
                                                        subtotal
                                                    FROM detalle_venta
                                                    WHERE id_venta = ?
                                                    ORDER BY nombre_producto ASC
                                                `, [id]);

        // Validar si no hay productos en esa venta
        if (productosResult.rows.length === 0){
            return new Response(JSON.stringify({ message: 'Venta sin productos' }), {
                headers: { 'Content-Type': 'application/json' },
                status: 404
            });
        }


        const result = {
                            cliente: {
                                nombre: ventaData.nombre_cliente,
                                cedula: ventaData.cedula_cliente,
                                telefono: ventaData.telefono_cliente
                            },
                            venta: {
                                fecha: ventaData.fecha,
                                monto_total: ventaData.total_usd,
                                tipo_pago: ventaData.tipo_pago
                            },
                            productos: productosResult.rows
                        };

        return new Response(JSON.stringify(result), { headers: { 'Content-Type': 'application/json' }});


    } catch (error) {
        console.error('Error interno al consultar venta:', error);
        return new Response(JSON.stringify({ error: 'Error interno del servidor' }), {
            headers: { 'Content-Type': 'application/json' },
            status: 500
        });
    }
}