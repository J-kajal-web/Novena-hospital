(function () {
    'use strict';

    function showMessage(messageBox, text, type) {
        if (!messageBox) {
            window.alert(text);
            return;
        }

        messageBox.textContent = text;
        messageBox.classList.remove('d-none', 'alert-success', 'alert-danger');
        messageBox.classList.add(type === 'success' ? 'alert-success' : 'alert-danger');
    }

    function hideMessage(messageBox) {
        if (!messageBox) {
            return;
        }

        messageBox.textContent = '';
        messageBox.classList.add('d-none');
        messageBox.classList.remove('alert-success', 'alert-danger');
    }

    function formDataToObject(formData) {
        var data = {};

        formData.forEach(function (value, key) {
            data[key] = typeof value === 'string' ? value.trim() : value;
        });

        return data;
    }

    function attachAjaxForm(form) {
        var messageBox = form.querySelector('.form-message');
        var submitButton = form.querySelector('button[type="submit"], input[type="submit"]');
        var defaultButtonText = submitButton
            ? (submitButton.tagName === 'INPUT' ? submitButton.value : submitButton.innerHTML)
            : '';

        form.addEventListener('submit', async function (event) {
            event.preventDefault();
            hideMessage(messageBox);

            if (!form.reportValidity()) {
                return;
            }

            if (submitButton) {
                submitButton.disabled = true;

                if (submitButton.tagName === 'INPUT') {
                    submitButton.value = 'Please wait...';
                } else {
                    submitButton.innerHTML = 'Please wait...';
                }
            }

            try {
                var response = await fetch(form.getAttribute('action'), {
                    method: (form.getAttribute('method') || 'POST').toUpperCase(),
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(formDataToObject(new FormData(form)))
                });

                var result;

                try {
                    result = await response.json();
                } catch (jsonError) {
                    result = {
                        message: 'Unexpected server response.'
                    };
                }

                if (!response.ok) {
                    throw new Error(result.message || 'Could not submit the form.');
                }

                showMessage(messageBox, result.message || 'Form submitted successfully.', 'success');
                form.reset();
            } catch (error) {
                showMessage(messageBox, error.message || 'Could not submit the form.', 'error');
            } finally {
                if (submitButton) {
                    submitButton.disabled = false;

                    if (submitButton.tagName === 'INPUT') {
                        submitButton.value = defaultButtonText;
                    } else {
                        submitButton.innerHTML = defaultButtonText;
                    }
                }
            }
        });
    }

    document.querySelectorAll('.contact__form, .appointment__form').forEach(attachAjaxForm);
})();
