FROM python:3.9-slim

# Set working directory
WORKDIR /app

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the script
COPY . .

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV PROCESS_TYPE=full
ENV MAX_WORKERS=20
ENV BATCH_SIZE=25
ENV START_PAGE=1
ENV END_PAGE=500
ENV PROVIDER_REFRESH_DAYS=7
ENV ENRICHMENT_REFRESH_DAYS=30
ENV TOTAL_WORKERS=8

# Set timezone
RUN apt-get update && apt-get install -y tzdata && \
    ln -fs /usr/share/zoneinfo/UTC /etc/localtime && \
    dpkg-reconfigure -f noninteractive tzdata && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Run script
CMD ["python", "data_processor.py"]