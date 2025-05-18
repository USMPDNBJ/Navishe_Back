import { InfluxDB } from '@influxdata/influxdb-client';

const INFLUXDB_HOST = '52.21.33.80'; // Nueva dirección IP sin http://
const INFLUXDB_PORT = 8086;  // Puerto de InfluxDB
const INFLUXDB_TOKEN = 'QDE5_ou_AyGbZse8bwjp7Xb0eWSUOnoxC2mb_jgjxVS5Lp-0BanqiPn4yjY-bMOPeQrUSRs-5iPR_lBGVRRAgQ=='; // Nuevo token
const INFLUXDB_BUCKET = 'navishe_bucket_pruebas'; // Nuevo bucket
const INFLUXDB_ORG = 'Navishe'; // Nueva organización

// Crear el cliente de InfluxDB
const influxdb = new InfluxDB({
  url: `http://${INFLUXDB_HOST}:${INFLUXDB_PORT}`,
  token: INFLUXDB_TOKEN,
});

const queryApi = influxdb.getQueryApi(INFLUXDB_ORG);

export const handler = async (event) => {
  // Definir la consulta Flux para obtener los datos de temperatura y humedad
  const query = `
  from(bucket: "${INFLUXDB_BUCKET}")
    |> range(start: -40h)  // Obtiene los registros desde las últimas 48 horas
    |> filter(fn: (r) => r["_field"] == "humedad" or r["_field"] == "temperatura" or r["_field"] == "longitud" or r["_field"] == "latitud" )
    |> group(columns: ["colmena"])  // Agrupa los resultados por medición
    |> sort(columns: ["_time"], desc: true)  // Ordena por tiempo de forma descendente
    |> limit(n: 4)  // Limita los resultados a los últimos 3 por grupo (medición)
  `;

  try {
    console.log("Iniciando consulta a InfluxDB...");

    // Ejecutar la consulta y procesar los resultados
    const result = await new Promise((resolve, reject) => {
      const data = [];

      queryApi.queryRows(query, {
        next(row, tableMeta) {
          const o = tableMeta.toObject(row);
          data.push(o);  // Almacena los resultados
        },
        error(error) {
          console.error('Error de consulta:', error);
          reject(error);  // Rechaza la promesa si hay un error
        },
        complete() {
          console.log('Consulta completada, datos obtenidos:', data);
          resolve(data);  // Resuelve la promesa con los resultados
        },
      });
    });

    // Si no se encontraron datos, devolvemos un mensaje
    if (result.length === 0) {
      let data = [];

      let valNull = {
        id_colmena: `0`,
        nombre: `0`,
        humedad: undefined,
        temperatura: undefined,
        longitud: 0,
        latitud: 0
      };

      data.push(valNull);  // Agregar el objeto al array

      return {
        statusCode: 404,
        body: data

      };
    }

    // Agrupar los datos por medición y calcular el promedio
    const groupedData = result.reduce((acc, row) => {
      const colmena = row["colmena"];
      const field = row["_field"];
      const sensorValue = row["_value"];

      // Si no existe un grupo para esta medición, lo creamos
      if (!acc[colmena]) {
        acc[colmena] = { humedad: [], temperatura: [], longitud: [], latitud: [] };
      }

      // Agrupar las mediciones por campo (humedad o temperatura)
      acc[colmena][field].push(sensorValue);
      return acc;
    }, {});

    console.log('Datos agrupados:', groupedData);  // Ver los datos agrupados

    // Calcular el promedio para cada sensor (campo) y limitar a las últimas 4 lecturas
    const averagedData = Object.keys(groupedData).map((colmena) => {
      const colmenaData = groupedData[colmena];

      // Imprimir el nombre de la medición para depurar
      console.log('Medición encontrada:', colmena);

      // Limpiar el nombre del tópico para eliminar posibles espacios extra o barras adicionales
      const cleanColmena = colmena.replace(/\s+/g, '').replace(/^iot\//, '').replace(/\/topic$/, '');
      console.log('Nombre limpio:', cleanColmena);

      // Intentamos extraer el número de la colmena del nombre
      const match = cleanColmena.match(/colmena_([A-Za-z]+)(\d+)$/); // Eliminamos "/topic" de la expresión regular

      let id_colmena = null;
      let nombre = null;

      if (match) {
        id_colmena = match[2];  // El número que aparece después de las letras
        nombre = `colmena_${match[1]}${match[2]}`;  // El nombre completo de la colmena (por ejemplo, "colmena_JoaquinCerna1")
      } else {
        // Si no sigue el patrón esperado, asignamos valores por defecto
        id_colmena = "desconocido";   // Cambiar este valor si prefieres otro mensaje
        nombre = cleanColmena;         // El nombre es el string original, pero no es válido
      }

      console.log('ID Colmena:', id_colmena);
      console.log('Nombre:', nombre);


      const longitud = colmenaData.longitud.length > 0
        ? colmenaData.longitud[colmenaData.longitud.length - 1]
        : null;

      const latitud = colmenaData.latitud.length > 0
        ? colmenaData.latitud[colmenaData.latitud.length - 1]
        : null;

      const promedioHumedad = colmenaData.humedad.length > 0
        ? colmenaData.humedad.slice(-4).reduce((sum, value) => sum + value, 0) / colmenaData.humedad.length
        : 0;

      const ultimasTemperaturas = colmenaData.temperatura.slice(-4);
      const promedioTemperatura = ultimasTemperaturas.length > 0
        ? ultimasTemperaturas.reduce((sum, value) => sum + value, 0) / ultimasTemperaturas.length
        : 0;

      return {
        id_colmena: id_colmena,   // El número de la colmena (o "desconocido" si no coincide con el patrón)
        nombre: nombre,           // El nombre completo de la colmena (sin "iot/" y "/topic")
        humedad: promedioHumedad,
        temperatura: promedioTemperatura,
        longitud: longitud,
        latitud: latitud,
      };
    });



    console.log('Datos promediados:', averagedData); // Ver los resultados promediados

    return {
      statusCode: 200,
      body: JSON.stringify(averagedData),
    };

  } catch (error) {
    console.error('Error en la ejecución de Lambda:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error al consultar InfluxDB.' }),
    };
  }
};