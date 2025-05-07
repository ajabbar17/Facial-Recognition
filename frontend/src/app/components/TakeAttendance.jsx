"use client"

import React, { useRef, useState, useEffect } from "react";
import Webcam from "react-webcam";

const TakeAttendance = () => {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [captureComplete, setCaptureComplete] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const hasDetectedFace = useRef(false);
  const faceImageRef = useRef(null);

  useEffect(() => {
    let faceDetector;
    let camera;

    const loadMediaPipe = async () => {
      try {
        // Import MediaPipe modules
        const { FaceDetector, FilesetResolver } = await import(
          "@mediapipe/tasks-vision"
        );

        // Initialize the face detector
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );

        faceDetector = await FaceDetector.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite",
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          minDetectionConfidence: 0.5,
        });

        // Setup the camera
        if (webcamRef.current && webcamRef.current.video) {
          const videoElement = webcamRef.current.video;

          const startCamera = () => {
            camera = setInterval(async () => {
              if (videoElement.readyState >= 2 && faceDetector) {
                await processFrame(faceDetector);
              }
            }, 200);
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

    const processFrame = async (detector) => {
      if (
        !webcamRef.current?.video ||
        !canvasRef.current ||
        !detector ||
        captureComplete ||
        isSending
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
        const now = performance.now();
        const detections = detector.detectForVideo(videoElement, now);

        if (detections && detections.detections.length > 0) {
          for (const detection of detections.detections) {
            // Draw bounding box
            const bbox = detection.boundingBox;
            canvasCtx.strokeStyle = "#00FF00";
            canvasCtx.lineWidth = 4;
            canvasCtx.strokeRect(
              bbox.originX,
              bbox.originY,
              bbox.width,
              bbox.height
            );

            
            const faceCanvas = document.createElement("canvas");
            
           
            const margin = 7; // pixels of margin around the face
            faceCanvas.width = Math.min(videoElement.videoWidth, bbox.width + margin * 2);
            faceCanvas.height = Math.min(videoElement.videoHeight, bbox.height + margin * 2);
            
            const faceCtx = faceCanvas.getContext("2d");
            
            // Calculate coordinates with margin, ensuring we don't go outside the video bounds
            const x = Math.max(0, bbox.originX - margin);
            const y = Math.max(0, bbox.originY - margin);
            const w = Math.min(videoElement.videoWidth - x, bbox.width + margin * 2);
            const h = Math.min(videoElement.videoHeight - y, bbox.height + margin * 2);
            
            faceCtx.drawImage(
              videoElement,
              x, y, w, h, // Source coordinates with margin
              0, 0, faceCanvas.width, faceCanvas.height // Destination coordinates
            );

            // Store the base64 image, using JPEG format with high quality
            faceImageRef.current = faceCanvas.toDataURL("image/jpeg", 0.95);
            hasDetectedFace.current = true;
            
            // Only process the first face
            break;
          }
        } else {
          // Reset face detection if no faces detected
          hasDetectedFace.current = false;
          faceImageRef.current = null;
        }
      } catch (error) {
        console.error("Error processing video frame:", error);
      }
    };

    if (typeof window !== "undefined" && !captureComplete) {
      loadMediaPipe();
    }

    return () => {
      if (camera) {
        clearInterval(camera);
      }
    };
  }, [captureComplete, isSending]);

  const handleAttendance = async () => {
   
    
    if (!hasDetectedFace.current || !faceImageRef.current) {
      setErrorMessage("No face detected. Please position your face in the camera");
      return;
    }
    
    setIsSending(true);
    setErrorMessage(null);
    
    try {
      console.log("Starting attendance process");
      
      
      const base64Data = faceImageRef.current.split(",")[1];
      const blob = await (
        await fetch(`data:image/jpeg;base64,${base64Data}`)
      ).blob();

      // Debug: check if blob is valid
      console.log("Image blob size:", blob.size, "bytes");
      if (blob.size === 0) {
        throw new Error("Generated empty image blob");
      }

      const formData = new FormData();

      formData.append("image", blob, "face.jpg");

      
      
      const response = await fetch(
        "http://localhost:8000/verify_face",
        {
          method: "POST",
          body: formData,
        }
      );

   
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response:", errorText);
        throw new Error(`Server error: ${response.status} - ${errorText || 'No error details'}`);
      }

      const data = await response.json();
      console.log(data)
      setCaptureComplete(true);
      setIsSending(false);
    } catch (error) {
      console.error("Error sending face to backend:", error);
      setErrorMessage(`Error: ${error.message}`);
      setIsSending(false);
    }
  };

  

  return (
    <div className="w-full max-w-2xl mx-auto p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-center">Face Recognition</h2>
      
      <div className="relative mb-4" style={{ width: "640px", height: "480px" }}>
        {!captureComplete ? (
          <>
            <Webcam
              ref={webcamRef}
              audio={false}
              width={640}
              height={480}
              screenshotFormat="image/jpeg"
              mirrored={true}
              className="absolute top-0 left-0 z-10 rounded-lg"
            />
            <canvas
              ref={canvasRef}
              className="absolute top-0 left-0 z-20 rounded-lg"
              style={{ width: "640px", height: "480px" }}
            />
            
            {hasDetectedFace.current && (
              <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-lg z-30">
                Face Detected ✓
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg">
            <div className="text-center p-4">
              <div className="text-green-600 text-5xl mb-4">✓</div>
              <h2 className="text-2xl font-semibold">Facial Recognition Successfull</h2>
              <p className="mt-2">
                Attendance has been successfully recorded. Thank you!
              </p>
            </div>
          </div>
        )}
      </div>

      {!isModelLoaded && !captureComplete && !errorMessage && (
        <div className="mb-4 text-center py-2 bg-yellow-100 text-yellow-800 rounded">
          Loading face detection model...
        </div>
      )}

      {errorMessage && (
        <div className="mb-4 text-center py-2 bg-red-100 text-red-800 rounded">
          {errorMessage}
        </div>
      )}
      
      {!captureComplete && (
        <div className="space-y-4">
         
          
          <button
            onClick={handleAttendance}
            disabled={isSending}
            className={`w-full py-3 rounded-md font-medium ${
              isSending 
                ? "bg-gray-400 text-gray-700" 
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            {isSending ? "Processing..." : "Capture Attendance"}
          </button>
        </div>
      ) 
    //   : (
    //     <button
    //       onClick={handleReset}
    //       className="w-full py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700"
    //     >
          
    //     </button>
    //   )
    }
    </div>
  );
};

export default TakeAttendance;