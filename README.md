# Sistema de Gestión de Metas de Reducción (Prototipo Académico)

> Proyecto universitario con datos simulados que usa a Codelco como caso hipotético. No es software oficial ni contiene información real.

## Resumen rápido
- Registro y seguimiento de metas de reducción con datos ficticios.
- Dashboard con estadísticas, filtros por división/año y exportación CSV.
- Formularios validados, soporte multi-dispositivo y ayudas de auditoría/verificación.
- Módulos extra de sensores, anomalías, cadena de registros y verificación para mostrar flujos anexos.

## Stack principal
- React 18 + Vite
- Tailwind CSS y Recharts
- React Router DOM
- Jest + Testing Library

## Inicio rápido
```bash
npm install
npm run dev
```

Abre `http://localhost:3000` en el navegador.

## Historias de usuario implementadas
> Todas las rutas protegidas requieren iniciar sesión desde `/login`. Los usuarios y roles disponibles están documentados en `USUARIOS.md` (por ejemplo, `maria.torres`, `carlos.rojas`, `ana.silva`, `pedro.gomez`, `lucia.mendez`, `jorge.campos` o `admin`).

### HU-R01 · Crear meta con línea base y unidad
Creación de metas corporativas con trazabilidad y control de calidad.

| Criterio de aceptación | Cómo demostrarlo |
| --- | --- |
| **CA-R01-1** · Meta incluye todos los campos | 1) Inicia sesión como `maria.torres`. 2) Abre `/crear-meta`. 3) Completa división, proceso, indicador `tCO₂e/ton Cu`, línea base (año ≥ 2015 y valor numérico), fecha objetivo futura y descripción. 4) Envía el formulario y revisa el panel de confirmación con los datos registrados. |
| **CA-R01-2** · Validaciones obligatorias y formato | 1) En `/crear-meta`, intenta enviar el formulario vacío; se muestran mensajes por campo. 2) Ingresa un año fuera de rango o un valor negativo y verifica los errores en línea. 3) Corrige los datos y confirma que las alertas desaparecen antes de poder crear la meta. |
| **CA-R01-3** · Visibilidad corporativa y divisional | 1) Tras la creación, navega a `/dashboard`. 2) Observa que el contador y las tarjetas de `Panel de Metas` se incrementan. 3) Usa los filtros de división/año para ubicar la meta recién creada en la vista particionada. |

### HU-R02 · Visualizar progreso vs. meta
Seguimiento en línea de metas con filtros corporativos.

| Criterio de aceptación | Cómo demostrarlo |
| --- | --- |
| **CA-R02-1** · Gráfica mensual metas vs. real | 1) Inicia sesión como `carlos.rojas` (o cualquier rol con acceso) y abre `/progreso`. 2) Selecciona una división y proceso en el panel de filtros. 3) El gráfico y las tarjetas “Metas disponibles/Metas en vista” se recalculan al instante con datos simulados. |
| **CA-R02-2** · Selector de periodo | 1) En el componente “Selector de periodo” cambia de `Año` a `Trimestre`. 2) Elige, por ejemplo, `Trimestre 2`. 3) Confirma que el gráfico reconstruye la serie y que la etiqueta del periodo en las chips superiores se actualiza. |
| **CA-R02-3** · Tiempo de render ≤ 2 s | 1) Con los datos por defecto, mira la caja “Tiempo de generación” sobre el gráfico; el valor se mantiene bajo los 2000 ms. 2) Ajusta filtros amplios para confirmar que, si se supera ese límite, aparece el aviso de rendimiento. |

### HU-R03 · Exportar reporte comparativo
Reportes ejecutivos con firma simulada y portada.

| Criterio de aceptación | Cómo demostrarlo |
| --- | --- |
| **CA-R03-1** · Configuración de división/proceso | 1) Desde `/exportar-reportes`, selecciona al menos dos divisiones y un proceso. 2) Define el tipo de periodo (año/semestre/trimestre) y verifica el resumen superior. |
| **CA-R03-2** · Portada e índice | 1) Ingresa un nombre en “Firmante”. 2) Haz clic en “Ver previsualización” y revisa la portada y el índice generado. 3) Cierra la modal para volver a la configuración. |
| **CA-R03-3** · Exportación PDF/CSV firmada | 1) Presiona “Generar PDF” y “Generar CSV”. 2) Confirma la descarga de ambos archivos y revisa en el panel lateral el hash/firmante registrados para evidencia. |

### HU-R04 · Conectar sensor por MQTT/HTTP
Alta y simulación de sensores con protocolos estándar.

