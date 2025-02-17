# AWS Lambda Deployment Guide

---

## Prerequisites

Before deploying, ensure you have the following:
- **AWS Account** with access to **AWS Lambda** and **API Gateway**, as well as with necessary IAM Role Permissions.
- **AWS CLI** installed and configured (`aws configure`).
- **Yarn** installed (`npm install -g yarn`).
- **API Gateway** configured to trigger the Lambda function.

---

## Test Running Locally

You can test the Lambda function locally before deployment using `yarn lambda:dev`,
Then install all necessary packages using `yarn install`.


## Deploying to AWS (using AWS Website)

1. Go to the AWS Lambda Console: https://console.aws.amazon.com/lambda
2. Log in your AWS account.
3. Create a function by selecting 'Author from scratch', entering a function name, and selecting runtime.
4. Upload your FunctionCode.zip.
5. Click Deploy.
6. Go to Configuration -> Triggers.
7. Select 'API Gateway' and choose to create a new API.
8. Set Deployment Stage then click 'Add'.
9. Go to your API -> Stages -> YOUR_DEPLOYMENT_STAGE.
10. Copy and paste the Invoke URL to your browser to test.


## Deploying to AWS (using AWS CLI)

1. Zip your Lambda Function Code.
2. Deploy the Lambda Function by running the following command to create the function:.
`aws lambda create-function --function-name <YOUR_FUNCTION> \`

3. Create an API Gateway:
`aws apigateway create-rest-api --name <YOUR_API_NAME>`

4. Get the Root Resource ID of the new API:
`aws apigateway get-resources --rest-api-id <API_ID>`

5. Create a new resource in the API Gateway:
`aws apigateway create-resource --rest-api-id <API_ID> \`

6. Create a GET method that triggers Lambda:
`aws apigateway put-method --rest-api-id <API_ID> \`

7. Link the method to the Lambda Function:
`aws apigateway put-integration --rest-api-id <API_ID> \`

8. Deploy the API Gateway and get the Invoke URL:
`aws apigateway create-deployment --rest-api-id <API_ID> \`

9. Allow API Gateway to invoke your Lambda Function:
`aws lambda add-permission --function-name <YOUR_FUNCTION> \`

10. Update the function code for later use by running this code:
`aws lambda update-function-code --function-name <YOUR_FUNCTION> \`

11. Verify the deployment using this code:
`aws lambda invoke --function-name <YOUR_FUNCTION> output.txt`
OR:
`curl -X POST "https://<API_ID>.execute-api.<REGION>.amazonaws.com/prod/lambda"`
