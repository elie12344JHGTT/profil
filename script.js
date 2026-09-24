/*================== icon navbar ===============*/

let menuIcon = document.querySelector('#menu-icon');
let navbar = document.querySelector('.navbar');

function toggleMenu() {
    menuIcon.classList.toggle('fa-xmark');
    navbar.classList.toggle('active');
    const expanded = navbar.classList.contains('active');
    menuIcon.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    menuIcon.setAttribute('aria-label', expanded ? 'Fermer le menu' : 'Ouvrir le menu');
}

if (menuIcon) {
    menuIcon.setAttribute('aria-expanded', 'false');
    menuIcon.onclick = toggleMenu;
    menuIcon.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            toggleMenu();
        }
    });
}

/*================= scroll section active ===============*/

let sections = document.querySelectorAll('section');
let navLinks = document.querySelectorAll('header nav a');

window.onscroll = () => {
    sections.forEach(sec => {
        let top = window.scrollY;
        let offset = sec.offsetTop - 150;
        let height = sec.offsetHeight;
        let id = sec.getAttribute('id');

        if (top >= offset && top < offset + height) {
            navLinks.forEach(link => {
                link.classList.remove('active');
            });

            let activeLink = document.querySelector(`header nav a[href*="${id}"]`);
            if (activeLink) {
                activeLink.classList.add('active');
            }
        }
    });

    /*================= sticky navbar ===============*/
    let header = document.querySelector('header');
    if (header) {
        header.classList.toggle('sticky', window.scrollY > 100);
    }

    /*================= remove toggle icon et navbar ===============*/
    if (menuIcon && navbar) {
        menuIcon.classList.remove('fa-xmark');
        navbar.classList.remove('active');
        menuIcon.setAttribute('aria-expanded', 'false');
        menuIcon.setAttribute('aria-label', 'Ouvrir le menu');
    }
};

/* ========== TYPED.JS ========== */
const translations = {
    fr: ['Développeur frontend', 'Concepteur web', 'White Hat Hacker'],
    en: ['Frontend Developer', 'Web Designer', 'White Hat Hacker'],
    es: ['Desarrollador frontend', 'Diseñador web', 'Hacker ético']
};

let currentLang = 'fr';
let typed;

function updateTypedText(lang) {
    if (typed) typed.destroy();

    typed = new Typed('.multiple-text', {
        strings: translations[lang],
        typeSpeed: 70,
        backSpeed: 70,
        backDelay: 1000,
        loop: true
    });
}

updateTypedText(currentLang);

function changeLanguage(lang) {
    if (translations[lang]) {
        currentLang = lang;
        updateTypedText(lang);
    }
}

/* ========== SCROLLREVEAL ========== */
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!prefersReducedMotion && typeof ScrollReveal !== 'undefined') {
    const sr = ScrollReveal({
        reset: false,
        distance: '60px',
        duration: 1500,
        delay: 100
    });

    sr.reveal('.home-content, .heading', { origin: 'top' });
    sr.reveal('.home-img, .services-container, .portfolio-box, .contact form, .contact-info', { origin: 'bottom' });
    sr.reveal('.about-img', { origin: 'left' });
    sr.reveal('.about-content', { origin: 'right' });
}

/* ========== EMAILJS ========== */
// Clé publique EmailJS : restreindre le domaine autorisé dans le tableau de bord EmailJS.
(function() {
    emailjs.init("tbOj8Kw--MPyqXAVT");
})();

const contactForm = document.getElementById('contact-form');
const formStatus = document.getElementById('form-status');
const submitBtn = document.getElementById('submit-btn');

function setFormStatus(message, type) {
    if (!formStatus) return;
    formStatus.textContent = message;
    formStatus.classList.remove('is-success', 'is-error');
    if (type) formStatus.classList.add(type);
}

if (contactForm) {
    contactForm.addEventListener('submit', function(event) {
        event.preventDefault();

        let fullName = document.getElementById('fullName').value.trim();
        let emailAddress = document.getElementById('emailAddress').value.trim();
        let mobileNumber = document.getElementById('mobileNumber').value.trim();
        let emailSubject = document.getElementById('emailSubject').value.trim();
        let message = document.getElementById('message').value.trim();

        if (!fullName || !emailAddress || !message) {
            setFormStatus('Veuillez remplir tous les champs obligatoires.', 'is-error');
            return;
        }

        const params = {
            fullName,
            emailAddress,
            mobileNumber,
            emailSubject,
            message
        };

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Envoi en cours...';
        }
        setFormStatus('Envoi du message...', null);

        emailjs.send('elie-ilunga', 'template_df6n7yt', params)
            .then(function() {
                setFormStatus('Message envoyé avec succès !', 'is-success');
                contactForm.reset();
            }, function(error) {
                setFormStatus('Erreur lors de l\'envoi : ' + (error.text || 'réessayez plus tard.'), 'is-error');
            })
            .finally(function() {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Envoyer le message';
                }
            });
    });
}
