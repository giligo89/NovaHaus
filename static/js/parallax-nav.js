window.addEventListener("scroll", () => {
  const depth = window.scrollY * 0.5;
  document.querySelectorAll(".nav-item").forEach(item => {
    item.style.transform = `translateZ(${depth}px) rotateY(${depth / 10}deg)`;
  });
});