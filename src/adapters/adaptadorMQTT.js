/**
 * adaptadorMQTT.js
 * 
 * Este archivo describe cómo se podría integrar el prototipo con mqtt.js
 * para escuchar paquetes de sensores en un broker real. Toda la lógica
 * está comentada intencionalmente para evitar dependencias adicionales
 * dentro del demo. Las pantallas de sensores utilizan la simulación
 * interna provista por `servicioSensores`.
 *
 * Uso referencial con mqtt.js:
 *
 * import { connect } from 'mqtt';
 *
 * export function conectarMQTT({ url, topic, onMessage }) {
 *   const client = connect(url, {
 *     username: 'usuario-demo',
 *     password: 'secreto-demo'
 *   });
 *
 *   client.on('connect', () => {
 *     client.subscribe(topic, (err) => {
 *       if (err) {
 *         console.error('MQTT subscribe error', err);
 *       }
 *     });
 *   });
 *
 *   client.on('message', (receivedTopic, payloadBuffer) => {
 *     if (receivedTopic !== topic) return;
 *     const payload = payloadBuffer.toString();
 *     onMessage?.(JSON.parse(payload));
 *   });
 *
 *   return () => client.end();
 * }
 *
 * Para mantener el prototipo auto contenido, exportamos funciones no-op
 * que documentan la intención y permiten a las vistas mostrar mensajes
 * educativos cuando el usuario decide revisar la integración real.
 */

export function conectarMQTTSimulada() {
  console.info('[adaptadorMQTT] Conexión simulada inicializada.');
  return {
    desconectar: () => console.info('[adaptadorMQTT] Conexión simulada cerrada.')
  };
}

export default {
  conectarMQTTSimulada
};
