import { db } from '../../../lib/db';

export async function PUT({ request }) {
    try {

        const body = await request.json();
        const { id, stockNuevo } = body;
        const producto = await db.execute('SELECT stock FROM productos WHERE id = ?', [id]);

        // Si no hay clientes, retornar un mensaje de error
        if (!producto || !producto.rows || producto.rows.length === 0) {
            return new Response(JSON.stringify({ message: 'No hay producto con ese ID' }), {
                headers: { 'Content-Type': 'application/json' },
                status: 404
            });
        }
        
        const stockActual = producto.rows[0].stock;
        const stockTotal = stockActual + stockNuevo;

        // 🔄 Actualizar en la base de datos
        await db.execute('UPDATE productos SET stock = ? WHERE id = ?', [stockTotal, id]);

        return new Response(JSON.stringify({ message: 'Stock actualizado correctamente', stock: stockTotal }), {
            headers: { 'Content-Type': 'application/json' },
            status: 200
        });


    } catch (error) {
        console.error('Error fetching producto:', error);
        return new Response('Error fetching producto', { status: 500 });
    }
}