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
        const { ventaId, codigo, nombre, precio, cantidad } = body;

        // Validaciones
        const esDecimalPositivo = /^\d+(\.\d+)?$/;
        const esEnteroPositivo = /^\d+$/;

        const cantidadValida = esEnteroPositivo.test(cantidad) && parseInt(cantidad) > 0;
        const precioUnitarioValido = esDecimalPositivo.test(precio) && parseFloat(precio) >= 0;
        

        if (!ventaId || !codigo || !nombre || !precioUnitarioValido || !cantidadValida) {
            return new Response('Faltan datos válidos del producto', { status: 400 });
        }

        // Parseo
        const cantidadFinal = parseInt(cantidad);
        const precioUnitarioFinal = parseFloat(precio).toFixed(2);

        // Insertar el nuevo cliente en la base de datos
        const result = await db.execute(`INSERT INTO detalle_venta (id_venta, codigo_producto, nombre_producto, precio_unitario, cantidad) VALUES (?, ?, ?, ?, ?)`,
        [ventaId, codigo, nombre, precioUnitarioFinal, cantidadFinal]
        );

        // Descontar del stock
        await db.execute(`UPDATE productos SET stock = stock - ? WHERE codigo = ?`,
        [cantidadFinal, codigo]
        );

        return new Response(JSON.stringify({ message: "Producto registrada exitosamente en la venta" }),
        { status: 201 });

    } catch (error) {
        console.error('Error inserting product:', error);
        return new Response('Error inserting product', { status: 500 });
    }
}

