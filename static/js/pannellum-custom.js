document.addEventListener('DOMContentLoaded', () => {
    const modal = document.querySelector('.panorama-modal');
    const panoramaContainer = document.querySelector('#panorama');
    const closeButton = document.querySelector('.panorama-close');
    const toggles = document.querySelectorAll('.panorama-toggle');

    function loadPanorama(panoramaUrl) {
        if (typeof pannellum === 'undefined') {
            console.error('Pannellum: Библиотека не найдена.');
            return;
        }
        pannellum.viewer('panorama', {
            "type": "equirectangular",
            "panorama": panoramaUrl,
            "autoLoad": true,
            "autoRotate": -2,
            "compass": true,
            "title": "NovaHaus Project",
            "author": "NovaHaus"
        });
        console.log('Pannellum: Панорама загружена:', panoramaUrl);
    }

    toggles.forEach(toggle => {
        toggle.addEventListener('click', () => {
            const panoramaUrl = toggle.getAttribute('data-panorama');
            modal.classList.remove('hidden');
            loadPanorama(panoramaUrl);
        });
    });

    closeButton.addEventListener('click', () => {
        modal.classList.add('hidden');
        panoramaContainer.innerHTML = '';
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.add('hidden');
            panoramaContainer.innerHTML = '';
        }
    });
});