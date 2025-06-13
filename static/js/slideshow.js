// This file will contain the JavaScript for the slideshow functionality.

// DOM elements
const currentImage = document.getElementById('current-image');
const prevBtn = document.getElementById('prev-btn');
const playPauseBtn = document.getElementById('play-pause-btn');
const nextBtn = document.getElementById('next-btn');
const currentImageInfo = document.getElementById('current-image-info');
const decreaseSpeedBtn = document.getElementById('decrease-speed-btn');
const increaseSpeedBtn = document.getElementById('increase-speed-btn');
const currentSpeedDisplay = document.getElementById('current-speed');


// Slideshow state
let currentIndex = 0;
let slideshowIntervalId = null; // To store the ID from setInterval
let currentSpeedFactor = 1.0;
const baseInterval = 2000; // 2 seconds per slide at 1.0x speed

// imageFilenames and imageBasePath are expected to be defined in a <script> tag in the HTML,
// before this script is loaded.

/**
 * Displays the image at the given index in the slideshow.
 * @param {number} index - The index of the image to display.
 */
function showImage(index) {
    if (imageFilenames && imageFilenames.length > 0) {
        if (index >= 0 && index < imageFilenames.length) {
            currentImage.src = imageBasePath + imageFilenames[index];
            currentImage.alt = imageFilenames[index];
            // Set onerror handler each time src changes, in case a new image also fails
            currentImage.onerror = function() {
                this.src = ""; // Or a path to a placeholder image e.g., "/static/placeholder.png"
                this.alt = "Image not found or cannot be loaded.";
                if (currentImageInfo) {
                    currentImageInfo.textContent = `Error: Image '${imageFilenames[index]}' could not be loaded.`;
                }
                // Optionally, try to advance to the next image or stop slideshow
                // if (slideshowIntervalId) playPause(); // Stop if playing
            };
            currentIndex = index;
            if (currentImageInfo) {
                currentImageInfo.textContent = `Image ${currentIndex + 1} / ${imageFilenames.length}`;
            }
        } else {
            console.warn("showImage: Index out of bounds", index);
        }
    } else {
        // No images, or imageFilenames is not defined
        if (currentImage) {
            currentImage.style.display = 'none';
        }
        if (currentImageInfo) {
            currentImageInfo.textContent = "No images to display.";
        }
        // Disable controls if no images (handled more comprehensively in DOMContentLoaded)
    }
}

/**
 * Displays the next image in the slideshow.
 */
function nextImage() {
    if (imageFilenames && imageFilenames.length > 0) {
        showImage((currentIndex + 1) % imageFilenames.length);
    }
}

/**
 * Displays the previous image in the slideshow.
 */
function prevImage() {
    if (imageFilenames && imageFilenames.length > 0) {
        showImage((currentIndex - 1 + imageFilenames.length) % imageFilenames.length);
    }
}

/**
 * Resets the slideshow timer if it's active.
 */
function resetTimer() {
    if (slideshowIntervalId) {
        clearInterval(slideshowIntervalId);
        slideshowIntervalId = setInterval(nextImage, baseInterval / currentSpeedFactor);
    }
}

/**
 * Toggles play/pause state of the slideshow.
 */
function playPause() {
    if (!imageFilenames || imageFilenames.length === 0) return; // No images to play

    if (slideshowIntervalId) { // Currently playing, about to pause
        clearInterval(slideshowIntervalId);
        slideshowIntervalId = null;
        playPauseBtn.textContent = 'Play';
        playPauseBtn.setAttribute('data-playing', 'false');
    } else { // Currently paused, about to play
        slideshowIntervalId = setInterval(nextImage, baseInterval / currentSpeedFactor);
        playPauseBtn.textContent = 'Pause';
        playPauseBtn.setAttribute('data-playing', 'true');
    }
}

/**
 * Changes the playback speed of the slideshow.
 * @param {number} factorAdjustment - The amount to adjust the speed factor by.
 */
