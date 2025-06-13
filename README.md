# Image Slideshow Web Application

## Description

This is a simple web application built with Go (Golang) for the backend and HTML, CSS, and JavaScript for the frontend. It allows users to:

1.  Upload multiple images through a web browser.
2.  View the uploaded images in an automated slideshow.
3.  Control the slideshow with Play/Pause, Next/Previous image, and speed adjustment options.

## Features

*   **Image Upload:** Supports uploading multiple JPEG, PNG, and GIF images.
*   **Slideshow Display:** Automatically cycles through uploaded images.
*   **Playback Controls:**
    *   Play/Pause the slideshow.
    *   Manually navigate to the Next or Previous image.
    *   Increase or decrease the slideshow speed.
*   **User Feedback:** Provides messages for successful uploads, no images, and image loading errors.
*   **Basic Styling:** Clean and functional user interface.

## Prerequisites

*   Go (Golang) installed on your system. (Refer to [https://golang.org/doc/install](https://golang.org/doc/install) for installation instructions).

## How to Run

1.  **Clone the repository or download the source code.**
    ```bash
    # If git is available
    # git clone <repository-url>
    # cd <repository-directory>
    ```

2.  **Open your terminal or command prompt and navigate to the project's root directory.**

3.  **Build the application:**
    ```bash
    go build
    ```
    This will create an executable file (e.g., `image-slideshow` on Linux/macOS or `image-slideshow.exe` on Windows).

4.  **Run the application:**
    ```bash
    ./image-slideshow
    ```
    (or `image-slideshow.exe` on Windows)

    You should see a log message indicating the server has started, typically:
    `YYYY/MM/DD HH:MM:SS Starting server on :8080`

5.  **Open your web browser and go to:**
    [http://localhost:8080](http://localhost:8080)

    You will see the image upload page. Upload some images, and you'll be redirected to the slideshow.

## Project Structure

*   `main.go`: Backend Go application logic.
*   `go.mod`, `go.sum`: Go module files.
*   `templates/`: HTML template files (`upload.html`, `slideshow.html`).
*   `static/`: Static assets.
    *   `css/style.css`: CSS stylesheets.
    *   `js/slideshow.js`: Frontend JavaScript for slideshow logic.
*   `uploads/`: Directory where uploaded images are stored (created automatically).
*   `README.md`: This file.

## Notes

*   Uploaded images are stored in the `uploads` directory. Clearing this directory will remove all uploaded images.
*   The application currently stores the list of uploaded image filenames in memory, so this list will be reset if the server restarts. For persistent storage, a database would be needed.
