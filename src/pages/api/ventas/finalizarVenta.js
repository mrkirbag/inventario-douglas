import { db } from '../db';

export async function PUT({ request }) {
    try {
        const body = await request.json();
        const { ventaId, totalVentaUSD } = body;

        // Validaciones
        if (!ventaId || isNaN(parseFloat(totalVentaUSD))) {
            return new Response('Datos inválidos', { status: 400 });
        }


        const datosVenta = await db.execute('SELECT * FROM ventas WHERE id = ?', [ventaId]);
        const venta = datosVenta.rows[0];

        // Actualizar el total de la venta en la base de datos y el estatus
        const total_final = parseFloat(totalVentaUSD).toFixed(2); // actualizar total en USD
        let estado_final = 'pendiente'; // por defecto
        
        // Actualizar el estado de la venta según el tipo de pago
        if (venta.tipo_pago === 'contado') {
            estado_final = 'completado';
        } 

        const queryActualizacion = await db.execute(`UPDATE ventas SET total_usd = ?, estado = ? WHERE id = ?`,[total_final, estado_final, ventaId]);

        if (queryActualizacion.affectedRows === 0) {
            return new Response('Error al actualizar la venta', { status: 500 });
        }

        // Obtener los productos de la venta
        const productosSeleccionados = await db.execute('SELECT * FROM detalle_venta WHERE id_venta = ?', [ventaId]);

        console.error('Productos seleccionados:', productosSeleccionados.rows);

        // Validar que se hayan encontrado productos
        if (productosSeleccionados.rows.length === 0) {
            return new Response('No se encontraron productos para esta venta', { status: 404 });
        }

        console.log('Productos seleccionados:', productosSeleccionados.rows);

        // Actualizar el stock de los productos vendidos
        for (const producto of productosSeleccionados.rows) {   

            const { codigo_producto, cantidad } = producto;
            const productoStock = await db.execute('SELECT stock FROM productos WHERE codigo = ?', [codigo_producto]);

            // Validar que el producto exista
            if (productoStock.rows.length === 0) {
                return new Response(`Producto con código ${codigo_producto} no encontrado`, { status: 404 });
            }

            const cantidadVendida = Number(cantidad);
            const stockActual = Number(productoStock.rows[0].stock);
            const nuevoStock = stockActual - cantidadVendida;

            // Validar que el stock no sea negativo
            if (nuevoStock < 0) {
                return new Response(`Stock insuficiente para el producto ${codigo_producto}`, { status: 400 });
            }

            // Actualizar el stock del producto
            const queryActualizacionProductos = await db.execute('UPDATE productos SET stock = ? WHERE codigo = ?', [nuevoStock, codigo_producto]);

            if (queryActualizacionProductos.affectedRows === 0) {
                return new Response(`Error al actualizar el stock del producto ${codigo_producto}`, { status: 500 });
            }
        }

        return new Response('Venta actualizada correctamente', { status: 200 });

    } catch (error) {
        console.error('Error fetching products:', error);
        return new Response('Error fetching products', { status: 500 });
    }
}