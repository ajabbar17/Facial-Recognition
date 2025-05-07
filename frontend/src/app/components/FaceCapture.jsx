"use client";

import React, { useRef, useState, useEffect } from "react";
import Webcam from "react-webcam";
import axios from "axios";

const FaceCapture = () => {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [captureComplete, setCaptureComplete] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const hasDetectedFace = useRef(false); // Add this to track if we've already detected a face

  useEffect(() => {
    let faceDetector;
    let camera;

    const loadMediaPipe = async () => {
      try {
        // Import MediaPipe modules
        const { FaceDetector, FilesetResolver } = await import(
          "@mediapipe/tasks-vision"
        );

        console.log("MediaPipe modules imported successfully");

        // Initialize the face detector
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );

        console.log("FilesetResolver initialized");

        faceDetector = await FaceDetector.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite",
            delegate: "GPU", // Changed from GPU to CPU for better compatibility
          },
          runningMode: "VIDEO",
          minDetectionConfidence: 0.5,
        });

        console.log("Face detector created successfully");

        // Setup the camera
        if (webcamRef.current && webcamRef.current.video) {
          const videoElement = webcamRef.current.video;

          const startCamera = () => {
            console.log("Camera loaded, starting processing");
            camera = setInterval(async () => {
              if (videoElement.readyState >= 2 && faceDetector && !hasDetectedFace.current) {
                await processFrame();
              }
            }, 200); // Process 5 frames per second (reduced for better performance)
          };

          if (videoElement.readyState >= 2) {
            startCamera();
          } else {
            videoElement.addEventListener("loadeddata", startCamera);
          }

          setIsModelLoaded(true);
        }
      } catch (error) {
        console.error("Error loading MediaPipe:", error);
        setErrorMessage(`Failed to load face detection: ${error.message}`);
      }
    };

    const processFrame = async () => {
      if (
        !webcamRef.current?.video ||
        !canvasRef.current ||
        !faceDetector ||
        captureComplete ||
        isSending ||
        hasDetectedFace.current // Check if we've already detected a face
      )
        return;

      const videoElement = webcamRef.current.video;
      const canvasElement = canvasRef.current;
      const canvasCtx = canvasElement.getContext("2d");

      // Make sure canvas dimensions match video
      canvasElement.width = videoElement.videoWidth || 640;
      canvasElement.height = videoElement.videoHeight || 480;

      // Draw the current frame to canvas
      canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
      canvasCtx.drawImage(
        videoElement,
        0,
        0,
        canvasElement.width,
        canvasElement.height
      );

      try {
        // Process the frame with MediaPipe
        const now = performance.now();
        const detections = faceDetector.detectForVideo(videoElement, now);

        console.log(`Detected ${detections.detections.length} faces`);

        if (detections && detections.detections.length > 0) {
          // Set this flag immediately to prevent duplicate processing
          hasDetectedFace.current = true;
          
          // Draw rectangles around detected faces
          for (const detection of detections.detections) {
            // Draw bounding box
            const bbox = detection.boundingBox;
            canvasCtx.strokeStyle = "#00FF00"; // Green for better visibility
            canvasCtx.lineWidth = 4;
            canvasCtx.strokeRect(
              bbox.originX,
              bbox.originY,
              bbox.width,
              bbox.height
            );

            console.log(
              `Drawing box at: (${bbox.originX}, ${bbox.originY}), w: ${bbox.width}, h: ${bbox.height}`
            );

            // Only process the first face
            if (!isSending) {
              setIsSending(true);

              // Extract face for sending to backend
              const faceCanvas = document.createElement("canvas");
              faceCanvas.width = bbox.width;
              faceCanvas.height = bbox.height;
              const faceCtx = faceCanvas.getContext("2d");

              faceCtx.drawImage(
                videoElement,
                bbox.originX,
                bbox.originY,
                bbox.width,
                bbox.height,
                0,
                0,
                bbox.width,
                bbox.height
              );

              // Convert to base64 and send to backend
              const base64Face = faceCanvas.toDataURL("image/jpeg");

              try {
                await sendFaceToBackend(base64Face);
                
                // Break out of the loop after processing the first face
                break;
              } catch (error) {
                console.error("Error sending face to backend:", error);
                setIsSending(false);
                hasDetectedFace.current = false; // Reset flag on error
              }
            }
          }
        }
      } catch (error) {
        console.error("Error processing video frame:", error);
      }
    };

    // Only run on client-side
    if (typeof window !== "undefined" && !captureComplete) {
      loadMediaPipe();
    }

    // Cleanup function
    return () => {
      if (camera) {
        clearInterval(camera);
      }
    };
  }, [captureComplete, isSending]);

  const sendFaceToBackend = async (base64Face) => {
    try {
      // Convert base64 to blob for form data
      const base64Data = base64Face.split(",")[1];
      const blob = await (
        await fetch(`data:image/jpeg;base64,${base64Data}`)
      ).blob();

      // Debug: check if blob is valid
      console.log("Image blob size:", blob.size, "bytes");
      if (blob.size === 0) {
        throw new Error("Generated empty image blob");
      }

      // Create form data
      const formData = new FormData();
      formData.append("name", "Test User");
      formData.append("age", "30");
      formData.append("image", blob, "face.jpg");

      console.log("Sending face data to backend...");

      const response = await axios.post(
        "http://localhost:8000/register-face",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      console.log("Face sent successfully:", response.data);
      setCaptureComplete(true);
      setIsSending(false);
      
      // Stop camera processing
      return response.data;
    } catch (error) {
      // Improved error logging
      if (error.response) {
        console.error("Server error response:", {
          status: error.response.status,
          data: error.response.data,
        });
        setErrorMessage(`Server error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
      } else if (error.request) {
        console.error("No response received:", error.request);
        setErrorMessage("No response from server. Check if backend is running.");
      } else {
        console.error("Request error:", error.message);
        setErrorMessage(`Error: ${error.message}`);
      }
      
      // Reset flags on error
      setIsSending(false);
      hasDetectedFace.current = false;
      throw error;
    }
  };

  return (
    <div className="relative w-full max-w-lg mx-auto">
      <div className="relative" style={{ width: "640px", height: "480px" }}>
        {!captureComplete ? (
          <>
            <Webcam
              ref={webcamRef}
              audio={false}
              width={640}
              height={480}
              screenshotFormat="image/jpeg"
              mirrored={true} // Mirror the webcam feed for more intuitive user experience
              className="absolute top-0 left-0 z-10"
            />
            <canvas
              ref={canvasRef}
              className="absolute top-0 left-0 z-20"
              style={{ width: "640px", height: "480px" }}
            />
          </>
        ) : (
          <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg">
            <div className="text-center p-4">
              <div className="text-green-600 text-3xl mb-2">✓</div>
              <h2 className="text-xl font-semibold">Face Captured!</h2>
              <p className="mt-2">
                Your face has been successfully registered.
              </p>
            </div>
          </div>
        )}
      </div>

      {!isModelLoaded && !captureComplete && !errorMessage && (
        <div className="mt-4 text-center py-2 bg-yellow-100 text-yellow-800 rounded">
          Loading face detection model...
        </div>
      )}

      {isSending && !captureComplete && (
        <div className="mt-4 text-center py-2 bg-blue-100 text-blue-800 rounded">
          Processing face data...
        </div>
      )}

      {errorMessage && (
        <div className="mt-4 text-center py-2 bg-red-100 text-red-800 rounded">
          {errorMessage}
        </div>
      )}
      
      {captureComplete && (
        <button
          onClick={() => {
            setCaptureComplete(false);
            setIsSending(false);
            hasDetectedFace.current = false;
            setErrorMessage(null);
          }}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Capture Again
        </button>
      )}
    </div>
  );
};

export default FaceCapture;