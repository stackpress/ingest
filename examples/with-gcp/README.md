# GCP Function Example

This is an example of GCP function using Typescript and Yarn.

## Prerequisites:

- Download Google Cloud SDK
- Initialize gcloud config ($ gcloud init)
- Log in to gcloud account ($ gcloud auth login)

## Running it locally

At the first time running the project run the command:

    $ yarn

Then you can build and start the local dev:

    $ yarn gcp:build
    $ yarn gcp:dev

Once the project is running check out http://localhost:8081.

## Deploying to GCP

Deploy the GCP function (cd examples/with-gcp)

    $ gcloud functions deploy gcp-function \
        --entry-point=handler \
        --runtime nodejs20 \
        --trigger-http \
        --no-allow-unauthenticated \
        --project [PROJECT ID]

## Authenticate for invocation

Since authentication is required, clicking the URL will return Error: Forbidden. Execute this line:

    $ curl  -H "Authorization: Bearer $(gcloud auth print-identity-token)" \
        [FUNCTION URL]

more info: https://cloud.google.com/functions/docs/securing/authenticating
