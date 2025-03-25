/*================== icon navbar ===============*/

let menuIcon = document.querySelector('#menu-icon');
let navbar = document.querySelector('.navbar');

if (menuIcon) {
    menuIcon.onclick = () => {
        menuIcon.classList.toggle('fa-xmark');
        navbar.classList.toggle('active');
    };
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
    }
};


/* ========== ANIMATIONS SCROLLREVEAL ========== */
const translations = {
    fr: ['Développeur frontend', 'Concepteur web', 'White Hat Hacker'],
    en: ['Frontend Developer', 'Web Designer', 'White Hat Hacker'],
    es: ['Desarrollador frontend', 'Diseñador web', 'Hacker ético']
};

// Détection de la langue par défaut (peut être changée dynamiquement)
let currentLang = 'fr';

// Fonction pour mettre à jour Typed.js avec la langue choisie
function updateTypedText(lang) {
    if (typed) typed.destroy(); // Détruit l'instance actuelle si elle existe

    typed = new Typed('.multiple-text', {
        strings: translations[lang],
        typeSpeed: 70,
        backSpeed: 70,
        backDelay: 1000,
        loop: true
    });
}

// Initialisation
let typed;
updateTypedText(currentLang);

// Fonction pour changer de langue (à appeler quand l'utilisateur sélectionne une langue)
function changeLanguage(lang) {
    if (translations[lang]) {
        currentLang = lang;
        updateTypedText(lang);
    }
}




// Initialisation d'EmailJS
(function() {
    emailjs.init("tbOj8Kw--MPyqXAVT"); // Remplace avec ton User ID EmailJS
})();

// Fonction d'envoi du formulaire
document.getElementById("contact-form").addEventListener("submit", function(event) {
    event.preventDefault(); // Empêche le rechargement de la page

    // Récupération des valeurs
    let fullName = document.getElementById("fullName").value;
    let emailAddress = document.getElementById("emailAddress").value;
    let mobileNumber = document.getElementById("mobileNumber").value;
    let emailSubject = document.getElementById("emailSubject").value;
    let message = document.getElementById("message").value;

    // Vérification si les champs sont remplis (optionnel si tu utilises `required`)
    if (!fullName || !emailAddress || !message) {
        alert("Please fill all required fields.");
        return;
    }

    // Création de l'objet contenant les infos
    let params = {
        fullName: fullName,
        emailAddress: emailAddress,
        mobileNumber: mobileNumber,
        emailSubject: emailSubject,
        message: message
    };

    console.log(params); 
    // Envoi via EmailJS
    emailjs.send("elie-ilunga", "template_df6n7yt", params)
        .then(function(response) {
            alert("Message envoyé avec succès !");
        }, function(error) {
            alert("Erreur lors de l'envoi : " + error.text);
        });
});
