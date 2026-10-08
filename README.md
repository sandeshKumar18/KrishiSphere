# 🌱 KrishiSphere

### AI-Powered Smart Agriculture & Crop Recommendation Platform

KrishiSphere is a full-stack smart agriculture platform designed to help farmers make better crop and farm-management decisions using Machine Learning, Generative AI, and data-driven recommendations.

The platform combines soil and environmental analysis, crop recommendation, field management, crop-cycle tracking, AI-powered agricultural assistance, and government-scheme information into a single application.

## 🚀 Overview

Agriculture decisions often depend on multiple factors such as:

- Soil nutrients
- Soil pH
- Temperature
- Humidity
- Rainfall
- Crop requirements
- Field conditions
- Previous crop cycles
- Government agricultural schemes

KrishiSphere brings these factors together and provides farmers with an easy-to-use digital platform for managing their agricultural activities.

The system uses a Machine Learning model to recommend suitable crops based on soil and environmental parameters, while **Gemini-powered AI services** provide contextual agricultural assistance.

---

## ✨ Key Features

### 🌾 Crop Recommendation

KrishiSphere uses a trained Machine Learning model to recommend suitable crops based on environmental and soil parameters.

**Input parameters include:**

- Nitrogen (N)
- Phosphorus (P)
- Potassium (K)
- Temperature
- Humidity
- Soil pH
- Rainfall

The trained model achieves approximately **95% accuracy across multiple crop classes** on the project's evaluation dataset.

---

### 🧪 Soil Testing

Farmers can record soil-test information and use the collected data for agricultural decision-making.

The system maintains soil information associated with individual fields, allowing users to keep track of soil conditions over time.

---

### 🌱 Field Management

Farmers can create and manage multiple agricultural fields.

Each field can contain information such as:

- Field name
- Location/details
- Area
- Soil information
- Current crop
- Crop-cycle information
- Agricultural activities

This allows farm-related information to remain organized in one place.

---

### 🔄 Crop Cycle Management

KrishiSphere provides workflows for managing crop cycles.

Farmers can track:

- Crop selection
- Planting information
- Crop stages
- Field association
- Crop-cycle progress
- Agricultural activities

This creates a structured record of farming activities instead of keeping them manually.

---

### 🤖 AI Agricultural Assistant

KrishiSphere integrates **Google Gemini** to provide an AI-powered agricultural assistant.

The AI service is designed to:

- Explain agricultural concepts
- Provide farmer-friendly guidance
- Answer crop-related questions
- Assist with soil and crop management
- Generate contextual recommendations

The AI layer includes:

- Modular AI service architecture
- Model fallback mechanism
- Prompt guardrails
- Farmer-friendly responses
- Protection against unsupported agricultural claims

The system is designed to avoid presenting invented facts or unsafe specific agricultural doses as authoritative recommendations.

---

### 🏛️ Government Schemes

KrishiSphere provides information about relevant government agricultural schemes.

The feature includes:

- Scheme information
- Eligibility-related information
- Agricultural support programs
- Structured scheme data
- Searchable scheme information

Government scheme data is maintained through the application's database layer.

> **Note:** Users should verify eligibility, deadlines, and official requirements with the relevant government authority before applying.

---

### 📊 Data-Driven Agriculture

KrishiSphere brings together multiple types of agricultural information:


Soil Data
    ↓
Environmental Data
    ↓
Machine Learning Model
    ↓
Crop Recommendation
    ↓
Field & Crop Cycle Management
    ↓
AI-Assisted Agricultural Guidance


## 🏗️ System Architecture

KrishiSphere follows a modular full-stack architecture.

                    ┌──────────────────────┐
                    │      Frontend        │
                    │       React          │
                    │      Vercel          │
                    └──────────┬───────────┘
                               │
                               │ REST API
                               ▼
                    ┌──────────────────────┐
                    │      Backend         │
                    │   Node.js/Express    │
                    │      MongoDB         │
                    └───────┬───────┬──────┘
                            │       │
                 ┌──────────┘       └─────────────┐
                 │                                │
                 ▼                                ▼
       ┌──────────────────┐             ┌──────────────────┐
       │   ML Service     │             │    Gemini AI     │
       │     FastAPI      │             │   AI Service     │
       │     Python       │             │                  │
       └────────┬─────────┘             └──────────────────┘
                │
                ▼
       ┌──────────────────┐
       │ Trained ML Model │
       │     Joblib       │
       └──────────────────┘



