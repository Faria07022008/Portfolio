const USER = 'Faria07022008';
const EMAIL = 'fariarobertomatheus@gmail.com';
const CACHE_KEY = `repos:${USER}`;
const CACHE_TTL = 1000 * 60 * 30; // 30 minutos
const MAX_PROJECTS = 6;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Menu mobile ---------- */

const menuButton = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');

function setMenu(open) {
  navLinks.classList.toggle('open', open);
  menuButton.classList.toggle('open', open);
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
}

if (menuButton && navLinks) {
  menuButton.addEventListener('click', () => {
    setMenu(!navLinks.classList.contains('open'));
  });

  navLinks.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => setMenu(false));
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') setMenu(false);
  });
}

/* ---------- Animação de entrada ---------- */

const revealItems = document.querySelectorAll('.reveal');

if ('IntersectionObserver' in window && !reducedMotion) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  revealItems.forEach((element) => observer.observe(element));
} else {
  revealItems.forEach((element) => element.classList.add('visible'));
}

/* ---------- Texto digitado no hero ---------- */

const typing = document.getElementById('typing');

if (typing && !reducedMotion) {
  const words = (typing.dataset.words || '').split('|').filter(Boolean);
  let wordIndex = 0;
  let charIndex = words[0] ? words[0].length : 0;
  let deleting = false;

  const tick = () => {
    const word = words[wordIndex];
    typing.textContent = word.slice(0, charIndex);
    let delay = deleting ? 35 : 70;

    if (!deleting && charIndex === word.length) {
      deleting = true;
      delay = 2000;
    } else if (deleting && charIndex === 0) {
      deleting = false;
      wordIndex = (wordIndex + 1) % words.length;
      delay = 350;
    } else {
      charIndex += deleting ? -1 : 1;
    }
    setTimeout(tick, delay);
  };

  if (words.length > 1) setTimeout(tick, 2200);
}

/* ---------- Projetos do GitHub ---------- */

const LANG_COLORS = {
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  HTML: '#e34c26',
  CSS: '#8b5cf6',
  'C#': '#7bd88f',
  Python: '#3572a5',
  Java: '#b07219',
  PHP: '#8892bf',
  'C++': '#f34b7d',
  C: '#9aa3b5',
  Shell: '#89e051'
};

function esc(value = '') {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }[character]));
}

function safeUrl(url) {
  return /^https?:\/\//i.test(url || '') ? esc(url) : '';
}

const ICON_FOLDER =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>';

function prettyName(name) {
  return name.replace(/[-_]+/g, ' ');
}

function card(repository) {
  const color = LANG_COLORS[repository.language] || '#6b7487';
  const live = safeUrl(repository.homepage);
  const description =
    repository.description || 'Projeto desenvolvido por Matheus Faria.';

  return `
    <article class="project-card">
      <div class="project-top">
        <span class="project-icon">${ICON_FOLDER}</span>
        <span class="project-stars" title="Estrelas no GitHub">★ ${repository.stargazers_count}</span>
      </div>
      <h3>${esc(prettyName(repository.name))}</h3>
      <p>${esc(description)}</p>
      <div class="project-foot">
        <span class="lang" style="--lang:${color}"><i></i>${esc(repository.language || 'Projeto')}</span>
        <div class="project-links">
          <a href="${esc(repository.html_url)}" target="_blank" rel="noopener noreferrer" aria-label="Código de ${esc(repository.name)} no GitHub">Código</a>
          ${live ? `<a class="live" href="${live}" target="_blank" rel="noopener noreferrer" aria-label="Ver ${esc(repository.name)} online">Ver online</a>` : ''}
        </div>
      </div>
    </article>
  `;
}

function readCache() {
  try {
    const cached = JSON.parse(sessionStorage.getItem(CACHE_KEY));
    if (cached && Date.now() - cached.time < CACHE_TTL) return cached.data;
  } catch (error) {
    /* sem cache disponível */
  }
  return null;
}

function writeCache(data) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ time: Date.now(), data }));
  } catch (error) {
    /* ignora */
  }
}

async function loadRepos() {
  const projectGrid = document.getElementById('project-grid');
  if (!projectGrid) return;

  const profileLink = `https://github.com/${USER}`;
  const emptyState = (message) => `
    <div class="state-card">
      <p>${message} <a href="${profileLink}" target="_blank" rel="noopener noreferrer">Ver perfil no GitHub ↗</a></p>
    </div>
  `;

  try {
    let repositories = readCache();

    if (!repositories) {
      const response = await fetch(
        `https://api.github.com/users/${USER}/repos?per_page=100&sort=updated`,
        { headers: { Accept: 'application/vnd.github+json' } }
      );

      if (!response.ok) throw new Error('Falha ao carregar repositórios');

      repositories = (await response.json())
        .filter((repository) => !repository.fork && !repository.archived)
        .slice(0, MAX_PROJECTS);

      writeCache(repositories);
    }

    projectGrid.innerHTML = repositories.length
      ? repositories.map(card).join('')
      : emptyState('Nenhum repositório público encontrado ainda.');
  } catch (error) {
    projectGrid.innerHTML = emptyState('Não foi possível carregar os projetos agora.');
  }
}

loadRepos();

/* ---------- Rodapé ---------- */

const year = document.getElementById('year');
if (year) year.textContent = new Date().getFullYear();

/* ---------- Formulário de contato ---------- */

const contactForm = document.getElementById('contact-form');

if (contactForm) {
  const note = document.getElementById('form-note');

  contactForm.addEventListener('submit', (event) => {
    event.preventDefault();

    if (!contactForm.checkValidity()) {
      contactForm.reportValidity();
      return;
    }

    const field = (id) => document.getElementById(id).value.trim();
    const nome = field('nome');
    const email = field('email');
    const telefone = field('telefone') || 'não informado';
    const mensagem = field('mensagem');

    const subject = encodeURIComponent(`Contato pelo portfólio - ${nome}`);
    const body = encodeURIComponent(
      `Nome: ${nome}\n` +
      `E-mail: ${email}\n` +
      `Telefone: ${telefone}\n\n` +
      `Mensagem:\n${mensagem}`
    );

    if (note) {
      note.textContent = 'Abrindo seu aplicativo de e-mail…';
    }

    window.location.href = `mailto:${EMAIL}?subject=${subject}&body=${body}`;
  });
}
