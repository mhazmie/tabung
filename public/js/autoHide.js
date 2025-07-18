document.addEventListener('DOMContentLoaded', function () {
    const toastElList = [].slice.call(document.querySelectorAll('.toast'));
    let delayBetweenToasts = 900;
    let baseDelay = 0;

    toastElList.forEach(function (toastEl, index) {
        const toast = new bootstrap.Toast(toastEl, { autohide: true, delay: 5500 });

        setTimeout(() => {
            toast.show();
        }, baseDelay);

        baseDelay += delayBetweenToasts;
    });
});
