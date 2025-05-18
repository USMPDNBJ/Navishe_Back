const { InfluxDB, Point } = require('@influxdata/influxdb-client');

const INFLUX_URL = 'http://34.233.48.228:8086';
const INFLUX_TOKEN = '4cqcmP5HAef1VEZi0sEHjdZ4twFVrKjCS2CZtTAqmFP8ouPUV1MtW6oszSoV5jRYINMGugusMTWUW5zsNu8gbw==';
const ORG = '213aac21b43b23ac';
const BUCKET = 'panales_bucket';

const influxDB = new InfluxDB({ url: INFLUX_URL, token: INFLUX_TOKEN });
const writeApi = influxDB.getWriteApi(ORG, BUCKET);

exports.handler = async (event) => {
    console.log("Mensaje recibido:", JSON.stringify(event));

    try {
        const humedad = parseFloat(event.humedad);
        const temperatura = parseFloat(event.temperatura);
        const [latitudJSON,logitudJSON] = event.ubicacion.split(',').map(parseFloat)
        const latitud = latitudJSON
        const longitud = logitudJSON
        const peso = parseFloat(event.peso)
        const colmenaId = event.topic.split('/')[1]


        const point = new Point('colmena_data')
            .tag('id_colmena', colmenaId)
            .floatField('humedad', humedad)
            .floatField('temperatura', temperatura)
            .floatField('latitud',latitud)
            .floatField('longitud',longitud)
            .floatField('peso', peso)
            .timestamp(new Date());

        writeApi.writePoint(point);
        await writeApi.close();

        return {
            statusCode: 200,
            body: JSON.stringify('Datos escritos en InfluxDB'),
        };
    } catch (error) {
        console.error('Error al escribir en InfluxDB:', error);
        return {
            statusCode: 500,
            body: JSON.stringify('Error al procesar el mensaje'),
        };
    }
};
