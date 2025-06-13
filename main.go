package main

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"html/template"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
)

var uploadedImageFilenames []string
const maxUploadSize = 10 << 20 // 10 MB
const uploadPath = "uploads"

func main() {
	// Create uploads directory if it doesn't exist
	if err := os.MkdirAll(uploadPath, os.ModePerm); err != nil {
		log.Fatalf("Could not create upload directory: %v", err)
	}

	http.HandleFunc("/", rootHandler)
	http.HandleFunc("/upload", uploadHandler)
	http.HandleFunc("/slideshow", slideshowHandler)

	// Serve static files (CSS, JS)
	fsStatic := http.FileServer(http.Dir("static"))
	http.Handle("/static/", http.StripPrefix("/static/", fsStatic))

	// Serve uploaded images
	fsUploads := http.FileServer(http.Dir("uploads"))
	http.Handle("/uploaded_images/", http.StripPrefix("/uploaded_images/", fsUploads))

	fmt.Println("Starting server on :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}

func rootHandler(w http.ResponseWriter, r *http.Request) {
	tmpl, err := template.ParseFiles("templates/upload.html")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	tmpl.Execute(w, nil)
}

func slideshowHandler(w http.ResponseWriter, r *http.Request) {
	// For simplicity, we'll re-parse the template every time.
	// In a production app, you'd parse templates once at startup.
	tmpl, err := template.ParseFiles("templates/slideshow.html")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Prepare data for the template
	data := map[string]interface{}{
		"ImageFilenames": uploadedImageFilenames,
	}

	err = tmpl.Execute(w, data)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

func uploadHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		log.Printf("Method not allowed for /upload: %s", r.Method)
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	if err := r.ParseMultipartForm(maxUploadSize); err != nil {
		log.Printf("Error parsing multipart form: %v", err)
		http.Error(w, "Error parsing multipart form: "+err.Error(), http.StatusInternalServerError)
		return
	}

	files := r.MultipartForm.File["images"]
	if len(files) == 0 {
		log.Println("No files uploaded in request")
		http.Error(w, "No files uploaded", http.StatusBadRequest)
		return
	}

	successfulUploads := 0
	for _, handler := range files {
		// Check file size (individual)
		if handler.Size > maxUploadSize { // Max size per file, can be different from total
			log.Printf("File too large: %s (%d bytes)", handler.Filename, handler.Size)
			// Optionally: add this filename to a list of skipped files to inform the user
			continue
		}

		file, err := handler.Open()
		if err != nil {
			log.Printf("Error opening uploaded file %s: %v", handler.Filename, err)
			http.Error(w, "Error processing file: "+err.Error(), http.StatusInternalServerError)
			return // For multiple files, maybe continue and collect errors? For now, fail fast for this file.
		}

		// Detect content type
		buffer := make([]byte, 512)
		_, err = file.Read(buffer)
		if err != nil && err != io.EOF {
			log.Printf("Error reading file for content type detection %s: %v", handler.Filename, err)
			file.Close() // Close file before next iteration or returning
			http.Error(w, "Error detecting file type", http.StatusInternalServerError)
			return
		}
		contentType := http.DetectContentType(buffer)
		// Reset read pointer
		if _, err := file.Seek(0, io.SeekStart); err != nil {
			log.Printf("Error seeking file %s: %v", handler.Filename, err)
			file.Close()
			http.Error(w, "Error processing file", http.StatusInternalServerError)
			return
		}

		// Validate file type
		allowedTypes := map[string]bool{
			"image/jpeg": true,
			"image/png":  true,
			"image/gif":  true,
		}
		if !allowedTypes[contentType] {
			log.Printf("Invalid file type for %s: %s", handler.Filename, contentType)
			file.Close()
			continue // Skip this file
		}

		// Generate unique filename
		randomBytes := make([]byte, 8)
		if _, err := rand.Read(randomBytes); err != nil {
			log.Printf("Error generating random bytes for filename: %v", err)
			file.Close()
			http.Error(w, "Error generating unique filename", http.StatusInternalServerError)
			return
		}
		randomString := hex.EncodeToString(randomBytes)
		// Use filepath.Base on original filename before getting extension to sanitize
		originalBaseFilename := filepath.Base(handler.Filename)
		extension := filepath.Ext(originalBaseFilename)
		uniqueFilename := randomString + extension

		// Create new file in uploads directory
		dstPath := filepath.Join(uploadPath, uniqueFilename)
		dst, err := os.Create(dstPath)
		if err != nil {
			log.Printf("Error creating destination file %s: %v", dstPath, err)
			file.Close()
			http.Error(w, "Error saving file", http.StatusInternalServerError)
			return
		}

		// Copy uploaded file content to new file
		if _, err := io.Copy(dst, file); err != nil {
			log.Printf("Error copying content to destination file %s: %v", dstPath, err)
			dst.Close() // Close dst before removing
			file.Close()
			os.Remove(dstPath) // Attempt to remove partially written file
			http.Error(w, "Error saving file content", http.StatusInternalServerError)
			return
		}

		dst.Close()
		file.Close() // Close the uploaded file explicitly after successful copy

		uploadedImageFilenames = append(uploadedImageFilenames, uniqueFilename)
		successfulUploads++
		log.Printf("Successfully uploaded and saved %s as %s", handler.Filename, uniqueFilename)
	}

	// Redirect to slideshow with count of successful uploads
	redirectURL := fmt.Sprintf("/slideshow?uploaded=%d", successfulUploads)
	http.Redirect(w, r, redirectURL, http.StatusSeeOther)
}
