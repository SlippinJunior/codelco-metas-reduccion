/**
 * adaptadorHTTP.js
 *
 * Ejemplo referencial de cómo el prototipo podría integrar un endpoint
 * HTTP para recibir paquetes de sensores. La implementación real se
 * deja comentada para evitar dependencias adicionales. El demo utiliza
 * exclusivamente el simulador interno basado en `setInterval`.
 *
 * Ejemplo de integración:
 *
 * export async function registrarPaqueteHTTP(sensorId, payload) {
 *   const respuesta = await fetch('/api/simular-paquete', {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify({ sensorId, payload })
 *   });
 *
 *   if (!respuesta.ok) {
 *     throw new Error('No se pudo registrar el paquete');
 *   }
 *
 *   return respuesta.json();
 * }
 *
 * En la demo retornamos respuestas simuladas para que las vistas puedan
 * mostrar mensajes informativos sin requerir un backend.
 */

export async function registrarPaqueteHTTPSimulado(sensorId, payload) {
  console.info('[adaptadorHTTP] Simulación de POST /api/simular-paquete', sensorId, payload);
  return {
    success: true,
    message: 'Paquete recibido por endpoint simulado',
    sensorId,
    payload
  };
}

export default {
  registrarPaqueteHTTPSimulado
};
