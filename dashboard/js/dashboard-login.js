(function () {
  'use strict';

  function showAlert(message, type) {
    var alertBox = document.getElementById('loginAlert');

    if (!alertBox) {
      return;
    }

    alertBox.className = 'alert alert-' + type;
    alertBox.textContent = message;
    alertBox.classList.remove('d-none');
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (window.HospitalAdminAuth && window.HospitalAdminAuth.isAuthenticated()) {
      window.location.href = '/dashboard/admin-dashboard.html';
      return;
    }

    var form = document.getElementById('dashboardLoginForm');

    if (!form) {
      return;
    }

    form.addEventListener('submit', function (event) {
      event.preventDefault();

      var username = document.getElementById('loginUsername').value.trim();
      var password = document.getElementById('loginPassword').value.trim();

      var result = window.HospitalAdminAuth.login(username, password);

      if (!result.success) {
        showAlert(result.message, 'danger');
        return;
      }

      showAlert(result.message + ' Redirecting...', 'success');
      setTimeout(function () {
        window.location.href = '/dashboard/admin-dashboard.html';
      }, 700);
    });
  });
})();