| Criterio de aceptación | Cómo demostrarlo |
| --- | --- |
| **CA-R04-1** · Alta con protocolo y credenciales | 1) Inicia sesión como `pedro.gomez` o `admin` y visita `/sensores`. 2) Completa el formulario con nombre, tipo, protocolo (HTTP o MQTT), ubicación y credenciales. 3) Guarda y valida el mensaje de éxito y la aparición del sensor en la tabla. |
| **CA-R04-2** · Recepción y acuse | 1) Desde la lista, pulsa “Ver detalle” del sensor creado. 2) Ejecuta “Simular paquete” o “Activar simulación automática”. 3) Observa la tarjeta “Última transmisión” y la tabla de acuses con el nuevo registro y mensaje de confirmación. |
| **CA-R04-3** · Historial visible | 1) En el detalle del sensor revisa el mapa, la frecuencia y las tablas de transmisiones. 2) Verifica que cada paquete incluye payload resumido y JSON completo descargable. |

### HU-R05 · Detección y validación de anomalías
Motor de reglas con aprobación/rechazo documentado.

| Criterio de aceptación | Cómo demostrarlo |
| --- | --- |
| **CA-R05-1** · Reglas básicas marcan sospechosos | 1) Ingresa como `jorge.campos` y abre `/anomalias`. 2) Filtra por tipo de anomalía (rango/salto/outlier) y rango de fechas. 3) La tabla se acota a lecturas sospechosas y el resumen superior se actualiza. |
| **CA-R05-2** · Aprobar o rechazar con comentario | 1) Selecciona una lectura “pendiente” y pulsa “Revisar”. 2) En la modal agrega un comentario y aprueba o rechaza; el mensaje confirma la acción y el historial conserva el comentario. |
| **CA-R05-3** · Datos rechazados salen de cálculos | 1) Tras rechazar, observa que la lectura deja de contarse en “Pendientes” y que el estado cambia a “rechazada”. 2) Exporta el CSV para evidenciar que los rechazados aparecen excluidos de los agregados. |

### HU-R06 · Trazabilidad del sensor
Bitácora de estados, mapa y exportación con filtro de fechas.

| Criterio de aceptación | Cómo demostrarlo |
| --- | --- |
| **CA-R06-1** · Bitácora con alta/operativo/etc. | 1) Abre el detalle de cualquier sensor en `/sensores`. 2) Cambia el estado a “mantenimiento” o “baja”, agrega un comentario y registra. 3) La bitácora agrega una fila con fecha, usuario y comentario. |
| **CA-R06-2** · Mapa y último heartbeat | 1) Revisa el mapa interactivo y la tarjeta “Última transmisión”. 2) Simula un paquete para ver la hora y el resumen actualizados, confirmando el heartbeat más reciente. |
| **CA-R06-3** · Exportar bitácora filtrada | 1) Define un rango de fechas en la bitácora y pulsa “Exportar bitácora”. 2) Comprueba la descarga del CSV con los eventos visibles y el total informado. |

### HU-R07 · Registrar bloque de huella de datos
Cadena enlazada de bloques con descarga de evidencia.

| Criterio de aceptación | Cómo demostrarlo |
| --- | --- |
| **CA-R07-1** · Generar hash y bloque | 1) Accede a `/cadena-registros`. 2) En “Registrar bloque” ingresa ID de registro, descripción y evidencia. 3) Envía y valida el mensaje de éxito junto con la descarga automática del JSON del bloque. |
| **CA-R07-2** · Mantener hash padre | 1) Selecciona el bloque recién creado en la lista. 2) En el detalle verifica el `hash_padre` que referencia al bloque anterior, garantizando la cadena. |
| **CA-R07-3** · Consultar hash por ID | 1) Usa el buscador “Consultar huella”. 2) Ingresa el ID de registro y confirma que el sistema localiza el bloque y muestra la huella asociada (simula la API interna). |

### HU-R08 · Verificar integridad de registro
Herramienta de recalculo de hash con divergencias detalladas.

| Criterio de aceptación | Cómo demostrarlo |
| --- | --- |
| **CA-R08-1** · Verificación con hash comparado | 1) Desde `/verificacion`, selecciona un registro de la lista y pulsa “Verificar”. 2) El panel de resultados muestra la huella recalculada, el estado (válido) y el tiempo usado. |
| **CA-R08-2** · Mostrar divergencias | 1) Activa “Simular manipulación” sobre el mismo registro. 2) El resultado cambia a inválido; haz clic en “Ver divergencias” para revisar campo a campo la diferencia. |
| **CA-R08-3** · Tiempo ≤ 1 s | 1) Con la verificación normal (sin retardo simulado) revisa el indicador “Tiempo de verificación”. 2) Se mantiene por debajo de 1000 ms; si activas el retardo se enciende la alerta amarilla. |

