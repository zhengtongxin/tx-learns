# TODO: write the recipe. Five ideas, in this order:
#  1. FROM a slim Python 3.12 base image
#  2. COPY the Lambda web adapter in from public.ecr.aws/awsguru/aws-lambda-adapter:0.9.1
#     (/lambda-adapter  ->  /opt/extensions/lambda-adapter)
#  3. ENV PORT=8000 and ENV AWS_LWA_INVOKE_MODE=response_stream
#  4. WORKDIR /app, COPY requirements.txt first, pip install --no-cache-dir -r requirements.txt,
#     then COPY the rest (this order keeps rebuilds fast)
#  5. CMD that starts: uvicorn server:app --host 0.0.0.0 --port 8000
# Hint: look at the lesson on serverless for the adapter lines.
FROM python:3.12-slim
