# Usuarios y Permisos del Sistema

Este documento describe los usuarios predefinidos en el sistema de login simulado y sus permisos basados en las historias de usuario del README.

## Usuarios Disponibles

### 1. María Torres (`maria.torres`)
- **Rol:** `analista-sustentabilidad`
- **Historia de Usuario:** HU-R01 - Registrar y monitorear metas corporativas
- **Descripción:** Analista de Sustentabilidad
- **Permisos:**
  - Crear y editar metas (`/crear-meta`)
  - Consultar dashboard corporativo (`/dashboard`)
  - Acceder a reportes y exportaciones (`/exportar-reportes`)
  - Visualizar progreso de metas (`/progreso`)
  - Panel interno de comunidades (`/comunidades`)

### 2. Carlos Rojas (`carlos.rojas`)
- **Rol:** `lider-sustentabilidad`
- **Historia de Usuario:** HU-R02 - Analizar progreso real vs meta
- **Descripción:** Líder de Sustentabilidad
- **Permisos:**
  - Análisis de progreso y comparativas (`/progreso`)
  - Dashboard corporativo (`/dashboard`)
  - Exportación de reportes (`/exportar-reportes`)
  - Gestión de escenarios de mitigación (`/escenarios-mitigacion`)
  - Predicciones con IA (`/ia-prediccion`)
  - Panel interno de comunidades (`/comunidades`)

### 3. Ana Silva (`ana.silva`)
- **Rol:** `auditor`
- **Historia de Usuario:** HU-R07 - Auditar eventos críticos
- **Descripción:** Auditor
- **Permisos:**
  - **Acceso exclusivo a auditoría** (`/auditoria`)
  - Verificación de integridad (`/verificacion`)
  - Cadena de registros (blockchain) (`/cadena-registros`)
  - Panel interno de comunidades (`/comunidades`)

### 4. Pedro Gómez (`pedro.gomez`)
- **Rol:** `operario`
- **Historia de Usuario:** HU-R10 - Monitorear activos en tiempo real
- **Descripción:** Operario de Planta
- **Permisos:**
  - Monitoreo de activos en tiempo real (`/operario/activos`)
  - Detalle de activos individuales (`/operario/activo/:id`)
  - Gestión de sensores (`/sensores`)

### 5. Lucía Méndez (`lucia.mendez`)
- **Rol:** `control-interno`
- **Historia de Usuario:** HU-R14 - Transparencia para comunidades
- **Descripción:** Control Interno
- **Permisos:**
  - **Panel interno de comunidades** (`/comunidades` - pestaña interna)
  - Acceso a auditoría (`/auditoria`)
  - Verificación de integridad (`/verificacion`)
  - Todas las funcionalidades del sistema

### 6. Jorge Campos (`jorge.campos`)
- **Rol:** `equipo-datos`
- **Historia de Usuario:** HU-R05/R06 - Detección y validación de anomalías
- **Descripción:** Equipo de Datos
- **Permisos:**
  - Detección de lecturas anómalas (`/anomalias`)
  - Validación y gobernanza de anomalías
  - Gestión de sensores (`/sensores`)
  - Configuración de reglas de detección
  - Análisis de datos y reportes

### 7. Administrador (`admin`)
- **Rol:** `admin`
- **Descripción:** Administrador del Sistema
- **Permisos:**
  - **Acceso total a todas las funcionalidades**
  - Todas las rutas y operaciones disponibles
  - Gestión de usuarios (simulado)
  - Configuración del sistema

## Matriz de Permisos por Ruta

| Ruta | Analista | Líder | Auditor | Operario | Control Interno | Equipo Datos | Admin |
|------|----------|-------|---------|----------|-----------------|--------------|-------|
| `/dashboard` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `/crear-meta` | ✓ | ✓ | - | - | ✓ | - | ✓ |
| `/progreso` | ✓ | ✓ | - | - | ✓ | ✓ | ✓ |
| `/auditoria` | - | - | ✓ | - | ✓ | - | ✓ |
| `/sensores` | - | - | - | ✓ | ✓ | ✓ | ✓ |
| `/anomalias` | - | - | - | - | ✓ | ✓ | ✓ |
| `/cadena-registros` | - | - | ✓ | - | ✓ | - | ✓ |
| `/verificacion` | - | - | ✓ | - | ✓ | - | ✓ |
| `/exportar-reportes` | ✓ | ✓ | - | - | ✓ | ✓ | ✓ |
| `/alertas` | ✓ | ✓ | - | - | ✓ | ✓ | ✓ |
| `/operario/activos` | - | - | - | ✓ | - | - | ✓ |
| `/operario/activo/:id` | - | - | - | ✓ | - | - | ✓ |
| `/escenarios-mitigacion` | ✓ | ✓ | - | - | ✓ | - | ✓ |
| `/ia-prediccion` | ✓ | ✓ | - | - | ✓ | ✓ | ✓ |
| `/comunidades` (público) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `/comunidades` (interno) | ✓ | ✓ | ✓ | - | ✓ | - | ✓ |
| `/comunidades/glosario` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

## Implementación

### Almacenamiento del Usuario Actual

El usuario actual se almacena en `localStorage` con la siguiente estructura:

```javascript
{
  "usuario": "maria.torres",
  "nombre": "María Torres",
  "rol": "analista-sustentabilidad"
}
```

### Validación de Permisos en Componentes

Ejemplo de validación en `VistaAuditoria.jsx`:

```javascript
useEffect(() => {
  const cu = localStorage.getItem('currentUser');
  if (!cu) { nav('/'); return; }
  const { rol } = JSON.parse(cu);
  if (!['control-interno','auditor','admin'].includes(rol)) { 
    nav('/'); 
  }
}, [nav]);
```

### Cómo Cambiar de Usuario

1. Navega a `/login`
2. Selecciona el usuario deseado del menú desplegable
3. Haz clic en "Entrar"
4. Serás redirigido al dashboard con los permisos del usuario seleccionado

## Notas de Implementación

- Los permisos se validan en el cliente (frontend)
- Esta es una simulación académica sin backend real
- En un sistema de producción, la validación debe hacerse en el servidor
- El rol se valida en cada componente que requiere control de acceso
- No hay persistencia de sesión entre recargas del navegador (excepto localStorage)

## Testing

Los tests del componente Login verifican:
- Que todos los usuarios predefinidos aparezcan en el selector
- Que la información del usuario se almacene correctamente en localStorage
- Que la navegación funcione después del login

Ejecutar tests:
```bash
npm test -- --testPathPattern=login.test.jsx
```

---

**Proyecto académico elaborado para fines educativos.**
