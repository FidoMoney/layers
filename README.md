# Layers Project

A modern web application with a React frontend and FastAPI backend.

## Project Structure

```
layers/
├── frontend/           # React + Vite frontend application
│   ├── src/           # Source code
│   ├── public/        # Static files
│   └── package.json   # Frontend dependencies
│
└── backend/           # FastAPI backend application
    ├── app/           # Application code
    │   ├── api/       # API endpoints
    │   ├── core/      # Core functionality
    │   ├── models/    # Database models
    │   ├── schemas/   # Pydantic schemas
    │   └── services/  # Business logic
    ├── tests/         # Test files
    └── pyproject.toml # Backend dependencies
```

## Setup Instructions

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies using Poetry:
   ```bash
   poetry install
   ```

3. Start the development server:
   ```bash
   poetry run uvicorn app.main:app --reload
   ```

## Development Guidelines

- Follow modular architecture principles
- Keep frontend and backend concerns separate
- Write clean, maintainable code
- Include proper documentation
- Write tests for new features 