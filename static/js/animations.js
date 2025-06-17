// animations.js
export async function initPageAnimations() {
  // Динамический импорт GSAP
  const gsapModule = await import('gsap');
  const gsap = gsapModule.default || gsapModule;

  // Анимация шапки
  gsap.from(".sticky-header", {
    duration: 1.2,
    y: -80,
    opacity: 0,
    ease: "expo.out",
    delay: 0.2
  });

  // Анимация пунктов меню
  gsap.from(".nav-item", {
    duration: 0.8,
    x: -30,
    opacity: 0,
    stagger: 0.15,
    ease: "back.out(1.7)",
    delay: 0.4
  });

  // Анимация основного контента
  gsap.from(".hero-content", {
    duration: 1,
    y: 50,
    opacity: 0,
    ease: "power3.out",
    delay: 0.6
  });

  // Анимация кнопки ассистента
  gsap.from("#ai-assistant", {
    duration: 1,
    scale: 0,
    opacity: 0,
    ease: "elastic.out(1, 0.8)",
    delay: 1.2
  });
}

// Плавная прокрутка наверх
document.getElementById('scrollTop').addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});