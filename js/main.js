// Device detection and content adjustment
function adjustContentForDevice() {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if (isMobile) {
        // Show mobile-specific content
        document.querySelector('.mobile-logo').style.display = 'block';
        document.getElementById('unlockBtn').textContent = 'Continue to Mobile Access';

        // Show mobile recommendation modal
        document.getElementById('mobileModal').classList.add('active');
    } else {
        // Show PC-specific content
        document.querySelector('.pc-logo').style.display = 'block';
        document.getElementById('unlockBtn').textContent = 'Download Opera GX & Unlock Early Access';
        document.getElementById('mainHeadline').innerHTML = 'Exclusive Early Access<br>with Opera GX';
        document.getElementById('mainSubtext').innerHTML = 'This <span class="collab-badge">OFFICIAL COLLABORATION</span> between Opera GX and Netflix gives users <span class="highlight">exclusive early access</span> to unreleased content.';
    }
}

// Run device detection when page loads
window.addEventListener('load', adjustContentForDevice);

// Enhanced mobile modal interactions
document.getElementById('mobileContinueBtn').addEventListener('click', function () {
    document.getElementById('mobileModal').classList.remove('active');
    // Add success feedback
    this.textContent = '✓ Continuing...';
    this.style.background = 'linear-gradient(135deg, #00ff7f, #00cc66)';
    setTimeout(() => {
        this.textContent = 'Continue on Mobile';
        this.style.background = 'linear-gradient(135deg, var(--secondary), var(--primary))';
    }, 2000);
});

document.getElementById('usePcBtn').addEventListener('click', function () {
    document.getElementById('mobileModal').classList.remove('active');
    // Add feedback
    this.textContent = '✓ Redirecting...';
    this.style.background = 'rgba(0, 255, 127, 0.2)';
    this.style.borderColor = '#00ff7f';
    setTimeout(() => {
        this.textContent = 'I\'ll Use My PC Instead';
        this.style.background = 'transparent';
        this.style.borderColor = 'var(--border)';
    }, 2000);
});

// Modal close button
document.getElementById('modalClose').addEventListener('click', function () {
    document.getElementById('mobileModal').classList.remove('active');
});

// Close modal when clicking outside
document.getElementById('mobileModal').addEventListener('click', function (e) {
    if (e.target === this) {
        this.classList.remove('active');
    }
});

// Countdown timer
function updateCountdown() {
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);

    const diff = midnight - now;

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    document.getElementById('countdown').textContent =
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

setInterval(updateCountdown, 1000);
updateCountdown();

// Unlock button functionality
document.getElementById('unlockBtn').addEventListener('click', function () {
    window.open("https://unlockofferwall.top/cl/v/e6gr5d", "_self")
});

// Activity feed dynamic data
const feed = document.getElementById('feed');

const actionTemplates = [
    'just unlocked early access to Stranger Things Season 5.',
    'started watching The Witcher Season 4 before release.',
    'activated early access mode.',
    'just finished verification for early streaming.',
    'is now watching exclusive Netflix content early.',
    'unlocked preview of Wednesday Season 2.',
    'streaming unreleased episodes of Avatar: The Last Airbender.',
    'got early access successfully.',
    'joined from Amsterdam, NL – early access confirmed.',
    'verified this page as safe and secure.',
    'recommended this early access to friends.',
    'shared their access link and unlocked bonus content.',
    'is streaming Netflix with early access activated.',
    'got access to developer preview mode.',
    'just viewed exclusive content not yet on Netflix.',
    'bypassed regional restrictions.',
    'streaming secret Netflix previews.',
    'just enabled early access mode successfully.',
    'joined the private program.',
    'invited 2 friends to unlock full access.',
    'streaming leaked Netflix shows in HD.',
    'discovered hidden Netflix content via this page.',
    'verified their device and unlocked full episodes.',
    'just claimed the latest unreleased Netflix drops.'
];

