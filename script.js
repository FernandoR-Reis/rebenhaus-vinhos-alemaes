(function() {
  var nav = document.getElementById('mainNav');
  if (nav) {
    window.addEventListener('scroll', function() {
      nav.classList.toggle('scrolled', window.scrollY > 40);
    });
  }

  var animEls = document.querySelectorAll('[data-anim]');
  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    animEls.forEach(function(el) { observer.observe(el); });
  } else {
    animEls.forEach(function(el) { el.classList.add('visible'); });
  }

  var ageGate = document.getElementById('ageGate');
  var ageYesBtn = document.getElementById('ageYesBtn');
  var ageNoBtn = document.getElementById('ageNoBtn');

  if (sessionStorage.getItem('age_verified') && ageGate) {
    ageGate.style.display = 'none';
  }

  if (ageYesBtn && ageGate) {
    ageYesBtn.addEventListener('click', function() {
      sessionStorage.setItem('age_verified', '1');
      ageGate.style.display = 'none';
    });
  }

  if (ageNoBtn) {
    ageNoBtn.addEventListener('click', function() {
      window.location.href = 'https://google.com';
    });
  }
})();