const menuIcon = document.getElementById('menu-icon');
  const navMenu = document.getElementById('nav-menu');

  menuIcon.addEventListener('click', () => {
    navMenu.classList.toggle('active');
    menuIcon.classList.toggle('fa-bars');
    menuIcon.classList.toggle('fa-xmark'); // croix pour fermer
  });