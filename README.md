# 🏥 Hospital Management System

A full-stack Hospital Management Website developed for online appointment booking, patient communication, and admin management.

## 🌐 Live Demo

Frontend + Backend Live Link:

https://novena-hospital-nqmz.onrender.com

---

## 📌 Features

* Online Appointment Booking
* Contact Form Submission
* Admin Dashboard
* MongoDB Data Storage
* Email Notification using Nodemailer
* Responsive Hospital Website UI
* Patient and Appointment Management

---

## 🛠️ Tech Stack

### Frontend

* HTML5
* CSS3
* JavaScript
* Bootstrap / Custom Styling

### Backend

* Node.js
* Express.js

### Database

* MongoDB Atlas
* Mongoose

### Other Tools

* Nodemailer
* Git & GitHub
* Render (Deployment)

---

## 📁 Project Structure

```bash
Novena-hospital/
│
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   ├── server.js
│   └── package.json
│
├── hospital/
│   ├── index.html
│   ├── appoinment.html
│   ├── contact.html
│   ├── css/
│   └── js/
│
├── dashboard/
│   ├── dashboard-login.html
│   ├── dashboard.css
│   ├── dashboard.js
│
└── README.md
```

---

## 🚀 Installation

Clone repository:

```bash
git clone https://github.com/J-kajal-web/Novena-hospital.git
cd Novena-hospital
```

Install backend dependencies:

```bash
cd backend
npm install
```

Run server:

```bash
npm run dev
```

Server runs at:

```bash
http://localhost:5000
```

---

## ⚙️ Environment Variables

Create `.env` file inside backend folder:

```env
PORT=5000
MONGO_URI=your_mongodb_atlas_uri
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email
EMAIL_PASS=your_app_password
```

---

## 📊 Modules

### 1. Appointment Module

* Book appointments
* Store patient details
* Save in MongoDB

### 2. Contact Module

* Submit contact inquiries
* Send email notifications

### 3. Admin Dashboard

* View appointments
* Manage records
* Dashboard analytics

---

## 🌍 Deployment

Deployed on Render:

https://novena-hospital-nqmz.onrender.com

Database hosted on MongoDB Atlas.

---

## 🎓 Academic Project

This project was developed as a college major project for demonstrating full-stack web development using Node.js and MongoDB.

---

## 👩‍💻 Author

Kajal Aambedare

GitHub:
https://github.com/J-kajal-web

