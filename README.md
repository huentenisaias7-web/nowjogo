# Mis Tablas

Plataforma educativa para practicar las tablas de multiplicar del 2 al 10 y resolver situaciones matemáticas contextualizadas para 4° básico.

## Ejecutar en XAMPP

1. Mantén la carpeta dentro de `htdocs` (en este espacio de trabajo está en `htdocs/codigos/nowjogo`).
2. Inicia Apache desde el panel de XAMPP.
3. Abre `http://localhost/codigos/nowjogo/`. Si la carpeta se llama `misTablas` directamente dentro de `htdocs`, abre `http://localhost/misTablas/`.
4. Escribe el nombre del estudiante, elige un avatar y entra.

El avance se guarda en el almacenamiento local del navegador. Si se usa otro navegador o dispositivo, se crea un avance separado.

## Estructura

```text
nowjogo/
├── index.html              # Identificación del estudiante
├── README.md
└── Sistema/
    ├── index.html           # Plataforma de aprendizaje
    ├── CSS/
    │   └── styles.css       # Diseño adaptable y animaciones
    └── JS/
        └── app.js           # Actividades, navegación y progreso
```

## Actividades incluidas

- Ingreso con validación y selección de avatar.
- Lecciones visuales con grupos de objetos, patrones y un mini desafío de cinco preguntas por tabla.
- Seis juegos: reto cronometrado, memoria de parejas, detective matemático, construcción de grupos, carrera para completar secuencias y una misión para ordenar productos.
- Seguimiento de puntaje, mejor resultado, tablas dominadas y días de práctica.
- Insignias por metas alcanzadas.
- Ensayo de 10 situaciones tipo SIMCE, desbloqueado al dominar las nueve tablas, con navegación entre preguntas y retroalimentación final.
- Efectos sonoros distintos para aciertos y errores, botones de sonido y guía de voz breve que se puede activar o desactivar. La voz acompaña los cambios de actividad y no lee cada pregunta; las preferencias quedan guardadas en el dispositivo.
- Animación de puntos y destellos al acertar; al abrir el progreso aparece una felicitación personalizada con serpentina. Las insignias también se celebran.
- Interfaz adaptable a pantallas pequeñas, controles táctiles, animaciones y respeto por la preferencia de movimiento reducido del dispositivo.

## Trabajo colaborativo con GitHub

Para que el equipo mantenga un historial compartido, creen un repositorio en GitHub y conecten esta carpeta. Cada integrante puede trabajar en una rama con un cambio acotado, por ejemplo `feature/ensayo-simce` o `feature/tabla-visual`, y luego abrir un Pull Request para revisar y combinar el aporte.

```bash
git init
git add .
git commit -m "Crear plataforma educativa Mis Tablas"
git branch -M main
git remote add origin URL_DEL_REPOSITORIO
git push -u origin main
```

Antes de comenzar otra tarea, actualicen `main`; después de integrar un Pull Request, sincronicen sus ramas. Eviten que varias personas editen simultáneamente el mismo archivo y describan cada avance en el Pull Request.
