# 🩸 LifeFlow – Blood Emergency Platform

> A full-stack Blood Emergency Management System built using **React.js, Django REST Framework, SQLite, JWT Authentication, and Bootstrap** to connect blood donors, hospitals, blood banks, and patients during emergencies.

---

## 📌 Overview

LifeFlow is a modern web platform designed to simplify and accelerate the blood donation process. It helps patients find nearby donors, enables hospitals and blood banks to manage blood inventory, and allows administrators to monitor the entire system efficiently.

The platform aims to reduce response time during blood emergencies through secure authentication, real-time donor management, and location-based services.

---
## 🚀 Features

### 👤 Authentication
- Secure JWT Authentication
- User Registration & Login
- Role-Based Access Control
- Profile Management

### 🩸 Donor Module
- Register as Blood Donor
- Update Availability Status
- Blood Group Management
- Donor Profile

### 🏥 Hospital & Blood Bank
- Facility Registration
- Blood Stock Management
- Blood Unit Tracking
- Inventory Updates

### 🚨 Emergency Blood Requests
- Create Blood Request
- Request Status Tracking
- Request History

### 📍 Nearby Donor Search
- Location-Based Donor Search
- Fast Emergency Response
- Availability Filtering

### 🔔 Notifications
- Emergency Alerts
- Request Updates
- Status Notifications

### 🏕 Donation Camps
- Create Donation Camps
- Camp Registration
- Camp Management

### 📊 Reports
- Blood Donation Reports
- Request Analytics
- System Statistics

### 🤖 Voice AI
- Voice Assistance Module
- Emergency Support Features

---

# 🛠 Tech Stack

## Frontend
- React.js
- Vite
- Bootstrap 5
- React Router DOM
- Axios
- Chart.js
- Leaflet
- React Icons


## Backend
- Python
- Django
- Django REST Framework
- JWT Authentication
- CORS Headers


## Database
- SQLite
*(MySQL configuration is also available for deployment.)*

---

# 📁 Project Structure

```
LifeFlow-Blood-Emergency-Platform/
│
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── backend/
│   ├── accounts/
│   ├── donor/
│   ├── receiver/
│   ├── requests/
│   ├── notification/
│   ├── camp/
│   ├── reports/
│   ├── voice_ai/
│   ├── backend/
│   └── manage.py
│
└── README.md
```

---

# ⚙ Installation

## Clone Repository

```bash
git clone https://github.com/jaybhuva31/LifeFlow-Blood-Emergency-Platform.git

cd LifeFlow-Blood-Emergency-Platform
```

---
# Backend Setup

```bash
cd backend

python -m venv venv

# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate

pip install -r requirements.txt
```

Apply migrations

```bash
python manage.py migrate
```
Run server

```bash
python manage.py runserver
```

Backend runs at

```
http://127.0.0.1:8000/
```

---
