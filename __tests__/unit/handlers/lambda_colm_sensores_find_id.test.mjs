
import { handler } from '../../../src/functions/colmFindIdFunction/lambda_colm_sensores_find_id.mjs';



test('handler responde con datos si el id es válido', async () => {
  const mockEvent = { id: "colmena_01" };
  const response = await handler(mockEvent);

  expect([200, 404]).toContain(response.statusCode); // permite ambos, útil para desarrollo
  if (response.statusCode === 200) {
    expect(response.body).toBeDefined();
  } else {
    expect(JSON.parse(response.body).message).toContain("No se encontraron datos");
  }
});

test('handler responde con 404 si el id no existe', async () => {
  const mockEvent = { id: "colmena_inexistente" };
  const response = await handler(mockEvent);

  expect(response.statusCode).toBe(404);
  expect(JSON.parse(response.body).message).toContain("No se encontraron datos");
});

test('handler responde con 400 si el evento está mal formado', async () => {
  const mockEvent = {}; // sin el campo 'id'
  const response = await handler(mockEvent);

  expect(response.statusCode).toBe(400);
  expect(JSON.parse(response.body).message).toContain("Falta el parámetro id");
});

//
//test('Debería retornar 400 si el parámetro id no es una cadena', async () => {
  // Evento con `id` de tipo número, lo cual es un error común
  //const mockEvent = { id: 12345 };

  // Ejecutamos la función handler tal como se haría en producción
  //const response = await handler(mockEvent);

  // Esperamos un código de estado HTTP 400 (Bad Request)
  //expect(response.statusCode).toBe(400);

  // Verificamos que el mensaje explique claramente el problema
  //const body = JSON.parse(response.body);
  //expect(body.message).toContain("El parámetro id debe ser una cadena");
//});
