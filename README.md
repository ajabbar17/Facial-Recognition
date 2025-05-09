# AI-Powered Facial Recognition Attendance System

Revolutionizing attendance management with an advanced, AI-driven facial recognition system. This project integrates real-time facial detection using Mediapipe in the browser and face recognition with Python backend to deliver an efficient and modern attendance tracking solution.

---

## 🚀 Features

### 1. Real-Time Face Detection & Recognition
- **Mediapipe Face Detection:** Lightweight, high-speed face detection directly in the browser using TensorFlow.js and Mediapipe.
- **Face Recognition (Python):** Utilizes Dlib-based encoding for comparing face vectors against registered images to verify identity and log attendance.



### 2. Streamlined Workflow
- **Registration System:** Users can register with name, age, and face image via webcam.
- **One-Tap Attendance:** Start attendance via webcam, capture face, and verify instantly.
- **Clean Logging:** Each attendance entry records the name, age, and exact timestamp.

### 3. Elegant User Interface
- **Landing Dashboard:** A white-background homepage with clean UI, including three professional-looking cards:
  - Take Attendance
  - Register
  - Check Attendance
- **Responsive Attendance Table:** Attractive and structured table showing all attendance logs.

---

## 🛠️ Technology Stack

### Backend:
- **Python**: Face encoding, image matching
- **FastAPI**: Backend API server
- **face_recognition (Dlib)**: Face encoding and comparison
- **OpenCV**: Frame capture and preprocessing

### Frontend:
- **Next.js (App Router)**: Modular and performant React framework
- **Tailwind CSS**: Fast and responsive styling
- **Lucide React Icons**: Consistent and modern iconography
- **Mediapipe**: In-browser real-time face detection

### Database:
- **PostgreSQL**: For storing user details and attendance logs

---

## 🚀 Getting Started

### Prerequisites
- **Python 3.8+**
- **Node.js 16+**
- **npm**
- **PostgreSQL** if using a relational DB

### Setup Instructions

#### 1. Clone the Repository
```bash
git clone https://github.com/ajabbar17/Facial-Recognition.git
cd FacialRecognition
```

#### 2. Backend Setup
```bash
cd backend
conda create -n face-attendance python=3.9
conda activate face-attendance
pip install -r requirements.txt
uvicorn app.main:app --reload
```

#### 3. Frontend Setup
```bash
cd ../frontend
npm install
npm run dev
```

#### 4. Database Setup
- Install PostgreSQL and create a database for the system the schema is provided in queries.sql file.
- Update the database connection string in the backend configuration file.