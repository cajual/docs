#!/bin/bash
set -e

# Ensure AWS SAM CLI is installed
if ! command -v sam &> /dev/null
then
    echo "AWS SAM CLI could not be found. Please install it first."
    exit 1
fi

# Ensure Docker is installed
if ! command -v docker &> /dev/null
then
    echo "Docker is not installed. Please install Docker first."
    exit 1
fi

# Define Lambda function name and project directory
LAMBDA_FUNCTION_NAME="hello_lambda"
LAMBDA_PROJECT_DIR="hello_world"

# Change to the Lambda project directory
cd "$LAMBDA_PROJECT_DIR"

echo "Building AWS SAM Lambda..."
sam build --use-container

echo "Starting Lambda locally on port 3001..."
sam local start-lambda --port 3001 &

# Give some time for the Lambda to start
sleep 5

# Move back to project root
cd ..

# Create Locust test script (locustfile.py)
echo "Generating Locust test script..."
cat <<EOL > locustfile.py
from locust import HttpUser, task, between
import boto3
import json

class LambdaUser(HttpUser):
    wait_time = between(1, 3)

    @task
    def invoke_lambda(self):
        lambda_client = boto3.client("lambda", endpoint_url="http://127.0.0.1:3001", region_name="us-east-1")
        payload = json.dumps({"test": "data"})
        response = lambda_client.invoke(FunctionName="$LAMBDA_FUNCTION_NAME", Payload=payload)
        print(response)
EOL

echo "Running Locust load test..."
locust -f locustfile.py --headless -u 5000 -r 100 --run-time 1m --csv=load_test_results

echo "Cleaning up..."
pkill -f "sam local start-lambda"

echo "Load test completed. Results saved to load_test_results.csv"
