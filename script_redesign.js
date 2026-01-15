(() => {
  const html = document.documentElement;
  const body = document.body;

  // Rok v patičce
  const rok = document.getElementById("rok");
  if (rok) rok.textContent = String(new Date().getFullYear());

  // Mobilní menu toggle (FIXED)
  const tlacitkoMenu = document.querySelector("[data-menu-tlacitko]");
  const navigace = document.querySelector("[data-navigace]");
  const mqDesktop = window.matchMedia("(min-width: 900px)");

  const zamknoutScroll = (zamknout) => {
    html.classList.toggle("menu-locked", zamknout);
    body.classList.toggle("menu-locked", zamknout);
  };

  if (tlacitkoMenu && navigace) {
    const nastavitStav = (otevreno) => {
      // Desktop: menu je vždy "normální" (žádný off-canvas)
      if (mqDesktop.matches) {
        navigace.classList.remove("navigace--otevrena");
        tlacitkoMenu.setAttribute("aria-expanded", "false");
        tlacitkoMenu.setAttribute("aria-label", "Menu");
        navigace.setAttribute("aria-hidden", "false");
        zamknoutScroll(false);
        return;
      }

      // Mobil: off-canvas
      navigace.classList.toggle("navigace--otevrena", otevreno);
      tlacitkoMenu.setAttribute("aria-expanded", String(otevreno));
      tlacitkoMenu.setAttribute("aria-label", otevreno ? "Zavřít menu" : "Otevřít menu");
      navigace.setAttribute("aria-hidden", String(!otevreno));
      zamknoutScroll(otevreno);
    };

    const prepnout = (otevrit) => {
      // když někdo zavolá prepnout(true/false), respektuj to
      // jinak přepni podle aktuálního stavu
      const jeOtevrene = otevrit ?? !navigace.classList.contains("navigace--otevrena");
      nastavitStav(jeOtevrene);
    };

    // Klik na burger
    tlacitkoMenu.addEventListener("click", () => prepnout());

    // Zavřít menu po kliknutí na odkaz (mobil) – FIX: closest("a")
    navigace.addEventListener("click", (e) => {
      const a = e.target instanceof HTMLElement ? e.target.closest("a") : null;
      if (a) prepnout(false);
    });

    // Zavřít po ESC
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") prepnout(false);
    });

    // FIX: místo resize → matchMedia change (mobil se nebude náhodně zavírat při scrollu)
    const onMqChange = () => prepnout(false);
    if (mqDesktop.addEventListener) mqDesktop.addEventListener("change", onMqChange);
    else mqDesktop.addListener(onMqChange); // starší Safari

    // počáteční stav
    prepnout(false);
  }

  // Animace při scrollu (IntersectionObserver)
  const prvky = Array.from(document.querySelectorAll(".animace"));
  if (prvky.length && "IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("animace--videt");
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.14 }
    );
    prvky.forEach((el) => observer.observe(el));
  } else {
    // fallback
    prvky.forEach((el) => el.classList.add("animace--videt"));
  }

  // Zvýraznění aktivní sekce v navigaci
  const odkazy = Array.from(document.querySelectorAll(".navigace__odkaz"))
    .filter(a => a.getAttribute("href")?.startsWith("#"));

  const sekce = odkazy
    .map(a => document.querySelector(a.getAttribute("href")))
    .filter(Boolean);

  if (odkazy.length && sekce.length && "IntersectionObserver" in window) {
    const aktivni = (id) => {
      odkazy.forEach(a => {
        const je = a.getAttribute("href") === `#${id}`;
        a.classList.toggle("navigace__odkaz--aktivni", je);
      });
    };

    const obs = new IntersectionObserver((entries) => {
      const viditelne = entries
        .filter(e => e.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (viditelne?.target?.id) aktivni(viditelne.target.id);
    }, { threshold: [0.15, 0.35, 0.55] });

    sekce.forEach(s => obs.observe(s));
  }

  // Portfolio filtr
  const tlacitkaFiltru = Array.from(document.querySelectorAll("[data-filtr]"));
  const polozkyPortfolia = Array.from(document.querySelectorAll(".portfolio-karta"));

  if (tlacitkaFiltru.length && polozkyPortfolia.length) {
    const nastavitFiltr = (filtr) => {
      tlacitkaFiltru.forEach(t => t.classList.toggle("portfolio-filtr--aktivni", t.dataset.filtr === filtr));

      polozkyPortfolia.forEach(karta => {
        const kategorie = (karta.getAttribute("data-kategorie") || "").trim();
        const videt = filtr === "vse" || kategorie === filtr;
        karta.classList.toggle("portfolio-karta--skryta", !videt);
      });
    };

    tlacitkaFiltru.forEach(tl => {
      tl.addEventListener("click", () => nastavitFiltr(tl.dataset.filtr || "vse"));
    });

    nastavitFiltr("vse");
  }

  // Klikací celé portfolio karty (data-url)
  const klikaciKarty = Array.from(document.querySelectorAll(".portfolio-karta[data-url]"));
  klikaciKarty.forEach(karta => {
    karta.addEventListener("click", (e) => {
      const target = e.target;
      if (target instanceof HTMLElement && target.closest("a")) return;

      const url = karta.getAttribute("data-url");
      if (!url) return;

      if (url.startsWith("#")) {
        const el = document.querySelector(url);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }

      window.open(url, "_blank", "noopener");
    });
  });

  // Formspree odeslání přes fetch (bez přesměrování)
  const formular = document.getElementById("formular");
  const stav = document.querySelector("[data-formular-stav]");

  if (formular && stav) {
    formular.addEventListener("submit", async (e) => {
      e.preventDefault();

      const jmeno = String(formular.jmeno?.value || "").trim();
      const email = String(formular.email?.value || "").trim();
      const zprava = String(formular.zprava?.value || "").trim();
      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(email);

      if (!jmeno || !emailOk || !zprava) {
        stav.textContent = "Prosím vyplňte jméno, platný e-mail a zprávu.";
        return;
      }

      const gotcha = String(formular._gotcha?.value || "").trim();
      if (gotcha) {
        stav.textContent = "Odeslání se nezdařilo. Zkuste to prosím znovu.";
        return;
      }

      stav.textContent = "Odesílám…";

      try {
        const data = new FormData(formular);

        const res = await fetch(formular.action, {
          method: "POST",
          body: data,
          headers: { "Accept": "application/json" }
        });

        if (res.ok) {
          formular.reset();
          stav.textContent = "Hotovo! Zpráva byla odeslána. Ozvu se co nejdřív.";
        } else {
          const json = await res.json().catch(() => null);
          const chyba = json?.errors?.[0]?.message || "Nepodařilo se odeslat zprávu. Zkuste to prosím později.";
          stav.textContent = chyba;
        }
      } catch {
        stav.textContent = "Nepodařilo se odeslat zprávu. Zkontrolujte připojení a zkuste to znovu.";
      }
    });
  }

  // Automatické otevírání <details> podle URL hashe (pro GDPR / obchodní podmínky)
  const otevritPodleHashe = () => {
    const hash = window.location.hash;
    if (hash) {
      const cil = document.querySelector(hash);

      if (cil && cil.tagName === "DETAILS") {
        cil.open = true;
        setTimeout(() => {
          cil.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
      }
    }
  };

  window.addEventListener("load", otevritPodleHashe);
  window.addEventListener("hashchange", otevritPodleHashe);

  // Legal modal – basic open/close + tabs
  const modal = document.querySelector(".legal-modal");
  if (modal) {
    const closeBtns = Array.from(modal.querySelectorAll("[data-legal-close]"));
    const tabBtns = Array.from(modal.querySelectorAll("[data-legal-tab]"));
    const panels = Array.from(modal.querySelectorAll("[data-legal-panel]"));

    const otevritModal = () => {
      modal.setAttribute("aria-hidden", "false");
      zamknoutScroll(true);
    };

    const zavritModal = () => {
      modal.setAttribute("aria-hidden", "true");
      zamknoutScroll(false);
    };

    const openTriggers = Array.from(document.querySelectorAll("[data-legal-open]"));
    openTriggers.forEach(btn => btn.addEventListener("click", (e) => {
      e.preventDefault();
      otevritModal();
    }));

    closeBtns.forEach(b => b.addEventListener("click", zavritModal));
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") zavritModal();
    });

    const aktivovatTab = (klic) => {
      tabBtns.forEach(b => b.setAttribute("aria-selected", String(b.dataset.legalTab === klic)));
      panels.forEach(p => {
        const je = p.dataset.legalPanel === klic;
        p.toggleAttribute("hidden", !je);
      });
    };

    tabBtns.forEach(b => b.addEventListener("click", () => aktivovatTab(b.dataset.legalTab)));

    // init
    aktivovatTab("gdpr");
  }
})();