## 🛠️ Tech Stack

### Frontend

- React.js
- Vite
- JavaScript
- HTML5
- CSS3
- Tailwind CSS
- React Router

### Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- REST APIs
- JWT Authentication

### Machine Learning

- Python
- FastAPI
- Scikit-learn
- Joblib
- Pandas
- NumPy

### Generative AI

- Google Gemini API
- Modular AI service
- Model fallback
- Prompt guardrails

### Deployment

- Vercel — Frontend
- Render — Backend / ML services
- MongoDB Atlas — Database

---

## 📁 Project Structure

A simplified structure of the project is:


KrishiSphere/
│
├── frontend/
│   ├── public/
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── services/
│       ├── hooks/
│       ├── assets/
│       └── ...
│
├── backend/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── services/
│   ├── scripts/
│   │   └── GovernmentSchemes.js
│   └── server.js
│
├── ml-service/
│   ├── src/
│   │   ├── api/
│   │   │   └── main.py
│   │   ├── prediction/
│   │   │   └── predictor.py
│   │   └── ...
│   │
│   ├── artifacts/
│   │   └── models/
│   │       └── crop_recommendation_model.joblib
│   │
│   └── requirements.txt
│
├── README.md
└── ...


> Folder names may vary slightly depending on the current version of the project.

# ⚙️ Getting Started

## 1. Clone the Repository


git clone https://github.com/sandeshKumar18/KrishiSphere.git
cd KrishiSphere


---

## 2. Frontend Setup

Navigate to the frontend directory:

cd frontend


Install dependencies:

npm install


Create a `.env` file:

VITE_BACKEND_URL=http://localhost:5000

Start the development server:

npm run dev

The frontend will normally be available at:

http://localhost:5173

# 🖥️ Backend Setup

Open another terminal and navigate to the backend:

cd backend

Install dependencies:

npm install


Create a `.env` file.

Example:

env
PORT=5000

MONGO_URI=your_mongodb_connection_string

JWT_SECRET=your_jwt_secret

GEMINI_API_KEY=your_gemini_api_key


Start the backend:
npm run dev


The backend will normally run on:

http://localhost:5000


# 🤖 ML Service Setup

Navigate to the ML service:

cd ml-service

Create a Python virtual environment:

### Windows

python -m venv venv

Activate it:

.\venv\Scripts\activate

### Linux / macOS

python3 -m venv venv

Activate:

source venv/bin/activate

Install dependencies:

pip install -r requirements.txt

Start the FastAPI server:

uvicorn src.api.main:app --reload

The ML service will normally run on:

http://127.0.0.1:8000
# 🔐 Environment Variables

Do **not** commit API keys, database credentials, JWT secrets, or other sensitive information to GitHub.

Example backend environment variables:

```env
PORT=5000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_secret
GEMINI_API_KEY=your_api_key
```

Example frontend:

```env
VITE_BACKEND_URL=http://localhost:5000
```

Example ML service configuration, if required:

```env
MODEL_PATH=path_to_model
```

Add environment files to `.gitignore`:

.env
.env.local
.env.production
venv/
__pycache__/


# 🔌 API Architecture

The application is divided into multiple API responsibilities.

### Authentication

Handles:

- User registration
- Login
- JWT authentication
- User profile

### Fields

Handles:

- Creating fields
- Updating fields
- Retrieving fields
- Managing field information

### Soil Tests

Handles:

- Adding soil-test records
- Retrieving soil information
- Associating soil tests with fields

### Crop Cycles

Handles:

- Creating crop cycles
- Managing crop-cycle information
- Tracking crop progress

### Recommendations

Handles:

- Receiving soil/environmental parameters
- Communicating with the ML service
- Returning crop recommendations

### Government Schemes

Handles:

- Retrieving government schemes
- Scheme information
- Agricultural support information

### AI Assistant

Handles:

- User agricultural queries
- Gemini API communication
- Prompt processing
- Fallback model handling

---

# 🧠 Machine Learning Pipeline

The crop recommendation system follows this pipeline:

Agricultural Dataset
        │
        ▼
Data Cleaning
        │
        ▼
Feature Selection
        │
        ▼
