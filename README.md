# Sistema de Gestión de Metas de Reducción - Proyecto Universitario

**⚠️ IMPORTANTE: Este es un proyecto académico universitario basado en supuestos y casos de estudio. No es un sistema oficial de Codelco ni tiene relación comercial con la empresa.**

## 📋 Desc### Gestión de Divisiones y Procesos (Datos Ficticios)

Los catálogos están centralizados en `src/services/servicioMetas.js` con datos simulados:

```javascript
// Ejemplo académico - datos ficticios
export const DIVISIONES = [
  ...existentes,
  { id: 'nueva-division', nombre: 'Nueva División' }
];
```

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

## 🔧 Configuración para Proyectos Similares

### Hipotética Migración a API Real

Este proyecto demuestra cómo se podría conectar con una API de producción. Para proyectos reales, se modificaría el archivo `src/services/servicioMetas.js`:

```javascript
// Ejemplo hipotético de integración con API real
export async function listarMetas() {
  const response = await fetch('/api/metas', {
    headers: {
      'Authorization': `Bearer ${getAuthToken()}`,
      'Content-Type': 'application/json'
    }
  });
  return response.json();
}
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

## 🤝 Contribución y Desarrollo Académico

### Contexto Universitario

Este proyecto fue desarrollado como ejercicio académico para demostrar:
- Arquitectura de aplicaciones web modernas
- Implementación de validaciones front-end
- Diseño de interfaces accesibles
- Integración de librerías de gráficos
- Buenas prácticas en React y JavaScript

### Guías de Desarrollo

1. **Estructura de commits**
   ```
   feat: agregar nueva funcionalidad
   fix: corregir bug
   docs: actualizar documentación
   style: cambios de formato
   test: agregar tests
   ```

2. **Estándares de código**
   - Usar ESLint y Prettier
   - Seguir convenciones de nomenclatura
   - Agregar comentarios JSDoc para funciones públicas

## 📝 Changelog

### v1.0.0 (Prototipo Inicial)
- ✅ Formulario de creación de metas con validaciones
- ✅ Panel de visualización con filtros
- ✅ Exportación a CSV
- ✅ Gráficos estadísticos
- ✅ Diseño responsivo y accesible
- ✅ Tests automatizados básicos

### Roadmap Académico
- 🎓 Integración con APIs ficticias para demostrar arquitectura
- 🎓 Implementación de autenticación simulada
- 🎓 Ejemplos de notificaciones en tiempo real
- 🎓 Templates de reportes avanzados
- 🎓 Caso de estudio para aplicación móvil

## 📞 Información del Proyecto

**Autor**: Estudiante Universitario  
**Contexto**: Proyecto Académico de Ingeniería de Software  
**Propósito**: Demostración de tecnologías web modernas  
**Disclaimer**: Este proyecto utiliza Codelco como caso de estudio académico. No tiene vinculación oficial con la empresa.

Para consultas académicas:
- **Documentación técnica**: Ver código comentado en `/src`
- **Tests**: Revisar `/src/__tests__` para ejemplos de uso
- **Configuración**: Consultar archivos de configuración en raíz del proyecto

## 📄 Licencia

Este es un proyecto académico universitario bajo licencia MIT para fines educativos.

**⚠️ Importante**: 
- Los datos de Codelco utilizados son públicos o simulados
- No hay acceso a información confidencial o sistemas reales
- El proyecto no representa opiniones oficiales de Codelco
- Es un ejercicio puramente académico y educativo

---

**Proyecto Universitario** - Sistema de Gestión de Metas de Reducción v1.0  
*Caso de estudio académico para demostrar desarrollo web moderno*
