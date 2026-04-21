(function () {
  'use strict';

  var dashboardState = {
    appointments: [],
    contacts: []
  };

  function byId(id) {
    return document.getElementById(id);
  }

  function escapeHtml(text) {
    if (text === null || text === undefined) {
      return '';
    }

    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function formatDate(value) {
    if (!value) {
      return '-';
    }

    var date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function showPageAlert(message, type) {
    var alert = byId('pageAlert');

    if (!alert) {
      return;
    }

    alert.className = 'alert alert-' + type;
    alert.textContent = message;
    alert.classList.remove('d-none');

    setTimeout(function () {
      alert.classList.add('d-none');
    }, 2500);
  }

  function setSectionVisibility(loadingId, emptyId, wrapperId, mode, emptyMessage) {
    var loading = byId(loadingId);
    var empty = byId(emptyId);
    var wrapper = byId(wrapperId);

    if (loading) {
      loading.classList.toggle('d-none', mode !== 'loading');
    }

    if (empty) {
      empty.classList.toggle('d-none', mode !== 'empty');

      if (mode === 'empty' && emptyMessage) {
        empty.textContent = emptyMessage;
      }
    }

    if (wrapper) {
      wrapper.classList.toggle('d-none', mode !== 'table');
    }
  }

  async function fetchJson(url, options) {
    var response = await fetch(url, options || {});
    var data = {};

    try {
      data = await response.json();
    } catch (error) {
      data = {};
    }

    if (!response.ok) {
      throw new Error(data.message || 'Request failed.');
    }

    return data;
  }

  function setupSidebarToggle() {
    var toggleButton = byId('sidebarToggle');
    var overlay = byId('sidebarOverlay');

    if (toggleButton) {
      toggleButton.addEventListener('click', function () {
        document.body.classList.toggle('sidebar-open');
      });
    }

    if (overlay) {
      overlay.addEventListener('click', function () {
        document.body.classList.remove('sidebar-open');
      });
    }
  }

  function appointmentStatusBadge(status) {
    var safeStatus = status || 'Pending';
    var cssClass = 'status-pending';

    if (safeStatus === 'Confirmed') {
      cssClass = 'status-confirmed';
    } else if (safeStatus === 'Cancelled') {
      cssClass = 'status-cancelled';
    } else if (safeStatus === 'Completed') {
      cssClass = 'status-completed';
    }

    return '<span class="status-badge ' + cssClass + '">' + escapeHtml(safeStatus) + '</span>';
  }

  function reviewedBadge(reviewed) {
    if (reviewed) {
      return '<span class="status-badge status-reviewed">Reviewed</span>';
    }

    return '<span class="status-badge status-not-reviewed">Not Reviewed</span>';
  }

  async function loadOverviewData() {
    setSectionVisibility(
      'overviewLoadingState',
      'overviewEmptyState',
      'recentAppointmentsWrapper',
      'loading'
    );

    try {
      var result = await Promise.all([fetchJson('/api/appointments'), fetchJson('/api/contact')]);
      var appointments = result[0].data || [];
      var contacts = result[1].data || [];

      dashboardState.appointments = appointments;
      dashboardState.contacts = contacts;

      byId('totalAppointmentsValue').textContent = appointments.length;
      byId('pendingAppointmentsValue').textContent = appointments.filter(function (item) {
        return item.status === 'Pending';
      }).length;
      byId('confirmedAppointmentsValue').textContent = appointments.filter(function (item) {
        return item.status === 'Confirmed';
      }).length;
      byId('cancelledAppointmentsValue').textContent = appointments.filter(function (item) {
        return item.status === 'Cancelled';
      }).length;
      byId('totalContactsValue').textContent = contacts.length;

      var recentRows = appointments.slice(0, 8);
      var tableBody = byId('recentAppointmentsTableBody');

      if (recentRows.length === 0) {
        setSectionVisibility(
          'overviewLoadingState',
          'overviewEmptyState',
          'recentAppointmentsWrapper',
          'empty',
          'No appointments yet. New bookings will appear here.'
        );
        return;
      }

      tableBody.innerHTML = recentRows
        .map(function (item) {
          return (
            '<tr>' +
            '<td>' + escapeHtml(item.name || '-') + '</td>' +
            '<td>' + escapeHtml(item.department || '-') + '</td>' +
            '<td>' + escapeHtml(item.doctor || '-') + '</td>' +
            '<td>' + formatDate(item.date + ' ' + (item.time || '')) + '</td>' +
            '<td>' + appointmentStatusBadge(item.status) + '</td>' +
            '<td>' + formatDate(item.createdAt) + '</td>' +
            '</tr>'
          );
        })
        .join('');

      setSectionVisibility(
        'overviewLoadingState',
        'overviewEmptyState',
        'recentAppointmentsWrapper',
        'table'
      );
    } catch (error) {
      setSectionVisibility(
        'overviewLoadingState',
        'overviewEmptyState',
        'recentAppointmentsWrapper',
        'empty',
        'Could not load dashboard data.'
      );
      showPageAlert(error.message || 'Could not load overview data.', 'danger');
    }
  }

  function initializeOverviewPage() {
    var refreshButton = byId('overviewRefreshBtn');

    if (refreshButton) {
      refreshButton.addEventListener('click', function () {
        loadOverviewData();
      });
    }

    loadOverviewData();
  }

  function getFilteredAppointments() {
    var searchInput = byId('appointmentSearch');
    var statusFilter = byId('appointmentStatusFilter');
    var query = searchInput ? searchInput.value.trim().toLowerCase() : '';
    var status = statusFilter ? statusFilter.value : 'all';

    return dashboardState.appointments.filter(function (item) {
      var statusMatch = status === 'all' || item.status === status;
      var searchableText = [
        item.name,
        item.email,
        item.phone,
        item.department,
        item.doctor,
        item.message,
        item.status,
        item.date
      ]
        .join(' ')
        .toLowerCase();
      var queryMatch = !query || searchableText.indexOf(query) !== -1;

      return statusMatch && queryMatch;
    });
  }

  function renderAppointmentsTable(rows) {
    var tableBody = byId('appointmentsTableBody');

    if (!rows.length) {
      setSectionVisibility(
        'appointmentsLoadingState',
        'appointmentsEmptyState',
        'appointmentsTableWrapper',
        'empty',
        'No appointments found for your current search/filter.'
      );
      return;
    }

    tableBody.innerHTML = rows
      .map(function (item) {
        var id = escapeHtml(item._id);

        return (
          '<tr>' +
          '<td>' + escapeHtml(item.name || '-') + '</td>' +
          '<td>' + escapeHtml(item.email || '-') + '</td>' +
          '<td>' + escapeHtml(item.phone || '-') + '</td>' +
          '<td>' + formatDate(item.date + ' ' + (item.time || '')) + '</td>' +
          '<td>' + escapeHtml(item.department || '-') + '</td>' +
          '<td>' + escapeHtml(item.doctor || '-') + '</td>' +
          '<td class="message-cell">' + escapeHtml(item.message || '-') + '</td>' +
          '<td>' + appointmentStatusBadge(item.status) + '</td>' +
          '<td>' + formatDate(item.createdAt) + '</td>' +
          '<td>' +
          '<div class="action-group">' +
          '<button class="btn-action btn-confirm" data-action="confirm" data-id="' + id + '">Confirm</button>' +
          '<button class="btn-action btn-cancel" data-action="cancel" data-id="' + id + '">Cancel</button>' +
          '<button class="btn-action btn-delete" data-action="delete" data-id="' + id + '">Delete</button>' +
          '</div>' +
          '</td>' +
          '</tr>'
        );
      })
      .join('');

    setSectionVisibility(
      'appointmentsLoadingState',
      'appointmentsEmptyState',
      'appointmentsTableWrapper',
      'table'
    );
  }

  async function loadAppointments() {
    setSectionVisibility(
      'appointmentsLoadingState',
      'appointmentsEmptyState',
      'appointmentsTableWrapper',
      'loading'
    );

    try {
      var result = await fetchJson('/api/appointments');
      dashboardState.appointments = result.data || [];
      renderAppointmentsTable(getFilteredAppointments());
    } catch (error) {
      setSectionVisibility(
        'appointmentsLoadingState',
        'appointmentsEmptyState',
        'appointmentsTableWrapper',
        'empty',
        'Could not load appointments right now.'
      );
      showPageAlert(error.message || 'Failed to load appointments.', 'danger');
    }
  }

  async function handleAppointmentAction(action, appointmentId) {
    if (!appointmentId) {
      return;
    }

    if (action === 'confirm' || action === 'cancel') {
      var status = action === 'confirm' ? 'Confirmed' : 'Cancelled';

      try {
        await fetchJson('/api/appointments/' + appointmentId, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            status: status
          })
        });

        showPageAlert('Appointment status updated to ' + status + '.', 'success');
        loadAppointments();
      } catch (error) {
        showPageAlert(error.message || 'Could not update appointment status.', 'danger');
      }

      return;
    }

    if (action === 'delete') {
      var userConfirmed = window.confirm('Delete this appointment permanently?');

      if (!userConfirmed) {
        return;
      }

      try {
        await fetchJson('/api/appointments/' + appointmentId, {
          method: 'DELETE'
        });

        showPageAlert('Appointment deleted successfully.', 'success');
        loadAppointments();
      } catch (error) {
        showPageAlert(error.message || 'Could not delete appointment.', 'danger');
      }
    }
  }

  function initializeAppointmentsPage() {
    var searchInput = byId('appointmentSearch');
    var statusFilter = byId('appointmentStatusFilter');
    var refreshButton = byId('appointmentRefreshBtn');
    var tableBody = byId('appointmentsTableBody');

    if (searchInput) {
      searchInput.addEventListener('input', function () {
        renderAppointmentsTable(getFilteredAppointments());
      });
    }

    if (statusFilter) {
      statusFilter.addEventListener('change', function () {
        renderAppointmentsTable(getFilteredAppointments());
      });
    }

    if (refreshButton) {
      refreshButton.addEventListener('click', function () {
        loadAppointments();
      });
    }

    if (tableBody) {
      tableBody.addEventListener('click', function (event) {
        var button = event.target.closest('button[data-action]');

        if (!button) {
          return;
        }

        var action = button.getAttribute('data-action');
        var appointmentId = button.getAttribute('data-id');
        handleAppointmentAction(action, appointmentId);
      });
    }

    loadAppointments();
  }

  function getFilteredContacts() {
    var searchInput = byId('contactSearch');
    var reviewedFilter = byId('contactReviewedFilter');
    var query = searchInput ? searchInput.value.trim().toLowerCase() : '';
    var filterValue = reviewedFilter ? reviewedFilter.value : 'all';

    return dashboardState.contacts.filter(function (item) {
      var reviewMatch =
        filterValue === 'all' ||
        (filterValue === 'reviewed' && item.reviewed) ||
        (filterValue === 'not-reviewed' && !item.reviewed);
      var searchableText = [item.name, item.email, item.phone, item.subject, item.message]
        .join(' ')
        .toLowerCase();
      var queryMatch = !query || searchableText.indexOf(query) !== -1;

      return reviewMatch && queryMatch;
    });
  }

  function renderContactsTable(rows) {
    var tableBody = byId('contactsTableBody');

    if (!rows.length) {
      setSectionVisibility(
        'contactsLoadingState',
        'contactsEmptyState',
        'contactsTableWrapper',
        'empty',
        'No contact messages found for your current search/filter.'
      );
      return;
    }

    tableBody.innerHTML = rows
      .map(function (item) {
        var id = escapeHtml(item._id);
        var reviewedButtonLabel = item.reviewed ? 'Unreview' : 'Mark Reviewed';
        var reviewedAction = item.reviewed ? 'unreview' : 'review';

        return (
          '<tr>' +
          '<td>' + escapeHtml(item.name || '-') + '</td>' +
          '<td>' + escapeHtml(item.email || '-') + '</td>' +
          '<td>' + escapeHtml(item.phone || '-') + '</td>' +
          '<td>' + escapeHtml(item.subject || '-') + '</td>' +
          '<td class="message-cell">' + escapeHtml(item.message || '-') + '</td>' +
          '<td>' + reviewedBadge(Boolean(item.reviewed)) + '</td>' +
          '<td>' + formatDate(item.createdAt) + '</td>' +
          '<td>' +
          '<div class="action-group">' +
          '<button class="btn-action btn-review" data-action="' + reviewedAction + '" data-id="' + id + '">' +
          reviewedButtonLabel +
          '</button>' +
          '<button class="btn-action btn-delete" data-action="delete" data-id="' + id + '">Delete</button>' +
          '</div>' +
          '</td>' +
          '</tr>'
        );
      })
      .join('');

    setSectionVisibility(
      'contactsLoadingState',
      'contactsEmptyState',
      'contactsTableWrapper',
      'table'
    );
  }

  async function loadContacts() {
    setSectionVisibility('contactsLoadingState', 'contactsEmptyState', 'contactsTableWrapper', 'loading');

    try {
      var result = await fetchJson('/api/contact');
      dashboardState.contacts = result.data || [];
      renderContactsTable(getFilteredContacts());
    } catch (error) {
      setSectionVisibility(
        'contactsLoadingState',
        'contactsEmptyState',
        'contactsTableWrapper',
        'empty',
        'Could not load contact messages right now.'
      );
      showPageAlert(error.message || 'Failed to load contact messages.', 'danger');
    }
  }

  async function handleContactAction(action, contactId) {
    if (!contactId) {
      return;
    }

    if (action === 'review' || action === 'unreview') {
      var reviewedValue = action === 'review';

      try {
        await fetchJson('/api/contact/' + contactId, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            reviewed: reviewedValue
          })
        });

        showPageAlert('Contact message updated.', 'success');
        loadContacts();
      } catch (error) {
        showPageAlert(error.message || 'Could not update contact message.', 'danger');
      }

      return;
    }

    if (action === 'delete') {
      var userConfirmed = window.confirm('Delete this contact message permanently?');

      if (!userConfirmed) {
        return;
      }

      try {
        await fetchJson('/api/contact/' + contactId, {
          method: 'DELETE'
        });

        showPageAlert('Contact message deleted successfully.', 'success');
        loadContacts();
      } catch (error) {
        showPageAlert(error.message || 'Could not delete contact message.', 'danger');
      }
    }
  }

  function initializeContactsPage() {
    var searchInput = byId('contactSearch');
    var reviewedFilter = byId('contactReviewedFilter');
    var refreshButton = byId('contactRefreshBtn');
    var tableBody = byId('contactsTableBody');

    if (searchInput) {
      searchInput.addEventListener('input', function () {
        renderContactsTable(getFilteredContacts());
      });
    }

    if (reviewedFilter) {
      reviewedFilter.addEventListener('change', function () {
        renderContactsTable(getFilteredContacts());
      });
    }

    if (refreshButton) {
      refreshButton.addEventListener('click', function () {
        loadContacts();
      });
    }

    if (tableBody) {
      tableBody.addEventListener('click', function (event) {
        var button = event.target.closest('button[data-action]');

        if (!button) {
          return;
        }

        var action = button.getAttribute('data-action');
        var contactId = button.getAttribute('data-id');
        handleContactAction(action, contactId);
      });
    }

    loadContacts();
  }

  document.addEventListener('DOMContentLoaded', function () {
    setupSidebarToggle();

    var page = document.body.dataset.dashboardPage;

    if (page === 'overview') {
      initializeOverviewPage();
    } else if (page === 'appointments') {
      initializeAppointmentsPage();
    } else if (page === 'contacts') {
      initializeContactsPage();
    }
  });
})();
