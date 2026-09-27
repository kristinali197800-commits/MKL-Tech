const header = document.querySelector("[data-header]");
const nav = document.querySelector("[data-nav]");
const navToggle = document.querySelector("[data-nav-toggle]");
const year = document.querySelector("[data-year]");
const heroCanvas = document.querySelector("[data-hero-canvas]");

if (year) {
  year.textContent = new Date().getFullYear();
}

function updateHeader() {
  if (!header) return;
  if (header.classList.contains("solid")) {
    header.classList.remove("scrolled");
    return;
  }
  header.classList.toggle("scrolled", window.scrollY > 20);
}

updateHeader();
window.addEventListener("scroll", updateHeader, { passive: true });

if (navToggle && nav) {
  navToggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  nav.addEventListener("click", (event) => {
    if (event.target instanceof HTMLAnchorElement) {
      nav.classList.remove("open");
      navToggle.setAttribute("aria-expanded", "false");
    }
  });
}

document.querySelectorAll("[data-carousel]").forEach((carousel) => {
  const slides = Array.from(carousel.querySelectorAll(".carousel-slide, .review-slide"));
  const previousButtons = carousel.querySelectorAll("[data-carousel-prev]");
  const nextButtons = carousel.querySelectorAll("[data-carousel-next]");
  const count = carousel.querySelector("[data-carousel-count]");
  const dotsWrap = carousel.querySelector("[data-carousel-dots]");
  let active = 0;
  let autoplayTimer = null;
  const isPortfolio = carousel.dataset.carousel === "portfolio";
  const isCoverflow = isPortfolio || carousel.dataset.carousel === "reviews";
  const shouldAutoplay = isCoverflow
    && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const dots = [];
  const requestedBuild = new URLSearchParams(window.location.search).get("build") || window.location.hash.replace("#build-", "");
  const requestedIndex = requestedBuild
    ? slides.findIndex((slide) => slide instanceof HTMLElement && slide.dataset.build === requestedBuild)
    : -1;

  if (dotsWrap) {
    slides.forEach((_, index) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "carousel-dot";
      dot.setAttribute("aria-label", `Go to slide ${index + 1}`);
      dot.addEventListener("click", () => showSlide(index));
      dotsWrap.appendChild(dot);
      dots.push(dot);
    });
  }

  function showSlide(index) {
    if (!slides.length) return;
    slides.forEach((slide) => {
      slide.classList.remove("active", "prev-preview", "next-preview");
      slide.removeAttribute("role");
      slide.removeAttribute("tabindex");
      slide.removeAttribute("aria-label");
      slide.setAttribute("aria-hidden", "true");
    });
    active = (index + slides.length) % slides.length;
    slides[active].classList.add("active");
    slides[active].setAttribute("aria-hidden", "false");

    if (isCoverflow && slides.length > 1) {
      const previousIndex = (active - 1 + slides.length) % slides.length;
      const nextIndex = (active + 1) % slides.length;
      const previousSlide = slides[previousIndex];
      const nextSlide = slides[nextIndex];
      const itemLabel = isPortfolio ? "build" : "review";

      previousSlide.classList.add("prev-preview");
      previousSlide.setAttribute("role", "button");
      previousSlide.setAttribute("tabindex", "0");
      previousSlide.setAttribute("aria-label", `View previous ${itemLabel}`);
      previousSlide.setAttribute("aria-hidden", "false");

      nextSlide.classList.add("next-preview");
      nextSlide.setAttribute("role", "button");
      nextSlide.setAttribute("tabindex", "0");
      nextSlide.setAttribute("aria-label", `View next ${itemLabel}`);
      nextSlide.setAttribute("aria-hidden", "false");
    }

    if (count) count.textContent = `${active + 1} / ${slides.length}`;
    dots.forEach((dot, dotIndex) => {
      const isActive = dotIndex === active;
      dot.classList.toggle("active", isActive);
      dot.setAttribute("aria-current", isActive ? "true" : "false");
    });
  }

  function stopAutoplay() {
    if (autoplayTimer === null) return;
    window.clearInterval(autoplayTimer);
    autoplayTimer = null;
  }

  if (isCoverflow) {
    slides.forEach((slide) => {
      slide.addEventListener("click", () => {
        if (slide.classList.contains("prev-preview")) {
          stopAutoplay();
          showSlide(active - 1);
        } else if (slide.classList.contains("next-preview")) {
          stopAutoplay();
          showSlide(active + 1);
        }
      });

      slide.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        if (!slide.classList.contains("prev-preview") && !slide.classList.contains("next-preview")) return;
        event.preventDefault();
        stopAutoplay();
        showSlide(slide.classList.contains("prev-preview") ? active - 1 : active + 1);
      });
    });
  }

  previousButtons.forEach((button) => button.addEventListener("click", () => {
    stopAutoplay();
    showSlide(active - 1);
  }));
  nextButtons.forEach((button) => button.addEventListener("click", () => {
    stopAutoplay();
    showSlide(active + 1);
  }));

  carousel.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      stopAutoplay();
      showSlide(active - 1);
    }
    if (event.key === "ArrowRight") {
      stopAutoplay();
      showSlide(active + 1);
    }
  });

  showSlide(requestedIndex >= 0 ? requestedIndex : 0);

  if (shouldAutoplay) {
    autoplayTimer = window.setInterval(() => showSlide(active + 1), 3000);
  }

  if (requestedIndex >= 0 && carousel.id === "build-carousel") {
    window.requestAnimationFrame(() => {
      const top = carousel.getBoundingClientRect().top + window.scrollY - 104;
      window.scrollTo({ top: Math.max(top, 0), behavior: "auto" });
    });
  }
});

