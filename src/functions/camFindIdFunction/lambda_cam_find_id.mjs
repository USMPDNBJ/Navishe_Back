// hello-world/app.mjs
import mysql from 'mysql2/promise';

const dbConfig = {
    host: 'bd-mysql-na-vishe.csbswo6i0muu.us-east-1.rds.amazonaws.com',
    user: 'admin',
    password: 'Vishe-1234',
    database: 'bd-na-vishe-test',
    port: 3306,
};

export const handler = async (event, context) => {
    let connection;
    try {
        // --- INICIO: Validación de parámetro ---
        const idCameraToFind = event.queryStringParameters?.id;

        if (!idCameraToFind) {
            return {
                statusCode: 400,
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET, OPTIONS",
                    "Access-Control-Allow-Headers": "Content-Type, Authorization"
                },
                body: JSON.stringify({
                    message: 'Missing id query parameter.',
                }),
            };
        }
        // --- FIN Validación ---

        connection = await mysql.createConnection(dbConfig);

        const [rows] = await connection.execute(
            `SELECT id, nombre, url_camera FROM t_camera WHERE id = ?`,
            [idCameraToFind]
        );

        if (rows.length === 0) {
            return {
                statusCode: 404,
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET, OPTIONS",
                    "Access-Control-Allow-Headers": "Content-Type, Authorization"
                },
                body: JSON.stringify({
                    message: `No camera found with id: ${idCameraToFind}`,
                }),
            };
        }

        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, Authorization"
            },
            body: JSON.stringify({
                message: 'Camera retrieved successfully',
                data: rows[0],
            }),
        };
    } catch (err) {
        console.error('Error executing query:', err);
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'Error retrieving camera',
                error: err.message,
            }),
        };
    } finally {
        if (connection) {
            await connection.end();
        }
    }
};