### HU-R09 · Panel de auditoría de cambios
Bitácora paginada con filtros avanzados y exportación.

| Criterio de aceptación | Cómo demostrarlo |
| --- | --- |
| **CA-R09-1** · Listado quién/qué/cuándo/motivo | 1) Inicia sesión como `ana.silva` o `lucia.mendez` y abre `/auditoria`. 2) Cada fila muestra usuario, acción, entidad, fecha y detalle del cambio. |
| **CA-R09-2** · Filtros por usuario/módulo/fecha | 1) Usa el panel de filtros para seleccionar usuario, entidad y rango de fechas. 2) Aplica y verifica que la tabla y el resumen superior se ajustan al criterio. |
| **CA-R09-3** · Exportación CSV | 1) Pulsa “Exportar CSV”. 2) Comprueba la descarga del archivo con los eventos filtrados y los metadatos del filtro. |

### HU-R10 · Configurar umbrales y severidad de alertas
Motor de políticas con simulación histórica y versionamiento.

| Criterio de aceptación | Cómo demostrarlo |
| --- | --- |
| **CA-R10-1** · Umbral + ventana + severidad | 1) En `/alertas`, ajusta la ventana en días, cambia el método (media/percentil) y la severidad por defecto. 2) Crea o edita una regla desde el formulario y guarda con “Aplicar Reglas”. |
| **CA-R10-2** · Simulación con datos históricos | 1) En “Simulación de alertas” presiona “Simular”. 2) Revisa las tarjetas resumen (ventana, total, severidades) y la tabla con lecturas históricas que disparan alertas. 3) Exporta el CSV para documentar el resultado. |
| **CA-R10-3** · Guardado versionado | 1) Pulsa “Guardar (versionar)”. 2) El historial agrega una entrada con fecha, usuario y configuración completa. 3) (Opcional) Usa “Crear alertas demo” para almacenar esa corrida en el log local. |

### HU-R11 · Notificaciones multicanal
Entrega de alertas por web/app y correo con control de reintentos.

| Criterio de aceptación | Cómo demostrarlo |
| --- | --- |
| **CA-R11-1** · Plantillas configurables | 1) En la sección “Notificaciones multicanal”, edita asunto y cuerpo de correo; habilita los canales Web/App y Email. 2) Guarda la plantilla y observa el mensaje de confirmación. |
| **CA-R11-2** · Registro de lectura/cierre | 1) Ejecuta “Probar envío”. 2) La bandeja web muestra la alerta; marca como leído y luego ciérrala para evidenciar el seguimiento del usuario. |
| **CA-R11-3** · Reintentos automáticos | 1) En la cola de correos (Outbox), identifica un envío en estado `queued`. 2) Usa “Reintentar” para incrementar el contador de intentos y observa cómo cambia a `sent` tras los reintentos del worker simulado. |

### HU-R12 · Predicción de desvío con IA
Modelo básico con métricas visibles y explicación de variables.

| Criterio de aceptación | Cómo demostrarlo |
| --- | --- |
| **CA-R12-1** · Modelo entrenado con 12 meses | 1) Abre `/ia-prediccion`. 2) Las tarjetas superiores indican que el set de entrenamiento contiene 12 meses y muestran MAE/MAPE. |
| **CA-R12-2** · Métricas y umbral mínimo | 1) Observa el chip “Umbral MAPE permitido” y la tarjeta de métricas; confirma que la métrica cumple o alerta según el umbral declarado. |
| **CA-R12-3** · Variables influyentes | 1) Ajusta los sliders de intensidad y factor de emisión para ver cómo cambia la predicción. 2) Recorre la lista “Explicación simple de las variables” con la importancia relativa y coeficientes. |

### HU-R13 · Comparar escenarios de mitigación
Evaluación financiera y ambiental de múltiples alternativas.

