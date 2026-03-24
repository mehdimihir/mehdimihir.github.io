// Mehdi Mihir · Portfolio
// script.js - Cosmic OS Redesign
// Bug fix: containment: 'parent' (was 'body') prevents window drift on resize

// ── Ambient Particle System ──────────────────────────────────
(function initParticles() {
  const canvas  = document.getElementById('ambient-canvas');
  if (!canvas) return;
  const ctx     = canvas.getContext('2d');
  let W, H, particles;
  const COUNT   = 65;
  // Ocean bioluminescence: cyan, teal, aqua, deep blue
  const PALETTE = [
    [0,   229, 255],   // bright bio-cyan
    [6,   182, 212],   // teal
    [56,  189, 248],   // sky blue
    [99,  102, 241],   // indigo depth
    [165, 243, 252],   // pale aqua
    [14,  116, 144],   // deep teal
  ];

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function rand(min, max) { return Math.random() * (max - min) + min; }

  function mkParticle() {
    const [r, g, b] = PALETTE[Math.floor(Math.random() * PALETTE.length)];
    return {
      x:    rand(0, W),
      y:    rand(0, H),
      r:    rand(1.5, 5),
      alpha:rand(0.03, 0.14),
      vx:   rand(-0.12, 0.12),
      vy:   rand(-0.18, -0.04),
      pulse:rand(0, Math.PI * 2),
      pSpeed:rand(0.003, 0.009),
      r_base:0,
      g,
      b,
      red: r,
    };
  }

  function init() {
    resize();
    particles = Array.from({ length: COUNT }, mkParticle);
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    for (const p of particles) {
      p.pulse += p.pSpeed;
      const glow  = 1 + 0.4 * Math.sin(p.pulse);
      const r     = p.r * glow;
      const alpha = p.alpha * (0.8 + 0.2 * Math.sin(p.pulse));

      // Soft radial glow
      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 4);
      grad.addColorStop(0,   `rgba(${p.red},${p.g},${p.b},${alpha})`);
      grad.addColorStop(0.5, `rgba(${p.red},${p.g},${p.b},${alpha * 0.3})`);
      grad.addColorStop(1,   `rgba(${p.red},${p.g},${p.b},0)`);

      ctx.beginPath();
      ctx.arc(p.x, p.y, r * 4, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      // Move
      p.x += p.vx;
      p.y += p.vy;

      // Wrap
      if (p.y < -20) { p.y = H + 10; p.x = rand(0, W); }
      if (p.x < -20) p.x = W + 10;
      if (p.x > W + 20) p.x = -10;
    }

    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', resize);
  init();
  draw();
})();


// ── Main Portfolio App ────────────────────────────────────────
$(document).ready(function () {

  // ── State ──
  var windowPositions     = {};
  var preTileSizes        = {};
  var activeWindowId      = null;
  var windowZIndexCounter = 1000;

  function restoreTileSize(windowId) {
    if (preTileSizes[windowId]) {
      const s = preTileSizes[windowId];
      $('#' + windowId).css({ width: s.width, height: s.height });
      delete preTileSizes[windowId];
    }
  }

  if (!sessionStorage.getItem('closedWindows')) {
    sessionStorage.setItem('closedWindows', JSON.stringify([]));
  }

  // ── Clock ──
  function updateClock() {
    const now     = new Date();
    let hours     = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const ampm    = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    $('#clock').text(`${hours}:${minutes} ${ampm}`);
  }
  updateClock();
  setInterval(updateClock, 30000);

  // ── Window management ──
  function makeWindowActive(windowId) {
    $('.window').css('z-index', 10).removeClass('window-focused');
    $('#' + windowId).css('z-index', windowZIndexCounter++).addClass('window-focused');
    activeWindowId = windowId;
    $('.taskbar-button').removeClass('active');
    $(`.taskbar-button[data-window="${windowId}"]`).addClass('active');
    $('#' + windowId).removeClass('minimized');
    updateSidebarActive(windowId);
  }

  function minimizeWindow(windowId) {
    if (!windowPositions[windowId]) {
      windowPositions[windowId] = {
        top:  $('#' + windowId).css('top'),
        left: $('#' + windowId).css('left'),
      };
    }
    $('#' + windowId).addClass('minimized').hide();
    $(`.taskbar-button[data-window="${windowId}"]`).removeClass('active');
  }

  function restoreWindow(windowId) {
    if (windowPositions[windowId]) {
      $('#' + windowId).css({
        top:  windowPositions[windowId].top,
        left: windowPositions[windowId].left,
      });
    }
    restoreTileSize(windowId);
    $('#' + windowId).removeClass('minimized').show();
    makeWindowActive(windowId);
  }

  function closeWindow(windowId) {
    $('#' + windowId).hide();
    $(`.taskbar-button[data-window="${windowId}"]`).remove();
    const closed = JSON.parse(sessionStorage.getItem('closedWindows') || '[]');
    if (!closed.includes(windowId)) {
      closed.push(windowId);
      sessionStorage.setItem('closedWindows', JSON.stringify(closed));
    }
  }

  function updateSidebarActive(windowId) {
    const section = windowId.replace('-window', '');
    $('.sidebar a').removeClass('nav-active');
    $(`.sidebar a[href="#${section}"]`).addClass('nav-active');
  }

  // ── Sidebar nav ──
  $('.sidebar a').on('click', function (e) {
    e.preventDefault();
    const target   = $(this).attr('href').substring(1);
    const windowId = target + '-window';
    if ($('#' + windowId).is(':visible') && !$('#' + windowId).hasClass('minimized')) {
      makeWindowActive(windowId);
    } else if ($('#' + windowId).hasClass('minimized')) {
      restoreWindow(windowId);
    } else {
      openWindow(target);
    }
    history.replaceState(null, null, `#${target}`);
  });

  // ── Window controls ──
  $(document).on('click', '.window-minimize', function () {
    minimizeWindow($(this).closest('.window').attr('id'));
  });

  $(document).on('click', '.window-close', function () {
    closeWindow($(this).closest('.window').attr('id'));
  });

  $(document).on('mousedown', '.window', function () {
    const id = $(this).attr('id');
    if (!$(this).hasClass('minimized') && $(this).is(':visible')) {
      makeWindowActive(id);
    }
  });

  // ── Context menu ──
  $(document).on('contextmenu', function (e) {
    e.preventDefault();
    $('.context-menu').remove();
    const menu = $(`
      <div class="context-menu" style="top:${e.clientY}px;left:${e.clientX}px">
        <div class="context-menu-item" id="ctx-refresh">⟳ &nbsp;Refresh</div>
        <div class="context-menu-separator"></div>
        <div class="context-menu-item" id="ctx-tile">⊞ &nbsp;Tile Windows</div>
        <div class="context-menu-separator"></div>
        <div class="context-menu-item" id="ctx-about">✦ &nbsp;Properties</div>
      </div>
    `);
    $('body').append(menu);
    $('#ctx-refresh').on('click', () => location.reload());
    $('#ctx-tile').on('click',    () => { tileWindows(); $('.context-menu').remove(); });
    $('#ctx-about').on('click',   () => { alert('Portfolio by Mehdi Mihir · 2025'); $('.context-menu').remove(); });
    $(document).one('click', () => $('.context-menu').remove());
  });

  // ── Tile windows ──
  function tileWindows() {
    const wins = $('.window:visible').not('.minimized');
    const n    = wins.length;
    if (!n) return;
    const cols = Math.ceil(Math.sqrt(n));
    const rows = Math.ceil(n / cols);
    const dw   = Math.floor($('#desktop').width() / cols);
    const dh   = Math.floor($('#desktop').height() / rows);
    wins.each(function (i) {
      const id = $(this).attr('id');
      if (!preTileSizes[id]) {
        preTileSizes[id] = {
          width:  $(this)[0].style.width  || '',
          height: $(this)[0].style.height || '',
        };
      }
      $(this).css({
        left:   (i % cols) * dw + 'px',
        top:    Math.floor(i / cols) * dh + 'px',
        width:  (dw - 8) + 'px',
        height: (dh - 8) + 'px',
      });
    });
  }



  // ── Hash change ──
  $(window).on('hashchange', initializeWindows);

  function initializeWindows() {
    const hash     = window.location.hash.substring(1) || 'about';
    const windowId = hash + '-window';
    const closed   = JSON.parse(sessionStorage.getItem('closedWindows') || '[]');
    if (closed.includes(windowId)) return;
    $('.taskbar-buttons').empty();
    $('.window').hide();
    openWindow(hash);
  }

  // ── Taskbar ──
  function addToTaskbar(windowId, title) {
    if (!$(`.taskbar-button[data-window="${windowId}"]`).length) {
      $('.taskbar-buttons').append(
        `<div class="taskbar-button active" data-window="${windowId}">${title}</div>`
      );
    } else {
      $(`.taskbar-button[data-window="${windowId}"]`).addClass('active');
    }
  }

  $(document).on('click', '.taskbar-button', function () {
    const id = $(this).data('window');
    if (!$('#' + id).length) { $(this).remove(); return; }
    if ($('#' + id).is(':visible') && !$('#' + id).hasClass('minimized')) {
      minimizeWindow(id);
    } else {
      restoreWindow(id);
    }
  });

  // ── Open window ──
  function openWindow(sectionName) {
    const windowId = sectionName + '-window';
    const el       = $('#' + windowId);

    if (el.hasClass('minimized')) { restoreWindow(windowId); return; }

    // Offset left enough to clear the floating sidebar (~210px wide incl margin)
    const defaults = {
      about:      { left: 215, top: 30  },
      experience: { left: 235, top: 50  },
      projects:   { left: 255, top: 70  },
      skills:     { left: 275, top: 90  },
      resume:     { left: 295, top: 110 },
      papers:     { left: 315, top: 130 },
    };

    const dw = $('#desktop').width();
    const dh = $('#desktop').height();
    const pos = defaults[sectionName] || { left: 80, top: 60 };
    let L = pos.left, T = pos.top;
    const elW = el.outerWidth()  || 420;
    const elH = el.outerHeight() || 320;

    if (L + elW > dw) L = Math.max(215, dw - elW - 10);
    if (T + elH > dh) T = Math.max(0,   dh - elH);

    el.css({ position: 'absolute', left: L + 'px', top: T + 'px' });
    restoreTileSize(windowId);
    el.addClass('window-entering');
    el.show();
    setTimeout(() => el.removeClass('window-entering'), 250);

    windowPositions[windowId] = { top: T + 'px', left: L + 'px' };
    addToTaskbar(windowId, el.find('.window-title-text').text());
    makeWindowActive(windowId);
  }

  // ── Start button / menu ──
  $('.start-button').on('click', function (e) {
    e.stopPropagation();
    if ($('.start-menu').length) { $('.start-menu').remove(); return; }

    // Get current time for the menu header
    const now    = new Date();
    let   hh     = now.getHours();
    const mm     = now.getMinutes().toString().padStart(2, '0');
    const ampm   = hh >= 12 ? 'pm' : 'am';
    hh = (hh % 12) || 12;
    const timeStr = `${hh}:${mm} ${ampm}`;
    const dateStr = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

    const menu = $(`
      <div class="start-menu">
        <div class="start-menu-header">
          <div class="start-menu-name">Mehdi Mihir</div>
          <div class="start-menu-meta">
            <span class="start-menu-time">${timeStr}</span>
            <span class="start-menu-date">${dateStr}</span>
          </div>
        </div>
        <div class="start-menu-items">
          <div class="start-menu-label">workspace</div>
          <div class="start-menu-item sm-icon-about"   data-section="about">about</div>
          <div class="start-menu-item sm-icon-exp"     data-section="experience">experience</div>
          <div class="start-menu-item sm-icon-proj"    data-section="projects">projects</div>
          <div class="start-menu-separator"></div>
          <div class="start-menu-label">system</div>
          <div class="start-menu-item sm-icon-tile"    id="start-tile">tile windows</div>
          <div class="start-menu-item sm-icon-shut danger" id="start-shutdown">restart</div>
        </div>
      </div>
    `);
    $('body').append(menu);

    menu.find('[data-section]').on('click', function () {
      openWindow($(this).data('section'));
      menu.remove();
    });

    menu.find('#start-tile').on('click', function () {
      tileWindows();
      menu.remove();
    });

    menu.find('#start-shutdown').on('click', function () {
      menu.remove();
      shutdownSequence();
    });

    $(document).one('click', function (e) {
      if (!$(e.target).closest('.start-button, .start-menu').length) {
        menu.remove();
      }
    });
  });

  // ── Oceanic bubble shutdown sequence ──
  function shutdownSequence() {
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;z-index:99998;pointer-events:all;';
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    const W = canvas.width;
    const H = canvas.height;

    const msg = document.createElement('div');
    msg.style.cssText = 'position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;pointer-events:none;opacity:0;transition:opacity 1.4s ease;';
    msg.innerHTML = '<span style="font-family:Courier Prime,monospace;font-size:13px;letter-spacing:0.18em;text-transform:lowercase;color:rgba(125,211,252,0.75);text-shadow:0 0 20px rgba(0,229,255,0.5);">surfacing...</span>';
    document.body.appendChild(msg);

    const PALETTE = [[0,229,255],[6,182,212],[56,189,248],[99,102,241],[165,243,252]];

    // Fixed-size circular pool - never grows, never crashes
    const MAX_BUBBLES = 120;
    const pool = [];
    let   poolHead = 0; // next slot to overwrite

    function initPool() {
      for (let i = 0; i < MAX_BUBBLES; i++) pool.push(null);
    }

    function spawnBubble(x, vy, r, maxA, delayMs) {
      const [rc,gc,bc] = PALETTE[Math.floor(Math.random() * PALETTE.length)];
      const b = {
        x:   x != null ? x : Math.random() * W,
        y:   H + Math.random() * 60,
        r:   r   || (3 + Math.random() * 18),
        vx:  (Math.random() - 0.5) * 0.8,
        vy:  vy  || -(0.7 + Math.random() * 1.8),
        wobble: Math.random() * Math.PI * 2,
        wSpeed: 0.02 + Math.random() * 0.03,
        alpha: 0,
        maxA: maxA || (0.2 + Math.random() * 0.45),
        rc, gc, bc,
        born: performance.now() + (delayMs || 0),
        popped: false, popT: 0,
      };
      pool[poolHead % MAX_BUBBLES] = b;
      poolHead++;
      return b;
    }

    function drawBubble(b) {
      if (!b) return;
      const now = performance.now();
      if (now < b.born) return;

      // Move
      b.wobble += b.wSpeed;
      b.x += b.vx + Math.sin(b.wobble) * 0.35;
      b.y += b.vy;

      // Pop at top
      if (!b.popped && b.y < H * 0.08) b.popped = true;

      // Alpha
      if (!b.popped) {
        b.alpha = Math.min(b.maxA, b.alpha + 0.015);
      } else {
        b.popT  += 0.055;
        b.alpha  = Math.max(0, b.maxA * (1 - b.popT));
      }

      // Recycle completely faded or far off-screen bubbles
      if (b.alpha <= 0 || b.y < -60) { pool[pool.indexOf(b)] = null; return; }

      const {x, y, r, rc, gc, bc, alpha} = b;

      // Glow halo
      const glow = ctx.createRadialGradient(x, y, 0, x, y, r * 2.8);
      glow.addColorStop(0, `rgba(${rc},${gc},${bc},${alpha * 0.30})`);
      glow.addColorStop(1, `rgba(${rc},${gc},${bc},0)`);
      ctx.beginPath(); ctx.arc(x, y, r * 2.8, 0, Math.PI * 2);
      ctx.fillStyle = glow; ctx.fill();

      // Shell
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${rc},${gc},${bc},${alpha * 1.2})`;
      ctx.lineWidth = 1.1; ctx.stroke();

      // Highlight
      ctx.beginPath(); ctx.arc(x - r*0.28, y - r*0.30, r*0.18, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${alpha * 0.5})`; ctx.fill();

      // Pop ring
      if (b.popped && b.popT < 1) {
        ctx.beginPath(); ctx.arc(x, y, r * (1 + b.popT * 2), 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${rc},${gc},${bc},${alpha * 0.6})`;
        ctx.lineWidth = 0.7; ctx.stroke();
      }
    }

    initPool();
    // Seed first wave with staggered delays
    for (let i = 0; i < 50; i++) spawnBubble(null, null, null, null, i * 40);

    let phase      = 0;   // 0=descent  1=burst  2=surface  3=done
    let startT     = null;
    let phaseT     = null;
    let msgShown   = false;
    let reloadFired = false;
    const DESCENT_D = 4200;
    const BURST_D   = 900;
    const SURFACE_D = 1000;

    function tick(ts) {
      if (reloadFired) return;
      if (!startT) { startT = ts; phaseT = ts; }
      const elapsed = ts - startT;
      const phaseEl = ts - phaseT;

      // Always schedule next frame first - never miss a beat
      requestAnimationFrame(tick);

      // ── Background fill ──
      if (phase <= 1) {
        const darkT = Math.min(1, elapsed / DESCENT_D);
        ctx.fillStyle = `rgba(1,8,16,${0.14 + darkT * 0.79})`;
      } else {
        ctx.fillStyle = 'rgba(1,8,16,0.22)';
      }
      ctx.fillRect(0, 0, W, H);

      // ── Light shaft (phase 0 only, fades at 60%) ──
      if (phase === 0) {
        const t = Math.min(1, elapsed / DESCENT_D);
        if (t < 0.60) {
          const sA = (0.60 - t) * 0.32;
          const shaft = ctx.createRadialGradient(W*0.5, 0, 0, W*0.5, 0, H*0.55);
          shaft.addColorStop(0,   `rgba(14,165,233,${sA})`);
          shaft.addColorStop(0.5, `rgba(6,182,212,${sA*0.3})`);
          shaft.addColorStop(1,   'rgba(0,0,0,0)');
          ctx.fillStyle = shaft; ctx.fillRect(0, 0, W, H);
        }
        // Trickle-spawn - only if pool has room and we are before 65%
        if (t < 0.65 && Math.random() < 0.22) spawnBubble();
      }

      // ── Draw all live bubbles ──
      for (let i = 0; i < MAX_BUBBLES; i++) drawBubble(pool[i]);

      // ── Message ──
      if (!msgShown && elapsed > DESCENT_D * 0.42) {
        msgShown = true;
        msg.style.opacity = '1';
      }

      // ── Phase transitions ──
      if (phase === 0 && elapsed >= DESCENT_D) {
        phase = 1; phaseT = ts;
        // Burst: 40 fast large bubbles, spread across pool slots
        for (let i = 0; i < 40; i++) {
          spawnBubble(
            Math.random() * W,
            -(2.2 + Math.random() * 3.8),
            6 + Math.random() * 22,
            0.55 + Math.random() * 0.4,
            i * 20
          );
        }
      }

      if (phase === 1 && phaseEl >= BURST_D) {
        phase = 2; phaseT = ts;
      }

      if (phase === 2) {
        const t    = Math.min(1, phaseEl / SURFACE_D);
        const ease = t < 0.5 ? 2*t*t : -1 + (4 - 2*t)*t;
        const lA   = ease * 0.97;
        const lg   = ctx.createRadialGradient(W*0.5, 0, 0, W*0.5, H*0.4, H*1.1);
        lg.addColorStop(0,    `rgba(200,245,255,${lA})`);
        lg.addColorStop(0.25, `rgba(125,211,252,${lA*0.75})`);
        lg.addColorStop(0.65, `rgba(14,165,233,${lA*0.3})`);
        lg.addColorStop(1,    'rgba(1,8,16,0)');
        ctx.fillStyle = lg; ctx.fillRect(0, 0, W, H);

        if (t >= 1) {
          reloadFired = true;
          ctx.fillStyle = 'rgba(215,250,255,1)';
          ctx.fillRect(0, 0, W, H);
          setTimeout(() => {
            sessionStorage.removeItem('closedWindows');
            location.reload();
          }, 80);
        }
      }
    }

    requestAnimationFrame(tick);
  }

  // ── Desktop icons ──
  function createDesktopIcons() {
    const icons = [
      { name: 'Visual Studio', icon: 'visual-studio.png' },
      { name: 'VS Code',       icon: 'vscode.png'        },
      { name: 'Jupyter',       icon: 'jupyter.png'       },
      { name: 'Docker',        icon: 'docker.png'        },
      { name: 'AWS',           icon: 'aws.png'           },
      { name: 'GitHub',        icon: 'github.png'        },
      { name: 'Jira',          icon: 'jira.png'          },
    ];

    if (!$('.desktop-icons').length) $('body').append('<div class="desktop-icons"></div>');

    icons.forEach((icon, i) => {
      $('.desktop-icons').append(`
        <div class="desktop-icon" style="position:absolute;top:${16 + i * 88}px">
          <img src="icons/${icon.icon}" alt="${icon.name}">
          <div class="icon-text">${icon.name}</div>
        </div>
      `);
    });

    $(document).on('click', '.desktop-icon', function () {
      const name = $(this).find('.icon-text').text();
      alert(`I also use ${name} when developing!`);
    });
  }

  // ── Cursor trail ──
  let trailThrottle = 0;
  $(document).on('mousemove', function (e) {
    const now = Date.now();
    if (now - trailThrottle < 35) return;
    trailThrottle = now;
    const dot = $('<div class="cursor-trail"></div>').css({ left: e.clientX, top: e.clientY });
    $('body').append(dot);
    setTimeout(() => dot.remove(), 800);
  });

  // ── Download resume ──
  $(document).on('click', '#download-resume', function () {
    window.open('assets/Mehdi-Mihir-SWE-Resume.pdf', '_blank');
  });

  // ── Build all windows ──
  createAboutWindow();
  createExperienceWindow();
  createProjectsWindow();
  createSkillsWindow();
  createResumeWindow();
  createPapersWindow();
  createDesktopIcons();

  // Hide all, then open default
  $('.window').hide();
  $('.taskbar-buttons').empty();
  initializeWindows();

}); // end ready


// ── Helper: create a draggable window element ─────────────────
// BUG FIX: containment: 'parent' keeps windows inside #desktop
// regardless of browser window snap / resize events.
function createWindowElement(id, title, left, top) {
  const el = $(`
    <div id="${id}-window" class="window" style="position:absolute;left:${left}px;top:${top}px;">
      <div class="window-title">
        <div class="window-title-text">${title}</div>
        <div class="window-controls">
          <div class="window-button window-minimize" title="Minimize">−</div>
          <div class="window-button window-close"    title="Close">×</div>
        </div>
      </div>
      <div class="window-content"></div>
    </div>
  `);

  el.draggable({
    handle:   '.window-title',
    scroll:   false,
    drag: function(event, ui) {
      const desktop       = $('#desktop');
      const dW            = desktop.outerWidth();
      const dH            = desktop.outerHeight();
      const elW           = $(this).outerWidth();
      const elH           = $(this).outerHeight();
      const SIDEBAR_RIGHT = 210;
      const SIDEBAR_BOT   = 270; // approx bottom of nav card

      // A window may enter the left zone ONLY if it fits entirely below the nav.
      // i.e. its top edge is at or below the sidebar's bottom edge.
      // Any vertical overlap with the sidebar → enforce the right boundary.
      const windowTop    = ui.position.top;
      const fitsBelow    = windowTop >= SIDEBAR_BOT;
      const leftMin      = fitsBelow ? 0 : SIDEBAR_RIGHT;

      // Hard clamp: window must stay fully within the desktop in all directions
      ui.position.left = Math.max(leftMin, Math.min(ui.position.left, dW - elW));
      ui.position.top  = Math.max(0,       Math.min(ui.position.top,  dH - elH));
    },
    start: function () {
      $('.window').css('z-index', 10).removeClass('window-focused');
      $(this).css('z-index', 2000).addClass('window-focused dragging-window');
    },
    stop: function () {
      $(this).removeClass('dragging-window');
    },
  });

  return el;
}


// ── Window content factories ──────────────────────────────────

function createAboutWindow() {
  const w = createWindowElement('about', 'about', 40, 30);
  w.find('.window-content').html(`
    <h2>hello, world.</h2>
    <p>i'm <strong>Mehdi Mihir</strong> - a full-stack software engineer
       based in the Boston area, currently at
       <strong>GlaxoSmithKline</strong> building tools that accelerate
       scientific research.</p>

    <img src="assets/profile-picture.jpg" alt="Mehdi Mihir" class="profile-pic">

    <p>SNHU Computer Science graduate (Honors, 2025). Passionate about
       clean systems, thoughtful UI, and turning complex data into
       something people can actually use.</p>

    <p>feel free to reach out!</p>

    <div class="contact-links">
      <p><strong>github</strong> &nbsp;→&nbsp;
         <a href="https://github.com/mehdimihir" target="_blank">mehdimihir</a></p>
      <p><strong>linkedin</strong> &nbsp;→&nbsp;
         <a href="https://linkedin.com/in/mmihir" target="_blank">mmihir</a></p>
      <p><strong>email</strong> &nbsp;→&nbsp; mehdi.mihir [at] gmail [dot] com</p>
    </div>
  `);
  $('main').append(w);
}


function createExperienceWindow() {
  const w = createWindowElement('experience', 'experience', 70, 55);
  w.find('.window-content').html(`
    <div class="experience-item">
      <h3>GlaxoSmithKline (GSK)</h3>
      <p class="exp-role">Senior Full-Stack Software Engineer</p>
      <p class="exp-date">Jun. 2025 – Present</p>
      <ul>
        <li>Built Python–Benchling integration replacing manual CSV uploads for lab scientists</li>
        <li>Refactored legacy C++ sequence pipeline - significant speed and memory improvements</li>
        <li>Developed React / Flask QC dashboard for real-time DNA sequencing metrics</li>
        <li>Collaborated with cross-functional teams in a pharma-grade regulated environment</li>
      </ul>
    </div>

    <div class="experience-item">
      <h3>NYC Department of Transportation</h3>
      <p class="exp-role">Data Science Engineering Intern - Pavement Profile Project</p>
      <p class="exp-date">Jun. 2023 – Aug. 2023</p>
      <ul>
        <li>Digitized roadway deterioration modeling using GIS alongside city planners &amp; civil engineers</li>
        <li>Streamlined metadata organization and advanced dataset querying</li>
        <li>Engineered dynamic maps and interactive dashboards with D3.js</li>
      </ul>
    </div>

    <div class="experience-item">
      <h3>Bank of America</h3>
      <p class="exp-role">Software Engineering Intern</p>
      <p class="exp-date">Jun. 2022 – Aug. 2022</p>
      <ul>
        <li>Built and deployed predictive models using Python, TensorFlow, and Scikit-Learn</li>
        <li>Implemented AES &amp; RSA encryption with PyCryptodome</li>
        <li>Collaborated with cloud engineering to migrate legacy systems to AWS</li>
        <li>Developed React.js / Redux interfaces for internal tooling</li>
      </ul>
    </div>

    <div class="experience-item">
      <h3>Openwave Computing</h3>
      <p class="exp-role">Software Engineering Intern - QuikAllot (Field Service Management)</p>
      <p class="exp-date">Jun. 2021 – Aug. 2021</p>
      <ul>
        <li>Designed mobile UI screens in Figma; implemented client-side features with React.js &amp; Redux</li>
        <li>Developed real-time GIS tracking for employer-side solutions</li>
        <li>Architected database schema on AWS RDS and built RESTful APIs</li>
      </ul>
    </div>
  `);
  $('main').append(w);
}


function createProjectsWindow() {
  const w = createWindowElement('projects', 'projects', 100, 80);
  w.find('.window-content').html(`
    <div class="project-card">
      <div class="project-title">
        <a href="https://github.com/mehd-mihir/fitness-tracker" target="_blank">Fitness Tracker Dashboard</a>
      </div>
      <p>Java · JavaFX · Chart.js · Google Maps API · Firebase · TensorFlow Java</p>
      <ul>
        <li>Desktop application for workout logging and progress tracking</li>
        <li>Data visualization with Chart.js; predictive analytics via TensorFlow Java API</li>
        <li>Firebase real-time database and authentication</li>
      </ul>
    </div>

    <div class="project-card">
      <div class="project-title">
        <a href="https://github.com/mehd-mihir/finance-management-app" target="_blank">Personal Finance Management App</a>
      </div>
      <p>React Native · Node.js · AWS DynamoDB · Lambda · S3</p>
      <ul>
        <li>Cross-platform mobile app for expense tracking, budgeting, and financial goals</li>
        <li>Serverless architecture with AWS Lambda; secure media storage on S3</li>
      </ul>
    </div>

    <div class="project-card">
      <div class="project-title">
        <a href="https://github.com/mehdimihir/CS-370-Deep-Q-Learning-Agent" target="_blank">Treasure Hunt: Deep Q-Learning Agent</a>
      </div>
      <p>Python · TensorFlow/Keras · NumPy · Matplotlib · Jupyter</p>
      <ul>
        <li>Reinforcement learning agent navigating an 8×8 maze via deep Q-learning</li>
        <li>Experience replay, epsilon-greedy strategy, custom neural network architecture</li>
      </ul>
    </div>

    <div class="project-card">
      <div class="project-title">
        <a href="https://github.com/mehdimihir/CS-330-Zen-Garden-OpenGL" target="_blank">Zen Garden Visualization - OpenGL</a>
      </div>
      <p>C++ · OpenGL · GLEW · GLM · GLFW</p>
      <ul>
        <li>3D interactive Zen garden with textured objects and dynamic lighting</li>
        <li>WASD + mouse camera system; toggleable perspective / orthographic views</li>
      </ul>
    </div>
  `);
  $('main').append(w);
}


function createSkillsWindow() {
  const w = createWindowElement('skills', 'technical skills', 130, 105);
  w.find('.window-content').html(`
    <div class="skill-category">
      <div class="skill-title">Languages</div>
      <div class="skill-list">
        <div class="skill-item">Python</div>
        <div class="skill-item">Java</div>
        <div class="skill-item">C++</div>
        <div class="skill-item">JavaScript</div>
        <div class="skill-item">TypeScript</div>
        <div class="skill-item">SQL</div>
        <div class="skill-item">Swift</div>
      </div>
    </div>

    <div class="skill-category">
      <div class="skill-title">Frameworks & Libraries</div>
      <div class="skill-list">
        <div class="skill-item">React</div>
        <div class="skill-item">React Native</div>
        <div class="skill-item">Angular</div>
        <div class="skill-item">Node.js</div>
        <div class="skill-item">Flask</div>
        <div class="skill-item">Express</div>
        <div class="skill-item">PyTorch</div>
        <div class="skill-item">TensorFlow</div>
        <div class="skill-item">jQuery</div>
      </div>
    </div>

    <div class="skill-category">
      <div class="skill-title">Cloud & DevOps</div>
      <div class="skill-list">
        <div class="skill-item">AWS</div>
        <div class="skill-item">GCP</div>
        <div class="skill-item">Docker</div>
        <div class="skill-item">Kubernetes</div>
        <div class="skill-item">Jenkins</div>
        <div class="skill-item">Linux</div>
        <div class="skill-item">Git</div>
      </div>
    </div>

    <div class="skill-category">
      <div class="skill-title">Databases</div>
      <div class="skill-list">
        <div class="skill-item">PostgreSQL</div>
        <div class="skill-item">MongoDB</div>
        <div class="skill-item">DynamoDB</div>
        <div class="skill-item">Firebase</div>
      </div>
    </div>
  `);
  $('main').append(w);
}


function createResumeWindow() {
  const w = createWindowElement('resume', 'resume', 160, 130);
  w.find('.window-content').html(`
    <p>download my resume as a PDF:</p>
    <button id="download-resume" class="retro-button">↓ &nbsp;Download Resume</button>

    <div class="resume-preview">
      <h3>Mehdi Mihir</h3>
      <p>(347) 247-1655 &nbsp;·&nbsp; mehdi.mihir [at] gmail [dot] com</p>
      <p>
        <a href="https://linkedin.com/in/mmihir" target="_blank">LinkedIn</a>
        &nbsp;·&nbsp;
        <a href="https://github.com/mehdimihir" target="_blank">GitHub</a>
      </p>
      <br>
      <h4>Education</h4>
      <p>Southern New Hampshire University<br>
         B.S. Computer Science - Honors &nbsp;·&nbsp; 2025</p>
      <br>
      <p>Stony Brook University<br>
         B.S. Computer Science (transferred) &nbsp;·&nbsp; 2020–2022</p>
    </div>
  `);
  $('main').append(w);
}


function createPapersWindow() {
  const w = createWindowElement('papers', 'academic papers', 190, 155);
  w.find('.window-content').html(`
    <div class="papers-intro">
      <p>a selection of academic writing and research.</p>
    </div>

    <div class="paper-item">
      <h3>Digital Wellness Technologies and Mental Health</h3>
      <p class="paper-date">Winter 2025</p>
      <p class="paper-description">
        Examines why Gen Z's adoption of digital wellness apps often produces
        paradoxical outcomes - falling short of lasting benefits while
        contributing to anxiety and digital fatigue.
      </p>
      <div class="paper-tags">
        <span class="paper-tag">Digital Wellness</span>
        <span class="paper-tag">Generation Z</span>
        <span class="paper-tag">Mental Health</span>
        <span class="paper-tag">Digital Fatigue</span>
      </div>
      <a href="assets/Digital-Wellness-Technologies-Mental-Health.pdf"
         target="_blank" class="retro-button paper-view-btn">↗ View Paper</a>
    </div>

    <div class="paper-item">
      <h3>Cloud-based Microservice Architecture: Benefits and Challenges</h3>
      <p class="paper-date">Spring 2023</p>
      <p class="paper-description">
        Explores microservice architectures in cloud environments - advantages,
        trade-offs, and implementation best practices.
      </p>
      <div class="paper-tags">
        <span class="paper-tag">Cloud Computing</span>
        <span class="paper-tag">Microservices</span>
        <span class="paper-tag">DevOps</span>
      </div>
      <a href="assets/Cloud-Microservice-Paper.pdf"
         target="_blank" class="retro-button paper-view-btn">↗ View Paper</a>
    </div>
  `);
  $('main').append(w);
}