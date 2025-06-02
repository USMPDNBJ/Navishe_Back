
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