| Criterio de aceptación | Cómo demostrarlo |
| --- | --- |
| **CA-R13-1** · Crear al menos 3 escenarios | 1) Desde `/escenarios-mitigacion`, pulsa “Agregar escenario” hasta contar con tres o más. 2) Completa nombre, división, horizonte y reducción esperada; los indicadores se recalculan al guardar. |
| **CA-R13-2** · Tabla comparativa ROI/payback | 1) Agrega o modifica supuestos (por ejemplo, costos o ahorros). 2) Observa cómo cambian ROI, payback y tCO₂e evitados en las tarjetas laterales y en la tabla comparativa. |
| **CA-R13-3** · Descarga de resultados y supuestos | 1) Pulsa “Descargar anexo (CSV)”. 2) Abre el archivo y confirma que incluye resumen financiero, reducciones y supuestos activos por escenario. |

### HU-R14 · Portal ciudadano accesible (AA)
Vista pública con filtros simples y lenguaje claro.

| Criterio de aceptación | Cómo demostrarlo |
| --- | --- |
| **CA-R14-1** · Accesibilidad AA (contraste/teclado/alt) | 1) Sin iniciar sesión, abre `/comunidades`. 2) Navega con teclado hasta “Explorar iniciativas” y comprueba el foco visible. 3) Revisa las tarjetas con alto contraste y textos alternativos en imágenes. |
| **CA-R14-2** · Filtros por región y periodo | 1) Usa los selectores de región y periodo en la vista pública. 2) El listado de iniciativas y los KPIs se actualizan inmediatamente según los filtros. |
| **CA-R14-3** · Glosario en lenguaje claro | 1) Haz clic en “Ir al glosario”. 2) Verifica que cada término es navegable por teclado y contiene definiciones simples. 3) Utiliza el enlace superior para volver al portal público. |

### HU-R15 · Monitoreo en tiempo real de activos críticos
Dashboard operativo con superposición de eventos y auto-refresh.

| Criterio de aceptación | Cómo demostrarlo |
| --- | --- |
| **CA-R15-1** · Dashboard con último hora | 1) Inicia sesión como `pedro.gomez` y visita `/operario/activos`. 2) Selecciona un activo para abrir la vista tiempo real; el gráfico muestra 60 minutos de emisiones simuladas. |
| **CA-R15-2** · Eventos superpuestos | 1) Observa las líneas verticales en el gráfico (Inicio de ciclo, Mantención, Cambio de carga). 2) Revisa la tabla de eventos recientes para validar la correlación con los marcadores. |
| **CA-R15-3** · Auto-refresh cada 60 s | 1) Permanece en la vista más de un minuto. 2) El indicador “Actualizado” y la leyenda de conectividad se renuevan automáticamente; también puedes forzar un refresh manual con el botón embebido. |

### Evidencia automatizada
- `FormularioMeta.test.jsx` y `PanelMetas.test.jsx` validan creación, filtros y exportación de metas (HU-R01).
- `progreso.test.jsx` cubre cálculos y renderización del comparador real vs. meta (HU-R02).
- `servicioExportes.test.js` asegura la construcción de PDF/CSV con firma simulada (HU-R03).
- `servicioSensores.test.js` verifica alta, simulación y bitácoras de sensores (HU-R04, HU-R06).
- `servicioAnomalias.test.js` respalda reglas, aprobaciones y exportes de anomalías (HU-R05).
- `servicioCadena.test.js` y `servicioVerificacion.test.js` prueban cadena de bloques y verificación (HU-R07, HU-R08).
- `servicioAuditoria.test.js` garantiza filtros y exportación del panel de auditoría (HU-R09).
- `servicioAlertas.test.js` y `alertasService.test.js` ejercitan configuración, simulación y versionamiento de alertas/notificaciones (HU-R10, HU-R11).
- `servicioPrediccionIA.test.js` valida métricas y escenarios del modelo IA (HU-R12).
- `servicioEscenariosMitigacion.test.js` comprueba cálculos financieros/ambientales (HU-R13).
- `servicioComunidades.test.js` cubre filtros y persistencia del portal ciudadano (HU-R14).

## Módulos demostrativos adicionales
- **Sensores** (`/sensores`): alta y simulación de lecturas para monitoreo continuo del prototipo.
- **Anomalías** (`/anomalias`): revisión, validación y ajuste de reglas totalmente en el navegador.
- **Cadena de registros** (`/cadena-registros`) y **Verificación** (`/verificacion`): flujo de bloques, firmas y control de integridad demostrativo.
- **Progreso** (`/progreso`): comparación mensual real vs meta con datos generados en el cliente.

Estos módulos comparten los datos simulados y se almacenan en `localStorage`.

## Comandos útiles
```bash
npm run build    # Generar build estático
npm run preview  # Servir el build generado
npm test         # Ejecutar suites de pruebas
```

---
Proyecto académico elaborado para fines educativos y de demostración de buenas prácticas front-end.
