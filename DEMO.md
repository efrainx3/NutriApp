# Guion de Demostración en Video (5 a 8 minutos) — NutriRuta

Este documento contiene el guion paso a paso en el orden exacto solicitado para grabar el video de demostración técnica y funcional de **NutriRuta**.

---

## Preparación previa a la grabación (30 segundos)

1. Abre una terminal en la raíz del repositorio y ejecuta:
   ```bash
   npm start
   ```
2. Abre el navegador en `http://localhost:4200`.
3. Abre las herramientas de desarrollo del navegador (**F12**) y ten lista la pestaña **Redux DevTools** (y opcionalmente **Application → IndexedDB → `nutriruta_offline_db`**).

---

## Paso 1: Entrar como paciente, mostrar «Hoy» y registrar el almuerzo (0:00 – 1:15)

1. **Consentimiento Ley 1581 de 2012**:
   - En la pantalla de bienvenida, haz clic primero en **«Entrar como paciente (Jorge R.)»** sin marcar la casilla para mostrar la validación accesible de consentimiento obligatorio.
   - Marca la casilla **«Autorizo el tratamiento de mis datos sensibles de salud conforme a la Ley 1581 de 2012 (Colombia)»** y pulsa **«Entrar como paciente (Jorge R.)»**.
2. **Revisión de la pantalla «Hoy» (Mobile-first, 375 px)**:
   - Muestra el saludo **«Hola, Jorge R.»** y la tarjeta de progreso semanal en lenguaje positivo: **«Cumpliste 5 de 7 días»**.
   - Muestra las **5 tarjetas del plan del día** (Desayuno y Media mañana aparecen como `✓ Sincronizado`; Almuerzo, Merienda y Cena aparecen como `Hoy no registraste aún`).
   - Destaca el botón principal de acción única en la zona del pulgar (**56 px de alto y ancho completo**): **«Registrar hoy (almuerzo)»**.
3. **Registrar el almuerzo en un toque (< 60 segundos)**:
   - Pulsa **«Registrar hoy (almuerzo)»** (observa cómo se oculta la barra de navegación inferior para evitar distracciones).
   - Muestra la pregunta única **«¿Seguiste el almuerzo?»**, el resumen del plan y escribe opcionalmente en la nota: `"Pechuga a la plancha con lentejas y ensalada fresca"`.
   - Toca el botón grande **«Sí, completo»** (objetivo táctil ≥ 44×44 px).
   - Al instante vuelves a «Hoy»: señala el banner `aria-live="polite"` con **«Registro guardado»** (actualización optimista inmediata en estado `⟳ Pendiente…` que pasa en ~350 ms a `✓ Sincronizado`).

---

## Paso 2: Simular sin conexión, registrar la cena («en cola») y sincronizar al reconectar (1:15 – 2:30)

1. **Activar modo sin conexión**:
   - En la barra superior, haz clic en el interruptor **«Simular sin conexión»** (pasa a estado **`⚡ Simular sin conexión: ACTIVO`**).
2. **Registrar la cena sin conexión**:
   - En la tarjeta de **Cena**, pulsa **«Registrar cena»**.
   - En la pantalla **«¿Seguiste la cena?»**, agrega la nota `"Trucha al horno con brócoli (registrado sin red)"` y toca **«Parcialmente»**.
3. **Verificar el estado «en cola» e IndexedDB**:
   - En la pantalla «Hoy», señala el banner `aria-live="polite"` que indica: **«Guardado sin conexión; se enviará al reconectar»**.
   - Señala la insignia **`◷ En cola (sin conexión)`** en la tarjeta de la Cena y el contador **`1 en cola offline`**.
   - *(Opcional)* Muestra en DevTools → Application → IndexedDB → `nutriruta_offline_db` → `registros_pendientes` que solo está guardado el registro de la cena (y ningún dato de historia clínica).
