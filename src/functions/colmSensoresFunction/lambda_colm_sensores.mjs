import { InfluxDB } from '@influxdata/influxdb-client';

const INFLUXDB_TOKEN = process.env.INFLUX_TOKEN || 'U9lAxx7_eNCKiY4NGz_UfNlpVKlHpud6mURWiuaunQT-cVUi1gBtDhNYf47HgsJyFcyJKK_4yL45WC-My42ypQ==';
const INFLUXDB_BUCKET = process.env.INFLUX_BUCKET || 'panales_bucket';
const INFLUXDB_ORG = process.env.INFLUX_ORG || '213aac21b43b23ac';
const INFLUXDB_URL = process.env.INFLUX_URL || 'http://34.233.48.228:8086';


const influxdb = new InfluxDB({
  url: INFLUXDB_URL,
  token: INFLUXDB_TOKEN,
});

const queryApi = influxdb.getQueryApi(INFLUXDB_ORG);

export const handler = async (event) => {
  const query = `
    from(bucket: "${INFLUXDB_BUCKET}")
      |> range(start: -100h)
      |> filter(fn: (r) => r["_field"] == "humedad" or 
                          r["_field"] == "temperatura" or 
                          r["_field"] == "longitud" or 
                          r["_field"] == "latitud" or 
                          r["_field"] == "peso")
      |> group(columns: ["colmena", "_field"])
      |> last()
      |> group(columns: ["colmena"])
      |> sort(columns: ["_time"], desc: true)
  `;

  try {
    console.log("Iniciando consulta a InfluxDB...");
    try {
      const pingResult = await influxdb.ping(5000); // Timeout de 5 segundos
      if (!pingResult || pingResult.status !== 'ready') {
        throw new Error('InfluxDB no está disponible');
      }
      console.log('Conexión con InfluxDB verificada:', pingResult); // Depuración
    } catch (pingError) {
      console.error('Error de conexión con InfluxDB:', pingError.message); // Depuración
      return {
        statusCode: 503,
        body: JSON.stringify({
          message: 'Error de conexión con InfluxDB.',
          details: pingError.message,
        }),
      };
    }
    const result = await new Promise((resolve, reject) => {
      const data = [];

      queryApi.queryRows(query, {
        next(row, tableMeta) {
          const o = tableMeta.toObject(row);
          console.log('Fila obtenida:', o);
          data.push(o);
        },
        error(error) {
          console.error('Error de consulta:', error);
          reject(error);
        },
        complete() {
          console.log('Consulta completada, datos obtenidos:', data);
          resolve(data);
        },
      });
    });
    if (!result || result.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'No se encontraron datos.' }),
        headers: { 'Content-Type': 'application/json' }
      };
    }
    if (result.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify([{
          id_colmena: 0,
          nombre: "0",
          humedad: null,
          temperatura: null,
          peso: null,
          longitud: null,
          latitud: null
        }])
      };
    }

    const colmenasData = {};

    result.forEach(row => {
      const colmena = row.colmena;
      const field = row._field;
      const value = row._value;

      if (typeof colmena !== 'string') {
        console.warn('Valor colmena no válido:', colmena);
        return;
      }

      if (!colmenasData[colmena]) {
        colmenasData[colmena] = {
          id_colmena: null,
          nombre: colmena,
          humedad: null,
          temperatura: null,
          peso: null,
          longitud: null,
          latitud: null
        };

        const match = colmena.match(/colmena_([A-Za-z]+)?(\d+)$/i);
        if (match) {
          colmenasData[colmena].id_colmena = match[2] || "0";
          colmenasData[colmena].nombre = `colmena_${match[1] || ''}${match[2] || ''}`;
        } else {
          colmenasData[colmena].id_colmena = "0";
        }
      }

      if (typeof field === 'string') {
        switch (field) {
          case 'humedad':
            colmenasData[colmena].humedad = value;
            break;
          case 'temperatura':
            colmenasData[colmena].temperatura = value;
            break;
          case 'peso':
            colmenasData[colmena].peso = value;
            break;
          case 'longitud':
            colmenasData[colmena].longitud = value;
            break;
          case 'latitud':
            colmenasData[colmena].latitud = value;
            break;
        }
      } else {
        console.warn('Campo _field no válido:', field);
      }
    });

    const formattedData = Object.values(colmenasData);

    console.log('Datos formateados:', formattedData);

    return {
      statusCode: 200,
      body: JSON.stringify(formattedData), // Asegúrate que formattedData sea un objeto/array
      headers: {
        'Content-Type': 'application/json'
      }
    };

  } catch (error) {
    console.error('Error en la ejecución de Lambda:', error);

    // Manejo específico de errores de conexión
    if (error.message.includes('ECONNREFUSED') || error.message.includes('Connection failed')) {
      return {
        statusCode: 503, // Service Unavailable
        body: JSON.stringify({
          message: 'Error de conexión con InfluxDB.',
          details: error.message
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      };
    }

    // Otros errores
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Error al consultar InfluxDB.',
        details: error.message
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    };
  }
};
