import { db } from '../../../lib/db';

export async function GET({ request }) {
    try {

        const url = new URL(request.url);
        const page = parseInt(url.searchParams.get('page')) || 1;
        const search = url.searchParams.get('search') || '';

        const limit = 50;
        const offset = (page - 1) * limit;

        const query = search
        ? {
            sql: 'SELECT * FROM clientes WHERE nombre LIKE ? ORDER BY nombre LIMIT ? OFFSET ?',
            args: [`%${search}%`, limit, offset],
            }
        : {
            sql: 'SELECT * FROM clientes ORDER BY nombre LIMIT ? OFFSET ?',
            args: [limit, offset],
        };

        const clientes = await db.execute(query);

        // Si no hay clientes, retornar un mensaje de error
        if (!clientes || !clientes.rows || clientes.rows.length === 0) {
            return new Response(JSON.stringify({ message: 'No hay clientes registrados' }), {
                headers: { 'Content-Type': 'application/json' },
                status: 200
            });
        }
        
        // Retornar los clientes en formato JSON
        return new Response(JSON.stringify(clientes.rows), {
        headers: { 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('Error fetching clientes:', error);
        return new Response('Error fetching clientes', { status: 500 });
    }
}

export async function POST({ request }) {
    try {
        const body = await request.json();
        const { nombre, telefono } = body;

        // Validar que el cliente tenga los campos necesarios
        if (!nombre || !telefono) {
            return new Response('Faltan datos del cliente', { status: 400 });
        }

        // Insertar el nuevo cliente en la base de datos
        const result = await db.execute('INSERT INTO clientes (nombre, telefono) VALUES (?, ?)',[nombre, telefono]);

        return new Response(JSON.stringify({ message: "Cliente agregado exitosamente" }), { status: 201 });


    } catch (error) {
        console.error('Error inserting cliente:', error);
        return new Response('Error inserting cliente', { status: 500 });
    }
}

export async function DELETE({ request }) {
    try {
        const body = await request.json();
        const { id } = body;

        // Validar que se haya proporcionado un ID
        if (!id) {
            return new Response('Falta el ID del cliente', { status: 400 });
        }

        // Eliminar el cliente de la base de datos
        const result = await db.execute('DELETE FROM clientes WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return new Response('Cliente no encontrado', { status: 404 });
        }

        return new Response(JSON.stringify({ message: "Cliente eliminado exitosamente" }), { status: 200 });

    } catch (error) {
        console.error('Error deleting cliente:', error);
        return new Response('Error deleting cliente', { status: 500 });
    }
}

export async function PUT({ request }) {
    try {
        const body = await request.json();
        const { idCliente, nombre, telefono } = body;

        // Validar que el cliente tenga los campos necesarios
        if (!idCliente || !nombre || !telefono) {
            return new Response('Faltan datos del cliente', { status: 400 });
        }

        // Actualizar el cliente en la base de datos
        const result = await db.execute('UPDATE clientes SET nombre = ?, telefono = ? WHERE id = ?', [nombre, telefono, idCliente]);

        // Validar si no se encuentra
        if (result.affectedRows === 0) {
            return new Response('Cliente no encontrado', { status: 404 });
        }

        return new Response(JSON.stringify({ message: "Cliente actualizado exitosamente" }), { status: 200 });

    } catch (error) {
        console.error('Error updating cliente:', error);
        return new Response('Error updating cliente', { status: 500 });
    }
}