Train / Test Split
        │
        ▼
Model Training
        │
        ▼
Model Evaluation
        │
        ▼
Model Serialization
        │
        ▼
Joblib Model
        │
        ▼
FastAPI Prediction API
        │
        ▼
KrishiSphere Backend
        │
        ▼
Frontend Recommendation

### Input Features

The model uses agricultural parameters such as:

N
P
K
Temperature
Humidity
pH
Rainfall

### Output

The model predicts a suitable crop from the supported crop classes.

Example:


{
  "crop": "rice"
}
`

---

# 🔬 ML Service

The Machine Learning model is exposed through a FastAPI service.

Example endpoint:

POST /predict


Example request:

```json
{
  "N": 90,
  "P": 42,
  "K": 43,
  "temperature": 20.8,
  "humidity": 82,
  "ph": 6.5,
  "rainfall": 202
}
```

Example response:

{
  "crop": "rice"
}

The exact request/response schema may depend on the current implementation.

---

# 🤖 AI Service Architecture

The Gemini integration follows a modular service design.

User Query
    │
    ▼
AI Service
    │
    ├── Prompt Guardrails
    │
    ├── Primary Gemini Model
    │
    └── Fallback Model
            │
            ▼
      Generated Response
            │
            ▼
      Farmer-Friendly Output


The fallback mechanism helps maintain service availability when the primary model is unavailable or encounters an API/model error.

# 🗄️ Database

KrishiSphere uses **MongoDB** for persistent application data.

The database stores information related to:

- Users
- Fields
- Soil tests
- Crop cycles
- Recommendations
- Government schemes
- Other application workflows

MongoDB provides a flexible document-oriented structure suitable for the application's evolving agricultural data model.

---

# 🔒 Security

KrishiSphere implements several security practices:

- JWT-based authentication
- Protected API routes
- Environment variables for secrets
- Server-side API key handling
- Input validation
- CORS configuration
- Separation of frontend and backend responsibilities

### Important

Never expose your Gemini API key or MongoDB credentials in frontend code.


# 🌐 Deployment

KrishiSphere can be deployed using:

| Component | Platform |
|---|---|
| Frontend | Vercel |
| Backend | Render |
| ML Service | Render |
| Database | MongoDB Atlas |

A typical production architecture is:

                    Internet
                       │
                       ▼
                ┌──────────────┐
                │    Vercel    │
                │   Frontend   │
                └──────┬───────┘
                       │
                       ▼
                ┌──────────────┐
                │    Render    │
                │   Backend    │
                └───┬──────┬───┘
                    │      │
          ┌─────────┘      └──────────┐
          ▼                           ▼
   ┌──────────────┐            ┌──────────────┐
   │   MongoDB    │            │    Render    │
   │    Atlas     │            │  ML Service  │
   └──────────────┘            └──────────────┘


# 📱 Application Workflow

A typical user workflow looks like:

Register / Login
       │
       ▼
Create Field
       │
       ▼
Add Soil Test
       │
       ▼
Enter Environmental Data
       │
       ▼
Get Crop Recommendation
       │
       ▼
Create Crop Cycle
       │
       ▼
Manage Field & Crop
       │
       ▼
Use AI Agricultural Assistant
       │
       ▼
Explore Government Schemes

# 🎯 Project Goals

KrishiSphere aims to:

1. Make agricultural information easier to access.
2. Help farmers make data-driven crop-selection decisions.
3. Digitize field and crop-cycle management.
4. Provide AI-assisted agricultural guidance.
5. Bring government agricultural schemes into one platform.
6. Demonstrate how Machine Learning and Generative AI can be integrated into a real-world full-stack application.

---

# 🔮 Future Enhancements

Potential future improvements include:

- 🌦️ Real-time weather integration
- 🌧️ Rainfall prediction
- 📡 IoT sensor integration
- 🌱 Real-time soil monitoring
- 🦠 Plant disease detection using Computer Vision
- 📈 Crop yield prediction
- 💰 Market-price prediction
- 🧮 Fertilizer optimization
- 📊 Advanced farm analytics
- 🗺️ Location-based agricultural recommendations
- 📱 Progressive Web App / mobile application
- 🌐 Multi-language support including Hindi
- 🔔 Agricultural alerts and notifications

---

# 🧪 Testing

Before deploying changes, test each major layer independently.

### Frontend

npm run dev

### Backend

```bash
npm run dev
```

### ML Service

```bash
uvicorn src.api.main:app --reload
```

Verify:

- Authentication
- Field creation
- Soil-test creation
- Crop recommendation
- Crop-cycle workflows
- Government schemes
- AI assistant
- API communication

---

# 🐛 Troubleshooting

### ML model not found

If you see an error similar to:

```text
FileNotFoundError:
crop_recommendation_model.joblib
```

verify that the trained model exists in the expected location:

```text
ml-service/
└── artifacts/
    └── models/
        └── crop_recommendation_model.joblib
