window.addEventListener('load', () => {
    const el = document.getElementById('vote-settings');
    const shouldShowVote = el?.dataset.shouldShow === 'true';

    if (shouldShowVote) {
        const voteModal = new bootstrap.Modal(document.getElementById('voteModal'));
        setTimeout(() => voteModal.show(), 300);
    }
});