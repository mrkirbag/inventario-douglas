import { db } from '../../../lib/db';

export async function GET() {
    try {

        const usuarios = await db.execute('SELECT * FROM usuarios');

        // Si no hay clientes, retornar un mensaje de error
        if (!usuarios || !usuarios.rows || usuarios.rows.length === 0) {
            return new Response(JSON.stringify({ message: 'No hay usuarios registrados' }), {
                headers: { 'Content-Type': 'application/json' },
                status: 200
            });
        }
        
        // Retornar los clientes en formato JSON
        return new Response(JSON.stringify(usuarios.rows), {
        headers: { 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('Error fetching usuarios:', error);
        return new Response('Error fetching usuarios', { status: 500 });
    }
}

export async function POST({ request }) {
    try {
        const body = await request.json();
        const { nombre, usuario, contrasena } = body;

        // Validar que el cliente tenga los campos necesarios
        if (!nombre || !usuario || !contrasena) {
            return new Response('Faltan datos del usuario', { status: 400 });
        }

        // Insertar el nuevo cliente en la base de datos
        const result = await db.execute('INSERT INTO usuarios (nombre, usuario, contrasena) VALUES (?, ?, ?)',[nombre, usuario, contrasena]);

        return new Response(JSON.stringify({ message: "Usuario agregado exitosamente" }), { status: 201 });


    } catch (error) {
        console.error('Error inserting usuario:', error);
        return new Response('Error inserting usuario', { status: 500 });
    }
}

export async function DELETE({ request }) {
    try {
        const body = await request.json();
        const { id } = body;

        // Validar que se haya proporcionado un ID
        if (!id) {
            return new Response('Falta el ID del usuario', { status: 400 });
        }

        // Eliminar el cliente de la base de datos
        const result = await db.execute('DELETE FROM usuarios WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return new Response('Usuario no encontrado', { status: 404 });
        }

        return new Response(JSON.stringify({ message: "Usuario eliminado exitosamente" }), { status: 200 });

    } catch (error) {
        console.error('Error deleting user:', error);
        return new Response('Error deleting user', { status: 500 });
    }
}

export async function PUT({ request }) {
    try {
        const body = await request.json();
        const { id, nombre, usuario, contrasena } = body;

        // Validar que el cliente tenga los campos necesarios
        if (!id || !nombre || !usuario || !contrasena) {
            return new Response('Faltan datos del usuario', { status: 400 });
        }

        // Actualizar el cliente en la base de datos
        const result = await db.execute('UPDATE usuarios SET nombre = ?, usuario = ?, contrasena = ? WHERE id = ?', [nombre, usuario, contrasena, id]);

        // Validar si no se encuentra
        if (result.affectedRows === 0) {
            return new Response('Usuario no encontrado', { status: 404 });
        }

        return new Response(JSON.stringify({ message: "Usuario actualizado exitosamente" }), { status: 200 });

    } catch (error) {
        console.error('Error updating user:', error);
        return new Response('Error updating cliente', { status: 500 });
    }
}