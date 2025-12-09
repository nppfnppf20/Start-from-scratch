<div class="desktop-only-container">
    <div class="desktop-only-content">
        <svg class="desktop-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
            <line x1="8" y1="21" x2="16" y2="21"></line>
            <line x1="12" y1="17" x2="12" y2="21"></line>
        </svg>
        <h1>Desktop Required</h1>
        <p>This application is optimized for desktop browsers and is not yet available on mobile devices.</p>
        <p class="sub-text">Please access this site from a desktop or laptop computer.</p>
    </div>
</div>

<style>
    .desktop-only-container {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 2rem;
    }

    .desktop-only-content {
        background: white;
        border-radius: 1rem;
        padding: 3rem 2rem;
        max-width: 500px;
        text-align: center;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    }

    .desktop-icon {
        width: 80px;
        height: 80px;
        margin: 0 auto 2rem;
        color: #667eea;
    }

    .desktop-only-content h1 {
        font-size: 2rem;
        font-weight: 700;
        color: #1a202c;
        margin: 0 0 1rem;
    }

    .desktop-only-content p {
        font-size: 1.1rem;
        color: #4a5568;
        line-height: 1.6;
        margin: 0 0 1rem;
    }

    .desktop-only-content .sub-text {
        font-size: 1rem;
        color: #718096;
        margin: 1.5rem 0 0;
    }
</style>
