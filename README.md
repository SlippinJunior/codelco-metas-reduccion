# Sistema de Gestión de Metas de Reducción - Proyecto Universitario

**⚠️ IMPORTANTE: Este es un proyecto académico universitario basado en supuestos y casos de estudio. No es un sistema oficial de Codelco ni tiene relación comercial con la empresa.**

## 📋 Desc### Gestión de Divisiones y Procesos (Datos Ficticios)

# Sistema de Metas de Reducción

**Proyecto universitario** - Prototipo web para gestión de metas de reducción de emisiones.

## 📋 Qué hace

- ✅ **Crear metas** con formulario validado
- ✅ **Ver dashboard** con gráficos y estadísticas  
- ✅ **Filtrar por división** y año objetivo
- ✅ **Exportar a CSV**
- ✅ **Diseño responsive** y accesible

> **Nota**: Proyecto académico con datos simulados, no es oficial de ninguna empresa.

## 🛠️ Tecnologías

- **React 18** + **Vite**
- **Tailwind CSS** para estilos
- **Recharts** para gráficos
- **React Router** para navegación

## 🚀 Instalación

### Requisitos
- Node.js 16+
- npm

### Pasos

```bash
# 1. Clonar el repositorio
git clone https://github.com/SlippinJunior/codelco-metas-reduccion.git
cd codelco-metas-reduccion

# 2. Instalar dependencias
npm install

# 3. Iniciar servidor de desarrollo
npm run dev

# 4. Abrir en navegador
# http://localhost:3000
```

## 📖 Cómo usar

### 1. Dashboard Principal
- Ve a `http://localhost:3000`
- Explora las **3 metas de ejemplo** ya creadas
- Revisa **gráficos** de estadísticas por división y proceso
- Usa **filtros** para ver metas específicas
- **Exporta** datos a CSV

### 2. Crear Nueva Meta
- Haz clic en el **botón "+"** (esquina inferior izquierda)
- O navega a `http://localhost:3000/crear-meta`
- Completa el formulario:
  - **División**: Selecciona de la lista
  - **Proceso**: molienda, chancado, fundición, etc.
  - **Línea base**: año y valor numérico
  - **Fecha objetivo**: debe ser futura
  - **Nombre y descripción**
- Haz clic en **"Crear Meta"**
- La nueva meta aparece automáticamente en el dashboard

### 3. Filtrar y Exportar
- En el dashboard, usa los **filtros**:
  - Por división (El Teniente, Radomiro Tomic, etc.)
  - Por año objetivo
- Haz clic en **"Exportar CSV"** para descargar datos
- El archivo incluye todas las metas visibles con el filtro actual

### 4. Exportar reportes comparativos (PDF + CSV con firma simulada)
1. Navega a la ruta `/exportar-reportes` desde el encabezado o el panel de metas.
2. Selecciona las **divisiones** (por ejemplo, *El Teniente* y *Ministro Hales*), el periodo (ej. *Año 2024*) y, si deseas, procesos específicos.
3. Marca la casilla **“Incluir historial de cambios”** para adjuntar eventos desde la auditoría del prototipo.
4. Ingresa el nombre del **firmante** (ejemplo sugerido: `Gerente Sustentabilidad - Demo`).
5. Opcional: pulsa **“Ver previsualización”** para revisar la portada y el índice del reporte antes de generar los archivos.
6. Presiona **“Generar PDF”** para descargar `reporte_comparativo.pdf`. Verifica en el documento:
    - Portada con logo, periodo, divisiones y firmante ingresado.
    - Índice de contenidos.
    - Secciones por división con resumen, tabla comparativa y gráfico meta vs real.
    - Sección de historial (si fue seleccionada).
    - Bloque final “Firma digital simulada — para demostración” con nombre, fecha y hash Base64.
7. Presiona **“Generar CSV”** para descargar `reporte_comparativo.csv`, el archivo opcional `historial_cambios.csv` y `firma_reporte.txt` con el detalle de la firma simulada (nombre, fecha y hash).
8. Para validar manualmente la firma, abre `firma_reporte.txt` y compara el hash con el que aparece en pantalla o en el bloque final del PDF.

> ℹ️ **Nota:** el proceso de firma es completamente demostrativo: el hash se calcula con `crypto.subtle.digest` en el navegador y no representa un firmado electrónico legal. Su propósito es evidenciar el flujo de generación y verificación dentro del prototipo.

