import { InfluxDB } from '@influxdata/influxdb-client';

const INFLUXDB_HOST = '34.233.48.228';
const INFLUXDB_PORT = 8086;
const INFLUXDB_TOKEN = 'U9lAxx7_eNCKiY4NGz_UfNlpVKlHpud6mURWiuaunQT-cVUi1gBtDhNYf47HgsJyFcyJKK_4yL45WC-My42ypQ==';
const INFLUXDB_BUCKET = 'panales_bucket';
const INFLUXDB_ORG = '213aac21b43b23ac';

// Crear el cliente de InfluxDB
const influxdb = new InfluxDB({
  url: `http://${INFLUXDB_HOST}:${INFLUXDB_PORT}`,
  token: INFLUXDB_TOKEN,
});

const queryApi = influxdb.getQueryApi(INFLUXDB_ORG);

// Función para formatear la fecha al formato YYYY-MM-DD HH:mm:ss
const formatDate = (isoDate) => {
  const date = new Date(isoDate);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

// Función para calcular estadísticas
const calculateStatistics = (values) => {
  if (values.length === 0) return { average: null, max: null, min: null, standardDeviation: null };

  const average = values.reduce((sum, val) => sum + val, 0) / values.length;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const variance = values.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) / values.length;
  const standardDeviation = Math.sqrt(variance);

  return { average, max, min, standardDeviation };
};

export const handler = async (event) => {
  const id = event.id;

  if (!id) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Falta el parámetro id' }),
    };
  }

  // Consulta Flux modificada para incluir el campo peso
  const query = `
from(bucket: "${INFLUXDB_BUCKET}")
  |> range(start: -24h)
  |> filter(fn: (r) => r["_field"] == "humedad" or r["_field"] == "temperatura" or r["_field"] == "peso")
  |> filter(fn: (r) => r["colmena"] == "${id}")
  |> sort(columns: ["_time"], desc: true)
  |> limit(n: 10)  // Limitar a las últimas 10 lecturas por campo
`;

  try {
    console.log("Iniciando consulta a InfluxDB...");

    const result = await new Promise((resolve, reject) => {
      const data = [];
      queryApi.queryRows(query, {
        next(row, tableMeta) {
          const o = tableMeta.toObject(row);
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

    if (result.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'No se encontraron datos para esta colmena.' }),
      };
    }

    // Filtrar los resultados para obtener las lecturas de humedad, temperatura y peso
    const humedadData = result.filter(row => row["_field"] === "humedad").slice(0, 10);
    const temperaturaData = result.filter(row => row["_field"] === "temperatura").slice(0, 10);
    const pesoData = result.filter(row => row["_field"] === "peso").slice(0, 10);

    // Procesar lecturas de humedad
    const humedadValues = humedadData.map(row => row["_value"]);
    const humedadStats = calculateStatistics(humedadValues);
    const humedadLecturas = humedadData.map(row => ({
      fecha: formatDate(row["_time"]),      
      humedad: row["_value"]
    }));

    // Procesar lecturas de temperatura
    const temperaturaValues = temperaturaData.map(row => row["_value"]);
    const temperaturaStats = calculateStatistics(temperaturaValues);
    const temperaturaLecturas = temperaturaData.map(row => ({
      fecha: formatDate(row["_time"]),
      temperatura: row["_value"]
    }));

    // Procesar lecturas de peso
    const pesoValues = pesoData.map(row => row["_value"]);
    const pesoStats = calculateStatistics(pesoValues);
    const pesoLecturas = pesoData.map(row => ({
      fecha: formatDate(row["_time"]),
      peso: row["_value"]
    }));

    // Construir la respuesta con el nuevo campo peso
    const response = {
      humedad: {
        average: humedadStats.average,
        max: humedadStats.max,
        min: humedadStats.min,
        standardDeviation: humedadStats.standardDeviation,
        data: humedadLecturas,
      },
      temperatura: {
        average: temperaturaStats.average,
        max: temperaturaStats.max,
        min: temperaturaStats.min,
        standardDeviation: temperaturaStats.standardDeviation,
        data: temperaturaLecturas,
      },
      peso: {
        average: pesoStats.average,
        max: pesoStats.max,
        min: pesoStats.min,
        standardDeviation: pesoStats.standardDeviation,
        data: pesoLecturas,
      }
    };

    return {
      statusCode: 200,
      body: response
    };

  } catch (error) {
    console.error('Error en la ejecución de Lambda:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error al consultar InfluxDB.' }),
    };
  }
};