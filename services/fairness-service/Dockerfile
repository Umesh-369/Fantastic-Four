FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY services/fairness-service /app
COPY thin_file_credit_10000_synthetic.csv /app/thin_file_credit_10000_synthetic.csv
ENV SYNTHETIC_DATA_PATH=/app/thin_file_credit_10000_synthetic.csv
EXPOSE 8006
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8006"]
