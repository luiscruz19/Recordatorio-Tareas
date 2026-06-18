# Recordatorios Diarios — Documento Funcional

**Qué es:** una app simple para anotar las cosas que tenés que hacer en el día —las que no tienen una hora fija— y que te insiste cada tanto hasta que las hacés o las marcás como hechas.

**El problema que resuelve:** las tareas sin horario son las que se escapan. No tienen un "a las 15:00" que dispare un recordatorio, así que quedan flotando y se olvidan. Tus ejemplos son exactamente eso: el mail a Maxi por los ajustes de QA en el TMS, el WhatsApp a Santi, el mensaje a Daniel por el pago, el mensaje a Diego de Dl Hogar. Ninguna tiene hora; todas son "para hoy".

---

## La idea en una frase

Tareas del día **sin hora**, con **recordatorios que se repiten** cada cierto tiempo hasta que las completás.

---

## Pantallas (lo mínimo)

- **Hoy** — la lista del día: arriba las pendientes, abajo las hechas (tachadas). Es la pantalla principal.
- **Agregar** — escribir una tarea en dos segundos (solo el texto, sin obligarte a poner hora). Se puede agregar para **hoy** o para **otro día** (tu caso "mañana tengo que…").
- **Ajustes** — el **intervalo de los recordatorios** (vale para todas las tareas) y la **franja horaria activa**.

Y nada más: la gracia es que sea rápida.

---

## El corazón: los recordatorios

Lo que la hace útil es el "cada X tiempo":

- **Un intervalo configurable, igual para todas las tareas**: desde **Ajustes** elegís "recordame mis pendientes **cada X**" (por ejemplo cada 2 horas) y ese ritmo vale para todas las tareas del día. Cada intervalo te llega una notificación con lo que falta.
- **Franja horaria activa**: los recordatorios suenan solo dentro de una ventana (por ejemplo **9:00 a 21:00**). Fuera de eso, silencio — para que no te suene a las 3 de la mañana.
- **Desde la notificación** podés **marcar hecha** o **posponer** sin abrir la app.
- **Cuándo paran**: una tarea deja de recordarse apenas la marcás hecha; cuando no queda ninguna pendiente, no hay más recordatorios ese día.
- Cada vez que marcás algo como hecho o agregás una tarea, el recordatorio **se ajusta solo** (para que el "te quedan N pendientes" siempre sea exacto).

---

## El ciclo de una tarea

Crear → queda **pendiente** → te llegan los recordatorios → la **marcás hecha** (o la **posponés**). Las que no completaste **no se pierden**: pasan al día siguiente (ver abajo).

---

## Arranque del día: las tareas que quedaron

El **primer ingreso de cada día**, si quedaron tareas sin completar de días anteriores, la app abre una **pantalla obligatoria de revisión**: te muestra todas esas tareas y **no te deja avanzar** hasta que decidas qué hacer con cada una. Por cada una:

- **Pasar a hoy** — sigue en la lista del día (la opción por defecto).
- **Marcar como hecha** — ya la hiciste.
- **Eliminar** — ya no aplica.

Para ir rápido, hay un **"pasar todas a hoy"**. Recién cuando no queda ninguna sin decidir, entrás a la lista de Hoy. Así, lo que siempre se olvida te lo **obliga a confrontar** apenas abrís la app, en vez de que se acumule callado.

---

## Widget de pantalla de inicio

Un widget en la pantalla de inicio para tener las tareas a la vista sin abrir la app.

- Muestra **todas las tareas del día sin terminar**.
- **Tocar una tarea** abre la app en esa tarea para **darla por hecha**.
- El botón **"+"** abre directo el **formulario para cargar una tarea**.
- Se mantiene al día cuando agregás o completás algo, y se refresca de fondo según el sistema.

---

## Lo que NO hace (para que siga siendo simple)

- No tiene horarios por tarea: esa es justamente la diferencia con un calendario.
- No tiene tareas recurrentes ni hábitos: **solo tareas del día**.
- No se conecta con otras apps: sin atajos a WhatsApp ni mail.
- No tiene cuentas ni login.
- No es colaborativa ni tiene proyectos: es tu lista del día y listo.

---

## Definiciones tomadas

- **Solo tareas del día** — sin recurrentes ni hábitos.
- **Arranque con revisión obligatoria** — las tareas no completadas pasan al día siguiente y hay que decidir qué hacer con cada una antes de avanzar.
- **Intervalo global configurable** — se ajusta desde Ajustes y vale para todas las tareas.
- **Sin atajos** a WhatsApp ni mail.

---

## Cómo construirla simple

Para una app así no hace falta backend ni cuentas: puede ser **todo en el dispositivo** —los datos guardados localmente y las notificaciones programadas en el propio teléfono (se pueden agendar recordatorios que se repiten sin servidor)—. Eso la hace barata, rápida y privada, y encaja con **React Native / Expo**, que es lo que vas a usar.

El **widget** se arma con un componente nativo de Android (la librería *react-native-android-widget*, con su config plugin de Expo) y necesita un **development build** —no corre en Expo Go—; el resto de la app es directo.

Con esto definido, el siguiente paso es la **interfaz en Claude Design** y después el **código con Claude Code**.