```

Also make sure the model path is constructed correctly and does not depend on the current working directory.

---

### Backend cannot connect to MongoDB

Check:

```env
MONGO_URI=your_mongodb_connection_string
```

Also verify that your deployment IP/network access is allowed in MongoDB Atlas.

---

### Frontend cannot communicate with backend

Verify:

```env
VITE_BACKEND_URL=http://localhost:5000
```

For production, replace it with the deployed backend URL.

Also verify the backend CORS configuration.

---

### Gemini API errors

Check:

- API key validity
- Enabled API access
- Model availability
- API quota
- Correct model name
- Fallback configuration

---

# 📸 Screenshots

Add screenshots of the application here as the UI becomes finalized.

Example:

```text
docs/
├── dashboard.png
├── field-management.png
├── soil-test.png
├── crop-recommendation.png
├── crop-cycle.png
├── ai-assistant.png
└── government-schemes.png
```

Then display them in the README:

```markdown
![Dashboard](docs/dashboard.png)

![Crop Recommendation](docs/crop-recommendation.png)

![AI Assistant](docs/ai-assistant.png)
```

---

# 👨‍💻 Development

If you want to contribute:

1. Fork the repository.
2. Create a new branch.

```bash
git checkout -b feature/your-feature
```

3. Make your changes.
4. Test the application.
5. Commit your changes.

```bash
git add .
git commit -m "Add: your feature"
```

6. Push the branch.

```bash
git push origin feature/your-feature
```

7. Open a Pull Request.

---

# 📜 License

This project is currently intended for **educational, development, and demonstration purposes**.

If you plan to distribute or commercialize the project, add an appropriate open-source or proprietary license here.

---

# ⚠️ Disclaimer

KrishiSphere provides **technology-assisted agricultural information and recommendations**.

Machine Learning predictions and AI-generated responses should not be treated as a substitute for professional agricultural advice.

Farmers should verify important decisions—particularly those involving fertilizers, pesticides, irrigation, crop protection, or government benefits—with qualified agricultural experts or official government sources.

---

# 🌱 Why KrishiSphere?

Traditional agricultural decision-making can require farmers to consult multiple sources for soil information, crop selection, field management, weather conditions, government schemes, and agricultural guidance.

KrishiSphere aims to bring these capabilities together:

```text
             ┌────────────────────┐
             │    KrishiSphere    │
             └─────────┬──────────┘
                       │
       ┌───────────────┼────────────────┐
       │               │                │
       ▼               ▼                ▼
   🌱 ML Crop      🧪 Soil &        🤖 AI
   Recommendation  Field Data      Assistant
       │               │                │
       └───────────────┼────────────────┘
                       │
                       ▼
              🌾 Smarter Farming
                       │
                       ▼
             🏛️ Government Schemes
```

---

# ⭐ Project Highlights

- Full-stack **MERN application**
- Separate **FastAPI Machine Learning service**
- ML-based crop recommendation
- Approximately **95% model accuracy**
- MongoDB-based agricultural data management
- JWT authentication
- AI-powered agricultural assistant
- Gemini model fallback architecture
- Prompt guardrails
- Field management
- Soil testing
- Crop-cycle management
- Government agricultural schemes
- Production deployment architecture using Vercel + Render + MongoDB Atlas

---

## 📬 Contact

**Developer:** Sandesh Kumar

**GitHub:** `sandeshKumar18`

For questions, suggestions, or collaboration, feel free to open an issue or submit a pull request.

---

<div align="center">

### 🌱 KrishiSphere

**Technology for smarter, data-driven agriculture.**

⭐ If you find this project useful, consider giving the repository a star!

</div>
