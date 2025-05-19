import sql from 'mssql';

export const handler = async (event, context) => {
    let pool;
    
    try {
        // Log the entire event for debugging
        console.log('Received event:',event);
        
        // Check if event.body exists
        if (!event || !event.body) {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    message: 'Request body is missing or invalid'
                })
            };
        }

        // Parse request body
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
        
        // Validate required fields
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

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(body.correo)) {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    message: 'Invalid email format'
                })
            };
        }

        // Validate DNI (8 digits)
        if (!/^\d{8}$/.test(body.dni)) {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    message: 'DNI must be 8 digits'
                })
            };
        }

        // Generate worker ID
        const id_trabajador = context.awsRequestId;

        // Database connection configuration
        const dbConfig = {
            server: '161.132.55.86',
            user: 'NVS',
            password: '@Vishe1234',
            database: 'BD_NA_VISHE_PRUEBAS',
            options: {
                encrypt: true,
                trustServerCertificate: true
            }
        };

        // Connect to MSSQL
        pool = await sql.connect(dbConfig);

        // Check if DNI already exists
        const checkDni = await pool.request()
            .input('dni', sql.VarChar, body.dni)
            .query('SELECT COUNT(*) as count FROM t_trabajador WHERE dni = @dni');
        
        if (checkDni.recordset[0].count > 0) {
            return {
                statusCode: 409,
                body: JSON.stringify({
                    message: 'DNI already exists'
                })
            };
        }

        // Insert worker
        await pool.request()
            .input('id_trabajador', sql.VarChar, id_trabajador)
            .input('fecha_registro', sql.DateTime, new Date())
            .input('contrasena', sql.VarChar, body.contrasena)
            .input('rol', sql.VarChar, body.rol)
            .input('correo', sql.VarChar, body.correo)
            .input('nombre', sql.VarChar, body.nombre)
            .input('status', sql.Bit, 'ACTIVO')
            .input('dni', sql.VarChar, body.dni)
            .query(`
                INSERT INTO t_trabajador (
                    fecha_registro, 
                    contrasena, 
                    rol, 
                    correo, 
                    nombre, 
                    status, 
                    dni
                ) 
                VALUES (
                    @fecha_registro, 
                    @contrasena, 
                    @rol, 
                    @correo, 
                    @nombre, 
                    @status, 
                    @dni
                )
            `);

        return {
            statusCode: 201,
            headers: {
            "Access-Control-Allow-Origin": "*",  // Habilitar CORS
            "Access-Control-Allow-Methods": "POST, OPTIONS", // Métodos permitidos
            "Access-Control-Allow-Headers": "Content-Type, Authorization" // Encabezados permitidos
            },
            body: JSON.stringify({
                message: 'Worker created successfully',
                id_trabajador
            })
        };

    } catch (error) {
        console.error('Error:', error);
        
        if (error.code === 'EREQUEST') {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    message: 'Database query error',
                    error: error.message
                })
            };
        }

        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'Internal server error',
                error: error.message
            })
        };
    } finally {
        // Close database connection
        if (pool) {
            await pool.close();
        }
    }
};