### 5. Simulador de Sensores (MQTT / HTTP demo)
1. En el encabezado selecciona **“Sensores”** o visita `http://localhost:3000/sensores`.
2. Completa el formulario **“Dar de alta un nuevo sensor”** con los campos obligatorios. Ejemplo rápido:
   - Nombre: `Medidor M1`
   - Tipo: `Electricidad`
   - División: `Ministro Hales`
   - Protocolo: `MQTT`
   - Topic: `codelco/sensores/m1`
   - Frecuencia: `10`
3. Pulsa **“Dar de alta”** y verifica que el sensor aparezca en la lista.
4. Haz clic en **“Ver detalle”** y luego activa **“Simulación automática”**. El servicio interno generará paquetes cada *N* segundos y actualizará la última transmisión.
5. Utiliza **“Simular paquete ahora”** para disparar un paquete manual y revisa el acuse de recibo en el panel lateral.
6. Observa cómo la columna **“Última transmisión”** de la lista cambia a *“hace X minutos”* y cómo se almacenan los acuses en la tabla inferior.
7. Desde el detalle puedes **exportar el historial en CSV**, detener la simulación automática o volver a la vista general.
8. Para eliminar el sensor, pulsa **“Eliminar”** en la tarjeta y confirma. El prototipo registra el evento en la auditoría si el servicio está disponible.

> 💡 El demo inicial carga cuatro sensores reales de ejemplo desde `data/sensores-ejemplo.json`. Puedes restablecer el estado borrando la clave `codelco_sensores_demo` en el localStorage del navegador.

### 6. Módulo demonstrativo de anomalías y validación
1. Desde el encabezado abre **“Anomalías”** o visita `http://localhost:3000/anomalias`.
2. Revisa el panel de filtros superior para segmentar por sensor, división, tipo de lectura, estado o rango de fechas. Puedes activar *“Mostrar solo lecturas marcadas como anómalas”* para priorizar los casos críticos.
3. La tabla muestra las lecturas detectadas con sus motivos (Rango, Salto, Outlier), el score automático y el estado de validación. Selecciona una o varias filas usando los checkboxes.
4. Haz clic en **“Ver / Validar”** para abrir el detalle. El modal incluye:
   - Resumen de la lectura y score.
   - Motivos que originaron la anomalía.
   - Sparkline y lista de las últimas 10 lecturas cercanas para comparar contexto.
   - Formulario para aprobar o rechazar con comentario. Recuerda: el comentario es obligatorio para rechazar.
5. Al aprobar, la lectura vuelve a participar en los cálculos demostrativos. Al rechazar, `participaEnCalculos` queda en `false` y se registra un evento en el módulo de auditoría (si está habilitado).
6. Para validar en lote, selecciona varias lecturas, escribe un comentario (obligatorio al rechazar) y usa los botones **“Aprobar lote”** o **“Rechazar lote”**.
7. Puedes exportar las lecturas filtradas en CSV para evidencias. El archivo incluye columnas con los motivos identificados.
8. Ajusta los parámetros de detección en **“Parámetros de reglas (demo)”**: modifica rangos, umbral de saltos o z-score y pulsa **“Guardar configuración”**. Usa **“Restaurar valores por defecto”** si deseas volver a la configuración base.

> ℹ️ Todo el comportamiento estadístico y de auditoría es demostrativo y se ejecuta en el navegador utilizando `localStorage`. Los datos de ejemplo se definen en `data/lecturas-ejemplo.json`.

## 🧪 Validaciones Implementadas

El formulario valida:
- ✅ Campos obligatorios no vacíos
- ✅ Fecha objetivo debe ser futura  
- ✅ Valores numéricos positivos
- ✅ Año de línea base válido (2015-2024)
- ✅ Mensajes de error específicos por campo

## 📁 Estructura del Proyecto

```
src/
├── components/          # Componentes React
│   ├── FormularioMeta.jsx   # Formulario de creación
│   ├── PanelMetas.jsx       # Dashboard principal  
│   └── TarjetaMeta.jsx      # Tarjeta individual
├── pages/              # Páginas
│   ├── Dashboard.jsx       # Página principal
│   └── CrearMeta.jsx       # Página crear meta
├── services/           # Lógica de negocio  
│   └── servicioMetas.js    # Manejo de datos
└── utils/              # Utilidades
    └── helpers.js          # Funciones auxiliares

data/
└── metas-ejemplo.json  # 3 metas de ejemplo
```

