# Recordatorios Diarios — Brief de diseño (para Claude Design)

App **mobile** simple de tareas del día: anotás cosas para hacer hoy (sin hora) y te llegan recordatorios cada cierto tiempo hasta que las marcás como hechas. Diseñar **4 pantallas**.

## Estilo visual

- **Plataforma:** app mobile (vertical, una mano).
- **Tipografía:** Space Grotesk.
- **Color de acento:** azul `#1F4894`.
- **Tema:** claro, fondo casi blanco, texto gris oscuro, mucho aire.
- **Forma:** minimalista, esquinas redondeadas, sombras suaves. Pocos elementos por pantalla, todo grande y fácil de tocar.

## Pantalla 1 — Hoy (principal)

- Encabezado grande **"Hoy"** + la fecha en gris (ej. *martes 17 de junio*).
- Debajo, un contador sutil: *3 pendientes*.
- **Lista de pendientes**: cada fila es un **círculo vacío** a la izquierda + el texto de la tarea. Tocar el círculo = marcar como hecha.
- Sección **"Hechas"** más abajo: tareas completadas con el texto **tachado** en gris y el círculo lleno con un tilde.
- **Botón flotante "+"** (azul `#1F4894`) abajo a la derecha para agregar una tarea.
- **Estado vacío** (sin tareas): mensaje amable y tranquilo, ej. *"Nada pendiente por hoy"*.

Contenido de ejemplo para la lista:
- Enviar mail a Maxi por los ajustes de QA en el informe del TMS
- WhatsApp a Santi: avisarle que están los cambios y que estoy a disposición
- Mensaje a Daniel por el último pago
- Mensaje a Diego (Dl Hogar) por el pago y los avances

## Pantalla 2 — Revisión de inicio del día

Aparece **al abrir la app** el primer momento del día si quedaron tareas sin terminar de días anteriores. Es **obligatoria**: no se puede cerrar ni saltear hasta resolver todas.

- Título: **"Quedaron tareas sin terminar"** + subtítulo *"Decidí qué hacer con cada una para continuar"*.
- **Lista**: cada fila es el texto de la tarea + tres acciones: **Pasar a hoy** (opción por defecto, en azul), **Hecha**, **Eliminar**.
- Abajo, un botón ancho: **"Pasar todas a hoy"**.

## Pantalla 3 — Agregar tarea

Hoja inferior (bottom sheet) simple y rápida.

- **Campo de texto** grande con placeholder *"¿Qué tenés que hacer?"*.
- Selector **"Para:"** con dos opciones: **Hoy** / **Otro día** (si elige *Otro día*, un selector de fecha).
- Botón **"Agregar"** (azul, ancho).

## Pantalla 4 — Ajustes

- **"Recordarme cada"**: selector de intervalo (opciones: 30 min · 1 h · 2 h · 4 h). Es **uno solo para todas las tareas**.
- **"Franja horaria activa"**: hora de inicio y hora de fin (ej. *9:00 – 21:00*); fuera de esa franja no suenan recordatorios.
- **Notificaciones**: estado del permiso (activado / activar).

## Widget de pantalla de inicio (Android)

La vista del **widget** para la home de Android (no es una pantalla de la app).

- **Barra superior** chica: "Hoy" a la izquierda y un botón **"+"** a la derecha (azul `#1F4894`).
- **Lista de las tareas del día sin terminar**, cada una en una fila simple con su texto y el círculo vacío a la izquierda (igual que en la app).
- Tocar una fila abre la app en esa tarea; tocar el **"+"** abre el formulario de agregar.
- Mismo estilo visual que la app (Space Grotesk, fondo claro, minimalista). Conviene pensar dos tamaños: uno **chico** (pocas filas) y uno **mediano/alto** (más filas).

## Notas de UX

- Lo más importante es la pantalla **Hoy**: agregar y marcar hecho tiene que ser de **un toque**.
- Marcar una tarea como hecha debería sentirse satisfactorio (animación suave del tachado).
- Nada de horarios por tarea, ni proyectos, ni cuentas: es una sola lista por día.
