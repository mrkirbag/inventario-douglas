import { db } from '../db';

export async function PUT({ request }) {
    try {
        const body = await request.json();
        const { ventaId } = body;
        const estado = 'cancelado'; 

        // Validar el id recibido
        if (!ventaId || typeof ventaId !== 'number') {
            return new Response('ID inválido', { status: 400 });
        }

        // Verificar que la venta existe y que no está cancelada
        const venta = await db.execute('SELECT estado FROM ventas WHERE id = ?', [ventaId]);

        if (!venta || venta.rows.length === 0) { 
            return new Response(JSON.stringify({ error: 'Venta no encontrada' }), { status: 404 });
        }

        if (venta.estado === 'cancelado') {
            return new Response(JSON.stringify({ error: 'La venta ya está cancelada' }), { status: 409 });
        }

        // Actualizar el estado en la base de datos
        const result = await db.execute('UPDATE ventas SET estado = ? WHERE id = ?', [estado, ventaId]);

        // Validar si no se encuentra
        if (result.affectedRows === 0) {
            return new Response('Venta no encontrado', { status: 404 });
        }

        // Eliminar los detalles de la venta
        await db.execute('DELETE FROM detalle_venta WHERE id_venta = ?', [ventaId]);

        return new Response(JSON.stringify({ message: "Venta cancelada exitosamente" }), { status: 200 });

    } catch (error) {
        console.error('Error updating sale:', error);
        return new Response('Error updating sale', { status: 500 });
    }
}