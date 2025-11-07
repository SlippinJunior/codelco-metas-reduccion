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
### HU-R01 · Registrar y monitorear metas corporativas
Gestión integral de metas para analistas de sustentabilidad.

| Criterio de aceptación | Cómo demostrarlo |
| --- | --- |
| **CA-R01-1** · Esquema completo de meta | 1) Ve a `/crear-meta`. 2) Completa división, proceso, indicador (prefijado), línea base (año 2015-2024 y valor), fecha objetivo futura y descripción. 3) Envía y confirma que la meta aparece en el panel. |
| **CA-R01-2** · Validaciones front-end | 1) En `/crear-meta`, intenta enviar el formulario vacío. 2) Observa los mensajes de error por campo. 3) Corrige cada valor y comprueba que el error desaparece, incluida fecha futura y números positivos. |
| **CA-R01-3** · Vista corporativa y filtros | 1) Navega a `/dashboard`. 2) Revisa metas agrupadas por división y estadísticas globales. 3) Usa filtros de división y año objetivo, exporta el CSV y verifica que respeta el filtro aplicado. |

### HU-R02 · Analizar progreso real vs meta
Seguimiento mensual consolidado para líderes de sustentabilidad.

| Criterio de aceptación | Cómo demostrarlo |
| --- | --- |
| **CA-R02-1** · Comparativa filtrada | 1) Abre `/progreso`. 2) Selecciona una división y proceso con los filtros superiores. 3) Verifica que el gráfico y los conteos "Metas en vista" se recalculan al instante. |
| **CA-R02-2** · Cambio de periodo | 1) En el selector lateral, cambia de "Año" a "Trimestre". 2) Elige trimestre 2. 3) Confirma que el gráfico se regenera y el resumen indica el nuevo periodo. |
| **CA-R02-3** · Indicadores y alertas | 1) Observa las tarjetas inferiores (meses analizados, brecha promedio). 2) Activa filtros amplios hasta que la generación tarde más de 2 s. 3) Comprueba que aparece la advertencia de rendimiento y el tiempo se registra en la esquina superior del gráfico. |

### HU-R03 · Exportar reportes comparativos con firma
Generación de reportes ejecutivos con evidencia de trazabilidad.

| Criterio de aceptación | Cómo demostrarlo |
| --- | --- |
| **CA-R03-1** · Configuración segmentada | 1) Visita `/exportar-reportes`. 2) Marca dos divisiones y un proceso específico. 3) Ajusta periodo a semestre 1 del año más reciente y valida el resumen rápido. |
| **CA-R03-2** · Previsualización y portada | 1) Ingresa un nombre en "Firmante". 2) Pulsa "Ver previsualización" y revisa portada e índice sugerido. 3) Cierra la modal. |
| **CA-R03-3** · Evidencia descargable | 1) Pulsa "Generar PDF" y espera la descarga. 2) Repite con "Generar CSV". 3) Observa en la tarjeta lateral el hash y firma simulada registrados. |

### HU-R04 · Integrar sensores operativos al piloto
Alta, monitoreo y simulación de dispositivos de campo.

| Criterio de aceptación | Cómo demostrarlo |
| --- | --- |
| **CA-R04-1** · Alta guiada de sensor | 1) Abre `/sensores`. 2) Completa el formulario con un identificador único. 3) Guarda y confirma el mensaje de éxito más la aparición del sensor en la lista. |
| **CA-R04-2** · Visualizar telemetría | 1) Selecciona "Ver detalle" en el sensor recién creado. 2) Revisa las últimas lecturas, el estado y los metadatos. 3) Cierra el panel con "Volver al listado". |
| **CA-R04-3** · Simulación de paquetes | 1) En la tabla de sensores, pulsa "Simular paquete". 2) Reabre el detalle y verifica la recepción con acuse y actualización de fecha. 3) Observa la notificación temporal en la parte superior. |

### HU-R05 · Detectar lecturas anómalas
Filtrado y revisión detallada para equipos de datos.

| Criterio de aceptación | Cómo demostrarlo |
| --- | --- |
| **CA-R05-1** · Filtros especializados | 1) Visita `/anomalias`. 2) Aplica un filtro por tipo de anomalía y rango de fecha. 3) Verifica que la tabla se actualiza y el resumen se ajusta. |
| **CA-R05-2** · Contexto de cada lectura | 1) Abre una lectura pendiente con el botón "Revisar". 2) Navega por el historial en la modal y valida que incluye scores y reglas disparadas. 3) Cierra la ventana. |
| **CA-R05-3** · Evidencia externa | 1) Pulsa "Exportar CSV". 2) Confirma la descarga y apertura del archivo con las columnas solicitadas (estado, motivos, participación). |

