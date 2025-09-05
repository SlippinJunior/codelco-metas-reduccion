# Guía de Demostración - Sistema de Metas de Reducción Codelco

## 🎯 Ejemplo de Uso Manual: "Crear Meta de Prueba"

Esta guía te permitirá probar todas las funcionalidades del prototipo siguiendo un flujo completo de trabajo.

### Paso 1: Acceder al Sistema

1. **Abrir el navegador** y navegar a `http://localhost:3000`
2. **Verificar que carga correctamente** el dashboard con:
   - Header corporativo de Codelco
   - Panel de estadísticas (debe mostrar 3 metas iniciales)
   - Gráficos de barras y circular
   - Lista de metas agrupadas por división

### Paso 2: Explorar Metas Existentes

El sistema viene con 3 metas de ejemplo pre-pobladas:

1. **El Teniente - Molienda**: Meta de reducción del 25% (15% progreso)
2. **Radomiro Tomic - Chancado**: Optimización energética (8% progreso)  
3. **Ministro Hales - Fundición**: Reducción del 40% (22% progreso)

**Acciones a probar:**
- ✅ Verificar que las metas se muestran agrupadas por división
- ✅ Expandir detalles de descripción en las tarjetas
- ✅ Verificar barras de progreso y colores de estado
- ✅ Observar cálculo automático de días restantes

### Paso 3: Usar Filtros (CA-R01-3)

**Filtrar por División:**
1. Usar el desplegable "Filtrar por División"
2. Seleccionar "El Teniente"
3. **Resultado esperado**: Solo aparece la meta de molienda
4. Verificar que el contador se actualiza a "(1 meta)"

**Filtrar por Año:**
1. Usar el desplegable "Filtrar por Año Objetivo"
2. Seleccionar "2030"
3. **Resultado esperado**: Solo aparecen metas con fecha objetivo en 2030

**Limpiar filtros:**
1. Hacer clic en "Limpiar Filtros"
2. **Resultado esperado**: Vuelven a aparecer todas las metas

### Paso 4: Crear Nueva Meta (CA-R01-1 y CA-R01-2)

1. **Hacer clic en el botón flotante "+"** (esquina inferior izquierda)
   - Alternativamente: navegar directamente a `/crear-meta`

2. **Probar validaciones (CA-R01-2):**
   - Intentar enviar formulario vacío
   - **Resultado esperado**: Aparecen mensajes de error específicos:
     - "El nombre debe tener al menos 3 caracteres"
     - "Debe seleccionar una división"
     - "Debe seleccionar un proceso"
     - "El valor de línea base debe ser mayor a 0"

3. **Completar formulario correctamente (CA-R01-1):**
   ```
   Nombre de la Meta: "Reducción de emisiones en transporte"
   División: "El Teniente"
   Proceso: "Transporte"
   Indicador: "tCO₂e/ton Cu" (ya viene seleccionado)
   Año Línea Base: 2023
   Valor Línea Base: 3.2
   Fecha Objetivo: 31-12-2030
   Descripción: "Meta piloto para reducir emisiones del transporte de minerales mediante optimización de rutas y renovación de flota"
   ```

4. **Enviar formulario:**
   - Hacer clic en "Crear Meta"
   - **Resultado esperado**: 
     - Mensaje de éxito verde
     - Redireccionamiento automático al dashboard en 3 segundos
     - Nueva meta aparece en la sección "El Teniente"

### Paso 5: Verificar Meta Creada (CA-R01-3)

1. **En el dashboard, verificar:**
   - La nueva meta aparece bajo "El Teniente"
   - El contador de estadísticas se actualiza a "4 Total Metas"
   - Los gráficos se actualizan mostrando la nueva distribución

2. **Probar filtro por división:**
   - Filtrar por "El Teniente"
   - **Resultado esperado**: Aparecen 2 metas (la original + la nueva)

### Paso 6: Exportar Datos

