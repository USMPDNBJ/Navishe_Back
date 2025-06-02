import mysql from 'mysql2/promise';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

// Configuración de MySQL
const MYSQL_CONFIG = {
  host: 'bd-mysql-na-vishe.csbswo6i0muu.us-east-1.rds.amazonaws.com',
  user: 'admin',
  password: 'Vishe-1234',
  port: 3306,
  database: 'bd-na-vishe-prod',
};

// Configuración de SNS
const SNS_TOPIC_ARN = "arn:aws:sns:us-east-1:428847003734:sns_prod_notif";
const SNS_REGION = 'us-east-1';
const snsClient = new SNSClient({ region: SNS_REGION });

// Función para parsear el string de ubicación
function parseLocationString(locationStr) {
  try {
    const [ lat, lon] = locationStr.split(',').map(parseFloat);
    if (isNaN(lat) || isNaN(lon)) throw new Error('Invalid location string format');
    return { latitude: lat, longitude: lon };
  } catch (error) {
    throw new Error(`Failed to parse location string: ${error.message}`);
  }
}

// Función para calcular la distancia (Haversine)
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Radio de la Tierra en metros
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) ** 2 +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distancia en metros
}

// Función para consultar MySQL
async function queryMySql(colmenaId) {
  let connection;
  try {
    connection = await mysql.createConnection(MYSQL_CONFIG);
    const [rows] = await connection.execute(
      `
        SELECT latitud, longitud
        FROM t_colmena
        WHERE nombre = ?
        ORDER BY fecha_instalacion DESC
        LIMIT 1
      `,
      [colmenaId]
    );

    if (!rows || rows.length === 0) {
      throw new Error(`No location data found for colmenaId: ${colmenaId}`);
    }

    const { latitud, longitud } = rows[0];
    if (!latitud || !longitud) {
      throw new Error(`Incomplete location data for colmenaId: ${colmenaId}`);
    }
    console.log(rows[0])
    return { latitude: latitud, longitude: longitud };
  } catch (error) {
    throw new Error(`MySQL query error: ${error.message}`);
  } finally {
    if (connection) await connection.end();
  }
}

// Handler principal de Lambda
export const handler = async (event) => {
  try {
    // Extraer datos del evento (desde IoT Core)
    console.log('Event received:', JSON.stringify(event));
    const { topic, ubicacion } = event;
    if (!topic || !ubicacion) {
      throw new Error('Missing topic or ubicacion in event');
    }

    // Extraer colmenaId eliminando la última letra del topic
    const colmenaId = topic.slice(0, -1); // ej: 'colmena_CristopherNieves0' -> 'colmena_CristopherNieves'
    const { latitude: newLat, longitude: newLon } = parseLocationString(ubicacion);
    console.log('Parsed new location:', { colmenaId, newLon, newLat });

    // Consultar la última posición en MySQL
    const { latitude: lastLat, longitude: lastLon } = await queryMySql(colmenaId);

    // Calcular la distancia
    const distance = haversine(lastLat, lastLon, newLat, newLon);
    console.log('Distance calculated:', distance.toFixed(2), 'meters');

    // Si la distancia es mayor a 1 metro, enviar notificación vía SNS
    if (distance > 1) {
      if (!SNS_TOPIC_ARN) {
        throw new Error('SNS_TOPIC_ARN is not configured');
      }
      try {
        const message = `La colmena ${colmenaId} se ha movido ${distance.toFixed(2)} metros desde su posición (Lat: ${lastLat}, Lon: ${lastLon})`;
        await snsClient.send(
          new PublishCommand({
            TopicArn: SNS_TOPIC_ARN,
            Message: message,
            Subject: 'Alert de localización de la colmena',
          })
        );
        console.log('SNS notification sent successfully');
        return {
          statusCode: 200,
          body: JSON.stringify({ status: 'Notification sent', distance: distance.toFixed(2) }),
        };
      } catch (snsError) {
        console.error('Failed to send SNS notification:', snsError);
        throw new Error(`SNS error: ${snsError.message}`);
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ status: 'No notification needed', distance: distance.toFixed(2) }),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ status: 'Error', message: error.message }),
    };
  }
};