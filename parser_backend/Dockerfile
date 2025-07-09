# Use an official Python runtime as a parent image
FROM python:3.11-slim

# Set the working directory
WORKDIR /app

# Copy requirements if exists, else fallback to install minimal dependencies
COPY parser_backend/requirements.txt ./requirements.txt

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt || true

# Copy the rest of the application code
COPY parser_backend/ .

# Set environment variables (optional)
ENV PYTHONUNBUFFERED=1

# Run the application
CMD ["python", "main.py"]