if (heroCanvas instanceof HTMLCanvasElement) {
  const context = heroCanvas.getContext("2d");
  const hero = heroCanvas.closest(".hero");
  const pointer = { x: null, y: null };
  let width = 0;
  let height = 0;
  let particles = [];
  let animationFrame = 0;

  function resizeCanvas() {
    const rect = heroCanvas.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    width = rect.width;
    height = rect.height;
    heroCanvas.width = Math.floor(width * ratio);
    heroCanvas.height = Math.floor(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);

    const count = Math.max(58, Math.min(110, Math.floor((width * height) / 11000)));
    particles = Array.from({ length: count }, (_, index) => ({
      x: Math.random() * width,
      y: Math.random() * height,
      baseX: Math.random() * width,
      baseY: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.34,
      vy: (Math.random() - 0.5) * 0.34,
      size: 1.2 + Math.random() * 2,
      phase: index * 0.45
    }));
  }

  function movePointer(event) {
    if (!hero) return;
    const rect = hero.getBoundingClientRect();
    pointer.x = event.clientX - rect.left;
    pointer.y = event.clientY - rect.top;
  }

  function clearPointer() {
    pointer.x = null;
    pointer.y = null;
  }

  function draw(time) {
    if (!context) return;
    context.clearRect(0, 0, width, height);
    context.lineWidth = 1;

    particles.forEach((particle) => {
      particle.baseX += particle.vx;
      particle.baseY += particle.vy;

      if (particle.baseX < -20 || particle.baseX > width + 20) particle.vx *= -1;
      if (particle.baseY < -20 || particle.baseY > height + 20) particle.vy *= -1;

      let targetX = particle.baseX + Math.sin(time * 0.001 + particle.phase) * 18;
      let targetY = particle.baseY + Math.cos(time * 0.0011 + particle.phase) * 18;

      if (pointer.x !== null && pointer.y !== null) {
        const dx = targetX - pointer.x;
        const dy = targetY - pointer.y;
        const distance = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
        if (distance < 170) {
          const force = (170 - distance) / 170;
          targetX += (dx / distance) * force * 58;
          targetY += (dy / distance) * force * 58;
        }
      }

      particle.x += (targetX - particle.x) * 0.08;
      particle.y += (targetY - particle.y) * 0.08;
    });

    for (let i = 0; i < particles.length; i += 1) {
      const a = particles[i];
      for (let j = i + 1; j < particles.length; j += 1) {
        const b = particles[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < 120) {
          const alpha = (1 - distance / 120) * 0.26;
          context.strokeStyle = `rgba(143, 212, 255, ${alpha})`;
          context.beginPath();
          context.moveTo(a.x, a.y);
          context.lineTo(b.x, b.y);
          context.stroke();
        }
      }
    }

    particles.forEach((particle) => {
      context.fillStyle = "rgba(143, 212, 255, 0.82)";
      context.beginPath();
      context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      context.fill();
    });

    if (pointer.x !== null && pointer.y !== null) {
      const glow = context.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, 190);
      glow.addColorStop(0, "rgba(91, 188, 255, 0.28)");
      glow.addColorStop(1, "rgba(91, 188, 255, 0)");
      context.fillStyle = glow;
      context.beginPath();
      context.arc(pointer.x, pointer.y, 190, 0, Math.PI * 2);
      context.fill();
    }

    animationFrame = window.requestAnimationFrame(draw);
  }

  if (context) {
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    hero?.addEventListener("mousemove", movePointer);
    hero?.addEventListener("mouseleave", clearPointer);
    animationFrame = window.requestAnimationFrame(draw);
    window.addEventListener("pagehide", () => window.cancelAnimationFrame(animationFrame), { once: true });
  }
}

