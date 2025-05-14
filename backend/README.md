# Layers Backend

This is the backend service for the Layers project, built with FastAPI and Poetry.

## Features

- FastAPI-based REST API
- Modular architecture
- Type-safe with Pydantic
- Poetry for dependency management

## Development

1. Install dependencies:
   ```bash
   poetry install
   ```

2. Run the development server:
   ```bash
   poetry run uvicorn app.main:app --reload
   ```

The API will be available at http://localhost:8000

## API Documentation

Once the server is running, you can access:
- Interactive API docs (Swagger UI): http://localhost:8000/docs
- Alternative API docs (ReDoc): http://localhost:8000/redoc 