(function () {
      const modal = document.getElementById('legalModal');
      const panel = modal?.querySelector('.legal-modal__panel');
      const tabButtons = modal?.querySelectorAll('[data-legal-tab]');
      const panels = {
        op: modal?.querySelector('#panel-op'),
        gdpr: modal?.querySelector('#panel-gdpr')
      };

      const setYear = () => {
        const el = document.getElementById('rok');
        if (el) el.textContent = new Date().getFullYear();
      };

      const openModal = (which) => {
        if (!modal) return;
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        switchTab(which || 'op');
        // fokus
        setTimeout(() => panel?.focus(), 0);
      };

      const closeModal = () => {
        if (!modal) return;
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
      };

      const switchTab = (which) => {
        const key = (which === 'gdpr') ? 'gdpr' : 'op';
        // tabs
        tabButtons?.forEach(btn => {
          const isActive = btn.getAttribute('data-legal-tab') === key;
          btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
        });
        // panels
        if (panels.op) panels.op.hidden = (key !== 'op');
        if (panels.gdpr) panels.gdpr.hidden = (key !== 'gdpr');
      };

      // open triggers
      document.querySelectorAll('[data-legal-open]').forEach(a => {
        a.addEventListener('click', (e) => {
          e.preventDefault();
          openModal(a.getAttribute('data-legal-open'));
        });
      });

      // close triggers
      modal?.querySelectorAll('[data-legal-close]').forEach(el => {
        el.addEventListener('click', closeModal);
      });

      // tab switching
      tabButtons?.forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.getAttribute('data-legal-tab')));
      });

      // ESC / click outside handled by backdrop + esc
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal?.getAttribute('aria-hidden') === 'false') closeModal();
      });

      setYear();
    })();