### HU-R06 · Validar y gobernar anomalías
Control operativo para aprobar, rechazar y ajustar reglas.

| Criterio de aceptación | Cómo demostrarlo |
| --- | --- |
| **CA-R06-1** · Validación en lote | 1) Marca varias lecturas en la tabla de `/anomalias`. 2) Pulsa "Aprobar lote" y espera el mensaje de éxito. 3) Observa cómo cambia el contador de pendientes. |
| **CA-R06-2** · Rechazo con trazabilidad | 1) Selecciona lecturas distintas, escribe un comentario en el campo lateral y presiona "Rechazar lote". 2) Abre una de las lecturas para comprobar el historial con el comentario registrado. 3) Verifica que ya no participa en cálculos. |
| **CA-R06-3** · Ajuste de reglas | 1) En "Reglas por indicador", modifica el umbral de una variable. 2) Guarda con "Aplicar Reglas". 3) Observa el mensaje de confirmación y cómo se recalculan los totales en el resumen superior. |

### HU-R07 · Auditar eventos críticos
Acceso controlado al libro de auditoría.

| Criterio de aceptación | Cómo demostrarlo |
| --- | --- |
| **CA-R07-1** · Control de acceso simulado | 1) Ingresa a `/login`, deja el usuario por defecto y selecciona rol `auditor`. 2) Tras iniciar sesión, navega a `/auditoria`. 3) Comprueba que usuarios sin rol correcto redireccionan al dashboard. |
| **CA-R07-2** · Búsqueda avanzada | 1) Usa el panel de filtros (entidad "metas", acción "crear"). 2) Aplica y revisa la tabla paginada. 3) Cambia de página con los botones inferiores. |
| **CA-R07-3** · Exportación oficial | 1) Haz clic en "Exportar CSV". 2) Valida que se descargue el archivo con los registros filtrados y que se mantenga el resumen lateral actualizado. |

### HU-R08 · Consola de cadena de registros
Simulación de blockchain corporativa para evidencias.

| Criterio de aceptación | Cómo demostrarlo |
| --- | --- |
| **CA-R08-1** · Inicialización automatizada | 1) Visita `/cadena-registros`. 2) Espera a que carguen los bloques demo y revisa el resumen superior (bloques totales, huella global). |
| **CA-R08-2** · Registro de nuevos bloques | 1) Completa el formulario lateral con un identificador y descripción. 2) Envía y confirma el mensaje "Bloque creado" más la descarga automática del JSON. 3) Selecciona el bloque en la lista para revisar la huella calculada. |
| **CA-R08-3** · Exportaciones masivas | 1) Pulsa "Exportar cadena y evidencia". 2) Corrobora que se generen CSV, PDF y archivo de firma simulada en tus descargas. |

### HU-R09 · Verificar integridad criptográfica
Herramientas forenses para detectar manipulaciones.

| Criterio de aceptación | Cómo demostrarlo |
| --- | --- |
| **CA-R09-1** · Verificación estándar | 1) Desde `/verificacion`, selecciona un registro en el buscador y presiona "Verificar". 2) Observa el panel de resultados con el hash y el tiempo de ejecución. |
| **CA-R09-2** · Simulación de manipulación | 1) Con el mismo registro, haz clic en "Simular manipulación". 2) Abre la pestaña de divergencias y revisa los campos modificados. 3) Comprueba la alerta amarilla de tiempo si activas el retardo simulado. |
| **CA-R09-3** · Informe descargable | 1) Tras una verificación (válida o manipulada), pulsa "Descargar JSON" o "Descargar PDF". 2) Confirma que el archivo incluye el resumen, divergencias y huellas. |

### HU-R10 · Monitorear activos en tiempo real
Vista operativa para equipos de planta.

| Criterio de aceptación | Cómo demostrarlo |
| --- | --- |
| **CA-R10-1** · Catálogo de activos | 1) Opcional: inicia sesión con rol `operario`. 2) Ve a `/operario/activos`. 3) Revisa el grid de activos con división, proceso y etiqueta DEMO. |
| **CA-R10-2** · Streaming simulado | 1) Desde la vista anterior, abre cualquier activo (botón "Ver tiempo real"). 2) Valida que el gráfico se cargue con lecturas de la última hora y un umbral rojo. |
| **CA-R10-3** · Eventos operacionales | 1) Observa las referencias verticales (inicio/cambio/mantención). 2) Verifica los KPIs laterales y la tabla de eventos recientes para acreditar la narrativa operativa. |

### HU-R11 · Configurar alertas multicanal
Orquestación de políticas, reglas y notificaciones.

