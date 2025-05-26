import { handler } from '../../../src/functions/colmFindIdFunction/lambda_colm_sensores_find_id.mjs'; // Asegúrate de usar el nombre correcto del archivo
import fs from 'fs';

test('handler responde con datos si el id es válido', async () => {
  const mockEvent = { id: "colmena_01" };
  const response = await handler(mockEvent);

  expect(response.statusCode).toBe(200);
  expect(response.body).toBeDefined();
});