(() => {
  const tlacitkoMenu = document.querySelector("[data-menu-tlacitko]");
  const navigace = document.querySelector("[data-navigace]");

  // Mobilní menu toggle
  if (tlacitkoMenu && navigace) {
    const prepnout = (otevrit) => {
      const jeOtevrene = otevrit ?? !navigace.classList.contains("navigace--otevrena");
      navigace.classList.toggle("navigace--otevrena", jeOtevrene);
      tlacitkoMenu.setAttribute("aria-expanded", String(jeOtevrene));
    };

    tlacitkoMenu.addEventListener("click", () => prepnout());

    // Zavřít menu po kliknutí na odkaz (mobil)
    navigace.addEventListener("click", (e) => {
      const cil = e.target;
      if (cil instanceof HTMLElement && cil.matches("a")) prepnout(false);
    });

    // Zavřít po ESC
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") prepnout(false);
    });
  }

  // Animace při scrollu (IntersectionObserver)
  const prvky = Array.from(document.querySelectorAll(".animace"));
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

  // Zvýraznění aktivní sekce v navigaci
  const odkazy = Array.from(document.querySelectorAll(".navigace__odkaz"))
    .filter(a => a.getAttribute("href")?.startsWith("#"));

  const sekce = odkazy
    .map(a => document.querySelector(a.getAttribute("href")))
    .filter(Boolean);

  if (odkazy.length && sekce.length) {
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
})();

// Automatické otevírání <details> podle URL hashe (pro obchodní podmínky)
  const otevritPodleHashe = () => {
    const hash = window.location.hash;
    if (hash) {
      // Najdeme element podle ID (např. #gdpr)
      const cil = document.querySelector(hash);
      
      // Pokud je to <details>, otevřeme ho
      if (cil && cil.tagName === "DETAILS") {
        cil.open = true;
        // Chvíli počkáme a scrollneme (aby se stihl vykreslit obsah)
        setTimeout(() => {
          cil.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
      }
    }
  };

  // Spustit při načtení stránky
  window.addEventListener("load", otevritPodleHashe);
  // Spustit i když se změní URL (např. kliknutí na odkaz v patičce, pokud tam bude)
  window.addEventListener("hashchange", otevritPodleHashe);