(function () {
  "use strict";

  var STORAGE_KEY = "misTablasStudent";
  var TABLES = [2, 3, 4, 5, 6, 7, 8, 9, 10];
  var NAV = [
    { id: "home", icon: "🏠", label: "Inicio" },
    { id: "learn", icon: "📚", label: "Aprender" },
    { id: "games", icon: "🎮", label: "Juegos" },
    { id: "progress", icon: "📈", label: "Mi progreso" },
    { id: "awards", icon: "🏅", label: "Logros" },
    { id: "simce", icon: "📝", label: "Ensayo SIMCE" }
  ];
  var EXAM = [
    { topic: "Organización", text: "En una sala hay 6 mesas. Si se sientan 4 estudiantes en cada mesa, ¿cuántos estudiantes hay en total?", options: ["10 estudiantes", "20 estudiantes", "24 estudiantes", "28 estudiantes"], answer: 2, why: "Son 6 grupos de 4: 6 × 4 = 24 estudiantes." },
    { topic: "Compras", text: "Cada cuaderno cuesta $7. Si Martina compra 3 cuadernos, ¿cuánto paga?", options: ["$10", "$21", "$24", "$27"], answer: 1, why: "Multiplicamos el precio por la cantidad: 7 × 3 = $21." },
    { topic: "Materiales", text: "El profesor reparte 8 lápices a cada uno de 5 equipos. ¿Cuántos lápices reparte?", options: ["13 lápices", "35 lápices", "40 lápices", "45 lápices"], answer: 2, why: "Hay 5 equipos con 8 lápices cada uno: 5 × 8 = 40." },
    { topic: "Juegos", text: "En un videojuego se ganan 9 puntos por nivel. Diego completa 4 niveles. ¿Cuántos puntos obtiene?", options: ["13 puntos", "32 puntos", "36 puntos", "40 puntos"], answer: 2, why: "9 puntos en cada uno de 4 niveles: 9 × 4 = 36." },
    { topic: "Vida cotidiana", text: "Una caja tiene 6 naranjas. ¿Cuántas naranjas hay en 7 cajas iguales?", options: ["13 naranjas", "36 naranjas", "40 naranjas", "42 naranjas"], answer: 3, why: "7 cajas de 6 naranjas: 7 × 6 = 42." },
    { topic: "Deportes", text: "Cada equipo necesita 5 jugadores. Si participan 8 equipos, ¿cuántos jugadores se necesitan?", options: ["13 jugadores", "35 jugadores", "40 jugadores", "45 jugadores"], answer: 2, why: "8 equipos con 5 jugadores: 8 × 5 = 40." },
    { topic: "Biblioteca", text: "Hay 9 estantes y en cada uno caben 3 libros grandes. ¿Cuántos libros caben en total?", options: ["12 libros", "27 libros", "30 libros", "36 libros"], answer: 1, why: "9 estantes con 3 libros cada uno: 9 × 3 = 27." },
    { topic: "Excursión", text: "Para una salida se llenan 6 buses con 8 estudiantes cada uno. ¿Cuántos estudiantes viajan?", options: ["14 estudiantes", "42 estudiantes", "48 estudiantes", "56 estudiantes"], answer: 2, why: "6 buses con 8 estudiantes: 6 × 8 = 48." },
    { topic: "Colación", text: "En cada bandeja hay 10 sándwiches. Si se preparan 7 bandejas, ¿cuántos sándwiches hay?", options: ["17 sándwiches", "60 sándwiches", "70 sándwiches", "77 sándwiches"], answer: 2, why: "7 bandejas de 10: 7 × 10 = 70." },
    { topic: "Aula", text: "Los 4 cursos de cuarto básico juntan 9 libros cada uno para la biblioteca. ¿Cuántos libros reúnen?", options: ["13 libros", "32 libros", "36 libros", "40 libros"], answer: 2, why: "Son 4 cursos que aportan 9 libros: 4 × 9 = 36." }
  ];

  var state = null;
  var view = "home";
  var table = 2;
  var lessonStep = 1;
  var lessonPhase = "explore";
  var lessonQuestions = [];
  var lessonIndex = 0;
  var lessonScore = 0;
  var lessonAnswered = false;
  var gameInterval = null;
  var gameDelay = null;
  var gameTime = 60;
  var gameScore = 0;
  var gameStreak = 0;
  var bestStreak = 0;
  var round = null;
  var examIndex = 0;

  function newState(profile) {
    return { profile: profile, score: 0, streak: 0, lastVisit: "", tables: {}, awards: {}, gameBest: 0, exam: null };
  }
  function loadState() {
    try {
      var stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (!stored || !stored.profile || !stored.profile.name) return null;
      stored.tables = stored.tables || {};
      stored.awards = stored.awards || {};
      return stored;
    } catch (error) { return null; }
  }
  function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
  function esc(value) {
    return String(value).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function dayKey(date) { return date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate(); }
  function recordFor(number) { return state.tables[number] || { complete: false, best: 0, attempts: 0 }; }
  function completeCount() { return TABLES.filter(function (n) { return recordFor(n).complete; }).length; }
  function isUnlocked() { return completeCount() === TABLES.length; }
  function progressOf(record) { return record.complete ? 100 : Math.min(90, Math.round((record.best || 0) * 20)); }
  function updateStreak() {
    var today = dayKey(new Date());
    if (state.lastVisit !== today) {
      if (state.lastVisit) {
        var parts = state.lastVisit.split("-");
        var prior = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        var now = new Date(); now.setHours(0, 0, 0, 0);
        var diff = Math.round((now - prior) / 86400000);
        state.streak = diff === 1 ? (state.streak || 0) + 1 : 1;
      } else state.streak = 1;
      state.lastVisit = today;
      save();
    }
  }
  function toast(message) {
    var region = document.getElementById("toast-region");
    if (!region) return;
    var item = document.createElement("div");
    item.className = "toast"; item.textContent = message; region.appendChild(item);
    window.setTimeout(function () { item.remove(); }, 3100);
  }
  function sparkle(element) {
    var box = element && element.getBoundingClientRect ? element.getBoundingClientRect() : { left: innerWidth / 2, top: innerHeight / 2, width: 0 };
    var marks = ["✦", "✧", "★", "♥", "●"];
    for (var i = 0; i < 12; i += 1) {
      var node = document.createElement("span"); node.className = "sparkle"; node.textContent = marks[i % marks.length];
      node.style.left = (box.left + box.width / 2 + Math.random() * 100 - 50) + "px";
      node.style.top = (box.top + window.scrollY + Math.random() * 26 - 13) + "px";
      node.style.color = ["#ffd166", "#8f83ff", "#ff8c79", "#58c99b"][i % 4];
      node.style.fontSize = (12 + Math.random() * 12) + "px"; document.body.appendChild(node);
      window.setTimeout(function (spark) { return function () { spark.remove(); }; }(node), 1000);
    }
  }
  function unlock(id) {
    if (state.awards[id]) return false;
    state.awards[id] = true; save(); return true;
  }
  function checkAwards() {
    var unlocked = [];
    if (state.score >= 10 && unlock("first10")) unlocked.push("¡Primeros 10 puntos!");
    if (completeCount() >= 1 && unlock("firstTable")) unlocked.push("¡Primera tabla dominada!");
    if (completeCount() >= 5 && unlock("halfway")) unlocked.push("¡Mitad del camino!");
    if (completeCount() === 9 && unlock("allTables")) unlocked.push("¡Maestro/a de las tablas!");
    if (state.gameBest >= 10 && unlock("quick10")) unlocked.push("¡Rayo veloz!");
    if (state.exam && state.exam.percent >= 80 && unlock("exam80")) unlocked.push("¡Estrella SIMCE!");
    unlocked.forEach(function (label, index) { window.setTimeout(function () { toast("🏅 Logro desbloqueado: " + label); }, index * 450); });
  }

  function initLogin() {
    var form = document.getElementById("login-form");
    var selectedAvatar = "🦊";
    document.querySelectorAll(".avatar-option").forEach(function (button) {
      button.addEventListener("click", function () {
        selectedAvatar = button.getAttribute("data-avatar");
        document.querySelectorAll(".avatar-option").forEach(function (option) {
          var active = option === button; option.classList.toggle("selected", active); option.setAttribute("aria-pressed", active ? "true" : "false");
        });
      });
    });
    var saved = loadState();
    if (saved) {
      document.getElementById("student-name").value = saved.profile.name;
      selectedAvatar = saved.profile.avatar || "🦊";
      document.querySelectorAll(".avatar-option").forEach(function (option) {
        var active = option.getAttribute("data-avatar") === selectedAvatar; option.classList.toggle("selected", active); option.setAttribute("aria-pressed", active ? "true" : "false");
      });
    }
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var input = document.getElementById("student-name");
      var error = document.getElementById("name-error");
      var name = input.value.trim().replace(/\s+/g, " ");
      if (name.length < 2) { error.textContent = "Escribe un nombre de al menos 2 letras para continuar."; input.setAttribute("aria-invalid", "true"); input.focus(); return; }
      if (!/^[\p{L}\p{M}][\p{L}\p{M} .'-]*$/u.test(name)) { error.textContent = "Usa letras y espacios para escribir tu nombre."; input.setAttribute("aria-invalid", "true"); input.focus(); return; }
      error.textContent = ""; input.removeAttribute("aria-invalid");
      var prior = loadState();
      if (prior && prior.profile.name.toLowerCase() === name.toLowerCase()) {
        state = prior; state.profile.name = name; state.profile.avatar = selectedAvatar; save();
      } else { state = newState({ name: name, avatar: selectedAvatar }); save(); }
      window.location.href = "Sistema/index.html";
    });
  }

  function navMarkup(item, active) {
    return '<button type="button" class="nav-item ' + (active ? "active" : "") + '" data-nav="' + item.id + '"><span class="nav-icon">' + item.icon + '</span><span>' + item.label + '</span></button>';
  }
  function renderFrame() {
    document.getElementById("header-name").textContent = state.profile.name;
    document.getElementById("header-avatar").textContent = state.profile.avatar || "🦊";
    document.getElementById("header-streak").textContent = state.streak || 1;
    document.getElementById("side-nav").innerHTML = NAV.map(function (item) { return navMarkup(item, item.id === view); }).join("");
    document.getElementById("mobile-nav").innerHTML = NAV.filter(function (item) { return ["home", "learn", "games", "progress", "simce"].indexOf(item.id) >= 0; }).map(function (item) { return navMarkup(item, item.id === view); }).join("");
  }
  function initApp() {
    state = loadState();
    if (!state) { window.location.replace("../index.html"); return; }
    updateStreak(); renderFrame(); renderView("home");
    document.getElementById("logout-button").addEventListener("click", function () { window.location.href = "../index.html"; });
  }
  function heading(kicker, title, subtitle) {
    return '<div class="page-heading"><div><span class="kicker">' + kicker + '</span><h1>' + title + '</h1><p>' + subtitle + '</p></div></div>';
  }
  function tableCards() {
    return TABLES.map(function (number) {
      var record = recordFor(number), amount = progressOf(record);
      var detail = record.complete ? "¡Dominada! Mejor " + record.best + "/5" : record.attempts ? amount + "% de tu mejor intento" : "Una nueva aventura";
      return '<button type="button" class="table-card" data-table="' + number + '"><span class="table-number">' + number + '</span><span class="table-card-info"><strong>Tabla del ' + number + '</strong><span>' + detail + '</span><span class="table-progress"><span style="width:' + amount + '%"></span></span></span>' + (record.complete ? '<span class="table-done">✓</span>' : "") + '</button>';
    }).join("");
  }
  function renderView(nextView) {
    if (gameInterval) { clearInterval(gameInterval); gameInterval = null; }
    if (gameDelay) { clearTimeout(gameDelay); gameDelay = null; }
    view = nextView; renderFrame();
    var main = document.getElementById("main-content"); main.innerHTML = ""; window.scrollTo(0, 0);
    if (view === "home") renderHome(main);
    else if (view === "learn") renderLearn(main);
    else if (view === "games") renderGames(main);
    else if (view === "progress") renderProgress(main);
    else if (view === "awards") renderAwards(main);
    else if (view === "simce") renderSimce(main);
    main.focus({ preventScroll: true });
  }
  function renderHome(main) {
    var count = completeCount();
    main.innerHTML = heading("TU ESPACIO DE APRENDIZAJE", "¡Hola, " + esc(state.profile.name) + "! 👋", "Cada desafío te acerca a ser una estrella matemática.")
      + '<section class="hero-card"><div class="hero-copy"><span class="eyebrow">TU AVENTURA DE HOY</span><h1>¡Vamos paso a paso!</h1><p>Ya tienes ' + count + ' de 9 tablas dominadas. ¿Cuál será la próxima?</p><button class="button" type="button" data-nav="learn">Seguir aprendiendo <span>→</span></button></div><div class="hero-decoration" aria-hidden="true">🦊</div></section>'
      + '<div class="stats-row"><div class="stat-card card"><span class="stat-icon">⭐</span><div><strong>' + state.score + '</strong><span>Puntos ganados</span></div></div><div class="stat-card card"><span class="stat-icon">🔥</span><div><strong>' + (state.streak || 1) + '</strong><span>Días aprendiendo</span></div></div><div class="stat-card card"><span class="stat-icon">🏆</span><div><strong>' + count + ' / 9</strong><span>Tablas dominadas</span></div></div></div>'
      + '<div class="section-title"><h2>Elige tu próxima tabla</h2><span>Del 2 al 10</span></div><section class="table-grid" aria-label="Tablas de multiplicar">' + tableCards() + '</section>'
      + '<div class="section-title"><h2>Más aventuras</h2></div><section class="action-grid"><button class="action-card card" type="button" data-nav="games"><span class="action-illustration">🎯</span><span><strong>Juegos y desafíos</strong><p>¿Cuántas respuestas puedes atrapar?</p></span><span class="action-arrow">→</span></button><button class="action-card card" type="button" data-nav="progress"><span class="action-illustration">🗺️</span><span><strong>Mi progreso</strong><p>Mira todo lo que ya has logrado.</p></span><span class="action-arrow">→</span></button></section>'
      + '<section class="simce-banner"><span class="simce-icon">📝</span><div><strong>' + (isUnlocked() ? "¡El ensayo SIMCE ya está listo!" : "Tu gran desafío te espera") + '</strong><p>' + (isUnlocked() ? "Resuelve 10 situaciones cotidianas y demuestra lo que sabes." : "Domina las 9 tablas para desbloquear el ensayo SIMCE.") + '</p></div>' + (isUnlocked() ? '<button class="button button-primary" type="button" data-nav="simce">Ir al ensayo →</button>' : '<span class="progress-pill">' + count + ' / 9</span>') + '</section>';
  }
  function renderLearn(main) {
    main.innerHTML = heading("APRENDE A TU RITMO", "Explora las tablas 📚", "Elige una tabla, descubre sus patrones y practica con un mini desafío.")
      + '<section class="table-grid">' + tableCards() + '</section><div class="pattern-note"><span>✨</span><div><strong>Un truco útil:</strong> multiplicar es sumar grupos iguales. Por ejemplo, 3 × 4 significa 3 grupos de 4. ¡Explora para verlo!</div></div>';
  }
  function beginLesson(number) {
    table = number; lessonStep = 1; lessonPhase = "explore"; lessonIndex = 0; lessonScore = 0; lessonAnswered = false; lessonQuestions = [];
    renderLesson();
  }
  function hintFor(n, groups) {
    if (n === 2) return "Los resultados van de 2 en 2 y siempre terminan en 0, 2, 4, 6 u 8.";
    if (n === 5) return "¡Mira el patrón! Los resultados terminan siempre en 0 o en 5.";
    if (n === 10) return "En la tabla del 10 agregamos un cero al número de grupos.";
    if (groups === 1) return "Multiplicar también es sumar varias veces: " + n + " = " + (n * groups) + ".";
    return "Cada vez que agregamos un grupo, sumamos " + n + ". El resultado crece de " + n + " en " + n + ".";
  }
  function renderLesson() {
    var main = document.getElementById("main-content");
    var isExplore = lessonPhase === "explore";
    var html = '<button class="back-link" type="button" data-action="back-tables">← Todas las tablas</button>'
      + heading(isExplore ? "MIRA, AGRUPA Y DESCUBRE" : lessonPhase === "quiz" ? "MINI DESAFÍO" : "RESULTADO", "Tabla del " + table + " ✨", isExplore ? "Observa los grupos y encuentra los patrones." : lessonPhase === "quiz" ? "Responde 5 preguntas. ¡Tú puedes!" : "Cada práctica te ayuda a aprender más.");
    if (isExplore) {
      var visualGroups = "";
      for (var g = 0; g < lessonStep; g += 1) {
        var dots = "";
        for (var d = 0; d < table; d += 1) dots += '<span class="dot" style="animation-delay:' + ((g * table + d) * 18) + 'ms"></span>';
        visualGroups += '<div class="dot-group" aria-label="Grupo con ' + table + ' objetos">' + dots + '</div>';
      }
      html += '<section class="lesson-card card"><div class="lesson-heading"><div><span class="kicker">DESCUBRE LOS GRUPOS</span><h2>' + lessonStep + ' grupo' + (lessonStep === 1 ? "" : "s") + ' de ' + table + '</h2><p>Cuenta los puntos: cada grupo aporta ' + table + '.</p></div><div class="lesson-badge">' + (lessonStep * table) + '</div></div><div class="group-stage"><div class="groups-visual">' + visualGroups + '</div><div class="equation-display"><strong>' + lessonStep + ' × ' + table + ' = ' + (lessonStep * table) + '</strong><span>' + lessonStep + ' grupo' + (lessonStep === 1 ? "" : "s") + ' de ' + table + ' objetos</span></div></div><div class="pattern-note"><span>💡</span><div>' + hintFor(table, lessonStep) + '</div></div><div class="lesson-controls"><div class="lesson-dots">' + TABLES.map(function (_, index) { return '<span class="' + (index + 1 === lessonStep ? "current" : "") + '"></span>'; }).join("") + '</div><button class="button button-primary" type="button" data-action="' + (lessonStep < 9 ? "next-group" : "start-quiz") + '">' + (lessonStep < 9 ? "Ver siguiente grupo →" : "¡A practicar! →") + '</button></div></section>';
    } else if (lessonPhase === "quiz") {
      var q = lessonQuestions[lessonIndex];
      html += '<section class="quiz-card card"><div class="quiz-top"><span>Pregunta ' + (lessonIndex + 1) + ' de 5</span><span>⭐ ' + lessonScore + ' aciertos</span></div><p class="question-text">' + q.text + '</p><div class="answer-grid">' + q.options.map(function (answer) {
        var cls = lessonAnswered && answer === q.answer ? " correct" : lessonAnswered && answer === q.selected ? " wrong" : "";
        return '<button class="answer-option' + cls + '" type="button" data-lesson-answer="' + answer + '" ' + (lessonAnswered ? "disabled" : "") + '>' + answer + '</button>';
      }).join("") + '</div><div class="feedback-box ' + (lessonAnswered ? (q.correct ? "good" : "try-again") : "") + '">' + (lessonAnswered ? (q.correct ? "¡Correcto! " + q.answer + " es la respuesta. ¡Vas muy bien!" : "¡Casi! La respuesta es " + q.answer + ". " + table + " × " + q.factor + " = " + q.answer + ".") : "Elige la respuesta que te parezca correcta.") + '</div><div class="quiz-footer"><span class="muted">Puedes volver a practicar cuando quieras.</span>' + (lessonAnswered ? '<button class="button button-primary" type="button" data-action="lesson-next">' + (lessonIndex < 4 ? "Siguiente →" : "Ver resultado →") + '</button>' : "") + '</div></section>';
    } else {
      var passed = lessonScore >= 4;
      html += '<section class="feedback-screen card"><div class="result-emoji">' + (passed ? "🌟" : "💪") + '</div><h2>' + (passed ? "¡Tabla dominada!" : "¡Buen intento!") + '</h2><p>' + (passed ? "Respondiste " + lessonScore + " de 5 correctamente. ¡Ya puedes usar esta tabla en tus aventuras!" : "Lograste " + lessonScore + " de 5. Repasa los grupos y vuelve a intentarlo cuando quieras.") + '</p><div class="result-summary"><div class="result-metric"><strong>' + lessonScore + ' / 5</strong><span>Respuestas correctas</span></div><div class="result-metric"><strong>+' + (lessonScore * 5) + ' ⭐</strong><span>Puntos ganados</span></div></div><div class="end-actions"><button class="button button-secondary" type="button" data-action="repeat-lesson">Intentarlo otra vez</button><button class="button button-primary" type="button" data-action="back-tables">Ver mis tablas</button></div></section>';
    }
    main.innerHTML = html;
  }
  function makeOptions(correct, step, n) {
    var values = [correct, correct + n, Math.max(1, correct - n), n + step];
    var candidate = correct + 2;
    while (new Set(values).size < 4) {
      if (values.indexOf(candidate) < 0) values.push(candidate);
      candidate += 1;
    }
    return Array.from(new Set(values)).slice(0, 4).sort(function () { return Math.random() - .5; });
  }
  function buildLessonQuestions() {
    var factors = [2, 4, 6, 8, 9];
    lessonQuestions = factors.map(function (factor, index) {
      var answer = table * factor;
      var lines = ["Hay " + factor + " bolsas con " + table + " canicas cada una. ¿Cuántas canicas hay?", "¿Cuánto es " + factor + " grupos de " + table + "?", "En cada caja hay " + table + " fichas. ¿Cuántas fichas hay en " + factor + " cajas?", "La tabla del " + table + ": " + table + " × " + factor + " = ?", "¿Qué resultado completa " + factor + " veces " + table + "?"];
      return { factor: factor, text: lines[index], answer: answer, options: makeOptions(answer, factor, table), selected: null, correct: false };
    });
  }
  function startQuiz() { buildLessonQuestions(); lessonPhase = "quiz"; lessonIndex = 0; lessonScore = 0; lessonAnswered = false; renderLesson(); }
  function answerLesson(value) {
    if (lessonAnswered) return;
    var question = lessonQuestions[lessonIndex]; question.selected = value; question.correct = value === question.answer; lessonAnswered = true;
    if (question.correct) { lessonScore += 1; state.score += 5; sparkle(document.activeElement); }
    save(); checkAwards(); renderFrame(); renderLesson();
  }
  function nextLessonQuestion() {
    if (lessonIndex < 4) { lessonIndex += 1; lessonAnswered = false; renderLesson(); return; }
    var record = recordFor(table); record.attempts += 1; record.best = Math.max(record.best || 0, lessonScore); if (lessonScore >= 4) record.complete = true;
    state.tables[table] = record; save(); checkAwards(); lessonPhase = "result"; renderLesson();
    if (lessonScore >= 4) sparkle(document.querySelector(".feedback-screen"));
  }

  function renderGames(main) {
    main.innerHTML = heading("JUEGA Y PRACTICA", "¡A jugar! 🎮", "Activa tu mente con un desafío corto y divertido.")
      + '<section class="activity-intro card"><span class="kicker">RETO CONTRA EL TIEMPO</span><h2>Atrapa el resultado ⏱️</h2><p>Tienes 60 segundos para responder tantos desafíos como puedas. Cada acierto suma puntos y una racha te da más confianza.</p><button class="button button-primary" type="button" data-action="start-game">¡Comenzar reto! →</button></section><div id="game-area"></div><div class="section-title"><h2>Consejos para el reto</h2></div><div class="pattern-note"><span>🎯</span><div>Lee con calma y busca una estrategia. Si te equivocas, piensa en grupos iguales. ¡Lo importante es intentarlo!</div></div>';
  }
  function newRound() {
    if (!gameInterval || gameTime <= 0) return;
    var a = TABLES[Math.floor(Math.random() * TABLES.length)], b = Math.floor(Math.random() * 9) + 2, correct = a * b;
    round = { a: a, b: b, answer: correct, options: makeOptions(correct, b, a) };
    var question = document.getElementById("game-question"), options = document.getElementById("game-options"), feedback = document.getElementById("game-feedback");
    if (!question || !options) return;
    question.textContent = "¿Cuánto es " + a + " × " + b + "?";
    options.innerHTML = round.options.map(function (value) { return '<button class="answer-option" type="button" data-game-answer="' + value + '">' + value + '</button>'; }).join("");
    if (feedback) { feedback.className = "feedback-box"; feedback.textContent = "Elige una respuesta para seguir jugando."; }
  }
  function beginGame() {
    if (gameInterval) clearInterval(gameInterval);
    if (gameDelay) clearTimeout(gameDelay);
    gameTime = 60; gameScore = 0; gameStreak = 0; bestStreak = 0;
    document.getElementById("game-area").innerHTML = '<div class="game-layout"><section class="quiz-card card"><div class="quiz-top"><span>Reto rápido</span><span class="timer-pill" id="game-clock">60 s</span></div><p class="question-text" id="game-question"></p><div class="answer-grid" id="game-options"></div><div class="feedback-box" id="game-feedback">Elige una respuesta para seguir jugando.</div></section><aside class="game-side card"><h3>Tu reto</h3><div class="game-stat"><strong id="game-points">0</strong><span>Puntos de hoy</span></div><div class="game-stat"><strong id="game-streak">0</strong><span>Racha actual</span></div><div class="game-stat"><strong>' + (state.gameBest || 0) + '</strong><span>Mejor puntaje</span></div></aside></div>';
    gameInterval = window.setInterval(function () {
      gameTime -= 1; var clock = document.getElementById("game-clock");
      if (clock) { clock.textContent = gameTime + " s"; if (gameTime <= 10) clock.classList.add("try-again"); }
      if (gameTime <= 0) endGame();
    }, 1000);
    newRound();
  }
  function answerGame(value, button) {
    if (!round || !button || button.disabled) return;
    var answer = round.answer, correct = value === answer, feedback = document.getElementById("game-feedback");
    document.querySelectorAll("[data-game-answer]").forEach(function (option) {
      option.disabled = true; if (Number(option.getAttribute("data-game-answer")) === answer) option.classList.add("correct");
    });
    if (correct) {
      gameScore += 1; gameStreak += 1; bestStreak = Math.max(bestStreak, gameStreak);
      feedback.className = "feedback-box good"; feedback.textContent = "¡Sí! " + round.a + " × " + round.b + " = " + answer + ". ¡Sigue así!"; sparkle(button);
    } else {
      button.classList.add("wrong"); gameStreak = 0; feedback.className = "feedback-box try-again";
      feedback.textContent = "¡Casi! " + round.a + " grupos de " + round.b + " son " + answer + ". ¡La próxima sale!";
    }
    document.getElementById("game-points").textContent = gameScore; document.getElementById("game-streak").textContent = gameStreak;
    gameDelay = window.setTimeout(newRound, correct ? 650 : 1100);
  }
  function endGame() {
    if (gameInterval) { clearInterval(gameInterval); gameInterval = null; }
    if (gameDelay) { clearTimeout(gameDelay); gameDelay = null; }
    state.score += gameScore; state.gameBest = Math.max(state.gameBest || 0, gameScore); save(); checkAwards(); renderFrame();
    var area = document.getElementById("game-area"); if (!area) return;
    area.innerHTML = '<section class="end-panel card"><div class="end-emoji">' + (gameScore >= 10 ? "🏆" : "🎉") + '</div><h2>¡Reto terminado!</h2><p>En 60 segundos atrapaste <strong>' + gameScore + '</strong> respuestas correctas y lograste una racha de <strong>' + bestStreak + '</strong>. ¡Cada ronda te hace más veloz!</p><div class="end-actions"><button class="button button-secondary" type="button" data-action="start-game">Jugar otra vez</button><button class="button button-primary" type="button" data-nav="home">Volver al inicio</button></div></section>';
    sparkle(area.querySelector(".end-panel"));
  }

  function renderProgress(main) {
    var count = completeCount();
    var rows = TABLES.map(function (n) {
      var record = recordFor(n), percentage = progressOf(record);
      return '<div class="card" style="padding:17px 19px;margin-bottom:10px"><div class="progress-label"><span>Tabla del ' + n + (record.complete ? " ✓" : "") + '</span><span>' + (record.complete ? "Dominada" : record.attempts ? "Mejor resultado " + record.best + " / 5" : "Por comenzar") + '</span></div><div class="progress-track"><span style="width:' + percentage + '%"></span></div><button class="back-link" type="button" style="margin:10px 0 0;padding:0;font-size:.77rem" data-table="' + n + '">' + (record.attempts ? "Practicar de nuevo →" : "Empezar esta tabla →") + '</button></div>';
    }).join("");
    main.innerHTML = heading("TU CAMINO", "¡Mira cuánto avanzas! 📈", "Cada práctica cuenta. Repite las tablas para superar tu mejor resultado.")
      + '<div class="stats-row"><div class="stat-card card"><span class="stat-icon">⭐</span><div><strong>' + state.score + '</strong><span>Puntos totales</span></div></div><div class="stat-card card"><span class="stat-icon">📚</span><div><strong>' + count + ' / 9</strong><span>Tablas dominadas</span></div></div><div class="stat-card card"><span class="stat-icon">🏅</span><div><strong>' + Object.keys(state.awards).length + '</strong><span>Logros ganados</span></div></div></div><div class="section-title"><h2>Avance por tabla</h2><span>' + Math.round(count / 9 * 100) + '% completado</span></div>' + rows;
  }
  var AWARDS = [
    { id: "first10", icon: "⭐", title: "Primeros 10 puntos", text: "Suma 10 puntos en tus actividades." },
    { id: "firstTable", icon: "📘", title: "Primera tabla", text: "Completa una tabla con 4 respuestas correctas." },
    { id: "halfway", icon: "🌈", title: "A mitad del camino", text: "Domina 5 de las 9 tablas." },
    { id: "allTables", icon: "👑", title: "Maestro/a de las tablas", text: "Completa todas las tablas del 2 al 10." },
    { id: "quick10", icon: "⚡", title: "Rayo veloz", text: "Acierta 10 preguntas en un reto." },
    { id: "exam80", icon: "🎓", title: "Estrella SIMCE", text: "Obtén 80% o más en el ensayo." }
  ];
  function renderAwards(main) {
    checkAwards();
    main.innerHTML = heading("TUS RECOMPENSAS", "¡Tus logros! 🏅", "Cada insignia cuenta una parte de tu aventura.")
      + '<div class="stats-row"><div class="stat-card card"><span class="stat-icon">🏅</span><div><strong>' + Object.keys(state.awards).length + ' / ' + AWARDS.length + '</strong><span>Insignias ganadas</span></div></div><div class="stat-card card"><span class="stat-icon">⭐</span><div><strong>' + state.score + '</strong><span>Puntos reunidos</span></div></div><div class="stat-card card"><span class="stat-icon">🔥</span><div><strong>' + state.streak + '</strong><span>Días de aventura</span></div></div></div><div class="section-title"><h2>Colección de insignias</h2></div><section class="achievement-grid">' + AWARDS.map(function (award) {
        var won = !!state.awards[award.id];
        return '<article class="achievement-card card ' + (won ? "unlocked" : "") + '"><span class="achievement-icon">' + award.icon + '</span><div><strong>' + award.title + (won ? " ✓" : "") + '</strong><p>' + (won ? "¡Insignia conseguida! " : "") + award.text + '</p></div></article>';
      }).join("") + '</section>';
  }

  function renderSimce(main) {
    if (!isUnlocked()) {
      main.innerHTML = heading("GRAN DESAFÍO", "Ensayo matemático 📝", "Completa las 9 tablas para desbloquear el ensayo.")
        + '<section class="feedback-screen card"><div class="result-emoji">🔒</div><h2>¡Sigue avanzando!</h2><p>Ya dominaste ' + completeCount() + ' de 9 tablas. Cuando termines todas, podrás resolver 10 situaciones cotidianas y revisar tus respuestas.</p><button class="button button-primary" type="button" data-nav="learn">Seguir con mis tablas →</button></section>';
      return;
    }
    if (state.exam && state.exam.finished) { showExamResult(main); return; }
    if (!state.exam || !state.exam.answers || state.exam.answers.length !== 10) { state.exam = { answers: new Array(10).fill(null), finished: false }; save(); }
    examIndex = Math.max(0, Math.min(9, examIndex));
    var question = EXAM[examIndex];
    var answered = state.exam.answers.filter(function (item) { return item !== null; }).length;
    main.innerHTML = heading("TU GRAN DESAFÍO", "Ensayo matemático 📝", "Lee cada situación y marca la alternativa que responde la pregunta.")
      + '<div class="simce-layout"><aside class="question-list card"><h3>Tus preguntas <span class="muted">(' + answered + ' / 10)</span></h3><div class="question-buttons">' + EXAM.map(function (_, index) { return '<button class="question-number ' + (index === examIndex ? "active " : "") + (state.exam.answers[index] !== null ? "answered" : "") + '" type="button" data-exam-index="' + index + '" aria-label="Ir a pregunta ' + (index + 1) + '">' + (index + 1) + '</button>'; }).join("") + '</div><p class="question-list-note">Los números verdes ya tienen respuesta. Puedes cambiarla antes de terminar.</p></aside><section class="exam-card card"><div class="exam-progress"><div class="progress-label"><span>Pregunta ' + (examIndex + 1) + ' de 10</span><span>' + Math.round(answered * 10) + '% respondido</span></div><div class="progress-track"><span style="width:' + (answered * 10) + '%"></span></div></div><span class="exam-category">' + question.topic + '</span><p class="exam-question">' + question.text + '</p><div class="exam-options">' + question.options.map(function (option, index) { var selected = state.exam.answers[examIndex] === index; return '<button type="button" class="exam-option ' + (selected ? "selected" : "") + '" data-exam-answer="' + index + '"><span class="option-letter">' + String.fromCharCode(65 + index) + '</span><span>' + option + '</span></button>'; }).join("") + '</div><div class="exam-controls"><button class="button button-soft" type="button" data-action="exam-prev" ' + (examIndex === 0 ? "disabled" : "") + '>← Anterior</button>' + (examIndex < 9 ? '<button class="button button-primary" type="button" data-action="exam-next">Siguiente →</button>' : '<button class="button button-primary" type="button" data-action="finish-exam">Finalizar ensayo</button>') + '</div></section></div>';
  }
  function finishExam() {
    var missing = state.exam.answers.filter(function (item) { return item === null; }).length;
    if (missing) { toast("Te falta responder " + missing + (missing === 1 ? " pregunta." : " preguntas.") + " Revisa los números verdes."); return; }
    var correct = 0; EXAM.forEach(function (question, index) { if (state.exam.answers[index] === question.answer) correct += 1; });
    state.exam.finished = true; state.exam.correct = correct; state.exam.percent = correct * 10; state.score += correct * 10;
    save(); checkAwards(); renderFrame(); showExamResult(document.getElementById("main-content"));
    if (state.exam.percent >= 80) sparkle(document.querySelector(".feedback-screen"));
  }
  function showExamResult(main) {
    var percent = state.exam.percent || 0, correct = state.exam.correct || 0;
    var message = percent >= 80 ? "¡Excelente trabajo! Comprendes muy bien las multiplicaciones en situaciones cotidianas." : percent >= 50 ? "¡Vas por buen camino! Repasa las preguntas y vuelve a intentarlo para mejorar." : "¡Sigue practicando! Cada error te ayuda a descubrir una estrategia nueva.";
    main.innerHTML = heading("RESULTADOS", "¡Ensayo terminado! 🎓", "Revisa tu resultado y la explicación de cada situación.")
      + '<section class="feedback-screen card"><div class="result-emoji">' + (percent >= 80 ? "🌟" : percent >= 50 ? "👏" : "💪") + '</div><h2>' + percent + '% de logro</h2><p>' + message + '</p><div class="result-summary"><div class="result-metric"><strong>' + correct + ' / 10</strong><span>Respuestas correctas</span></div><div class="result-metric"><strong>+' + (correct * 10) + ' ⭐</strong><span>Puntos ganados</span></div></div><button class="button button-primary" type="button" data-action="review-exam">Ver retroalimentación</button><div class="end-actions"><button class="button button-secondary" type="button" data-action="restart-exam">Intentar de nuevo</button><button class="button button-soft" type="button" data-nav="home">Volver al inicio</button></div></section><div id="exam-review" class="hidden"></div>';
  }
  function showExamReview() {
    var review = document.getElementById("exam-review");
    if (review.classList.contains("hidden")) {
      if (!review.dataset.loaded) {
        review.innerHTML = '<div class="section-title"><h2>Revisemos juntos</h2></div>' + EXAM.map(function (question, index) {
          var right = state.exam.answers[index] === question.answer;
          return '<article class="card" style="margin-bottom:10px;padding:18px"><div class="progress-label"><span>Pregunta ' + (index + 1) + ' · ' + question.topic + '</span><span style="color:' + (right ? "#23805a" : "#bd5650") + '">' + (right ? "✓ Correcta" : "✦ Para repasar") + '</span></div><p style="margin:9px 0;font-weight:800;line-height:1.5">' + question.text + '</p><p class="muted" style="margin:0;font-size:.84rem;line-height:1.5">' + question.why + '</p></article>';
        }).join(""); review.dataset.loaded = "true";
      }
      review.classList.remove("hidden");
    } else review.classList.add("hidden");
  }

  document.addEventListener("click", function (event) {
    var nav = event.target.closest("[data-nav]");
    if (nav) {
      event.preventDefault();
      var destination = nav.getAttribute("data-nav");
      if (destination === "simce" && !isUnlocked()) { toast("Completa las 9 tablas con al menos 4 respuestas correctas."); return; }
      renderView(destination); return;
    }
    var tableButton = event.target.closest("[data-table]");
    if (tableButton) { beginLesson(Number(tableButton.getAttribute("data-table"))); return; }
    var lessonButton = event.target.closest("[data-lesson-answer]");
    if (lessonButton) { answerLesson(Number(lessonButton.getAttribute("data-lesson-answer"))); return; }
    var gameButton = event.target.closest("[data-game-answer]");
    if (gameButton) { answerGame(Number(gameButton.getAttribute("data-game-answer")), gameButton); return; }
    var examNumber = event.target.closest("[data-exam-index]");
    if (examNumber) { examIndex = Number(examNumber.getAttribute("data-exam-index")); renderSimce(document.getElementById("main-content")); return; }
    var examAnswer = event.target.closest("[data-exam-answer]");
    if (examAnswer) { state.exam.answers[examIndex] = Number(examAnswer.getAttribute("data-exam-answer")); save(); renderSimce(document.getElementById("main-content")); return; }
    var actionButton = event.target.closest("[data-action]");
    if (!actionButton) return;
    var action = actionButton.getAttribute("data-action");
    if (action === "back-tables") renderView("learn");
    else if (action === "next-group") { lessonStep = Math.min(9, lessonStep + 1); renderLesson(); }
    else if (action === "start-quiz") startQuiz();
    else if (action === "repeat-lesson") beginLesson(table);
    else if (action === "lesson-next") { lessonAnswered = false; if (lessonIndex < 4) { lessonIndex += 1; renderLesson(); } else { lessonPhase = "result"; var saved = recordFor(table); saved.attempts += 1; saved.best = Math.max(saved.best || 0, lessonScore); if (lessonScore >= 4) saved.complete = true; state.tables[table] = saved; save(); checkAwards(); renderLesson(); if (lessonScore >= 4) sparkle(document.querySelector(".feedback-screen")); } }
    else if (action === "start-game") beginGame();
    else if (action === "exam-prev") { examIndex = Math.max(0, examIndex - 1); renderSimce(document.getElementById("main-content")); }
    else if (action === "exam-next") { examIndex = Math.min(9, examIndex + 1); renderSimce(document.getElementById("main-content")); }
    else if (action === "finish-exam") finishExam();
    else if (action === "restart-exam") { state.exam = { answers: new Array(10).fill(null), finished: false }; examIndex = 0; save(); renderSimce(document.getElementById("main-content")); }
    else if (action === "review-exam") showExamReview();
  });

  if (document.body.getAttribute("data-page") === "login") initLogin();
  if (document.body.getAttribute("data-page") === "app") initApp();
}());
