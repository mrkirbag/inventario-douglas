import { db } from '../db';

export async function GET({ request }) {
    try {

        const url = new URL(request.url);
        const page = parseInt(url.searchParams.get('page')) || 1;
        const search = url.searchParams.get('search') || '';

        const limit = 50;
        const offset = (page - 1) * limit;

        const esCedula = /^[1-9]\d*$/.test(search.trim());

        const query = search
        ? esCedula
            ? {
                sql: 'SELECT * FROM clientes WHERE cedula = ? ORDER BY nombre COLLATE NOCASE ASC LIMIT ? OFFSET ?',
                args: [search.trim(), limit, offset],
            }
            : {
                sql: 'SELECT * FROM clientes WHERE nombre LIKE ? ORDER BY nombre COLLATE NOCASE ASC LIMIT ? OFFSET ?',
                args: [`%${search.trim()}%`, limit, offset],
            }
        : {
            sql: 'SELECT * FROM clientes ORDER BY nombre COLLATE NOCASE ASC LIMIT ? OFFSET ?',
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
        const { nombre, telefono, cedula } = body;

        // Validar que el cliente tenga los campos necesarios
        if (!nombre || !telefono || !cedula) {
            return new Response('Faltan datos del cliente', { status: 400 });
        }

        const valor = Number(cedula);
        // Validacion de cedula
        if (
            typeof cedula !== "string" && typeof cedula !== "number" ||
            isNaN(valor) ||
            !Number.isInteger(valor) ||
            valor <= 0
        ) {
            return res.status(400).json({
                error: "La cédula debe ser un número entero positivo mayor a cero.",
                campo: "cedula"
            });
        }

        // Validacion para que no se ingrese otro codigo igual
        const existe = await db.execute('SELECT 1 FROM clientes WHERE cedula = ?', [cedula]);

        if (existe.rows.length > 0) {
            return new Response('Ya existe un cliente con esa cédula de identidad.', { status: 409 });
        }

        // Insertar el nuevo cliente en la base de datos
        const result = await db.execute('INSERT INTO clientes (nombre, telefono, cedula) VALUES (?, ?, ?)',[nombre, telefono, cedula]);

        const clienteAgregado = await db.execute('SELECT * FROM clientes WHERE cedula = ?', [cedula]);

        return new Response(JSON.stringify({ message: "Cliente agregado exitosamente", cliente: clienteAgregado.rows }), { status: 201 });


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
        const { idCliente, nombre, telefono, cedula } = body;

        // Validar que el cliente tenga los campos necesarios
        if (!idCliente || !nombre || !telefono || !cedula) {
            return new Response('Faltan datos del cliente', { status: 400 });
        }

        const valor = Number(cedula);
        // Validacion de cedula
        if (
            typeof cedula !== "string" && typeof cedula !== "number" ||
            isNaN(valor) ||
            !Number.isInteger(valor) ||
            valor <= 0
        ) {
            return res.status(400).json({
                error: "La cédula debe ser un número entero positivo mayor a cero.",
                campo: "cedula"
            });
        }

        // Validacion para que no se ingrese otro codigo igual
        const existe = await db.execute('SELECT 1 FROM clientes WHERE cedula = ? AND id != ?', [cedula, idCliente]);

        if (existe.rows.length > 0) {
            return new Response('Ya existe un cliente con esa cédula de identidad.', { status: 409 });
        }

        // Actualizar el cliente en la base de datos
        const result = await db.execute('UPDATE clientes SET nombre = ?, telefono = ?, cedula = ? WHERE id = ?', [nombre, telefono, cedula, idCliente]);

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