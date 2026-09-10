const menu = document.querySelector('.menu');
const nav = document.querySelector('.nav');

if (menu) {
  menu.addEventListener('click', () => {
    const open = menu.getAttribute('aria-expanded') === 'true';
    menu.setAttribute('aria-expanded', String(!open));
    nav.classList.toggle('mobile-open', !open);
  });
}

document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', () => {
    if (nav?.classList.contains('mobile-open')) {
      nav.classList.remove('mobile-open');
      menu?.setAttribute('aria-expanded', 'false');
    }
  });
});

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.section-heading, .work-card, .service-row, .about-copy, .contact-inner').forEach(el => {
  el.classList.add('reveal');
  observer.observe(el);
});
