FROM python:3.12-slim
# The adapter turns each function invocation into a normal web request on a local port.
COPY --from=public.ecr.aws/awsguru/aws-lambda-adapter:0.9.1 /lambda-adapter /opt/extensions/lambda-adapter
ENV PORT=8000
# Must match the function URL's invoke mode (RESPONSE_STREAM), or streaming arrives in one lump.
ENV AWS_LWA_INVOKE_MODE=response_stream
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000"]
