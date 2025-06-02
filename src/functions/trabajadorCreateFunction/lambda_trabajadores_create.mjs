import mysql from 'mysql2/promise';

export const handler = async (event, context) => {
    let connection;

    try {
        console.log('Received event:', event);

        if (!event || !event.body) {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    message: 'Request body is missing or invalid'
                })
            };
        }

        let body;
        try {
            body = JSON.parse(event.body);
        } catch (parseError) {
            console.error('JSON parse error:', parseError);
            return {
                statusCode: 400,
                body: JSON.stringify({
                    message: 'Invalid JSON in request body'
                })
            };
        }

        const requiredFields = ['contrasena', 'rol', 'correo', 'nombre', 'dni'];
        for (const field of requiredFields) {
            if (!body[field]) {
                return {
                    statusCode: 400,
                    body: JSON.stringify({
                        message: `Missing required field: ${field}`
                    })
                };
            }
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(body.correo)) {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    message: 'Invalid email format'
                })
            };
        }

        if (!/^\d{8}$/.test(body.dni)) {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    message: 'DNI must be 8 digits'
                })
            };
        }

        const id_trabajador = context.awsRequestId;

        // ✅ Configuración MySQL
        connection = await mysql.createConnection({
            host: 'bd-mysql-na-vishe.csbswo6i0muu.us-east-1.rds.amazonaws.com',
            user: 'admin',
            password: 'Vishe-1234',
            database: 'bd-na-vishe-test',
            port: 3306
        });

        try {
            // 🔍 Verificar si el DNI ya existe
            const [rows] = await connection.execute(
                'SELECT COUNT(*) as count FROM t_trabajador WHERE dni = ?',
                [body.dni]
            );

            if (rows[0].count > 0) {
                await connection.end();
                return {
                    statusCode: 409,
                    body: JSON.stringify({
                        message: 'DNI already exists'
                    })
                };
            }

            // ✅ Insertar trabajador
            const fecha_registro = new Date();
            const status = 'ACTIVO';
            
            const [result] = await connection.execute(`
                INSERT INTO t_trabajador (
                    id_trabajador,
                    fecha_registro,
                    contrasena,
                    rol,
                    correo,
                    nombre,
                    status,
                    dni
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    id_trabajador,
                    fecha_registro,
                    body.contrasena,
                    body.rol,
                    body.correo,
                    body.nombre,
                    status,
                    body.dni
                ]
            );

            await connection.end();
            return {
                statusCode: 201,
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "POST, OPTIONS",
                    "Access-Control-Allow-Headers": "Content-Type, Authorization"
                },
                body: JSON.stringify({
                    message: 'Worker created successfully',
                    id_trabajador
                })
            };
        } catch (dbError) {
            console.error('Database error:', dbError);
            if (connection) {
                await connection.end();
            }
            return {
                statusCode: 500,
                body: JSON.stringify({
                    message: 'Internal server error',
                    error: dbError.message
                })
            };
        }
    } catch (error) {
        console.error('Error:', error);
        if (connection) {
            await connection.end();
        }
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'Internal server error',
                error: error.message
            })
        };
    }
};