4. **Desactivar «Simular sin conexión» y ver la sincronización automática FIFO**:
   - Haz clic nuevamente en **`⚡ Simular sin conexión: ACTIVO`** para desactivarlo.
   - `ConnectivityService` emite `conexionRecuperada`, el manejador vacía la cola de IndexedDB en orden FIFO y la tarjeta de la Cena cambia automáticamente de **`◷ En cola`** a **`✓ Sincronizado`**.

---

## Paso 3: Forzar error de servidor y demostrar `registroFallido` con mensaje sin culpa (2:30 – 3:20)

1. **Activar bandera de error forzado**:
   - En la barra superior, pulsa el botón **«Forzar error API»** (cambia a **`⚠ Forzar error API: ACTIVO`**).
2. **Intentar registrar la Merienda**:
   - En la tarjeta de **Merienda**, pulsa **«Registrar merienda»** y toca **«Sí, completo»**.
   - Observa cómo el registro aparece de forma optimista por una fracción de segundo (`⟳ Pendiente…`) y, cuando el interceptor responde HTTP 503, el reducer procesa `registroFallido`, **revierte** el registro optimista y muestra el mensaje empático y sin culpa:
     > *"No pudimos confirmar el registro en el servidor en este intento. Puedes volver a tocar tu opción cuando quieras."*
3. **Desactivar bandera de error**:
   - Haz clic en **`⚠ Forzar error API: ACTIVO`** para dejarlo desactivado.
   - *(Opcional)* Visita brevemente la pestaña inferior **«Progreso»** del paciente para mostrar las dos gráficas SVG (peso con marcadores circulares y adherencia con marcadores cuadrados) y el botón **«Ver tabla alternativa»**.

---

## Paso 4: Cerrar sesión, entrar como nutricionista y verificar los registros recién hechos (3:20 – 4:40)

1. **Cerrar sesión del paciente**:
   - Pulsa **«Cerrar sesión»** en la barra superior (todos los stores vuelven a su estado inicial al procesar `[Sesión] sesionCerrada`).
2. **Entrar como nutricionista (Dra. Camila)**:
   - Marca el consentimiento de la Ley 1581 de 2012 y haz clic en **«Entrar como nutricionista (Dra. Camila)»**.
3. **Explorar el panel profesional de escritorio (`≥ 1280 px`)**:
   - A la izquierda, muestra la **Lista de pacientes** con buscador: señala que **Jorge R.** y **Elena Morales** aparecen primero con la etiqueta **«Requiere atención»** porque bajaron su adherencia.
   - A la derecha, en la pestaña **«Resumen clínico»** de Jorge R., muestra las **cuatro tarjetas de indicadores** (`IMC actual: 28.5 kg/m²`, `Cambio de peso: -3.2 kg`, `Adherencia al plan`, `Próximo control`) y la gráfica SVG de evolución del peso con el resumen en texto exacto: **«Bajó 3,2 kg en 8 semanas»** y su tabla de datos alternativa.
4. **Verificar el flujo compartido Paciente → Nutricionista**:
   - Haz clic en la pestaña **«Registros diarios»** de la ficha de Jorge R.
   - Señala en la parte superior de la tabla los registros que Jorge acaba de realizar en los pasos 1 y 2 (**Almuerzo: Sí, completo** y **Cena: Parcialmente**, con sus notas y estado `✓ Sincronizado`).

---

## Paso 5: Crear una valoración clínica, ver el IMC calculado al instante y el guardado pesimista (4:40 – 6:00)

1. **Abrir el formulario de valoración en 5 secciones**:
   - Haz clic en la pestaña **«Valoración (5 secciones)»** o en el botón **`+ Nueva valoración`** de la barra inferior fija.
   - Muestra la estructura accesible con `<fieldset>` y `<legend>` en 5 secciones (*1. Datos generales*, *2. Antropometría*, *3. Laboratorios*, *4. Hábitos*, *5. Objetivos*) y la barra de progreso (`5 de 5 secciones listas (100 %)`).