function changeSpeed(factorAdjustment) {
    const newSpeedFactor = currentSpeedFactor + factorAdjustment;
    // Limits for speed: 0.25x to 4x
    if (newSpeedFactor >= 0.25 && newSpeedFactor <= 4.0) {
        currentSpeedFactor = newSpeedFactor;
        currentSpeedDisplay.textContent = currentSpeedFactor.toFixed(2); // Show two decimal places
        resetTimer(); // Apply new speed immediately if playing
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    if (typeof imageFilenames !== 'undefined' && imageFilenames.length > 0) {
        showImage(0);
        playPauseBtn.textContent = 'Play'; // Initial text
        playPauseBtn.setAttribute('data-playing', 'false'); // Initial state
        currentSpeedDisplay.textContent = currentSpeedFactor.toFixed(2);

        prevBtn.addEventListener('click', () => {
            prevImage();
            resetTimer();
        });
        nextBtn.addEventListener('click', () => {
            nextImage();
            resetTimer();
        });
        playPauseBtn.addEventListener('click', playPause);
        increaseSpeedBtn.addEventListener('click', () => changeSpeed(0.25));
        decreaseSpeedBtn.addEventListener('click', () => changeSpeed(-0.25));

        // Check for upload success message
        const urlParams = new URLSearchParams(window.location.search);
        const uploadedCount = urlParams.get('uploaded');
        if (uploadedCount) { // Check if parameter exists
            const count = parseInt(uploadedCount);
            if (count > 0) {
                const feedback = document.createElement('p');
                feedback.textContent = `${count} image(s) uploaded successfully!`;
                feedback.className = 'feedback-message success';

                const containerH1 = document.querySelector('.container h1'); // Insert after H1
                if (containerH1) {
                    containerH1.parentNode.insertBefore(feedback, containerH1.nextSibling);
                } else { // Fallback if h1 is not found (e.g. add to start of .container)
                    const mainContainer = document.querySelector('.container');
                    if (mainContainer) {
                        mainContainer.prepend(feedback);
                    }
                }
                setTimeout(() => { feedback.remove(); }, 5000);
            } else if (count === 0 && urlParams.has('uploaded')) { // explicitly uploaded=0 means files were submitted but none were valid
                const feedback = document.createElement('p');
                feedback.textContent = `No new valid images were uploaded. Please ensure files are of type JPG, PNG, or GIF and within size limits.`;
                feedback.className = 'feedback-message warning';

                const containerH1 = document.querySelector('.container h1');
                if (containerH1) {
                    containerH1.parentNode.insertBefore(feedback, containerH1.nextSibling);
                } else {
                    const mainContainer = document.querySelector('.container');
                    if (mainContainer) {
                        mainContainer.prepend(feedback);
                    }
                }
                setTimeout(() => { feedback.remove(); }, 7000);
            }
             // Clean the URL (remove ?uploaded=N)
            history.replaceState(null, '', window.location.pathname);
        }

    } else {
        // No images: disable controls and update info
        showImage(0); // Will hide image and set "No images" text
        if (prevBtn) prevBtn.disabled = true;
        if (playPauseBtn) {
            playPauseBtn.disabled = true;
            playPauseBtn.textContent = 'Play'; // Ensure text is 'Play' if disabled
            playPauseBtn.setAttribute('data-playing', 'false');
        }
        if (nextBtn) nextBtn.disabled = true;
        if (decreaseSpeedBtn) decreaseSpeedBtn.disabled = true;
        if (increaseSpeedBtn) increaseSpeedBtn.disabled = true;
        if (currentSpeedDisplay) currentSpeedDisplay.textContent = currentSpeedFactor.toFixed(2);
        if (currentImageInfo) currentImageInfo.textContent = "No images uploaded. Please upload some first.";
        if (currentImage) currentImage.style.display = 'none';
        // Hide the whole controls div if no images
        const controlsDiv = document.getElementById('controls');
        if(controlsDiv) controlsDiv.style.display = 'none';
    }
});
