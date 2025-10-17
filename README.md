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

### Evidencia automatizada
- `npm test` ejecuta las suites unitarias que cubren los criterios anteriores (`FormularioMeta.test.jsx` y `PanelMetas.test.jsx`).

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
