(function () {
  'use strict';

  var STORAGE_KEY = 'hospital_admin_session';
  var SESSION_HOURS = 12;

  // Demo credentials for college project usage.
  var DEMO_ADMIN_USERNAME = 'admin';
  var DEMO_ADMIN_PASSWORD = 'admin123';

  function getSession() {
    var raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw);
    } catch (error) {
      return null;
    }
  }

  function isSessionExpired(session) {
    if (!session || !session.loginAt) {
      return true;
    }

    var loginTime = new Date(session.loginAt).getTime();
    var now = Date.now();
    var sessionDurationMs = SESSION_HOURS * 60 * 60 * 1000;

    return Number.isNaN(loginTime) || now - loginTime > sessionDurationMs;
  }

  function isAuthenticated() {
    var session = getSession();

    if (!session || isSessionExpired(session)) {
      localStorage.removeItem(STORAGE_KEY);
      return false;
    }

    return true;
  }

  function login(username, password) {
    if (username !== DEMO_ADMIN_USERNAME || password !== DEMO_ADMIN_PASSWORD) {
      return {
        success: false,
        message: 'Invalid username or password.'
      };
    }

    var session = {
      username: username,
      loginAt: new Date().toISOString()
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));

    return {
      success: true,
      message: 'Login successful.'
    };
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEY);
    window.location.href = '/dashboard/index.html';
  }

  function requireAuth() {
    if (!isAuthenticated()) {
      window.location.href = '/dashboard/index.html';
    }
  }

  function bindLogoutButtons() {
    var logoutButtons = document.querySelectorAll('.js-logout');

    logoutButtons.forEach(function (button) {
      button.addEventListener('click', function () {
        logout();
      });
    });
  }

  function setActiveSidebarLink() {
    var currentPage = window.location.pathname.split('/').pop();
    var links = document.querySelectorAll('.sidebar-link[data-page]');

    links.forEach(function (link) {
      if (link.getAttribute('data-page') === currentPage) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  function showDemoCredentials() {
    var box = document.getElementById('demoCredentials');

    if (!box) {
      return;
    }

    box.innerHTML =
      '<strong>Demo Login</strong><br>Username: <code>' +
      DEMO_ADMIN_USERNAME +
      '</code><br>Password: <code>' +
      DEMO_ADMIN_PASSWORD +
      '</code>';
  }

  window.HospitalAdminAuth = {
    login: login,
    logout: logout,
    requireAuth: requireAuth,
    isAuthenticated: isAuthenticated,
    getSession: getSession,
    bindLogoutButtons: bindLogoutButtons,
    setActiveSidebarLink: setActiveSidebarLink
  };

  document.addEventListener('DOMContentLoaded', function () {
    if (document.body.dataset.requiresAuth === 'true') {
      requireAuth();
    }

    bindLogoutButtons();
    setActiveSidebarLink();
    showDemoCredentials();
  });
})();
