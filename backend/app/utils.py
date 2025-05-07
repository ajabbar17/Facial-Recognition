import cv2
import numpy as np
import face_recognition

def read_imagefile(file_content):
    """Read and decode image file from bytes"""
    try:
        
        image_array = np.frombuffer(file_content, np.uint8)
        
        img = cv2.imdecode(image_array, cv2.IMREAD_COLOR)
        if img is None:
            print("Failed to decode image")
            return None
        
        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        return img_rgb
    except Exception as e:
        print(f"Error reading image file: {e}")
        return None

def encode_face(img):
    """Encode a face from the image"""
    try:
        if img is None:
            print("Image is None, cannot encode")
            return None
            
        face_locations = face_recognition.face_locations(img)
        
        
        if not face_locations:
            print("No faces detected in the image")
            return None
            
        # Get face encodings
        face_encodings = face_recognition.face_encodings(img, face_locations)
        
        if not face_encodings:
            print("Could not encode any faces")
            return None
            
        # Return the first face encoding
        return face_encodings[0]
    except Exception as e:
        print(f"Error encoding face: {e}")
        return None

# def compare_faces(unknown_encoding, known_encoding, tolerance=0.6):
#     """
#     Compare faces using face_recognition library
    
#     :param unknown_encoding: Face encoding of the person to verify
#     :param known_encoding: Face encoding from database
#     :param tolerance: Threshold for face comparison (lower is stricter)
#     :return: Boolean indicating if faces match
#     """
#     # Convert lists to NumPy arrays if they aren't already
#     if not isinstance(unknown_encoding, np.ndarray):
#         unknown_encoding = np.array(unknown_encoding)
#     if not isinstance(known_encoding, np.ndarray):
#         known_encoding = np.array(known_encoding)
    
#     # Use face_recognition's compare_faces correctly
#     return face_recognition.compare_faces([known_encoding], unknown_encoding, tolerance=tolerance)[0]
