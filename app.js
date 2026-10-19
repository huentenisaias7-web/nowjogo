(function () {
  "use strict";

  var STORAGE_KEY = "misTablasStudent";
  var AUDIO_KEY = "misTablasAudio";
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
  var audioSettings = { sound: true, voice: true };
  var audioContext = null;
  var firstView = true;
  var narratedViews = {};
  var memoryDeck = [];
  var memoryFlipped = [];
  var memoryMatches = 0;
  var memoryMoves = 0;
  var memoryBusy = false;
  var memoryTimeout = null;
  var memoryTable = 6;
  var detectiveQuestions = [];
  var detectiveIndex = 0;
  var detectiveScore = 0;
  var detectiveAnswered = false;
  var builderRound = 0;
  var builderScore = 0;
  var builderGroups = 0;
  var builderTarget = 0;
  var builderSize = 0;
  var builderAnswered = false;
  var jumpQuestions = [];
  var jumpIndex = 0;
  var jumpScore = 0;
  var jumpAnswered = false;
  var sortItems = [];
  var sortChoices = [];
  var sortIndex = 0;
  var sortMessage = "";

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
  function loadAudioSettings() {
    try {
      var saved = JSON.parse(localStorage.getItem(AUDIO_KEY));
      if (saved) { audioSettings.sound = saved.sound !== false; audioSettings.voice = saved.voice !== false; }
    } catch (error) { /* Use the gentle defaults when settings are unreadable. */ }
  }
  function saveAudioSettings() { localStorage.setItem(AUDIO_KEY, JSON.stringify(audioSettings)); }
  function playSound(kind) {
    if (!audioSettings.sound) return;
    var AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    try {
      if (!audioContext) audioContext = new AudioContextClass();
      if (audioContext.state === "suspended") audioContext.resume();
      var now = audioContext.currentTime;
      var notes = kind === "correct" ? [{ hz: 660, at: 0, len: .075 }, { hz: 880, at: .075, len: .11 }] :
        kind === "incorrect" ? [{ hz: 245, at: 0, len: .14 }] :
        kind === "achievement" ? [{ hz: 523, at: 0, len: .09 }, { hz: 659, at: .08, len: .09 }, { hz: 784, at: .16, len: .17 }] :
        [{ hz: 480, at: 0, len: .035 }];
      notes.forEach(function (note) {
        var oscillator = audioContext.createOscillator();
        var gain = audioContext.createGain();
        var start = now + note.at;
        oscillator.type = kind === "incorrect" ? "triangle" : "sine";
        oscillator.frequency.setValueAtTime(note.hz, start);
        gain.gain.setValueAtTime(.0001, start);
        gain.gain.exponentialRampToValueAtTime(kind === "tap" ? .018 : .04, start + .012);
        gain.gain.exponentialRampToValueAtTime(.0001, start + note.len);
        oscillator.connect(gain); gain.connect(audioContext.destination);
        oscillator.start(start); oscillator.stop(start + note.len + .02);
      });
    } catch (error) { /* Audio stays optional on browsers that block it. */ }
  }
  function speakLine(text) {
    if (!audioSettings.voice || !window.speechSynthesis || !window.SpeechSynthesisUtterance) return;
    try {
      window.speechSynthesis.cancel();
      var line = new SpeechSynthesisUtterance(text);
      line.lang = "es-CL"; line.rate = .91; line.pitch = 1.04; line.volume = .58;
      var voices = window.speechSynthesis.getVoices();
      var spanish = voices.filter(function (voice) { return /^es([-_]|$)/i.test(voice.lang); });
      line.voice = spanish.find(function (voice) { return /es[-_]cl/i.test(voice.lang); }) || spanish[0] || null;
      window.speechSynthesis.speak(line);
    } catch (error) { /* Keep the visual and sound cues usable without speech support. */ }
  }
  function stopSpeech() {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  }
  function updateAudioButtons() {
    var sound = document.getElementById("sound-toggle");
    var voice = document.getElementById("voice-toggle");
    if (sound) {
      sound.setAttribute("aria-pressed", audioSettings.sound ? "true" : "false");
      sound.setAttribute("aria-label", audioSettings.sound ? "Desactivar sonidos" : "Activar sonidos");
      sound.title = audioSettings.sound ? "Sonidos activados" : "Sonidos desactivados";
      sound.textContent = audioSettings.sound ? "🔊" : "🔇";
    }
    if (voice) {
      voice.setAttribute("aria-pressed", audioSettings.voice ? "true" : "false");
      voice.setAttribute("aria-label", audioSettings.voice ? "Desactivar guía de voz" : "Activar guía de voz");
      voice.title = audioSettings.voice ? "Guía de voz activada" : "Guía de voz desactivada";
      voice.textContent = audioSettings.voice ? "🗣️" : "💬";
    }
  }
  function animatePoints(amount, anchor) {
    if (!amount) return;
    var target = anchor && anchor.getBoundingClientRect ? anchor : document.getElementById("header-streak");
    var rect = target ? target.getBoundingClientRect() : { left: innerWidth / 2, top: innerHeight / 2, width: 0 };
    var burst = document.createElement("span");
    burst.className = "points-pop"; burst.setAttribute("aria-hidden", "true"); burst.textContent = "+" + amount + " ⭐";
    burst.style.left = (rect.left + rect.width / 2) + "px"; burst.style.top = (rect.top - 5) + "px";
    document.body.appendChild(burst);
    target.classList.remove("reward-target"); void target.offsetWidth; target.classList.add("reward-target");
    window.setTimeout(function () { burst.remove(); target.classList.remove("reward-target"); }, 1000);
    sparkle(target);
  }
  function recordPoints(amount, anchor) {
    state.score += amount; save(); animatePoints(amount, anchor); checkAwards();
  }
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
  function toast(message, achievement) {
    var region = document.getElementById("toast-region");
    if (!region) return;
    var item = document.createElement("div");
    item.className = "toast" + (achievement ? " achievement-toast" : ""); item.textContent = message; region.appendChild(item);
    window.setTimeout(function () { item.remove(); }, 3100);
  }
  function sparkle(element) {
    var box = element && element.getBoundingClientRect ? element.getBoundingClientRect() : { left: innerWidth / 2, top: innerHeight / 2, width: 0 };
    var marks = ["✦", "✧", "★", "♥", "●"];
    for (var i = 0; i < 12; i += 1) {
      var node = document.createElement("span"); node.className = "sparkle"; node.setAttribute("aria-hidden", "true"); node.textContent = marks[i % marks.length];
      node.style.left = (box.left + box.width / 2 + Math.random() * 100 - 50) + "px";
      node.style.top = (box.top + Math.random() * 26 - 13) + "px";
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
    if (unlocked.length) {
      playSound("achievement");
      speakLine("¡Nuevo logro! " + unlocked[0]);
      unlocked.forEach(function (label, index) { window.setTimeout(function () { toast("🏅 Logro desbloqueado: " + label, true); }, index * 450); });
    }
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
    updateAudioButtons();
  }
  function initApp() {
    state = loadState();
    if (!state) { window.location.replace("../index.html"); return; }
    loadAudioSettings(); updateStreak(); renderFrame(); renderView("home");
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
    var paused = pauseTimedGame();
    if (gameDelay) { clearTimeout(gameDelay); gameDelay = null; }
    if (memoryTimeout) { clearTimeout(memoryTimeout); memoryTimeout = null; }
    stopSpeech();
    view = nextView; renderFrame();
    var main = document.getElementById("main-content"); main.innerHTML = ""; window.scrollTo(0, 0);
    if (view === "home") renderHome(main);
    else if (view === "learn") renderLearn(main);
    else if (view === "games") renderGames(main);
    else if (view === "progress") renderProgress(main);
    else if (view === "awards") renderAwards(main);
    else if (view === "simce") renderSimce(main);
    if (paused) toast("Reto pausado. Guardamos tus puntos.");
    if (!firstView && !narratedViews[nextView]) {
      var narration = {
        home: "¡Hola, " + state.profile.name + "! Elige una aventura para empezar.",
        learn: "Elige una tabla y descubre cómo crecen sus grupos.",
        games: "Escoge un juego. Cada uno practica las tablas de una forma distinta.",
        progress: "¡Muy bien, " + state.profile.name + "! Vas avanzando. Sigue así; cada día sabes un poco más.",
        awards: "Mira tus insignias y celebra lo que ya lograste.",
        simce: "Lee cada situación con calma. Puedes revisar las preguntas antes de terminar."
      };
      speakLine(narration[nextView] || "¡Sigamos aprendiendo!"); narratedViews[nextView] = true;
    }
    firstView = false;
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
    renderLesson(); speakLine("Vamos con la tabla del " + table + ". Mira cómo se forman los grupos.");
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
  function startQuiz() { buildLessonQuestions(); lessonPhase = "quiz"; lessonIndex = 0; lessonScore = 0; lessonAnswered = false; renderLesson(); speakLine("Mini desafío. Responde cinco preguntas y piensa con calma."); }
  function answerLesson(value) {
    if (lessonAnswered) return;
    stopSpeech();
    var question = lessonQuestions[lessonIndex]; question.selected = value; question.correct = value === question.answer; lessonAnswered = true;
    if (question.correct) { lessonScore += 1; playSound("correct"); recordPoints(5, document.activeElement); }
    else playSound("incorrect");
    save(); renderFrame(); renderLesson();
  }
  function nextLessonQuestion() {
    if (lessonIndex < 4) { lessonIndex += 1; lessonAnswered = false; renderLesson(); return; }
    var record = recordFor(table); record.attempts += 1; record.best = Math.max(record.best || 0, lessonScore); if (lessonScore >= 4) record.complete = true;
    state.tables[table] = record; save(); checkAwards(); lessonPhase = "result"; renderLesson();
    if (lessonScore >= 4) sparkle(document.querySelector(".feedback-screen"));
  }

  function renderGames(main) {
    main.innerHTML = heading("JUEGA Y PRACTICA", "¡A jugar! 🎮", "Activa tu mente con un desafío corto y divertido.")
      + '<section class="game-mode-grid" aria-label="Elige un juego"><article class="game-mode-card"><span class="game-mode-icon">⏱️</span><strong>Atrapa el resultado</strong><p>Reto rápido de 60 segundos. Responde y arma una racha.</p><button class="button button-primary" type="button" data-action="start-game">Comenzar reto →</button></article><article class="game-mode-card"><span class="game-mode-icon">🧠</span><strong>Memoria matemática</strong><p>Encuentra las parejas que unen multiplicación y resultado.</p><label class="memory-toolbar">Elige una tabla <select id="memory-table">' + TABLES.map(function (n) { return '<option value="' + n + '"' + (n === memoryTable ? " selected" : "") + '>Tabla del ' + n + '</option>'; }).join("") + '</select></label><button class="button button-secondary" type="button" data-action="start-memory">Voltear cartas →</button></article><article class="game-mode-card"><span class="game-mode-icon">🔎</span><strong>Detective matemático</strong><p>Lee pistas de la vida diaria y descubre el resultado oculto.</p><button class="button button-secondary" type="button" data-action="start-detective">Resolver pistas →</button></article><article class="game-mode-card"><span class="game-mode-icon">🧺</span><strong>Construye grupos</strong><p>Arma conjuntos iguales con fichas y comprueba la multiplicación.</p><button class="button button-secondary" type="button" data-action="start-builder">¡A construir! →</button></article><article class="game-mode-card"><span class="game-mode-icon">🦘</span><strong>Carrera de saltos</strong><p>Completa la secuencia y ayuda al canguro a llegar a la meta.</p><button class="button button-secondary" type="button" data-action="start-jumps">Saltar por la tabla →</button></article><article class="game-mode-card"><span class="game-mode-icon">🚀</span><strong>Ordena la misión</strong><p>Ordena multiplicaciones desde el resultado menor al mayor.</p><button class="button button-secondary" type="button" data-action="start-sort">Despegar →</button></article></section><div id="game-area"></div><div class="section-title"><h2>Una pista para todos los retos</h2></div><div class="pattern-note"><span>🎯</span><div>Multiplicar es formar grupos iguales. Si dudas, suma el mismo número varias veces. ¡No hay apuro: puedes pensar!</div></div>';
  }
  function shuffle(items) {
    for (var i = items.length - 1; i > 0; i -= 1) {
      var j = Math.floor(Math.random() * (i + 1)); var swap = items[i]; items[i] = items[j]; items[j] = swap;
    }
    return items;
  }
  function beginMemory() {
    pauseTimedGame();
    if (memoryTimeout) { clearTimeout(memoryTimeout); memoryTimeout = null; }
    var selector = document.getElementById("memory-table");
    if (selector) memoryTable = Number(selector.value) || memoryTable;
    memoryDeck = []; memoryFlipped = []; memoryMatches = 0; memoryMoves = 0; memoryBusy = false;
    for (var factor = 2; factor <= 5; factor += 1) {
      var pair = factor - 2; var product = factor * memoryTable;
      memoryDeck.push({ pair: pair, face: factor + " × " + memoryTable, matched: false, flipped: false });
      memoryDeck.push({ pair: pair, face: String(product), matched: false, flipped: false });
    }
    shuffle(memoryDeck); renderMemory();
    speakLine("Memoria matemática. Busca las cuatro parejas entre multiplicaciones y resultados.");
  }
  function renderMemory() {
    var area = document.getElementById("game-area"); if (!area) return;
    var finished = memoryMatches === 4;
    area.innerHTML = '<div class="section-title"><h2>Memoria matemática <span>· Tabla del ' + memoryTable + '</span></h2><button class="back-link" type="button" data-action="back-games">← Cambiar juego</button></div><div class="mode-score-row"><span class="mode-score-pill" id="memory-pairs">Parejas: ' + memoryMatches + ' / 4</span><span class="mode-score-pill" id="memory-moves">Intentos: ' + memoryMoves + '</span></div><div id="memory-message" class="feedback-box">Voltea dos cartas y busca la operación con su resultado.</div>' + (finished ? '<section class="end-panel card"><div class="end-emoji">🧠✨</div><h2>¡Memoria brillante!</h2><p>Encontraste las cuatro parejas en ' + memoryMoves + ' intentos. Ganaste puntos por cada pareja y un bono final.</p><div class="end-actions"><button class="button button-secondary" type="button" data-action="start-memory">Jugar otra vez</button><button class="button button-primary" type="button" data-action="back-games">Elegir otro juego</button></div></section>' : '<div class="memory-grid" aria-label="Cartas de memoria">' + memoryDeck.map(function (card, index) { return '<button type="button" class="memory-card ' + (card.flipped ? "flipped " : "") + (card.matched ? "matched" : "") + '" data-memory-card="' + index + '" aria-label="Carta ' + (index + 1) + (card.flipped || card.matched ? ": " + card.face : ", oculta") + '" ' + (card.matched ? "disabled" : "") + '><span class="memory-back">?</span><span class="memory-face">' + card.face + '</span></button>'; }).join("") + '</div>');
  }
  function flipMemoryCard(index) {
    if (memoryBusy || memoryDeck[index].matched || memoryDeck[index].flipped || memoryFlipped.length >= 2) return;
    stopSpeech();
    playSound("tap");
    memoryDeck[index].flipped = true; memoryFlipped.push(index);
    var cardButton = document.querySelector('[data-memory-card="' + index + '"]');
    if (cardButton) { cardButton.classList.add("flipped"); cardButton.setAttribute("aria-label", "Carta " + (index + 1) + ": " + memoryDeck[index].face); }
    if (memoryFlipped.length < 2) return;
    memoryMoves += 1; memoryBusy = true;
    var firstIndex = memoryFlipped[0], secondIndex = memoryFlipped[1];
    var firstCard = memoryDeck[firstIndex], secondCard = memoryDeck[secondIndex];
    var message = document.getElementById("memory-message");
    var moves = document.getElementById("memory-moves"); if (moves) moves.textContent = "Intentos: " + memoryMoves;
    if (firstCard.pair === secondCard.pair) {
      firstCard.matched = true; secondCard.matched = true; memoryMatches += 1;
      var firstNode = document.querySelector('[data-memory-card="' + firstIndex + '"]');
      var secondNode = document.querySelector('[data-memory-card="' + secondIndex + '"]');
      [firstNode, secondNode].forEach(function (node) { if (node) { node.classList.add("matched"); node.disabled = true; } });
      playSound("correct"); recordPoints(2, secondNode || firstNode);
      if (message) { message.className = "feedback-box good"; message.textContent = "¡Pareja encontrada! " + firstCard.face + " ↔ " + secondCard.face; }
      var pairs = document.getElementById("memory-pairs"); if (pairs) pairs.textContent = "Parejas: " + memoryMatches + " / 4";
      memoryFlipped = []; memoryBusy = false;
      if (memoryMatches === 4) {
        recordPoints(3, document.getElementById("memory-pairs")); playSound("achievement");
        speakLine("¡Memoria brillante! Encontraste todas las parejas."); renderMemory();
      }
    } else {
      playSound("incorrect"); if (message) { message.className = "feedback-box try-again"; message.textContent = "No coinciden todavía. Mira las cartas y prueba otra combinación."; }
      memoryTimeout = window.setTimeout(function () {
        [firstIndex, secondIndex].forEach(function (cardIndex) {
          memoryDeck[cardIndex].flipped = false;
          var node = document.querySelector('[data-memory-card="' + cardIndex + '"]');
          if (node) { node.classList.remove("flipped"); node.setAttribute("aria-label", "Carta " + (cardIndex + 1) + ", oculta"); }
        });
        memoryFlipped = []; memoryBusy = false; memoryTimeout = null;
      }, 900);
    }
  }
  var DETECTIVE_STORIES = [
    function (groups, amount) { return "La bibliotecaria ordena " + groups + " estantes con " + amount + " libros nuevos en cada uno. ¿Cuántos libros ordenó?"; },
    function (groups, amount) { return "Para una celebración preparan " + groups + " bandejas con " + amount + " galletas cada una. ¿Cuántas galletas hay?"; },
    function (groups, amount) { return "Hay " + groups + " equipos y cada equipo recibe " + amount + " pelotas. ¿Cuántas pelotas se reparten?"; },
    function (groups, amount) { return "En una feria se arman " + groups + " filas con " + amount + " plantas por fila. ¿Cuántas plantas se muestran?"; },
    function (groups, amount) { return "Cada caja guarda " + amount + " lápices. Si hay " + groups + " cajas, ¿cuántos lápices hay?"; }
  ];
  function beginDetective() {
    pauseTimedGame();
    if (memoryTimeout) { clearTimeout(memoryTimeout); memoryTimeout = null; }
    detectiveIndex = 0; detectiveScore = 0; detectiveAnswered = false; detectiveHintShown = false;
    detectiveQuestions = shuffle(DETECTIVE_STORIES.slice()).map(function (story) {
      var groups = Math.floor(Math.random() * 8) + 2;
      var amount = Math.floor(Math.random() * 9) + 2;
      var answer = groups * amount;
      return { text: story(groups, amount), groups: groups, amount: amount, answer: answer, options: makeOptions(answer, groups, amount), hint: "Pista: suma " + amount + " en grupos de " + groups + ". También puedes calcular " + groups + " × " + amount + ".", selected: null, correct: false };
    });
    renderDetective(); speakLine("Detective matemático. Lee la pista y descubre qué multiplicación resuelve el caso.");
  }
  function renderDetective() {
    var area = document.getElementById("game-area"); if (!area) return;
    var finished = detectiveIndex >= detectiveQuestions.length;
    if (finished) {
      var success = detectiveScore >= 4;
      area.innerHTML = '<section class="end-panel card"><div class="end-emoji">' + (success ? "🕵️🏆" : "🔎✨") + '</div><h2>' + (success ? "¡Caso resuelto!" : "¡Buen trabajo, detective!") + '</h2><p>Respondiste correctamente ' + detectiveScore + ' de 5 pistas. ' + (success ? "Tus ojos de detective encontraron casi todos los resultados." : "Puedes volver a jugar y seguir practicando con nuevas pistas.") + '</p><div class="mode-score-row"><span class="mode-score-pill">+' + (detectiveScore * 5) + ' ⭐ ganadas</span></div><div class="end-actions"><button class="button button-secondary" type="button" data-action="start-detective">Resolver otros casos</button><button class="button button-primary" type="button" data-action="back-games">Elegir otro juego</button></div></section>';
      speakLine(success ? "¡Caso resuelto! Eres un gran detective matemático." : "¡Buen trabajo! Cada pista te ayuda a aprender."); return;
    }
    var q = detectiveQuestions[detectiveIndex];
    area.innerHTML = '<section class="detective-card card"><div class="quiz-top"><span>CASO ' + (detectiveIndex + 1) + ' DE 5</span><span>🕵️ ' + detectiveScore + ' resueltos</span></div><div class="detective-clue"><span class="detective-clue-icon">🔎</span><strong>' + q.text + '</strong></div><button class="button button-soft detective-hint" type="button" data-action="hint-detective">💡 Pedir una pista</button><div class="feedback-box ' + (detectiveHintShown ? "" : "hidden") + '" id="detective-hint">' + q.hint + '</div><div class="answer-grid" style="margin-top:18px">' + q.options.map(function (option) {
      var cls = detectiveAnswered && option === q.answer ? " correct" : detectiveAnswered && option === q.selected ? " wrong" : "";
      return '<button class="answer-option' + cls + '" type="button" data-detective-answer="' + option + '" ' + (detectiveAnswered ? "disabled" : "") + '>' + option + '</button>';
    }).join("") + '</div><div class="feedback-box detective-feedback ' + (detectiveAnswered ? (q.correct ? "good" : "try-again") : "") + '">' + (detectiveAnswered ? (q.correct ? "¡Pista resuelta! Ganaste 5 puntos ⭐" : "El resultado era " + q.answer + ". " + q.groups + " grupos de " + q.amount + " son " + q.answer + ".") : "Elige el resultado que resuelve el caso.") + '</div>' + (detectiveAnswered ? '<div class="quiz-footer"><span class="muted">' + (detectiveIndex + 1) + ' de 5 pistas</span><button class="button button-primary" type="button" data-action="next-detective">' + (detectiveIndex < 4 ? "Siguiente caso →" : "Ver resultado →") + '</button></div>' : "") + '</section>';
  }
  var detectiveHintShown = false;
  function answerDetective(value, button) {
    if (detectiveAnswered) return;
    stopSpeech();
    var question = detectiveQuestions[detectiveIndex];
    question.selected = value; question.correct = value === question.answer; detectiveAnswered = true;
    if (question.correct) { detectiveScore += 1; playSound("correct"); recordPoints(5, button); }
    else playSound("incorrect");
    renderDetective();
  }
  function nextDetective() {
    if (!detectiveAnswered) return;
    detectiveIndex += 1; detectiveAnswered = false; detectiveHintShown = false; renderDetective();
  }
  function prepareStandaloneGame() {
    pauseTimedGame();
    if (memoryTimeout) { clearTimeout(memoryTimeout); memoryTimeout = null; }
  }
  function beginBuilder() {
    prepareStandaloneGame(); builderRound = 0; builderScore = 0; setBuilderChallenge(); renderBuilder();
    speakLine("Construye grupos iguales. Usa los botones para agregar o quitar grupos y luego comprueba.");
  }
  function setBuilderChallenge() {
    builderGroups = 0; builderTarget = Math.floor(Math.random() * 6) + 3;
    builderSize = Math.floor(Math.random() * 9) + 2; builderAnswered = false;
  }
  function renderBuilder() {
    var area = document.getElementById("game-area"); if (!area) return;
    if (builderRound >= 5) {
      area.innerHTML = '<section class="end-panel card"><div class="end-emoji">🧺🌟</div><h2>¡Construcción terminada!</h2><p>Construiste correctamente ' + builderScore + ' de 5 desafíos. Cada grupo igual ayuda a entender la multiplicación.</p><div class="mode-score-row"><span class="mode-score-pill">' + builderScore + ' misiones resueltas</span></div><div class="end-actions"><button class="button button-secondary" type="button" data-action="start-builder">Construir otra vez</button><button class="button button-primary" type="button" data-action="back-games">Elegir otro juego</button></div></section>';
      speakLine("¡Construcción terminada! Resuelves cada vez más multiplicaciones."); return;
    }
    var groups = "";
    for (var g = 0; g < builderGroups; g += 1) {
      groups += '<div class="build-group" aria-label="Grupo ' + (g + 1) + '">';
      for (var d = 0; d < builderSize; d += 1) groups += '<span class="build-token" aria-hidden="true">✦</span>';
      groups += '</div>';
    }
    if (!groups) groups = '<div class="build-empty">Toca “Agregar grupo” para empezar ✨</div>';
    area.innerHTML = '<section class="builder-card card"><div class="quiz-top"><span>MISIÓN ' + (builderRound + 1) + ' DE 5</span><span>🧺 ' + builderScore + ' resueltas</span></div><h2>Construye ' + builderTarget + ' grupos con ' + builderSize + ' fichas en cada uno.</h2><p class="muted">Cada grupo debe tener la misma cantidad. ¿Cuántas fichas habrá en total cuando termines?</p><div class="builder-stage"><div class="builder-groups">' + groups + '</div><div class="builder-total"><span>GRUPOS</span><strong>' + builderGroups + ' / ' + builderTarget + '</strong><span>Fichas en total: ' + (builderGroups * builderSize) + '</span></div></div><div class="builder-controls"><button class="button button-soft" type="button" data-action="builder-minus" aria-label="Quitar un grupo" ' + (builderAnswered || builderGroups === 0 ? "disabled" : "") + '>− Quitar grupo</button><button class="button button-primary" type="button" data-action="builder-plus" ' + (builderAnswered || builderGroups >= builderTarget + 2 ? "disabled" : "") + '>＋ Agregar grupo</button></div>' + (builderAnswered ? '<div class="feedback-box ' + (builderGroups === builderTarget ? "good" : "try-again") + '">' + (builderGroups === builderTarget ? "¡Lo lograste! " + builderTarget + " grupos de " + builderSize + " forman " + (builderTarget * builderSize) + " fichas. ¡Ganaste 5 puntos!" : "Hay " + builderGroups + " grupos. La misión pide " + builderTarget + ". Ajusta la cantidad en el próximo desafío y recuerda: " + builderTarget + " × " + builderSize + " = " + (builderTarget * builderSize) + ".") + '</div><div class="quiz-footer"><span class="muted">' + (builderRound + 1) + ' de 5 construcciones</span><button class="button button-primary" type="button" data-action="next-builder">Siguiente misión →</button></div>' : '<div class="quiz-footer"><span class="muted">Puedes ajustar tus grupos antes de revisar.</span><button class="button button-primary" type="button" data-action="check-builder">Comprobar grupos ✓</button></div>') + '</section>';
  }
  function checkBuilder(button) {
    if (builderAnswered) return;
    builderAnswered = true;
    if (builderGroups === builderTarget) { builderScore += 1; playSound("correct"); recordPoints(5, button); }
    else playSound("incorrect");
    renderBuilder();
  }
  function nextBuilder() {
    if (!builderAnswered) return;
    builderRound += 1;
    if (builderRound < 5) setBuilderChallenge();
    renderBuilder();
  }
  function beginJumps() {
    prepareStandaloneGame(); jumpIndex = 0; jumpScore = 0;
    jumpQuestions = [];
    for (var i = 0; i < 5; i += 1) {
      var jumpTable = TABLES[Math.floor(Math.random() * TABLES.length)];
      var start = Math.floor(Math.random() * 5) + 2;
      var missing = Math.floor(Math.random() * 3) + 1;
      var sequence = [];
      for (var step = 0; step < 5; step += 1) sequence.push((start + step) * jumpTable);
      jumpQuestions.push({ table: jumpTable, missingFactor: start + missing, missingIndex: missing, sequence: sequence, answer: (start + missing) * jumpTable, options: makeOptions((start + missing) * jumpTable, jumpTable, start + missing), selected: null, correct: false });
    }
    jumpAnswered = false; renderJumps(); speakLine("Carrera de saltos. Completa el número que falta en la secuencia de la tabla.");
  }
  function renderJumps() {
    var area = document.getElementById("game-area"); if (!area) return;
    if (jumpIndex >= jumpQuestions.length) {
      area.innerHTML = '<section class="end-panel card"><div class="end-emoji">🦘🏁</div><h2>¡Llegaste a la meta!</h2><p>Completaste correctamente ' + jumpScore + ' de 5 secuencias. ¡Tu mente dio grandes saltos!</p><div class="end-actions"><button class="button button-secondary" type="button" data-action="start-jumps">Correr otra vez</button><button class="button button-primary" type="button" data-action="back-games">Elegir otro juego</button></div></section>';
      speakLine("¡Llegaste a la meta! Muy bien por completar la carrera."); return;
    }
    var q = jumpQuestions[jumpIndex];
    var sequence = q.sequence.map(function (value, index) { return '<span class="jump-step ' + (index === q.missingIndex ? "jump-missing" : "") + '">' + (index === q.missingIndex ? (jumpAnswered ? q.answer : "?") : value) + '</span>' + (index < q.sequence.length - 1 ? '<span class="jump-arrow" aria-hidden="true">→</span>' : ""); }).join("");
    area.innerHTML = '<section class="jump-card card"><div class="quiz-top"><span>CARRERA ' + (jumpIndex + 1) + ' DE 5</span><span>🏁 ' + jumpScore + ' aciertos</span></div><div class="jump-mascot" aria-hidden="true">🦘</div><h2>¿Qué número sigue en los saltos de ' + q.table + '?</h2><div class="jump-sequence" aria-label="Secuencia de la tabla del ' + q.table + '">' + sequence + '</div><div class="answer-grid jump-answers">' + q.options.map(function (value) {
      var cls = jumpAnswered && value === q.answer ? " correct" : jumpAnswered && value === q.selected ? " wrong" : "";
      return '<button class="answer-option' + cls + '" type="button" data-jump-answer="' + value + '" ' + (jumpAnswered ? "disabled" : "") + '>' + value + '</button>';
    }).join("") + '</div><div class="feedback-box ' + (jumpAnswered ? (q.correct ? "good" : "try-again") : "") + '">' + (jumpAnswered ? (q.correct ? "¡Salto perfecto! Ganaste 5 puntos. La tabla avanza de " + q.table + " en " + q.table + "." : "¡Casi! La respuesta es " + q.answer + ". Cuenta saltando de " + q.table + " en " + q.table + ".") : "Elige el número que aterriza en el espacio vacío.") + '</div>' + (jumpAnswered ? '<div class="quiz-footer"><span class="muted">' + (jumpIndex + 1) + ' de 5 carreras</span><button class="button button-primary" type="button" data-action="next-jump">Siguiente salto →</button></div>' : "") + '</section>';
  }
  function answerJump(value, button) {
    if (jumpAnswered) return;
    stopSpeech(); var q = jumpQuestions[jumpIndex]; q.selected = value; q.correct = value === q.answer; jumpAnswered = true;
    if (q.correct) { jumpScore += 1; playSound("correct"); recordPoints(5, button); } else playSound("incorrect");
    renderJumps();
  }
  function nextJump() {
    if (!jumpAnswered) return;
    jumpIndex += 1; jumpAnswered = false; renderJumps();
  }
  var SORT_POOL = [
    { a: 2, b: 2 }, { a: 2, b: 3 }, { a: 2, b: 4 }, { a: 3, b: 3 },
    { a: 2, b: 5 }, { a: 3, b: 4 }, { a: 2, b: 7 }, { a: 3, b: 5 },
    { a: 4, b: 4 }, { a: 2, b: 9 }, { a: 4, b: 5 }
  ];
  function beginSort() {
    prepareStandaloneGame();
    var chosen = shuffle(SORT_POOL.slice()).slice(0, 4).map(function (item, index) { return { id: index, a: item.a, b: item.b, product: item.a * item.b }; });
    sortItems = chosen.slice().sort(function (a, b) { return a.product - b.product; });
    sortChoices = shuffle(chosen.slice()); sortIndex = 0; sortMessage = ""; renderSort();
    speakLine("Ordena la misión. Elige primero la multiplicación con el resultado menor y sigue hasta el mayor.");
  }
  function renderSort() {
    var area = document.getElementById("game-area"); if (!area) return;
    if (sortIndex >= sortItems.length) {
      area.innerHTML = '<section class="end-panel card"><div class="end-emoji">🚀🌟</div><h2>¡Misión en órbita!</h2><p>Ordenaste cuatro multiplicaciones del resultado menor al mayor. ¡Ganaste puntos en cada paso!</p><div class="end-actions"><button class="button button-secondary" type="button" data-action="start-sort">Jugar otra misión</button><button class="button button-primary" type="button" data-action="back-games">Elegir otro juego</button></div></section>';
      speakLine("¡Misión en órbita! Tu nave llegó al destino gracias a tu estrategia."); return;
    }
    var picked = sortItems.slice(0, sortIndex).map(function (item, index) { return '<span class="sort-chip">' + (index + 1) + ". " + item.a + " × " + item.b + " = " + item.product + '</span>'; }).join("");
    area.innerHTML = '<section class="sort-card card"><div class="quiz-top"><span>MISIÓN DE ORDEN</span><span>🚀 ' + sortIndex + ' / 4 correctas</span></div><h2>Elige primero el resultado menor</h2><p class="muted">Calcula cada multiplicación. Después ordenaremos las cuatro respuestas de menor a mayor.</p><div class="sort-progress" aria-label="Multiplicaciones ordenadas">' + picked + (sortIndex < 4 ? '<span class="sort-placeholder">' + (sortIndex + 1) + '. ¿Cuál sigue?</span>' : "") + '</div><div class="sort-options">' + sortChoices.filter(function (item) { return sortItems.slice(0, sortIndex).every(function (done) { return done.id !== item.id; }); }).map(function (item) { return '<button class="sort-option" type="button" data-sort-item="' + item.id + '"><span>' + item.a + ' × ' + item.b + '</span><strong>?</strong></button>'; }).join("") + '</div><div class="feedback-box ' + (sortMessage.indexOf("¡Correcto") === 0 ? "good" : sortMessage ? "try-again" : "") + '" aria-live="polite">' + (sortMessage || "Selecciona una tarjeta para continuar la secuencia.") + '</div></section>';
  }
  function chooseSortItem(id, button) {
    if (sortIndex >= sortItems.length) return;
    var selected = sortChoices.find(function (item) { return item.id === id; });
    if (!selected) return;
    if (selected.id === sortItems[sortIndex].id) {
      sortIndex += 1; sortMessage = "¡Correcto! Ese era el resultado menor que faltaba. Ganaste 2 puntos.";
      recordPoints(2, button);
      if (sortIndex === sortItems.length) { recordPoints(3, button); playSound("achievement"); }
      else playSound("correct");
    } else {
      sortMessage = "Todavía hay un resultado menor. Prueba calculando y comparando las multiplicaciones.";
      playSound("incorrect");
    }
    renderSort();
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
  function pauseTimedGame() {
    if (!gameInterval) return false;
    clearInterval(gameInterval); gameInterval = null;
    if (gameDelay) { clearTimeout(gameDelay); gameDelay = null; }
    state.score += gameScore; state.gameBest = Math.max(state.gameBest || 0, gameScore); save(); checkAwards();
    gameScore = 0;
    return true;
  }
  function beginGame() {
    pauseTimedGame();
    if (gameDelay) clearTimeout(gameDelay);
    if (memoryTimeout) { clearTimeout(memoryTimeout); memoryTimeout = null; }
    gameTime = 60; gameScore = 0; gameStreak = 0; bestStreak = 0;
    document.getElementById("game-area").innerHTML = '<div class="game-layout"><section class="quiz-card card"><div class="quiz-top"><span>Reto rápido</span><span class="timer-pill" id="game-clock">60 s</span></div><p class="question-text" id="game-question"></p><div class="answer-grid" id="game-options"></div><div class="feedback-box" id="game-feedback">Elige una respuesta para seguir jugando.</div></section><aside class="game-side card"><h3>Tu reto</h3><div class="game-stat"><strong id="game-points">0</strong><span>Puntos de hoy</span></div><div class="game-stat"><strong id="game-streak">0</strong><span>Racha actual</span></div><div class="game-stat"><strong>' + (state.gameBest || 0) + '</strong><span>Mejor puntaje</span></div></aside></div>';
    gameInterval = window.setInterval(function () {
      gameTime -= 1; var clock = document.getElementById("game-clock");
      if (clock) { clock.textContent = gameTime + " s"; if (gameTime <= 10) clock.classList.add("try-again"); }
      if (gameTime <= 0) endGame();
    }, 1000);
    newRound(); speakLine("Tienes un minuto para atrapar resultados. ¡Puedes hacerlo!");
  }
  function answerGame(value, button) {
    if (!round || !button || button.disabled) return;
    stopSpeech();
    var answer = round.answer, correct = value === answer, feedback = document.getElementById("game-feedback");
    document.querySelectorAll("[data-game-answer]").forEach(function (option) {
      option.disabled = true; if (Number(option.getAttribute("data-game-answer")) === answer) option.classList.add("correct");
    });
    if (correct) {
      gameScore += 1; gameStreak += 1; bestStreak = Math.max(bestStreak, gameStreak);
      feedback.className = "feedback-box good"; feedback.textContent = "¡Sí! " + round.a + " × " + round.b + " = " + answer + ". ¡Sigue así!"; playSound("correct"); animatePoints(1, button);
    } else {
      button.classList.add("wrong"); gameStreak = 0; feedback.className = "feedback-box try-again"; playSound("incorrect");
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
    if (gameScore) animatePoints(gameScore, area.querySelector(".end-panel"));
    playSound(gameScore >= 10 ? "achievement" : "correct");
    speakLine("Terminó el reto. Lograste " + gameScore + " respuestas correctas. ¡Buen trabajo!");
  }

  function renderProgress(main) {
    var count = completeCount();
    var rows = TABLES.map(function (n) {
      var record = recordFor(n), percentage = progressOf(record);
      return '<div class="card" style="padding:17px 19px;margin-bottom:10px"><div class="progress-label"><span>Tabla del ' + n + (record.complete ? " ✓" : "") + '</span><span>' + (record.complete ? "Dominada" : record.attempts ? "Mejor resultado " + record.best + " / 5" : "Por comenzar") + '</span></div><div class="progress-track"><span style="width:' + percentage + '%"></span></div><button class="back-link" type="button" style="margin:10px 0 0;padding:0;font-size:.77rem" data-table="' + n + '">' + (record.attempts ? "Practicar de nuevo →" : "Empezar esta tabla →") + '</button></div>';
    }).join("");
    main.innerHTML = heading("TU CAMINO", "¡Mira cuánto avanzas! 📈", "Cada práctica cuenta. Repite las tablas para superar tu mejor resultado.")
      + '<section class="progress-congrats card" aria-label="Felicitaciones"><span class="congrats-spark" aria-hidden="true">✨</span><span class="congrats-avatar" aria-hidden="true">' + esc(state.profile.avatar || "🦊") + '</span><div><span class="kicker">¡VAS MUY BIEN!</span><h2>¡Sigue así, ' + esc(state.profile.name) + '!</h2><p>Cada práctica te hace más fuerte. Ya reuniste <strong>' + state.score + ' puntos</strong> y dominaste <strong>' + count + ' de 9 tablas</strong>. ¡Tu esfuerzo merece una celebración!</p></div><span class="congrats-star" aria-hidden="true">🌟</span></section><div class="stats-row"><div class="stat-card card"><span class="stat-icon">⭐</span><div><strong>' + state.score + '</strong><span>Puntos totales</span></div></div><div class="stat-card card"><span class="stat-icon">📚</span><div><strong>' + count + ' / 9</strong><span>Tablas dominadas</span></div></div><div class="stat-card card"><span class="stat-icon">🏅</span><div><strong>' + Object.keys(state.awards).length + '</strong><span>Logros ganados</span></div></div></div><div class="section-title"><h2>Avance por tabla</h2><span>' + Math.round(count / 9 * 100) + '% completado</span></div>' + rows;
    launchProgressConfetti(main);
  }
  function launchProgressConfetti(main) {
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    document.querySelectorAll(".confetti-rain").forEach(function (oldRain) { oldRain.remove(); });
    var rain = document.createElement("div");
    rain.className = "confetti-rain"; rain.setAttribute("aria-hidden", "true");
    var colors = ["#ffca5c", "#ff7f87", "#7a70ee", "#48c99a", "#53b9e8", "#fa9c55"];
    for (var i = 0; i < 30; i += 1) {
      var piece = document.createElement("span");
      piece.className = "confetti-piece";
      piece.style.left = (Math.random() * 100) + "%";
      piece.style.backgroundColor = colors[i % colors.length];
      piece.style.animationDelay = (Math.random() * .8) + "s";
      piece.style.setProperty("--drift", (Math.random() * 150 - 75) + "px");
      piece.style.setProperty("--spin", (Math.random() * 900 + 360) + "deg");
      rain.appendChild(piece);
    }
    document.body.appendChild(rain);
    window.setTimeout(function () { rain.remove(); }, 3300);
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
    if (correct) animatePoints(correct * 10, document.querySelector(".feedback-screen"));
    playSound(state.exam.percent >= 80 ? "achievement" : state.exam.percent >= 50 ? "correct" : "incorrect");
    speakLine("Ensayo terminado. Lograste " + state.exam.percent + " por ciento.");
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
    var pressedButton = event.target.closest("button");
    if (pressedButton && !pressedButton.disabled && !pressedButton.hasAttribute("data-lesson-answer") && !pressedButton.hasAttribute("data-game-answer") && !pressedButton.hasAttribute("data-detective-answer") && !pressedButton.hasAttribute("data-memory-card") && !pressedButton.hasAttribute("data-jump-answer") && !pressedButton.hasAttribute("data-sort-item")) playSound("tap");
    var audioToggle = event.target.closest("[data-audio-toggle]");
    if (audioToggle) {
      var setting = audioToggle.getAttribute("data-audio-toggle");
      audioSettings[setting] = !audioSettings[setting]; saveAudioSettings(); updateAudioButtons();
      if (setting === "voice") {
        if (audioSettings.voice) speakLine("La guía de voz está activa. Daré instrucciones breves para acompañarte.");
        else if (window.speechSynthesis) window.speechSynthesis.cancel();
      }
      if (setting === "sound" && audioSettings.sound) playSound("tap");
      return;
    }
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
    var memoryButton = event.target.closest("[data-memory-card]");
    if (memoryButton) { flipMemoryCard(Number(memoryButton.getAttribute("data-memory-card"))); return; }
    var detectiveButton = event.target.closest("[data-detective-answer]");
    if (detectiveButton) { answerDetective(Number(detectiveButton.getAttribute("data-detective-answer")), detectiveButton); return; }
    var jumpButton = event.target.closest("[data-jump-answer]");
    if (jumpButton) { answerJump(Number(jumpButton.getAttribute("data-jump-answer")), jumpButton); return; }
    var sortButton = event.target.closest("[data-sort-item]");
    if (sortButton) { chooseSortItem(Number(sortButton.getAttribute("data-sort-item")), sortButton); return; }
    var examNumber = event.target.closest("[data-exam-index]");
    if (examNumber) { examIndex = Number(examNumber.getAttribute("data-exam-index")); renderSimce(document.getElementById("main-content")); return; }
    var examAnswer = event.target.closest("[data-exam-answer]");
    if (examAnswer) { state.exam.answers[examIndex] = Number(examAnswer.getAttribute("data-exam-answer")); save(); renderSimce(document.getElementById("main-content")); return; }
    var actionButton = event.target.closest("[data-action]");
    if (!actionButton) return;
    var action = actionButton.getAttribute("data-action");
    if (action === "back-tables") renderView("learn");
    else if (action === "back-games") renderView("games");
    else if (action === "next-group") { lessonStep = Math.min(9, lessonStep + 1); renderLesson(); }
    else if (action === "start-quiz") startQuiz();
    else if (action === "repeat-lesson") beginLesson(table);
    else if (action === "lesson-next") nextLessonQuestion();
    else if (action === "start-game") beginGame();
    else if (action === "start-memory") beginMemory();
    else if (action === "start-detective") beginDetective();
    else if (action === "start-builder") beginBuilder();
    else if (action === "builder-minus") { builderGroups = Math.max(0, builderGroups - 1); renderBuilder(); }
    else if (action === "builder-plus") { builderGroups = Math.min(builderTarget + 2, builderGroups + 1); renderBuilder(); }
    else if (action === "check-builder") checkBuilder(actionButton);
    else if (action === "next-builder") nextBuilder();
    else if (action === "start-jumps") beginJumps();
    else if (action === "next-jump") nextJump();
    else if (action === "start-sort") beginSort();
    else if (action === "hint-detective") {
      detectiveHintShown = !detectiveHintShown;
      if (detectiveHintShown) speakLine(detectiveQuestions[detectiveIndex].hint); else stopSpeech();
      renderDetective();
    }
    else if (action === "next-detective") nextDetective();
    else if (action === "exam-prev") { examIndex = Math.max(0, examIndex - 1); renderSimce(document.getElementById("main-content")); }
    else if (action === "exam-next") { examIndex = Math.min(9, examIndex + 1); renderSimce(document.getElementById("main-content")); }
    else if (action === "finish-exam") finishExam();
    else if (action === "restart-exam") { state.exam = { answers: new Array(10).fill(null), finished: false }; examIndex = 0; save(); renderSimce(document.getElementById("main-content")); }
    else if (action === "review-exam") showExamReview();
  });

  if (document.body.getAttribute("data-page") === "login") initLogin();
  if (document.body.getAttribute("data-page") === "app") initApp();
}());
