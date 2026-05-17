FROM python:3.11-slim

WORKDIR /app

# Copy pyproject.toml
COPY pyproject.toml .

# Install dependencies directly from pyproject.toml
# Requires pip to build a generic wheel, or we can just pip install the packages listed.
RUN pip install --no-cache-dir .

COPY ./app /app/app

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