2. **Probar validaciones y campo condicional**:
   - Marca la casilla **«Paciente en estado de gestación»** para mostrar cómo aparece dinámicamente el campo condicional **«Semanas de gestación (1–42)»**, y luego desmárcala.
   - En **Peso actual**, escribe temporalmente `15` (fuera del rango `20–300 kg`) para mostrar el mensaje de error asociado con `aria-describedby` y el indicador de IMC mostrando `Fuera de rango`.
3. **Ver el IMC calculado al instante con `computed()`**:
   - Cambia el peso de Jorge R. a **`83.0`** kg (con talla `172` cm).
   - Señala cómo la tarjeta **«IMC calculado al instante»** se actualiza en tiempo real sin enviar el formulario a **`28.1 kg/m²`** (*Rango superior 25,0 – 29,9*).
4. **Demostrar el guardado pesimista**:
   - Haz clic en **«Confirmar y guardar valoración»**.
   - Señala que el botón cambia a **`Guardando…`** y se deshabilita mientras espera la respuesta del servidor (guardado pesimista).
   - Al confirmarse, aparece el banner verde de confirmación. Vuelve a la pestaña **«Resumen clínico»** y muestra que se agregó la **Sem 9 (`83 kg`)** en la gráfica de evolución y el IMC del paciente se actualizó a `28.1 kg/m²`.
5. **Asignar plan (opcional, 20 segundos)**:
   - Haz clic en la pestaña **«Plan nutricional»**, elige **«Cardioprotector Mediterráneo Adaptado»**, pulsa **«Confirmar y asignar plan seleccionado»** y confirma el diálogo de reemplazo.

---

## Paso 6: Mostrar Redux DevTools con la secuencia de eventos y el estado de los stores (6:00 – 6:45)

1. En las herramientas de desarrollo del navegador, abre la extensión **Redux DevTools**.
2. Muestra las instancias conectadas mediante `@angular-architects/ngrx-toolkit` (`SessionStore`, `RegistrosStore`, `EvolucionStore`, `PacientesStore`, `ValoracionStore`, `PlanesStore`).
3. Recorre el historial de estados mostrando cómo cada transición corresponde a un evento del flujo Flux (`[Sesión] sesionIniciada`, `[Registro Page] comidaRegistrada`, `[Registro API] registroEncolado`, `[Red] conexionRecuperada`, `[Registro API] registroGuardado`, `[Valoración Page] valoracionEnviada`, `[Valoración API] valoracionConfirmada`).

---

## Paso 7: Ejecutar `npm test` y mostrar las pruebas en verde (6:45 – 7:30)

1. Cambia a la terminal y ejecuta:
   ```bash
   npm test
   ```
2. Muestra en pantalla los **6 archivos de prueba y las 23 pruebas unitarias en verde**:
   - `calculos.spec.ts` (10 pruebas: IMC, límites fisiológicos, cambio de peso «Bajó 3,2 kg en 8 semanas», adherencia y progreso semanal).
   - `stores-reducers.spec.ts` (5 suites completas verificando transiciones puras de todos los stores y el reset global con `sesionCerrada`).
   - `registro.handlers.spec.ts` (2 pruebas de efectos secundarios: `comidaRegistrada` → `registroGuardado` con red, `registroEncolado` sin red y vaciado FIFO de IndexedDB con `conexionRecuperada`).
   - `tarjeta-indicador.component.spec.ts` (componente presentacional con entradas fijas).
   - `role.guard.spec.ts` (4 pruebas de protección de rutas por rol y redirección de paciente que intenta entrar a `/profesional`).
   - `app.spec.ts` (integración del componente raíz).
3. Finalmente ejecuta `npm run lint` y `npm run build` para mostrar que tanto ESLint (con la regla de aislamiento de `features/`) como el compilador de producción terminan con **0 errores y 0 warnings**.
