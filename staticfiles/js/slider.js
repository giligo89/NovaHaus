document.addEventListener('DOMContentLoaded', () => {
    const slider = document.querySelector('#hero-slider');
    const slides = slider.querySelectorAll('video, img');
    const indicators = slider.querySelectorAll('.indicator');
    let currentIndex = 0;
    const slideInterval = 5000;

    function showSlide(index) {
        slides.forEach((slide, i) => {
            slide.classList.toggle('active', i === index);
            slide.classList.toggle('opacity-0', i !== index);
        });
        indicators.forEach((indicator, i) => {
            indicator.classList.toggle('active', i === index);
        });
        currentIndex = index;
    }

    function nextSlide() {
        const nextIndex = (currentIndex + 1) % slides.length;
        showSlide(nextIndex);
    }

    indicators.forEach(indicator => {
        indicator.addEventListener('click', () => {
            const index = parseInt(indicator.getAttribute('data-slide'));
            showSlide(index);
            clearInterval(autoSlide);
            autoSlide = setInterval(nextSlide, slideInterval);
        });
    });

    slides.forEach(slide => {
        if (slide.tagName === 'VIDEO') {
            slide.addEventListener('play', () => {
                if (!slide.classList.contains('active')) {
                    slide.pause();
                }
            });
        }
    });

    let autoSlide = setInterval(nextSlide, slideInterval);

    slider.addEventListener('mouseenter', () => clearInterval(autoSlide));
    slider.addEventListener('mouseleave', () => {
        autoSlide = setInterval(nextSlide, slideInterval);
    });

    showSlide(0);
});