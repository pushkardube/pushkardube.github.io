/**
 * Main JavaScript — Navbar, Mobile Menu, Scroll Reveal, Active Links
 */

(function () {
  'use strict';

  // ── Navbar scroll detection ──────────────────────────────────────
  const navbar = document.querySelector('.navbar');

  function handleNavbarScroll() {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }

  window.addEventListener('scroll', handleNavbarScroll, { passive: true });

  // ── Mobile menu toggle ───────────────────────────────────────────
  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');

  if (navToggle) {
    navToggle.addEventListener('click', function () {
      const isOpen = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', !isOpen);
      navLinks.classList.toggle('open');
    });

    // Close menu when a link is clicked
    navLinks.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        navToggle.setAttribute('aria-expanded', 'false');
        navLinks.classList.remove('open');
      });
    });

    // Close menu on Escape key
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && navLinks.classList.contains('open')) {
        navToggle.setAttribute('aria-expanded', 'false');
        navLinks.classList.remove('open');
        navToggle.focus();
      }
    });
  }

  // ── Active nav link highlighting ─────────────────────────────────
  const sections = document.querySelectorAll('section[id]');
  const navItems = document.querySelectorAll('.nav-links a[href^="#"]');

  if (sections.length && navItems.length) {
    const sectionObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('id');
            navItems.forEach(function (item) {
              item.classList.remove('active');
              if (item.getAttribute('href') === '#' + id) {
                item.classList.add('active');
              }
            });
          }
        });
      },
      {
        rootMargin: '-20% 0px -80% 0px',
      }
    );

    sections.forEach(function (section) {
      sectionObserver.observe(section);
    });
  }

  // ── Scroll reveal animations ─────────────────────────────────────
  const revealElements = document.querySelectorAll('.reveal');

  // Respect prefers-reduced-motion
  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  if (prefersReducedMotion) {
    // Show everything immediately
    revealElements.forEach(function (el) {
      el.classList.add('revealed');
    });
  } else if (revealElements.length) {
    const revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            revealObserver.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px',
      }
    );

    revealElements.forEach(function (el) {
      revealObserver.observe(el);
    });
  }

  // ── Smooth scroll fallback ───────────────────────────────────────
  if (!('scrollBehavior' in document.documentElement.style)) {
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
      anchor.addEventListener('click', function (e) {
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;
        const target = document.querySelector(targetId);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });
  }
})();