## 🎯 Datos de Ejemplo

El sistema incluye 3 metas simuladas:
1. **El Teniente - Molienda**: Reducción 25% (15% progreso)
2. **Radomiro Tomic - Chancado**: Optimización energética (8% progreso)
3. **Ministro Hales - Fundición**: Reducción 40% (22% progreso)

## 🔧 Comandos Útiles

```bash
# Desarrollo
npm run dev          # Servidor desarrollo
npm run build        # Build para producción
npm run preview      # Preview del build

# Reset datos (si necesitas volver al estado inicial)
# Abre DevTools (F12) > Application > Local Storage
# Elimina la entrada 'codelco_metas_reduccion'
# Recarga la página
```

## 📝 Notas

- **Almacenamiento**: Los datos se guardan en LocalStorage del navegador
- **Datos ficticios**: Todas las divisiones y procesos son ejemplos académicos
- **Responsive**: Funciona en escritorio, tablet y móvil
- **Accesibilidad**: Compatible con lectores de pantalla y navegación por teclado

---

**Proyecto académico** - Demostración de desarrollo web moderno con React

**Importante**: Todas las divisiones y procesos mencionados son ejemplos académicos basados en información pública, no datos reales internos.o

Este es un prototipo académico desarrollado como parte de un proyecto universitario para demostrar el diseño e implementación de un sistema web moderno de gestión de metas de reducción de emisiones. Utiliza Codelco como caso de estudio hipotético, pero todos los datos son simulados y las funcionalidades son demostrativas.

### Contexto Académico
- **Propósito**: Proyecto universitario de Ingeniería de Software
- **Alcance**: Prototipo funcional con fines educativos
- **Datos**: Completamente simulados y ficticios
- **Tecnologías**: Demostración de stack moderno React + Tailwind

### Criterios de Aceptación Implementados (Académicos)

- **CA-R01-1**: Esquema completo de meta con división, proceso, indicador, línea base y fecha objetivo
- **CA-R01-2**: Validaciones front-end completas con mensajes de error específicos  
- **CA-R01-3**: Vista corporativa y filtrada por división con actualización en tiempo real

**Nota**: Estos criterios fueron definidos como parte del ejercicio académico para demostrar buenas prácticas en desarrollo de software.

## 🛠️ Tecnologías Utilizadas

### Frontend
- **React 18** - Framework principal con hooks y componentes funcionales
- **React Router DOM** - Navegación entre páginas
- **Tailwind CSS** - Framework de estilos utilitarios con tema personalizado
- **Recharts** - Gráficos interactivos para visualización de datos
- **date-fns** - Manipulación y formateo de fechas

### Desarrollo y Testing
- **Vite** - Herramienta de desarrollo y build
- **Jest** - Framework de testing
- **React Testing Library** - Testing de componentes React
- **ESLint + Prettier** - Linting y formateo de código

### Arquitectura
- **Componentes reutilizables** - Diseño modular escalable
- **Servicios separados** - Lógica de negocio independiente
- **Almacenamiento local** - Persistencia para demo académico
- **Diseño responsivo** - Compatible con escritorio y móvil

**Disclaimer**: Esta es una implementación académica con fines educativos. En un entorno real, se requeriría integración con sistemas corporativos, autenticación empresarial, y cumplimiento de normativas específicas.

## 🚀 Instalación y Configuración

### Prerrequisitos
- Node.js 16+ 
- npm o yarn
- Navegador moderno

### Pasos de Instalación

1. **Clonar el repositorio y navegar al directorio**
   ```bash
   cd /home/papic/Documents/USM/IdS/PrototipoProyecto
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno (opcional)**
   ```bash
   cp .env.example .env
   # Editar .env con configuraciones específicas si es necesario
   ```

4. **Iniciar servidor de desarrollo**
   ```bash
   npm run dev
   ```

5. **Abrir el navegador**
   ```
   http://localhost:3000
   ```

### Scripts Disponibles

```bash
# Desarrollo
npm run dev          # Inicia servidor de desarrollo
npm run build        # Construye para producción
npm run preview      # Previsualiza build de producción

