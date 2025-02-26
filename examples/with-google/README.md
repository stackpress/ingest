# Google Cloud Function Example

This is an example of GCP function using Typescript and Yarn.

## Prerequisites:

- Download Google Cloud SDK
- Initialize gcloud config ($ gcloud init)
- Log in to gcloud account ($ gcloud auth login)

## Running it locally

At the first time running the project run the command:

```bash
$ yarn
```

Then you can build and start the local dev:

```bash
$ yarn gcp:build
$ yarn gcp:dev
```

Once the project is running check out http://localhost:8081.

## Deploying to GCP

Deploy the GCP function (cd examples/with-gcp)

```bash
$ gcloud functions deploy gcp-function \
  --entry-point=handler \
  --runtime nodejs20 \
  --trigger-http \
  --allow-unauthenticated \
  --project [PROJECT ID]
```
access the URL (example): https://us-central1-zinc-style-449212-s0.cloudfunctions.net/gcp-function

## Authenticate for invocation

If authentication is required (--no-allow-unauthenticated), execute this line:

```bash
$ curl  -H "Authorization: Bearer $(gcloud auth print-identity-token)" \
  [FUNCTION URL]
```

more info: https://cloud.google.com/functions/docs/securing/authenticating

To invoke the GCP function directly, execute this line:

```bash
$ gcloud functions call [FUNCTION NAME]
```
more info: https://cloud.google.com/functions/docs/running/direct