const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
const revealTargets = document.querySelectorAll(
  ".impact-section-heading, .inventory-photo, .lifecycle-grid li, .trade-process-card, .tech-category, .win-win-grid article, .metrics-grid, .methodology, .impact-page-cta"
);

if (!motionPreference.matches && "IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  }, { rootMargin: "0px 0px -8%", threshold: 0.12 });

  revealTargets.forEach((target, index) => {
    target.classList.add("is-reveal");
    if (target instanceof HTMLElement) {
      target.style.transitionDelay = `${Math.min(index % 4, 3) * 70}ms`;
    }
    revealObserver.observe(target);
  });
} else {
  revealTargets.forEach((target) => target.classList.add("is-visible"));
}

const marketplaceShop = document.querySelector("[data-marketplace-shop]");

if (marketplaceShop) {
  const grid = marketplaceShop.querySelector("[data-listing-grid]");
  let cards = Array.from(marketplaceShop.querySelectorAll("[data-listing-card]"));
  const search = marketplaceShop.querySelector("[data-listing-search]");
  const category = marketplaceShop.querySelector("[data-listing-category]");
  const status = marketplaceShop.querySelector("[data-listing-status]");
  const sort = marketplaceShop.querySelector("[data-listing-sort]");
  const empty = marketplaceShop.querySelector("[data-listing-empty]");
  const loadMore = marketplaceShop.querySelector("[data-listing-load-more]");
  const facebookMore = marketplaceShop.querySelector("[data-listing-facebook-more]");
  let showAllListings = false;

  function listingCategory(title) {
    const value = title.toLowerCase();
    if (/monitor|display/.test(value)) return "display";
    if (/airpods|headset|headphone|speaker|microphone|sound card|audio|scarlett/.test(value)) return "audio";
    if (/macbook|laptop/.test(value)) return "laptop";
    if (/iphone|ipad|apple watch|apple pencil|magic keyboard|screen protector/.test(value)) return "mobile";
    if (/gaming pc|alienware|\bpc\b|gpu|graphics card|rtx|radeon|ryzen|intel core|\bcpu\b|\bram\b|memory|motherboard|power supply|ssd|hdd|nvme|pc case|case fan|\bfan\b|cooler|\baio\b|thermal paste|goldshell|keyboard|keycaps|mouse|controller|wi-fi|hdmi|cable|webcam|stream deck|gimbal|usb-c power adapter|ledger nano|corsair icue sp120/.test(value)) return "component";
    return "other";
  }

  function categoryLabel(value) {
    return {
      display: "Display",
      audio: "Audio",
      laptop: "Laptop",
      mobile: "Phone or tablet",
      component: "PC or component",
    }[value] || "Marketplace";
  }

  function createListingCard(listing) {
    const card = document.createElement("a");
    const title = String(listing.title || "Facebook Marketplace listing");
    const itemCategory = listingCategory(title);
    const fileRecency = Number(String(listing.file || "0").split("_")[0]) || Number(listing.order || 0);
    const availability = listing.sold ? "sold" : "available";

    card.className = `marketplace-card marketplace-card-${availability}`;
    card.dataset.listingCard = "";
    card.dataset.order = String(fileRecency);
    card.dataset.price = String(listing.priceValue || 0);
    card.dataset.category = itemCategory;
    card.dataset.status = availability;
    card.href = listing.href;
    card.target = "_blank";
    card.rel = "noopener";

    const imageWrap = document.createElement("div");
    imageWrap.className = "marketplace-image";

    if (listing.image) {
      const image = document.createElement("img");
      image.src = listing.image;
      image.alt = `${title}, photographed for the MKL-Tech Facebook Marketplace listing`;
      image.loading = "lazy";
      image.decoding = "async";
      imageWrap.appendChild(image);
    } else {
      imageWrap.classList.add("marketplace-image-placeholder");
      const placeholder = document.createElement("span");
      placeholder.textContent = "View original listing photo on Facebook";
      imageWrap.appendChild(placeholder);
    }

    const copy = document.createElement("div");
    copy.className = "marketplace-card-copy";

    const label = document.createElement("span");
    label.className = "listing-label";
    label.textContent = listing.sold ? "Sold" : "Available";

    const heading = document.createElement("h3");
    heading.textContent = title;

    const meta = document.createElement("p");
    meta.textContent = categoryLabel(itemCategory);

    const price = document.createElement("strong");
    price.textContent = listing.price || "Free";

    copy.append(label, heading, meta, price);
    card.append(imageWrap, copy);
    return card;
  }

  function updateMarketplaceListings() {
    if (!grid) return;

    const query = search instanceof HTMLInputElement ? search.value.trim().toLowerCase() : "";
    const selectedCategory = category instanceof HTMLSelectElement ? category.value : "all";
    const selectedStatus = status instanceof HTMLSelectElement ? status.value : "all";
    const selectedSort = sort instanceof HTMLSelectElement ? sort.value : "newest";

    const matchingCards = cards.filter((card) => {
      const matchesSearch = !query || (card.textContent || "").toLowerCase().includes(query);
      const matchesCategory = selectedCategory === "all" || card.dataset.category === selectedCategory;
      const matchesStatus = selectedStatus === "all" || card.dataset.status === selectedStatus;
      return matchesSearch && matchesCategory && matchesStatus;
    });

    const sortedCards = [...matchingCards].sort((a, b) => {
      const aOrder = Number(a.dataset.order || 0);
      const bOrder = Number(b.dataset.order || 0);
      const aPrice = Number(a.dataset.price || 0);
      const bPrice = Number(b.dataset.price || 0);
      const aAvailable = a.dataset.status === "available" ? 1 : 0;
      const bAvailable = b.dataset.status === "available" ? 1 : 0;

      if (selectedSort === "oldest") return aOrder - bOrder;
      if (selectedSort === "price-low") return aPrice - bPrice;
      if (selectedSort === "price-high") return bPrice - aPrice;
      if (aAvailable !== bAvailable) return bAvailable - aAvailable;
      return bOrder - aOrder;
    });

    cards.forEach((card) => {
      card.hidden = true;
    });

    const visibleLimit = showAllListings ? sortedCards.length : 4;

    sortedCards.forEach((card, index) => {
      card.hidden = index >= visibleLimit;
      grid.appendChild(card);
    });

    if (loadMore instanceof HTMLButtonElement) loadMore.hidden = sortedCards.length <= visibleLimit;
    if (facebookMore instanceof HTMLAnchorElement) facebookMore.hidden = !showAllListings;
    if (empty) empty.hidden = sortedCards.length !== 0;
  }

  function resetMarketplaceListings() {
    showAllListings = false;
    updateMarketplaceListings();
  }

  search?.addEventListener("input", resetMarketplaceListings);
  category?.addEventListener("change", resetMarketplaceListings);
  status?.addEventListener("change", resetMarketplaceListings);
  sort?.addEventListener("change", resetMarketplaceListings);
  loadMore?.addEventListener("click", () => {
    showAllListings = true;
    updateMarketplaceListings();
  });

  fetch("assets/facebook-listings/listings.json?v=20260927a")
    .then((response) => {
      if (!response.ok) throw new Error(`Listing archive request failed with ${response.status}`);
      return response.json();
    })
    .then((listings) => {
      if (!grid || !Array.isArray(listings)) return;
      const techListings = listings.filter((listing) => (
        listing.image
        && listingCategory(String(listing.title || "")) !== "other"
      ));
      grid.replaceChildren(...techListings.map(createListingCard));
      cards = Array.from(grid.querySelectorAll("[data-listing-card]"));
      updateMarketplaceListings();
    })
    .catch(() => {
      cards.forEach((card) => {
        card.dataset.status = "available";
      });
      updateMarketplaceListings();
    });
}
