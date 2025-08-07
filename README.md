# 🌾 AgriSphere - AI-Powered Digital Agronomist

> **Submission for the OpenEPI Hackathon 2025**

**Empowering smallholder farmers with AI-driven agricultural insights, crop diagnosis, smart irrigation, and climate-adaptive planning.**

[![OpenEPI Hackathon 2025](https://img.shields.io/badge/OpenEPI-Hackathon%202025-blue)](https://developer.openepi.io/hackathon-2025)
[![UN SDGs](https://img.shields.io/badge/UN%20SDGs-1%2C2%2C6%2C13-green)](https://sdgs.un.org/goals)
[![Team 12](https://img.shields.io/badge/Team-12-orange)]()

---

## 🎯 The Challenge: A Threat to Global Food Security

Smallholder farmers—the backbone of global food security—face unprecedented challenges from climate change, water scarcity, and crop diseases. In Sub-Saharan Africa, Latin America, and South-East Asia, **over 500 million smallholder farms** struggle with:
- 📉 **40% crop loss** due to preventable diseases and poor irrigation
- 💧 **60% water waste** from inefficient irrigation practices  
- 🌡️ **Climate uncertainty** affecting traditional farming methods
- 📱 **Limited access** to actionable agricultural intelligence

## 🌍 The Solution: AgriSphere

To address this challenge, we have developed **AgriSphere**, a web application that functions as an all-in-one digital toolkit for farmers. AgriSphere's core mission is to synthesize complex environmental data from OpenEPI's open datasets into simple, actionable advice tailored to a farmer's specific location.

The application is designed for extreme simplicity, with a minimal-text, icon-driven interface and multi-language support to ensure maximum accessibility for users who may have limited literacy or technical expertise.

## 🏆 Alignment with OpenEPI Hackathon 2025 Goals

AgriSphere is designed to create a measurable impact and directly aligns with the key themes of the OpenEPI Hackathon:

* **Use of OpenEPI Data**: Our solution is fundamentally built upon the OpenEPI platform, using its APIs for weather, soil, and crop health data to generate hyper-local, actionable insights.
* **Contribution to UN SDGs**: We are focused on creating a measurable impact on several key UN Sustainable Development Goals:
    * **SDG 1 (No Poverty)**: By improving farm productivity and profitability.
    * **SDG 2 (Zero Hunger)**: By directly increasing crop yields and reducing losses.
    * **SDG 6 (Clean Water and Sanitation)**: By promoting radical water efficiency in agriculture.
    * **SDG 13 (Climate Action)**: By providing farmers with the tools to adapt to climate change.
* **Global Reach**: Our target audience is smallholder farmers in developing regions, directly aligning with the hackathon's focus on Sub-Saharan Africa, Latin America, and South-East Asia.

## ✨ Features

### 🩺 AI Crop Doctor

* **Intelligent Diagnosis**: AI-powered plant disease detection and health assessment.
* **Image Recognition**: Farmers can upload a photo of a sick plant for instant analysis using the OpenEPI Crop Health API.
* **Treatment Recommendations**: Receive a threat-level assessment and a simple, numbered list of accessible treatment steps.
* **History Tracking**: Complete diagnosis history with progress monitoring.

### 💧 Smart Irrigation Advisor

* **Water Optimization**: Provides daily, specific watering advice by calculating evapotranspiration using real-time local weather data and soil properties.
* **Weather Integration**: Real-time weather data for informed irrigation decisions.
* **Soil Analysis**: Moisture monitoring and soil health assessments.
* **Automated Scheduling**: Smart irrigation timing based on crop needs and weather forecasts.

### 📅 Climate-Smart Planner

* **Seasonal Planning**: Analyzes a farm's specific soil type and historical weather patterns to provide a ranked list of the most recommended crops.
* **Risk Assessment**: Details pros, cons, and optimal planting windows for suggested crops.
* **Market Intelligence**: Price trends and demand forecasting.
* **Yield Optimization**: Maximize productivity through scientific planning.

### 🌍 Comprehensive Farm Management

* **Digital Farm Mapping**: GeoJSON-based farm boundary plotting, allowing users to draw a simple polygon to outline their field.
* **Multi-language Support**: Available in English, Hindi, Spanish, French, and German.
* **Offline Capability**: PWA with offline sync for rural connectivity.
* **Analytics Dashboard**: A personal "daily command center" providing at-a-glance wisdom and the single most important task for the day.

### Live Demo

* Web App: https://agrisphere.abhinavbajpai.com

## 🛠️ Technology Stack

#### Backend

* **Runtime**: Node.js 18+ with Express.js
* **Database**: MongoDB with Mongoose
* **Authentication**: JWT-based with bcrypt
* **File Storage**: Multer with Sharp
* **External APIs**: **OpenEPI** for weather, soil, and crop health data

#### Frontend

* **Framework**: React
* **Styling**: Tailwind CSS
* **Animations**: Framer Motion
* **Maps**: React Leaflet
* **State Management**: Context API
* **PWA**: Service Worker with offline sync

## 🚀 Quick Start

### Prerequisites

* Node.js 18+ and npm
* MongoDB 5.0+

### Installation

1.  **Clone the repository**
    ```bash
    git clone [https://github.com/agrisphere/agrisphere.git](https://github.com/agrisphere/agrisphere.git)
    cd agrisphere
    ```

2.  **Install dependencies**
    ```bash
    # Install backend dependencies
    cd backend
    npm install
    
    # Install frontend dependencies
    cd ../frontend
    npm install
    ```

3.  **Environment Setup**
    ```bash
    # Backend environment
    cd backend
    cp env.example .env
    # Edit .env with your configuration
    
    # Frontend environment
    cd ../frontend
    cp .env.example .env.local
    # Edit .env.local with your configuration
    ```

4.  **Start Development Servers**
    ```bash
    # Terminal 1: Backend
    cd backend
    npm run dev
    
    # Terminal 2: Frontend
    cd frontend
    npm run dev
    ```

* **Access the Application**:
    * Frontend: `http://localhost:3000`
    * Backend API: `http://localhost:5000`


## 👥 The Team & Acknowledgments

* This prototype was created by **Mann Vaswani** and **Abhinav Bajpai** for the OpenEPI Hackathon 2025.
* Special thanks to **OpenEPI** for providing the crucial agricultural APIs and the opportunity to build a solution with real-world impact.

---

<div align="center">
  <strong>🌾 Building the future of agriculture, one farmer at a time 🌾</strong>
  <br><br>
  Made with ❤️ by the AgriSphere Team
</div>
