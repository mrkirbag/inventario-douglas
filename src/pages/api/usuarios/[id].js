import { db } from '../db';

export async function GET({ params }) {
    try {

        const { id } = params;
        const usuario = await db.execute('SELECT * FROM usuarios WHERE id = ?', [id]);

        // Si no hay clientes, retornar un mensaje de error
        if (!usuario || !usuario.rows || usuario.rows.length === 0) {
            return new Response(JSON.stringify({ message: 'No hay usuario con ese ID' }), {
                headers: { 'Content-Type': 'application/json' },
                status: 404
            });
        }
        
        // Retornar los clientes en formato JSON
        return new Response(JSON.stringify(usuario.rows[0]), {
            headers: { 'Content-Type': 'application/json' },
            status: 200
        });

    } catch (error) {
        console.error('Error fetching usuario:', error);
        return new Response('Error fetching usuario', { status: 500 });
    }
}