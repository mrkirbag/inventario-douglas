import { db } from '../db';

export async function GET({ request }) {
    try {

        const url = new URL(request.url);
        const ventaId = parseInt(url.searchParams.get('ventaId'));

        const productosSeleccionados = await db.execute('SELECT * FROM detalle_venta WHERE id_venta = ?', [ventaId]);

        // Si no hay clientes, retornar un mensaje de error
        if (!productosSeleccionados || !productosSeleccionados.rows || productosSeleccionados.rows.length === 0) {
            return new Response(JSON.stringify({ message: 'No hay productos registrados para esa venta' }), {
                headers: { 'Content-Type': 'application/json' },
                status: 200
            });
        }
        
        // Retornar los clientes en formato JSON
        return new Response(JSON.stringify(productosSeleccionados.rows), {
            headers: { 'Content-Type': 'application/json' },
            });

    } catch (error) {
        console.error('Error fetching products:', error);
        return new Response('Error fetching products', { status: 500 });
    }
}

export async function POST({ request }) {
    try {

        const body = await request.json();
        const { ventaId, codigo_producto, nombre_producto, precio,  cantidad } = body;

        // Validaciones
        const esDecimalPositivo = /^\d+(\.\d+)?$/;
        const esEnteroPositivo = /^\d+$/;

        const cantidadValida = esEnteroPositivo.test(cantidad) && parseInt(cantidad) > 0;
        const precioUnitarioValido = esDecimalPositivo.test(precio) && parseFloat(precio) >= 0;
        

        if (!ventaId || !codigo_producto || !nombre_producto || !precioUnitarioValido || !cantidadValida) {
            return new Response('Faltan datos válidos del producto', { status: 400 });
        }

        // Parseo
        const cantidadFinal = parseInt(cantidad);
        const precioUnitarioFinal = parseFloat(precio).toFixed(2);

        // Insertar el nuevo cliente en la base de datos
        const result = await db.execute(`INSERT INTO detalle_venta (id_venta, codigo_producto, nombre_producto, precio_unitario, cantidad) VALUES (?, ?, ?, ?, ?)`,
        [ventaId, codigo_producto, nombre_producto, precioUnitarioFinal, cantidadFinal]
        );

        return new Response(JSON.stringify({ message: "Producto registrada exitosamente en la venta" }),
        { status: 201 });

    } catch (error) {
        console.error('Error inserting product:', error);
        return new Response('Error inserting product', { status: 500 });
    }
}

export async function DELETE({ request }) {
    try {
        const body = await request.json();
        const { id } = body;

        // Validar que se haya proporcionado un ID
        if (!id) {
            return new Response('Falta el ID del producto', { status: 400 });
        }

        // Eliminar el cliente de la base de datos
        const result = await db.execute('DELETE FROM detalle_venta WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return new Response('Producto no encontrado', { status: 404 });
        }

        return new Response(JSON.stringify({ message: "Producto eliminado exitosamente" }), { status: 200 });

    } catch (error) {
        console.error('Error deleting product:', error);
        return new Response('Error deleting product', { status: 500 });
    }
}