| Criterio de aceptación | Cómo demostrarlo |
| --- | --- |
| **CA-R11-1** · Política versionada | 1) Abre `/alertas`. 2) Ajusta algún parámetro de la política y pulsa "Guardar (versionar)". 3) Comprueba que la sección "Historial de configuraciones" agrega una nueva versión. |
| **CA-R11-2** · Simulación y creación de alertas | 1) En "Simulación de alertas", presiona "Simular". 2) Usa "Crear alertas demo" para registrar los resultados y revisa que aparezcan en el historial inferior. |
| **CA-R11-3** · Notificación multicanal | 1) Ajusta la plantilla de correo y habilita canales Web/Email. 2) Haz clic en "Probar envío". 3) Verifica que la bandeja web muestre la notificación y que la cola de correos registre el envío. |

### HU-R12 · Predicción de desviaciones con IA
Modelo explicable para proyecciones de meta 2030.

| Criterio de aceptación | Cómo demostrarlo |
| --- | --- |
| **CA-R12-1** · Métricas expuestas | 1) Visita `/ia-prediccion`. 2) Revisa las tarjetas con MAE, MAPE y número de observaciones. 3) Verifica que el chip superior indique si el MAPE está bajo el umbral. |
| **CA-R12-2** · Escenarios interactivos | 1) Modifica la intensidad energética y el factor de emisión. 2) Confirma que la predicción (en puntos porcentuales) cambie y el semáforo de riesgo actualice el mensaje. |
| **CA-R12-3** · Explicabilidad y dataset | 1) Explora la lista de variables y su importancia relativa. 2) Recorre la tabla de datos de entrenamiento para validar los insumos del modelo. |

### HU-R13 · Evaluar escenarios de mitigación
Comparador financiero-ambiental para priorizar inversiones.

| Criterio de aceptación | Cómo demostrarlo |
| --- | --- |
| **CA-R13-1** · Gestión de cartera | 1) Entra a `/escenarios-mitigacion`. 2) Crea un nuevo escenario con "Agregar escenario" y asígnale un nombre. 3) Comprueba que aparezca con indicadores calculados. |
| **CA-R13-2** · Supuestos y duplicación | 1) Añade un supuesto personalizado y guárdalo. 2) Usa "Duplicar" para generar una variante. 3) Observa cómo cambian ROI, payback y costo de abatimiento en la tarjeta lateral. |
| **CA-R13-3** · Exportación ejecutiva | 1) Presiona "Descargar anexo (CSV)". 2) Abre el archivo para validar los campos financieros y de reducción usados en la tabla comparativa. |

### HU-R14 · Transparencia para comunidades
Portal ciudadano con doble vista (pública e interna).

| Criterio de aceptación | Cómo demostrarlo |
| --- | --- |
| **CA-R14-1** · Acceso inclusivo | 1) Dirígete a `/comunidades`. 2) Navega con teclado hacia el botón "Explorar iniciativas" y accede a los filtros. 3) Ajusta región/periodo y revisa los KPIs en alto contraste. |
| **CA-R14-2** · Gestión interna segura | 1) Si deseas pruebas internas, inicia sesión con rol `control-interno`. 2) Vuelve a `/comunidades` y cambia a la pestaña "Panel interno". 3) Registra una iniciativa manual y comprueba que se etiqueta como "Interna" en la tabla. |
| **CA-R14-3** · Persistencia local responsable | 1) Recarga la página. 2) Verifica que la iniciativa interna se mantenga gracias a `localStorage`. 3) Elimínala desde las acciones y confirma que desaparece del listado. |

### HU-R15 · Accesibilidad y lenguaje claro
Glosario y utilidades para cumplir compromisos de transparencia.

| Criterio de aceptación | Cómo demostrarlo |
| --- | --- |
| **CA-R15-1** · Herramientas de accesibilidad | 1) En cualquier vista, activa el botón flotante de accesibilidad (parte inferior derecha). 2) Prueba aumentar texto y subrayar enlaces. 3) Observa que el ajuste se aplica globalmente. |
| **CA-R15-2** · Glosario ciudadano | 1) Ingresa a `/comunidades/glosario`. 2) Revisa que el contenido esté en lenguaje claro y que cada término sea navegable con teclado. 3) Usa el enlace superior para volver al portal ciudadano. |
| **CA-R15-3** · Navegación inclusiva | 1) Desde cualquier ruta, utiliza el enlace oculto "Saltar al contenido principal" con teclado (Shift+Tab seguido de Enter). 2) Valida que el foco se traslade a la sección principal de la vista actual. |

### Evidencia automatizada
- `npm test` ejecuta las suites de Jest/Testing Library que respaldan los criterios clave: creación y validación de metas (`FormularioMeta.test.jsx`, `PanelMetas.test.jsx`), autenticación simulada (`login.test.jsx`), comparativa de progreso (`progreso.test.jsx`), y eventos/auditoría (`servicioAuditoria.test.js`, `servicioMetas-audit.test.js`).

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