# Testing
npm test             # Ejecuta tests una vez
npm run test:watch   # Ejecuta tests en modo watch

# Calidad de Código
npm run lint         # Verifica linting
npm run format       # Formatea código con Prettier
```

## 📂 Estructura del Proyecto

```
src/
├── components/           # Componentes reutilizables
│   ├── FormularioMeta.jsx   # Formulario de creación de metas
│   ├── PanelMetas.jsx       # Panel principal con lista y filtros
│   └── TarjetaMeta.jsx      # Tarjeta individual de meta
├── pages/               # Páginas principales
│   ├── Dashboard.jsx        # Página principal del dashboard
│   └── CrearMeta.jsx        # Página de creación de metas
├── services/            # Lógica de negocio y API
│   └── servicioMetas.js     # Servicio principal para metas
├── utils/               # Utilidades y helpers
│   └── helpers.js           # Funciones auxiliares
├── __tests__/           # Tests automatizados
│   ├── FormularioMeta.test.jsx
│   └── PanelMetas.test.jsx
├── App.jsx              # Componente raíz con enrutamiento
├── main.jsx             # Punto de entrada de la aplicación
└── index.css            # Estilos globales y tema Tailwind

data/
└── metas-ejemplo.json   # Datos de ejemplo pre-poblados

public/
├── index.html           # Template HTML principal
└── codelco-icon.svg     # Icono de la aplicación (opcional)
```

### Endpoints Sugeridos (Ejemplo Académico)

```
GET    /api/metas              # Listar todas las metas
POST   /api/metas              # Crear nueva meta
PUT    /api/metas/:id          # Actualizar meta existente
DELETE /api/metas/:id          # Eliminar meta
GET    /api/metas/stats        # Obtener estadísticas
GET    /api/divisiones         # Catálogo de divisiones
GET    /api/procesos           # Catálogo de procesos
```

**Nota**: Estos endpoints son ejemplos didácticos para demostrar diseño de API REST.

### Variables de Entorno (Ejemplo Académico)

Crear archivo `.env` para configuración en proyectos reales:

```env
# Ejemplo de configuración para proyectos similares
VITE_API_BASE_URL=https://api.empresa.com
VITE_API_VERSION=v1
VITE_ENABLE_ANALYTICS=true
VITE_ENVIRONMENT=production
```

**Nota**: Las URLs y configuraciones son ejemplos didácticos.

## 🧪 Testing y Validación

### Ejecutar Tests

```bash
# Tests completos
npm test

# Tests con cobertura
npm test -- --coverage

# Tests específicos
npm test -- FormularioMeta
```

### Validación Manual de Criterios de Aceptación

#### Prueba 1 (CA-R01-1): Esquema Completo de Meta
1. Ir a `/crear-meta`
2. Completar formulario:
   - División: "El Teniente"
   - Proceso: "Molienda" 
   - Indicador: "tCO₂e/ton Cu"
   - Línea base: año 2023, valor 2.8
   - Fecha objetivo: "31-12-2030"
   - Nombre: "Meta de Prueba"
3. Enviar formulario
4. **Resultado esperado**: Meta aparece en panel bajo "El Teniente"

#### Prueba 2 (CA-R01-2): Validaciones Front-end
1. Ir a `/crear-meta`
2. Intentar enviar formulario vacío
3. **Resultado esperado**: Mensajes de error específicos aparecen
4. Llenar campos gradualmente y verificar que errores desaparecen

#### Prueba 3 (CA-R01-3): Vista Corporativa y Filtrada
1. Ir a `/dashboard`
2. Verificar que aparecen metas de todas las divisiones
3. Usar filtro "División" para seleccionar "El Teniente"
4. **Resultado esperado**: Solo aparecen metas de El Teniente
5. Limpiar filtro y verificar que vuelven todas las metas

#### Prueba 4: Exportación CSV
1. En el dashboard, hacer clic en "Exportar CSV"
2. Abrir archivo descargado
3. **Resultado esperado**: CSV contiene columnas: división, proceso, indicador, línea base, fecha objetivo, nombre de meta

## 📊 Características de Accesibilidad

- **Navegación por teclado** completa
- **Lectores de pantalla** compatibles con aria-labels y roles
- **Contraste de colores** cumple WCAG 2.1 AA
- **Formularios accesibles** con validaciones en vivo
- **Mensajes de estado** con aria-live regions
- **Focus management** apropiado en modales y formularios

## 🎨 Personalización de Tema

El proyecto usa un tema personalizado de Tailwind inspirado en Codelco:

```javascript
// tailwind.config.js
colors: {
  'codelco': {
    primary: '#1e3a8a',    // Azul corporativo
    secondary: '#374151',   // Gris industrial  
    accent: '#ea580c',      // Naranja acento
    light: '#f8fafc',       // Gris muy claro
    dark: '#0f172a'         // Azul muy oscuro
  }
}
```

## 📈 Métricas y Monitoreo

### Datos de Ejemplo Incluidos
- 3 metas pre-pobladas
- 3 divisiones: El Teniente, Radomiro Tomic, Ministro Hales
- 5 procesos: Molienda, Chancado, Fundición, Flotación, Transporte
- Indicadores con progreso simulado

### Estadísticas Disponibles
- Total de metas por división
- Distribución por proceso
- Progreso promedio
- Metas activas vs completadas

## 🔄 Versionado y Catálogos

### Gestión de Divisiones y Procesos

Los catálogos están centralizados en `src/services/servicioMetas.js`:

```javascript
// Para agregar nueva división:
export const DIVISIONES = [
  ...existentes,
  { id: 'nueva-division', nombre: 'Nueva División' }
];

