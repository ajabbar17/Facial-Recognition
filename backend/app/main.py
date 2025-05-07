from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, File, UploadFile, HTTPException, Form, Depends
from fastapi.middleware.cors import CORSMiddleware
from app.utils import read_imagefile, encode_face
from app.db import connect_to_db, disconnect_from_db
import cv2
import numpy as np


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_to_db(app)
    yield
    await disconnect_from_db(app)

app = FastAPI(lifespan=lifespan)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

@app.get("/users")
async def root(request: Request):
    db = request.app.state.pool
    async with db.acquire() as connection:
        result = await connection.fetch("SELECT * FROM users")
        return [dict(record) for record in result]

def cosine_distance(a, b):
    dot_product = np.dot(a, b)
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    if norm_a == 0 or norm_b == 0:
        return 1.0  # Max distance if one encoding is invalid
    return 1 - (dot_product / (norm_a * norm_b))

@app.post("/verify_face")
async def verify_face(request: Request, image: UploadFile = File(...)):
    
    image_bytes = await image.read()
    img = read_imagefile(image_bytes)

    if img is None:
        raise HTTPException(status_code=400, detail="Invalid image format.")

    encoding = encode_face(img)
    if encoding is None:
        raise HTTPException(status_code=400, detail="No face detected.")

    try:
        db = request.app.state.pool
        async with db.acquire() as connection:
            query = "SELECT id, name, age, encoding FROM users"
            result = await connection.fetch(query)

            best_match = None
            lowest_distance = float('inf')

            for record in result:
                user_encoding = np.array(record['encoding'])

                
                distance = cosine_distance(user_encoding, encoding)

                # Debug 
                print(f"Cosine distance for {record['name']}: {distance}")

                if distance < 0.4 and distance < lowest_distance:  
                    best_match = record
                    lowest_distance = distance

            if best_match:
                await connection.execute(
                    "INSERT INTO attendance (name, age) VALUES ($1, $2)",
                    best_match['name'], best_match['age']
                )
                return {
                    "message": "Face verified successfully.",
                    "user_id": best_match['id'],
                    "name": best_match['name'],
                    "confidence": f"{(1 - lowest_distance) * 100:.2f}%"
                }

            return {"message": "No matching face found."}

    except Exception as e:
        print(f"Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

# @app.post("/verify_face") 
# async def verify_face(request: Request, image: UploadFile = File(...)):
#     # Process the face image
#     image_bytes = await image.read()
#     img = read_imagefile(image_bytes)
    
#     if img is None:
#         raise HTTPException(status_code=400, detail="Invalid image format.")
    
#     encoding = encode_face(img)
#     if encoding is None:
#         raise HTTPException(status_code=400, detail="No face detected.")
    
    
#     try:
#         db = request.app.state.pool
#         async with db.acquire() as connection:
#             query = "SELECT id, name, age, encoding FROM users"
#             result = await connection.fetch(query)
            
#             best_match = None
#             lowest_distance = float('inf')
            
#             for record in result:
#                 user_encoding = np.array(record['encoding'])  
                
#                 # Calculate face distance with face_recognition
#                 distances = face_recognition.face_distance([user_encoding], encoding)
#                 distance = distances[0]
                
                
#                 # Debug information
#                 print(f"Face distance for {record['name']}: {distance}")
                
#                 if distance < 0.6 and distance < lowest_distance:  # Using 0.6 as threshold
#                     best_match = record
#                     lowest_distance = distance
            
#             if best_match:
#                 # Insert attendance record
#                 await connection.execute(
#                     "INSERT INTO attendance (name, age) VALUES ($1, $2)",
#                     best_match['name'], best_match['age']
#                 )
#                 return {
#                     "message": "Face verified successfully.",
#                     "user_id": best_match['id'],
#                     "name": best_match['name'],
#                     "confidence": f"{(1-lowest_distance)*100:.2f}%"
#                 }
            
#             return {"message": "No matching face found."}
            
#     except Exception as e:
#         print(f"Error: {str(e)}")
#         raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    

@app.post("/register-face")
async def register_face(
    request: Request,
    name: str = Form(None),
    age: int = Form(None),
    image: UploadFile = File(...)
):
    
    name = name or "Unknown User"
    age = age or 0
    
    
    image_bytes = await image.read()
    
    # Debug
    with open("received_image.jpg", "wb") as f:
        f.write(image_bytes)
    print(f"Saved received image to disk: received_image.jpg")
    
    
    img = read_imagefile(image_bytes)
    if img is None:
        raise HTTPException(status_code=400, detail="Invalid image format or corrupted image.")
    
    # Debug: save processed image
    cv2.imwrite("processed_image.jpg", cv2.cvtColor(img, cv2.COLOR_RGB2BGR))
    print(f"Saved processed image to disk: processed_image.jpg")
    
    encoding = encode_face(img)
    if encoding is None:
        raise HTTPException(status_code=400, detail="No face detected in the image.")
    
    # Convert numpy array to Python list for database storage
    encoding_list = encoding.tolist()
    
    # Store in database
    try:
        db = request.app.state.pool
        async with db.acquire() as connection:
            query = """
            INSERT INTO users (name, age, encoding)
            VALUES ($1, $2, $3)
            RETURNING id
            """
            result = await connection.fetchrow(query, name, age, encoding_list)
            user_id = result['id']
            print(f"User ID: {user_id}")
        return {
            "message": "Face registered successfully.",
            "user_id": user_id,
            "name": name,
            "age": age
        }
    except Exception as e:
        print(f"Database error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.get("/attendance")
async def get_attendance(request: Request):
    db = request.app.state.pool
    async with db.acquire() as connection:
        result = await connection.fetch("SELECT * FROM attendance")
        
        return [dict(record) for record in result]
    
