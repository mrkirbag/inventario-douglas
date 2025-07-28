import { db } from '../db';

export async function GET({ params }) {
    try {

        const { id } = params;
        const cliente = await db.execute('SELECT * FROM clientes WHERE id = ?', [id]);

        // Si no hay clientes, retornar un mensaje de error
        if (!cliente || !cliente.rows || cliente.rows.length === 0) {
            return new Response(JSON.stringify({ message: 'No hay cliente con ese ID' }), {
                headers: { 'Content-Type': 'application/json' },
                status: 404
            });
        }
        
        // Retornar los clientes en formato JSON
        return new Response(JSON.stringify(cliente.rows[0]), {
            headers: { 'Content-Type': 'application/json' },
            status: 200
        });

    } catch (error) {
        console.error('Error fetching clientes:', error);
        return new Response('Error fetching clientes', { status: 500 });
    }
}