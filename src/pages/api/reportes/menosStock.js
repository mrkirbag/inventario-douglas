import { db } from '../db';

export async function GET({ request }) {
    const queryMenorStock = `
                                SELECT 
                                    codigo,
                                    nombre,
                                    stock
                                FROM productos
                                WHERE stock > 0
                                ORDER BY stock ASC
                                LIMIT 10;
                            `;

    const queryAgotados = `
                            SELECT 
                                codigo,
                                nombre,
                                stock
                            FROM productos
                            WHERE stock = 0
                            ORDER BY nombre ASC
                            LIMIT 10;
                        `;

    try {
        const [menorStock, agotados] = await Promise.all([
            db.execute(queryMenorStock),
            db.execute(queryAgotados)
        ]);

        const resultado = {
            bajos_en_stock: menorStock.rows,
            agotados: agotados.rows
        };

        return new Response(JSON.stringify(resultado), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (err) {
        console.error('Error en productosStockCritico:', err);
        return new Response(JSON.stringify({ error: 'Error interno del servidor' }), { status: 500 });
    }
}