// Para agregar nuevo proceso:
export const PROCESOS = [
  ...existentes,
  { id: 'nuevo-proceso', nombre: 'Nuevo Proceso' }
];
```

En producción, estos vendrán de endpoints de API dedicados.

## 🐛 Solución de Problemas

### Problemas Comunes

1. **Error al cargar metas**
   - Verificar que localStorage esté habilitado
   - Revisar consola del navegador para errores

2. **Gráficos no se muestran**
   - Verificar que Recharts esté instalado correctamente
   - Comprobar que los datos tienen el formato esperado

3. **Estilos no se aplican**
   - Ejecutar `npm run build` para regenerar CSS
   - Verificar que Tailwind está configurado correctamente

### Logs y Debugging

```javascript
// Habilitar logs detallados en desarrollo
localStorage.setItem('debug', 'codelco:*');

// Ver datos del localStorage
console.log(localStorage.getItem('codelco_metas_reduccion'));
```


## 📝 Changelog

### v1.0.0 (Prototipo Inicial Sprint 1)
- ✅ Formulario de creación de metas con validaciones
- ✅ Panel de visualización con filtros
- ✅ Exportación a CSV
- ✅ Gráficos estadísticos
- ✅ Diseño responsivo y accesible
- ✅ Tests automatizados básicos

## 🔍 Nueva vista: Progreso (Real vs Meta)

Se agregó un módulo demostrativo accesible en la ruta `/progreso` que muestra el progreso real frente a la meta por mes.

Cómo probar:

1. Inicia la aplicación en desarrollo:

```bash
npm install
npm run dev
```

2. Abre en el navegador `http://localhost:3000/progreso`

3. Selecciona División, Proceso y Periodo (Año/Semestre/Trimestre). El gráfico mostrará dos series: "Meta" (azul) y "Real" (naranja).

4. Bajo el gráfico verás un resumen con porcentaje de cumplimiento y el tiempo de render inicial (ms).

Pruebas de rendimiento (simuladas):

- El módulo mide el tiempo desde la generación de datos hasta que el gráfico está montado usando `performance.now()`.
- Si el tiempo total supera 2000 ms, aparece un banner de advertencia y se registra el tiempo en la consola.

Notas de integración:

- `src/services/servicioDatosSimulados.js` genera lecturas mensuales simuladas. Para conectar con datos reales, reemplazar por una función `fetchDatosReales(apiConfig)` exportada desde el mismo archivo o implementar un adaptador que llame a la API corporativa.
- La función principal a reemplazar es `generarDatosReales(metas, periodo)`.

Recomendaciones para producción:

- Agregar paginación/agregación en servidor si los volúmenes crecen (evitar enviar 1000s de puntos al cliente).
- Cachear resultados por periodo/división/proceso.
- Precalcular agregados en backend cuando sea posible.
