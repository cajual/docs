# Architectural Decision Record (ADR): Shift-Left Concurrency Testing for AWS Lambda

## Introduction

Ensuring the reliability of an AWS Lambda service is critical for scalability, performance, and cost optimization. **Testing concurrency as early as possible (shift-left testing)** helps detect potential bottlenecks, race conditions, and service degradation before deployment. Without early testing, issues may only surface in production, leading to downtime, increased costs, or service failures. 

By implementing shift-left concurrency testing, we can:

- Identify performance bottlenecks before production.
- Optimize cold start and warm start behavior.
- Ensure the service scales properly under load.
- Reduce unexpected operational costs caused by excessive scaling.

---

## Solution Overview: Docker, Locust, and AWS SAM CLI for Shift-Left Testing

This solution leverages **Docker, Locust, and AWS SAM CLI** to provide a **fully automated, local concurrency testing environment** for AWS Lambda services. The components include:

- **Docker**: Packages the Lambda function as a container to simulate AWS Lambda execution.
- **AWS SAM CLI**: Runs the Lambda function locally within a container to mimic AWS runtime behavior.
- **Locust**: Simulates a high-concurrency workload to test Lambda's response time and scaling behavior.

---

## Value Proposition for Reliability and Optimization

By implementing this solution, we achieve:

- **Early identification of scaling bottlenecks**, allowing developers to optimize before deployment.
- **Cost efficiency**, by reducing excessive scaling and preventing unexpected AWS Lambda cost spikes.
- **Improved reliability**, ensuring the service handles production-like workloads under controlled conditions.
- **Automated, repeatable testing**, enabling continuous performance validation during development.

---

## How the Solution Works

### Step 1: Create a Test Lambda Project
- A sample AWS Lambda function is defined in `app.py` with a handler named `lambda_handler`.

### Step 2: Generate a Docker Image for the Lambda Function
- A Dockerfile is created to package the Lambda function.

### Step 3: Run the Lambda Container with AWS SAM CLI
- The function is deployed and executed locally using AWS SAM CLI.

### Step 4: Simulate 5000 Concurrent Users with Locust
- A Locust test script is created to simulate concurrent requests hitting the AWS Lambda container.

### Step 5: Automate the Entire Process
A `Makefile` and `setup.sh` script are provided to fully automate the process, including:

1. Checking for Docker or Podman installation.
2. Generating a Dockerfile for Lambda execution.
3. Installing necessary dependencies (`locust`, `aws-sam-cli`).
4. Creating and building an AWS SAM containerized Lambda project.
5. Running AWS SAM locally.
6. Creating a Locust test script.
7. Executing Locust against the locally running AWS SAM Lambda container.
8. Storing performance test results automatically in the repository.

---

## Implementation Details

### **5.1 `setup.sh`: Environment Setup Script**
```bash
#!/bin/bash
set -e

# Check for Docker or Podman
if command -v docker &> /dev/null; then
    echo "Docker found. Using Docker."
    CONTAINER_ENGINE="docker"
elif command -v podman &> /dev/null; then
    echo "Podman found. Using Podman."
    CONTAINER_ENGINE="podman"
else
    echo "Neither Docker nor Podman found. Please install Docker or Podman first."
    exit 1
fi

# Install dependencies in user space
pip install --user locust aws-sam-cli

# Create the AWS SAM project
sam init --runtime python3.9 --dependency-manager pip --name test-lambda --app-template hello-world
cd test-lambda

# Generate Dockerfile
echo "FROM public.ecr.aws/lambda/python:3.9
COPY app.py /var/task/
CMD [\"app.lambda_handler\"]" > Dockerfile

# Build and run AWS SAM locally
sam build
sam local start-api &

# Move back to project root
touch locustfile.py
cd ..

# Generate Locust test script
echo "from locust import HttpUser, task, between
class LambdaUser(HttpUser):
    wait_time = between(1, 3)
    
    @task
    def invoke_lambda(self):
        self.client.get(\"http://127.0.0.1:3000/\")" > locustfile.py

# Run Locust load test
locust -f locustfile.py --headless -u 5000 -r 100 --run-time 1m --csv=load_test_results
```

### **5.2 `Makefile`: Build & Test Automation**
```make
.PHONY: setup build test clean

setup:
	bash setup.sh

build:
	cd test-lambda && sam build

test:
	locust -f locustfile.py --headless -u 5000 -r 100 --run-time 1m --csv=load_test_results

clean:
	rm -rf test-lambda locustfile.py
```

### **5.3 Expected Outputs**
Upon execution, the solution will:
1. Install required dependencies.
2. Create an AWS SAM project with a test Lambda function.
3. Package the function in a Docker container.
4. Run the Lambda function locally with AWS SAM CLI.
5. Execute a **5000-user load test using Locust**.
6. **Store results in `load_test_results.csv`** for analysis.

---

## Conclusion

This ADR documents the decision to implement **shift-left concurrency testing** for AWS Lambda using **Docker, AWS SAM CLI, and Locust**. By automating load testing, we improve **reliability, scalability, and cost efficiency** before deployment. This approach enables **early detection of performance issues** and supports **continuous optimization** of serverless workloads.

---

## Next Steps
Would you like to integrate this solution into a CI/CD pipeline (e.g., GitHub Actions, AWS CodeBuild)? 🚀

