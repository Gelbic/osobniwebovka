(() => {
  const html = document.documentElement;
  const body = document.body;

  // =========================
  // Helpers: scroll lock
  // =========================
  const zamknoutScroll = (zamknout) => {
    html.classList.toggle("menu-locked", zamknout);
    body.classList.toggle("menu-locked", zamknout);
  };

  // =========================
  // Rok v patičce
  // =========================
  const rok = document.getElementById("rok");
  if (rok) rok.textContent = String(new Date().getFullYear());

  // =========================
  // Mobilní menu (burger + overlay + křížek)
  // =========================
  const tlacitkoMenu = document.querySelector("[data-menu-tlacitko]");
  const navigace = document.querySelector("[data-navigace]");
  const tlacitkoZavrit = document.querySelector("[data-zavrit-menu]");
  const mqDesktop = window.matchMedia("(min-width: 900px)");

  if (tlacitkoMenu && navigace) {
    const nastavitStav = (otevreno) => {
      // Desktop: navigace je normálně vidět, bez overlay režimu
      if (mqDesktop.matches) {
        navigace.classList.remove("navigace--otevrena");
        tlacitkoMenu.setAttribute("aria-expanded", "false");
        tlacitkoMenu.setAttribute("aria-label", "Menu");
        navigace.setAttribute("aria-hidden", "false");
        zamknoutScroll(false);
        return;
      }

      // Mobil: overlay režim
      navigace.classList.toggle("navigace--otevrena", otevreno);
      tlacitkoMenu.setAttribute("aria-expanded", String(otevreno));
      tlacitkoMenu.setAttribute("aria-label", otevreno ? "Zavřít menu" : "Otevřít menu");
      navigace.setAttribute("aria-hidden", String(!otevreno));
      zamknoutScroll(otevreno);
    };

    const prepnout = (otevrit) => {
      const jeOtevrene = otevrit ?? !navigace.classList.contains("navigace--otevrena");
      nastavitStav(jeOtevrene);
    };

    // Burger
    tlacitkoMenu.addEventListener("click", () => prepnout());

    // Křížek – zavřít
    if (tlacitkoZavrit) {
      tlacitkoZavrit.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        prepnout(false);
      });
    }

    // Klik v overlay:
    // - klik mimo bílý panel = zavřít
    // - klik na odkaz uvnitř panelu = zavřít
    navigace.addEventListener("click", (e) => {
      const obal = navigace.querySelector(".navigace__obal");
      const target = e.target;

      const klikUvnitPanelu =
        !!obal && (target instanceof Node) && obal.contains(target);

      if (!klikUvnitPanelu) {
        prepnout(false);
        return;
      }

      const a = target instanceof HTMLElement ? target.closest("a") : null;
      if (a) prepnout(false);
    });

    // ESC zavře menu (jen když je otevřené)
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") prepnout(false);
    });

    // Změna breakpointu: při přepnutí na desktop/menu zavřít
    const onMqChange = () => prepnout(false);
    if (mqDesktop.addEventListener) mqDesktop.addEventListener("change", onMqChange);
    else mqDesktop.addListener(onMqChange); // starší Safari

    // init
    prepnout(false);
  }

  // =========================
  // Animace při scrollu (IntersectionObserver)
  // =========================
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
    prvky.forEach((el) => el.classList.add("animace--videt"));
  }

  // =========================
  // Zvýraznění aktivní sekce v navigaci
  // =========================
  const odkazy = Array.from(document.querySelectorAll(".navigace__odkaz"))
    .filter((a) => a.getAttribute("href")?.startsWith("#"));

  const sekce = odkazy
    .map((a) => document.querySelector(a.getAttribute("href")))
    .filter(Boolean);

  if (odkazy.length && sekce.length && "IntersectionObserver" in window) {
    const aktivni = (id) => {
      odkazy.forEach((a) => {
        const je = a.getAttribute("href") === `#${id}`;
        a.classList.toggle("navigace__odkaz--aktivni", je);
      });
    };

    const obs = new IntersectionObserver(
      (entries) => {
        const viditelne = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (viditelne?.target?.id) aktivni(viditelne.target.id);
      },
      { threshold: [0.15, 0.35, 0.55] }
    );

    sekce.forEach((s) => obs.observe(s));
  }

  // =========================
  // Portfolio filtr (pokud existuje)
  // =========================
  const tlacitkaFiltru = Array.from(document.querySelectorAll("[data-filtr]"));
  const polozkyPortfolia = Array.from(document.querySelectorAll(".portfolio-karta"));

  if (tlacitkaFiltru.length && polozkyPortfolia.length) {
    const nastavitFiltr = (filtr) => {
      tlacitkaFiltru.forEach((t) =>
        t.classList.toggle("portfolio-filtr--aktivni", t.dataset.filtr === filtr)
      );

      polozkyPortfolia.forEach((karta) => {
        const kategorie = (karta.getAttribute("data-kategorie") || "").trim();
        const videt = filtr === "vse" || kategorie === filtr;
        karta.classList.toggle("portfolio-karta--skryta", !videt);
      });
    };

    tlacitkaFiltru.forEach((tl) => {
      tl.addEventListener("click", () => nastavitFiltr(tl.dataset.filtr || "vse"));
    });

    nastavitFiltr("vse");
  }

  // Klikací celé portfolio karty (data-url)
  const klikaciKarty = Array.from(document.querySelectorAll(".portfolio-karta[data-url]"));
  klikaciKarty.forEach((karta) => {
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

  // =========================
  // Formspree odeslání přes fetch (bez přesměrování)
  // =========================
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
          headers: { Accept: "application/json" },
        });

        if (res.ok) {
          formular.reset();
          stav.textContent = "Hotovo! Zpráva byla odeslána. Ozvu se co nejdřív.";
        } else {
          const json = await res.json().catch(() => null);
          const chyba =
            json?.errors?.[0]?.message ||
            "Nepodařilo se odeslat zprávu. Zkuste to prosím později.";
          stav.textContent = chyba;
        }
      } catch {
        stav.textContent =
          "Nepodařilo se odeslat zprávu. Zkontrolujte připojení a zkuste to znovu.";
      }
    });
  }

  // =========================
  // Automatické otevírání <details> podle URL hashe
  // =========================
  const otevritPodleHashe = () => {
    const hash = window.location.hash;
    if (!hash) return;

    const cil = document.querySelector(hash);
    if (cil && cil.tagName === "DETAILS") {
      cil.open = true;
      setTimeout(() => {
        cil.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  };

  window.addEventListener("load", otevritPodleHashe);
  window.addEventListener("hashchange", otevritPodleHashe);

  // =========================
  // Legal modal – open/close + tabs (sjednoceno)
  // =========================
  const modal = document.getElementById("legalModal");

  if (modal) {
    const panel = modal.querySelector(".legal-modal__panel");
    const closeBtns = Array.from(modal.querySelectorAll("[data-legal-close]"));
    const tabBtns = Array.from(modal.querySelectorAll("[data-legal-tab]"));
    const panelOp = modal.querySelector("#panel-op");
    const panelGdpr = modal.querySelector("#panel-gdpr");

    const otevritModal = (which) => {
      modal.setAttribute("aria-hidden", "false");
      zamknoutScroll(true);
      aktivovatTab(which || "op");
      setTimeout(() => panel?.focus(), 0);
    };

    const zavritModal = () => {
      modal.setAttribute("aria-hidden", "true");
      zamknoutScroll(false);
    };

    const aktivovatTab = (which) => {
      const key = which === "gdpr" ? "gdpr" : "op";

      tabBtns.forEach((b) => {
        b.setAttribute("aria-selected", String(b.dataset.legalTab === key));
      });

      if (panelOp) panelOp.hidden = key !== "op";
      if (panelGdpr) panelGdpr.hidden = key !== "gdpr";
    };

    // Otevírací triggery (paticka)
    Array.from(document.querySelectorAll("[data-legal-open]")).forEach((a) => {
      a.addEventListener("click", (e) => {
        e.preventDefault();
        otevritModal(a.getAttribute("data-legal-open") || "op");
      });
    });

    // Zavírání
    closeBtns.forEach((b) => b.addEventListener("click", zavritModal));
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && modal.getAttribute("aria-hidden") === "false") {
        zavritModal();
      }
    });

    // Taby
    tabBtns.forEach((b) => {
      b.addEventListener("click", () => aktivovatTab(b.dataset.legalTab));
    });

    // Init: výchozí tab (nechávám OP jako default)
    aktivovatTab("op");
  }
})();

// Kód pro automatické otevření modalu podle URL adresy
document.addEventListener("DOMContentLoaded", () => {
  // Zjistíme, co je za křížkem v URL (např. #obchodni-podminky)
  const hash = window.location.hash;

  if (hash === "#obchodni-podminky") {
    // Najdeme tlačítko, které otevírá OP, a "klikneme" na něj
    const btnOp = document.querySelector('[data-legal-open="op"]');
    if (btnOp) btnOp.click();
  } 
  else if (hash === "#gdpr") {
    // Najdeme tlačítko pro GDPR a "klikneme" na něj
    const btnGdpr = document.querySelector('[data-legal-open="gdpr"]');
    if (btnGdpr) btnGdpr.click();
  }
});
