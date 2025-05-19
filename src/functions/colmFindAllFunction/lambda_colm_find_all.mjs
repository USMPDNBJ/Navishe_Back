import sql from 'mssql';

const dbConfig = {
    server: '161.132.55.86',
    user: 'NVS',
    password: '@Vishe1234',
    database: 'BD_NA_VISHE_PRUEBAS',
    options: {
        encrypt: true,
        trustServerCertificate: true,
    },
};

export const handler = async (event, context) => {
    let pool;
    try {
        // Connect to the database
        pool = await sql.connect(dbConfig);

        // Query to get all beehives with specified columns
        const result = await pool.request().query(`
            SELECT 
                id_colmena,
                nombre,
                fecha_instalacion,
                imagen_url,
                id_sensores
            FROM t_colmena
        `);

        // Return successful response with data
        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",  // Habilitar CORS
                "Access-Control-Allow-Methods": "GET, OPTIONS", // Métodos permitidos
                "Access-Control-Allow-Headers": "Content-Type, Authorization" // Encabezados permitidos
            },
            body: JSON.stringify({
                message: 'Beehives retrieved successfully',
                data: result.recordset,
            }),
        };
    } catch (err) {
        // Handle errors
        console.error('Error executing query:', err);
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'Error retrieving beehives',
                error: err.message,
            }),
        };
    } finally {
        // Close the database connection
        if (pool) {
            await pool.close();
        }
    }
};