function randomUserMask() {
    const firstNames = ['Alex', 'Jamie', 'Taylor', 'Jordan', 'Casey', 'Morgan', 'Riley', 'Quinn'];
    const lastInitial = String.fromCharCode(65 + Math.floor(Math.random() * 26));
    return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastInitial}.`;
}

function generateActivity() {
    const user = randomUserMask();
    const action = actionTemplates[Math.floor(Math.random() * actionTemplates.length)];
    return `${user} ${action}`;
}

let normalInterval = 2500;
let fastInterval = 400;
let currentInterval = normalInterval;
let intervalId = null;

function addActivity() {
    const item = document.createElement('span');
    item.textContent = generateActivity();

    if (feed.children.length >= 6) feed.removeChild(feed.firstChild);
    feed.appendChild(item);
}

for (let i = 0; i < 4; i++) addActivity();

function startFeed(interval) {
    if (intervalId) clearInterval(intervalId);
    intervalId = setInterval(addActivity, interval);
}

startFeed(normalInterval);

function triggerWave() {
    startFeed(fastInterval);
    setTimeout(() => {
        startFeed(normalInterval);
    }, 8000);
}

setInterval(() => {
    if (Math.random() < 0.6) {
        triggerWave();
    }
}, 20000);

// Enhanced viewer count with super animations
const viewer = document.getElementById('viewerCount');
const viewerContainer = document.querySelector('.viewer-count');
let current = 1200 + Math.floor(Math.random() * 100);
let isAnimating = false;

// Function to animate number change
function animateNumberChange(newValue, oldValue) {
    if (isAnimating) return;
    isAnimating = true;

    const numberElement = document.querySelector('.number');
    const oldText = oldValue.toLocaleString();
    const newText = newValue.toLocaleString();

    // Add pulse effect to container
    viewerContainer.style.animation = 'viewerPulse 0.3s ease-in-out';

    // Animate the number change
    numberElement.style.animation = 'numberRoll 0.5s ease-out';

    setTimeout(() => {
        viewer.textContent = newText;
        numberElement.style.animation = '';
        viewerContainer.style.animation = 'gradientShift 3s ease-in-out infinite, viewerPulse 2s ease-in-out infinite';
        isAnimating = false;
    }, 250);
}

// Enhanced viewer count updates
function updateViewerCount() {
    const oldValue = current;
    const change = Math.floor(Math.random() * 15) - 5; // More dramatic changes
    current = Math.max(800, Math.min(2000, current + change)); // Keep within reasonable bounds

    if (oldValue !== current) {
        animateNumberChange(current, oldValue);
    }

    // Randomly trigger special effects
    if (Math.random() < 0.1) { // 10% chance
        triggerViewerEffect();
    }
}

// Special viewer effects
function triggerViewerEffect() {
    const viewerContainer = document.querySelector('.viewer-count');
    const liveIndicator = document.querySelector('.live-indicator');

    // Flash effect
    viewerContainer.style.animation = 'viewerPulse 0.2s ease-in-out, flashEffect 0.3s ease-in-out';
    liveIndicator.style.animation = 'livePulse 0.2s ease-in-out, flashEffect 0.3s ease-in-out';

    setTimeout(() => {
        viewerContainer.style.animation = 'gradientShift 3s ease-in-out infinite, viewerPulse 2s ease-in-out infinite';
        liveIndicator.style.animation = 'livePulse 1.5s ease-in-out infinite';
    }, 300);
}

// Add flash effect animation
const style = document.createElement('style');
style.textContent = `
      @keyframes flashEffect {
        0%, 100% { 
          box-shadow: 0 0 20px rgba(255, 71, 87, 0.2);
        }
        50% { 
          box-shadow: 0 0 40px rgba(255, 71, 87, 0.8);
        }
      }
    `;
document.head.appendChild(style);

// Update viewer count more frequently for better effect
setInterval(updateViewerCount, 2000); // Every 2 seconds

// Initial animation
setTimeout(() => {
    updateViewerCount();
}, 1000);

// Write review button behavior
const writeReviewBtn = document.getElementById('writeReviewBtn');
const reviewWarning = document.getElementById('reviewWarning');
writeReviewBtn.addEventListener('click', () => {
    reviewWarning.style.display = 'block';
    setTimeout(() => {
        reviewWarning.style.display = 'none';
    }, 4000);
});

// Virus Checker Functionality
document.getElementById('virusCheckerBtn').addEventListener('click', function () {
    const modal = document.getElementById('virusCheckerModal');
    const progressBar = document.getElementById('progressBar');
    const scanStatus = document.getElementById('scanStatus');
    const scanResult = document.getElementById('scanResult');

    modal.style.display = 'block';
    scanStatus.style.display = 'block';
    scanResult.style.display = 'none';
    progressBar.style.width = '0%';

    let progress = 0;
    const scanInterval = setInterval(() => {
        progress += 1;
        progressBar.style.width = `${progress}%`;

        if (progress === 20) scanStatus.innerHTML = '<p>Analyzing network connections...</p>';
        if (progress === 50) scanStatus.innerHTML = '<p>Checking for malware signatures...</p>';
        if (progress === 80) scanStatus.innerHTML = '<p>Finalizing security report...</p>';

        if (progress >= 100) {
            clearInterval(scanInterval);
            scanStatus.style.display = 'none';
            scanResult.style.display = 'block';
        }
    }, 30); // Fast scan (3 seconds total)
});

document.getElementById('closeModal').addEventListener('click', function () {
    document.getElementById('virusCheckerModal').style.display = 'none';
});

// Update "last scan" time
setInterval(() => {
    const minutes = Math.floor(Math.random() * 5);
    document.getElementById('lastScan').textContent = `${minutes} minutes ago`;
}, 60000);

// FAQ toggle functionality
document.querySelectorAll('.faq-question').forEach(question => {
    question.addEventListener('click', () => {
        const item = question.parentElement;
        item.classList.toggle('active');

        // Close other open items
        document.querySelectorAll('.faq-item').forEach(otherItem => {
            if (otherItem !== item && otherItem.classList.contains('active')) {
                otherItem.classList.remove('active');
            }
        });
    });
});

// Scroll progress bar
window.addEventListener('scroll', () => {
    const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrollProgress = (scrollTop / scrollHeight) * 100;
    document.getElementById('progressBarScroll').style.width = `${scrollProgress}%`;

    // Hide scroll hint when user starts scrolling
    if (scrollTop > 100) {
        document.getElementById('scrollHint').style.opacity = '0';
        document.getElementById('scrollHint').style.visibility = 'hidden';
    } else {
        document.getElementById('scrollHint').style.opacity = '1';
        document.getElementById('scrollHint').style.visibility = 'visible';
    }
});

// Smooth scroll to elements when clicking links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;

        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            window.scrollTo({
                top: targetElement.offsetTop - 20,
                behavior: 'smooth'
            });
        }
    });
});