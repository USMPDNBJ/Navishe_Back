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

// Función para formatear la fecha al formato YYYY-MM-DD en UTC-05:00
const formatDate = (isoDate) => {
  const date = new Date(isoDate);
  date.setHours(date.getHours() - 5); // Ajustar a UTC-05:00 (Colombia)
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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

// Función para obtener lecturas por fecha, hasta 5 por día
const getUniqueDateReadings = (data, field, maxPerDay) => {
  const dateMap = new Map();

  // Agrupar por fecha, recolectando hasta maxPerDay lecturas
  for (const row of data) {
    const date = formatDate(row["_time"]);
    if (!dateMap.has(date)) {
      dateMap.set(date, []);
    }
    const readings = dateMap.get(date);
    if (readings.length < maxPerDay) {
      readings.push(row);
    }
    // Ordenar las lecturas del día por _time descendente para mantener las más recientes
    readings.sort((a, b) => new Date(b["_time"]) - new Date(a["_time"]));
  }

  // Obtener todas las fechas únicas
  const uniqueDates = [...dateMap.entries()]
    .sort((a, b) => new Date(b[1][0]["_time"]) - new Date(a[1][0]["_time"])); // Ordenar por la lectura más reciente del día

  // Aplanar todas las lecturas para estadísticas y respuesta
  const allReadings = [];
  const responseReadings = [];

  for (const [date, readings] of uniqueDates) {
    // Agregar todas las lecturas (hasta maxPerDay) para estadísticas y respuesta
    allReadings.push(...readings);
    responseReadings.push(...readings.map(row => ({
      fecha: date,
      [field]: row["_value"],
    })));
  }

  return { allReadings, responseReadings };
};

export const handler = async (event) => {
  const { id, startDate, endDate } = event;
  
  // Validar parámetros
  if (!id || !startDate || !endDate) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Faltan parámetros: id, startDate o endDate' }),
    };
  }

  // Validar formato de fechas
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Formato de fecha inválido' }),
    };
  }

  // Asegurar que startDate sea anterior a endDate
  if (start > end) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'startDate debe ser anterior a endDate' }),
    };
  }

  // Consulta Flux modificada para incluir el campo peso
  const query = `
from(bucket: "${INFLUXDB_BUCKET}")
  |> range(start: ${start.toISOString()}, stop: ${end.toISOString()})
  |> filter(fn: (r) => r["_field"] == "humedad" or r["_field"] == "temperatura" or r["_field"] == "peso")
  |> filter(fn: (r) => r["colmena"] == "${id}")
  |> sort(columns: ["_time"], desc: true)
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
        body: JSON.stringify({ message: 'No se encontraron datos para esta colmena en el rango de fechas.' }),
      };
    }

    // Filtrar los resultados para obtener las lecturas de humedad, temperatura y peso
    const humedadDataAll = result.filter(row => row["_field"] === "humedad");
    const temperaturaDataAll = result.filter(row => row["_field"] === "temperatura");
    const pesoDataAll = result.filter(row => row["_field"] === "peso");

    // Obtener lecturas para todas las fechas únicas con hasta 5 lecturas por fecha
    const humedadResult = getUniqueDateReadings(humedadDataAll, "humedad", 5);
    const temperaturaResult = getUniqueDateReadings(temperaturaDataAll, "temperatura", 5);
    const pesoResult = getUniqueDateReadings(pesoDataAll, "peso", 5);

    // Procesar lecturas de humedad
    const humedadValues = humedadResult.allReadings.map(row => row["_value"]);
    const humedadStats = calculateStatistics(humedadValues);
    const humedadLecturas = humedadResult.responseReadings;

    // Procesar lecturas de temperatura
    const temperaturaValues = temperaturaResult.allReadings.map(row => row["_value"]);
    const temperaturaStats = calculateStatistics(temperaturaValues);
    const temperaturaLecturas = temperaturaResult.responseReadings;

    // Procesar lecturas de peso
    const pesoValues = pesoResult.allReadings.map(row => row["_value"]);
    const pesoStats = calculateStatistics(pesoValues);
    const pesoLecturas = pesoResult.responseReadings;

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