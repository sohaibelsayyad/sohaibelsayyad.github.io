/* Sohaib Elsayyad — Portfolio
   Vanilla script shared by the English and Arabic pages. */
(function () {
  "use strict";

  var doc = document.documentElement;
  var lang = doc.lang === "ar" ? "ar" : "en";
  var rtl = doc.dir === "rtl";
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var hasIO = "IntersectionObserver" in window;

  function $(sel, root) {
    return (root || document).querySelector(sel);
  }

  function $$(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  function clamp(v, min, max) {
    return Math.min(max, Math.max(min, v));
  }

  // Run fn once when el scrolls into view (or immediately without IO support)
  function onVisible(els, fn, margin) {
    if (!hasIO) {
      els.forEach(fn);
      return;
    }
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            io.unobserve(entry.target);
            fn(entry.target);
          }
        });
      },
      { rootMargin: margin || "0px 0px -10% 0px" }
    );
    els.forEach(function (el) {
      io.observe(el);
    });
  }

  // ---- Mobile navigation ----
  var toggle = $(".nav-toggle");
  var menu = $("#nav-menu");

  function setMenu(open) {
    menu.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
  }

  if (toggle && menu) {
    toggle.addEventListener("click", function () {
      setMenu(!menu.classList.contains("is-open"));
    });
    menu.addEventListener("click", function (e) {
      if (e.target.closest("a")) setMenu(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") setMenu(false);
    });
  }

  // ---- Highlight the nav link of the section in view ----
  var navLinks = $$('.nav-menu a[href^="#"]');
  if (hasIO && navLinks.length) {
    var byId = {};
    navLinks.forEach(function (a) {
      byId[a.getAttribute("href").slice(1)] = a;
    });
    var spy = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          navLinks.forEach(function (a) {
            a.removeAttribute("aria-current");
          });
          var link = byId[entry.target.id];
          if (link) link.setAttribute("aria-current", "true");
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    $$("main section[id]").forEach(function (s) {
      spy.observe(s);
    });
  }

  // ---- Reveal on scroll ----
  $$(".tags").forEach(function (list) {
    $$("li", list).forEach(function (li, i) {
      li.style.setProperty("--i", i);
    });
  });
  onVisible($$(".reveal"), function (el) {
    el.classList.add("is-visible");
  });

  // ---- Animated counters ----
  onVisible($$("[data-count]"), function (el) {
    var target = Number(el.getAttribute("data-count"));
    var suffix = el.getAttribute("data-suffix") || "";
    var format = function (n) {
      return (target >= 1900 && target <= 2100 ? String(n) : n.toLocaleString("en-US")) + suffix;
    };
    if (reduceMotion) {
      el.textContent = format(target);
      return;
    }
    // years count up from a nearby value instead of zero
    var from = target >= 1900 && target <= 2100 ? target - 12 : 0;
    var start = null;
    var duration = 1600;
    function step(t) {
      if (start === null) start = t;
      var p = Math.min((t - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = format(Math.round(from + (target - from) * eased));
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }, "0px");

  // ---- Typewriter for the rotating role ----
  var rotator = $(".rotator");
  if (rotator && !reduceMotion) {
    var words = JSON.parse(rotator.getAttribute("data-words") || "[]");
    var w = 0;
    var c = words[0] ? words[0].length : 0;
    var deleting = true;
    var tick = function () {
      var word = words[w];
      if (deleting) {
        c--;
        if (c <= 0) {
          deleting = false;
          w = (w + 1) % words.length;
        }
      } else {
        c++;
      }
      rotator.textContent = words[w].slice(0, Math.max(c, 0));
      var delay = deleting ? 40 : 80;
      if (!deleting && c >= words[w].length) {
        deleting = true;
        delay = 2200;
      }
      setTimeout(tick, delay);
    };
    if (words.length > 1) setTimeout(tick, 2600);
  }

  // ---- Live duration for current roles (data-start="YYYY-MM") ----
  function plural(n, forms) {
    if (lang === "en") return n + " " + (n === 1 ? forms[0] : forms[1]);
    if (n === 1) return forms[0];
    if (n === 2) return forms[1];
    return n + " " + (n <= 10 ? forms[2] : forms[3]);
  }

  function formatDuration(totalMonths) {
    var y = Math.floor(totalMonths / 12);
    var m = totalMonths % 12;
    var parts = [];
    if (lang === "en") {
      if (y) parts.push(plural(y, ["yr", "yrs"]));
      if (m) parts.push(plural(m, ["mo", "mos"]));
      return parts.join(" ");
    }
    if (y) parts.push(plural(y, ["سنة", "سنتان", "سنوات", "سنة"]));
    if (m) parts.push(plural(m, ["شهر", "شهران", "أشهر", "شهرًا"]));
    return parts.join(" و");
  }

  var now = new Date();
  $$("[data-start]").forEach(function (el) {
    var parts = el.getAttribute("data-start").split("-");
    var months = (now.getFullYear() - Number(parts[0])) * 12 + (now.getMonth() + 1 - Number(parts[1])) + 1;
    if (months > 0) el.textContent = formatDuration(months);
  });

  // ---- Scroll-driven effects: header, progress bar, timeline, parallax ----
  var header = $(".site-header");
  var toTop = $(".to-top");
  var timeline = $(".timeline");
  var bands = $$(".band");
  var ticking = false;

  function onScroll() {
    var y = window.scrollY;
    var vh = window.innerHeight;
    var max = doc.scrollHeight - vh;

    if (header) {
      header.classList.toggle("is-scrolled", y > 8);
      header.style.setProperty("--progress", max > 0 ? (y / max).toFixed(4) : 0);
    }
    if (toTop) toTop.classList.toggle("is-visible", y > 600);

    if (timeline) {
      var r = timeline.getBoundingClientRect();
      timeline.style.setProperty("--fill", clamp((vh * 0.65 - r.top) / r.height, 0, 1).toFixed(4));
    }

    if (!reduceMotion) {
      bands.forEach(function (band) {
        var b = band.getBoundingClientRect();
        if (b.bottom < 0 || b.top > vh) return;
        var offset = (b.top + b.height / 2 - vh / 2) * -0.18;
        band.style.setProperty("--py", offset.toFixed(1) + "px");
      });
    }
    ticking = false;
  }

  window.addEventListener("scroll", function () {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(onScroll);
    }
  }, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();

  // ---- Tilt + spotlight on service cards ----
  if (finePointer && !reduceMotion) {
    $$(".card").forEach(function (card) {
      card.addEventListener("pointermove", function (e) {
        var r = card.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width;
        var y = (e.clientY - r.top) / r.height;
        card.style.setProperty("--ry", ((x - 0.5) * 8).toFixed(2) + "deg");
        card.style.setProperty("--rx", ((0.5 - y) * 8).toFixed(2) + "deg");
        card.style.setProperty("--mx", (x * 100).toFixed(1) + "%");
        card.style.setProperty("--my", (y * 100).toFixed(1) + "%");
      });
      card.addEventListener("pointerleave", function () {
        card.style.setProperty("--rx", "0deg");
        card.style.setProperty("--ry", "0deg");
      });
    });
  }

  // ---- Certificates carousel ----
  var carousel = $("[data-carousel]");
  var lightbox = $("#lightbox");

  if (carousel) {
    var track = $(".carousel-track", carousel);
    var slides = $$(".slide", track);
    var dotsWrap = $(".dots", carousel);
    var counter = $(".carousel-count", carousel);
    var active = -1;
    var dots = [];
    var pad = function (n) {
      return n < 10 ? "0" + n : String(n);
    };

    slides.forEach(function (s, i) {
      var dot = document.createElement("button");
      dot.type = "button";
      dot.setAttribute("aria-label", (lang === "ar" ? "الشهادة " : "Certificate ") + (i + 1));
      dot.addEventListener("click", function () {
        goTo(i);
        restartAuto();
      });
      dotsWrap.appendChild(dot);
      dots.push(dot);
    });

    var updateSlides = function () {
      var tr = track.getBoundingClientRect();
      var mid = tr.left + tr.width / 2;
      var best = 0;
      var bestDist = Infinity;
      slides.forEach(function (s, i) {
        var r = s.getBoundingClientRect();
        var off = (r.left + r.width / 2 - mid) / (s.offsetWidth + 24);
        var a = Math.min(Math.abs(off), 2);
        if (!reduceMotion) {
          s.style.setProperty("--ry", (clamp(off, -2, 2) * -14).toFixed(2) + "deg");
          s.style.setProperty("--s", (1 - a * 0.1).toFixed(3));
          s.style.setProperty("--o", (1 - a * 0.32).toFixed(3));
        }
        if (Math.abs(off) < bestDist) {
          bestDist = Math.abs(off);
          best = i;
        }
      });
      if (best !== active) {
        if (active >= 0) {
          slides[active].classList.remove("is-active");
          dots[active].removeAttribute("aria-current");
        }
        active = best;
        slides[active].classList.add("is-active");
        dots[active].setAttribute("aria-current", "true");
        counter.textContent = pad(active + 1) + " / " + pad(slides.length);
      }
    };

    var goTo = function (i, instant) {
      var s = slides[(i + slides.length) % slides.length];
      var tr = track.getBoundingClientRect();
      var r = s.getBoundingClientRect();
      track.scrollBy({
        left: r.left + r.width / 2 - (tr.left + tr.width / 2),
        behavior: instant || reduceMotion ? "auto" : "smooth"
      });
    };

    var raf = false;
    track.addEventListener("scroll", function () {
      if (!raf) {
        raf = true;
        requestAnimationFrame(function () {
          updateSlides();
          raf = false;
        });
      }
    }, { passive: true });
    window.addEventListener("resize", updateSlides);

    $(".carousel-prev", carousel).addEventListener("click", function () {
      goTo(active - 1);
      restartAuto();
    });
    $(".carousel-next", carousel).addEventListener("click", function () {
      goTo(active + 1);
      restartAuto();
    });

    track.addEventListener("keydown", function (e) {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      e.preventDefault();
      var forward = (e.key === "ArrowRight") !== rtl;
      goTo(active + (forward ? 1 : -1));
      restartAuto();
    });

    // Mouse drag (touch uses native swipe)
    var drag = null;
    var suppressClick = false;
    track.addEventListener("pointerdown", function (e) {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      drag = { x: e.clientX, left: track.scrollLeft, moved: 0 };
      track.classList.add("is-dragging");
      stopAuto();
    });
    window.addEventListener("pointermove", function (e) {
      if (!drag) return;
      var dx = e.clientX - drag.x;
      drag.moved = Math.max(drag.moved, Math.abs(dx));
      track.scrollLeft = drag.left - dx;
    });
    window.addEventListener("pointerup", function () {
      if (!drag) return;
      suppressClick = drag.moved > 6;
      drag = null;
      track.classList.remove("is-dragging");
      goTo(active);
      restartAuto();
    });
    track.addEventListener("click", function (e) {
      if (suppressClick) {
        e.preventDefault();
        e.stopPropagation();
        suppressClick = false;
      }
    }, true);

    // Autoplay while visible and not being interacted with
    var timer = null;
    var inView = false;
    var hovering = false;
    var stopAuto = function () {
      clearInterval(timer);
      timer = null;
    };
    var startAuto = function () {
      if (reduceMotion || timer || !inView || hovering || (lightbox && lightbox.open)) return;
      timer = setInterval(function () {
        goTo(active + 1);
      }, 3800);
    };
    var restartAuto = function () {
      stopAuto();
      startAuto();
    };
    carousel.addEventListener("pointerenter", function () {
      hovering = true;
      stopAuto();
    });
    carousel.addEventListener("pointerleave", function () {
      hovering = false;
      startAuto();
    });
    carousel.addEventListener("focusin", function () {
      hovering = true;
      stopAuto();
    });
    carousel.addEventListener("focusout", function () {
      hovering = false;
      startAuto();
    });
    if (hasIO) {
      new IntersectionObserver(function (entries) {
        inView = entries[0].isIntersecting;
        inView ? startAuto() : stopAuto();
      }, { threshold: 0.4 }).observe(carousel);
    }

    updateSlides();

    // ---- Lightbox ----
    if (lightbox && typeof lightbox.showModal === "function") {
      var lbImg = $("img", lightbox);
      var lbTitle = $(".lightbox-title", lightbox);
      var lbVerify = $(".lightbox-verify", lightbox);
      var zoomable = slides.filter(function (s) {
        return s.hasAttribute("data-full");
      });
      var current = 0;

      var show = function (i) {
        current = (i + zoomable.length) % zoomable.length;
        var s = zoomable[current];
        var title = $("h3", s).textContent;
        var verify = $(".verify", s);
        lbImg.src = s.getAttribute("data-full");
        lbImg.alt = title;
        lbTitle.textContent = title;
        lbVerify.href = verify ? verify.href : "#";
        lbVerify.hidden = !verify;
      };

      zoomable.forEach(function (s, i) {
        $(".slide-media", s).addEventListener("click", function () {
          show(i);
          stopAuto();
          lightbox.showModal();
        });
      });

      $(".lightbox-prev", lightbox).addEventListener("click", function () {
        show(current - 1);
      });
      $(".lightbox-next", lightbox).addEventListener("click", function () {
        show(current + 1);
      });
      $(".lightbox-close", lightbox).addEventListener("click", function () {
        lightbox.close();
      });
      lightbox.addEventListener("click", function (e) {
        if (e.target === lightbox) lightbox.close();
      });
      lightbox.addEventListener("keydown", function (e) {
        if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
          var forward = (e.key === "ArrowRight") !== rtl;
          show(current + (forward ? 1 : -1));
        }
      });
      lightbox.addEventListener("close", function () {
        var idx = slides.indexOf(zoomable[current]);
        if (idx >= 0) goTo(idx, true);
        startAuto();
      });

      // swipe between certificates inside the lightbox
      var sx = null;
      lightbox.addEventListener("pointerdown", function (e) {
        sx = e.clientX;
      });
      lightbox.addEventListener("pointerup", function (e) {
        if (sx === null) return;
        var dx = e.clientX - sx;
        sx = null;
        if (Math.abs(dx) > 50) show(current + ((dx < 0) !== rtl ? 1 : -1));
      });
    }
  }

  // ---- Contact form (FormSubmit AJAX, falls back to the user's mail app) ----
  var form = $("#contact-form");
  if (form && window.fetch) {
    var statusEl = $(".form-status", form);
    var submit = $("button[type=submit]", form);

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (form._honey && form._honey.value) return;

      var data = {};
      new FormData(form).forEach(function (v, k) {
        data[k] = v;
      });

      form.classList.add("is-sending");
      submit.disabled = true;
      statusEl.className = "form-status";
      statusEl.textContent = "";

      fetch(form.getAttribute("data-ajax"), {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(data)
      })
        .then(function (res) {
          return res.json();
        })
        .then(function (json) {
          if (String(json.success) === "true") {
            statusEl.className = "form-status ok";
            statusEl.textContent = form.getAttribute("data-ok");
            form.reset();
            return;
          }
          // The service answered but refused (e.g. form not activated yet):
          // keep the visitor on the page instead of opening their mail app.
          statusEl.className = "form-status err";
          statusEl.textContent = form.getAttribute("data-fail");
        })
        .catch(function () {
          // Network failure: fall back to the visitor's email app
          statusEl.className = "form-status err";
          statusEl.textContent = form.getAttribute("data-err");
          var body = data.message + "\n\n— " + data.name + " (" + data.email + ")";
          window.location.href =
            "mailto:sohaib.elsayad1@gmail.com?subject=" +
            encodeURIComponent(data._subject || "Portfolio") +
            "&body=" + encodeURIComponent(body);
        })
        .then(function () {
          form.classList.remove("is-sending");
          submit.disabled = false;
        });
    });
  }

  // ---- Footer year ----
  var year = $("#year");
  if (year) year.textContent = now.getFullYear();
})();