1. **En el dashboard, hacer clic en "Exportar CSV"**
2. **Resultado esperado**: 
   - Se descarga archivo `metas-reduccion-codelco-YYYY-MM-DD.csv`
   - Mensaje de confirmación verde

3. **Abrir archivo CSV descargado:**
   - Verificar columnas: ID, Nombre de Meta, División, Proceso, Indicador, Línea Base (Año), Línea Base (Valor), Fecha Objetivo, Descripción, Progreso (%), Valor Actual, Estado, Fecha Creación
   - Verificar que incluye las 4 metas (3 originales + 1 nueva)

### Paso 7: Probar Accesibilidad

1. **Navegación por teclado:**
   - Usar Tab para navegar entre campos del formulario
   - Verificar que el foco es visible
   - Probar envío con Enter

2. **Lectores de pantalla:**
   - Verificar que los campos tienen etiquetas apropiadas
   - Comprobar mensajes de error con aria-describedby
   - Verificar roles y aria-labels en gráficos

3. **Contraste:**
   - Verificar que todos los textos son legibles
   - Probar en modo de alto contraste del navegador

### Paso 8: Probar Responsividad

1. **Vista móvil:**
   - Redimensionar navegador a 375px de ancho
   - Verificar que formulario se adapta correctamente
   - Comprobar que gráficos son legibles

2. **Vista tablet:**
   - Probar en 768px de ancho
   - Verificar que las tarjetas se organizan en grid apropiado

### 🧪 Validación de Criterios de Aceptación

#### ✅ CA-R01-1: Esquema Completo de Meta
- [x] División está presente y es obligatoria
- [x] Proceso está presente y es obligatorio  
- [x] Indicador está presente con valor por defecto
- [x] Línea base incluye año y valor
- [x] Fecha objetivo es obligatoria y debe ser futura

#### ✅ CA-R01-2: Validaciones Front-end
- [x] Campos vacíos muestran errores específicos
- [x] Fecha objetivo debe ser futura
- [x] Valores numéricos deben ser positivos
- [x] Año de línea base en rango válido (2015-2024)
- [x] Mensajes de error son accesibles (aria-describedby)

#### ✅ CA-R01-3: Vista Corporativa y Filtrada
- [x] Vista corporativa muestra todas las metas agrupadas por división
- [x] Filtro por división funciona correctamente
- [x] Meta nueva aparece inmediatamente en ambas vistas
- [x] Contadores se actualizan en tiempo real

### 🚨 Solución de Problemas

**Si el formulario no se envía:**
- Verificar que todos los campos obligatorios están completos
- Revisar consola del navegador para errores JavaScript
- Comprobar que la fecha objetivo es futura

**Si las metas no aparecen:**
- Verificar que localStorage está habilitado en el navegador
- Limpiar caché del navegador (F5 o Ctrl+Shift+R)
- Revisar datos en DevTools > Application > Local Storage

**Si la exportación CSV falla:**
- Verificar que el navegador permite descargas
- Comprobar que hay metas para exportar
- Intentar desde modo incógnito

### 📊 Datos de Prueba Adicionales

Para probar más escenarios, puedes crear estas metas adicionales:

```
Meta 2:
Nombre: "Eficiencia energética en flotación"
División: "Chuquicamata"  
Proceso: "Flotación"
Línea Base: 2022, 4.5 tCO₂e/ton Cu
Fecha Objetivo: 2028-06-30

Meta 3:
Nombre: "Modernización fundición" 
División: "Salvador"
Proceso: "Fundición"
Línea Base: 2023, 5.1 tCO₂e/ton Cu
Fecha Objetivo: 2029-12-31
```

### 🔄 Reset del Sistema

Para volver al estado inicial:
1. Abrir DevTools (F12)
2. Ir a Application > Storage > Local Storage
3. Eliminar la entrada `codelco_metas_reduccion`
4. Recargar la página (F5)

---

**¡Felicitaciones!** Has completado la demostración completa del prototipo. El sistema está listo para ser escalado con una API real de Codelco.
