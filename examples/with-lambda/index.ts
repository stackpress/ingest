import { server } from "@stackpress/ingest/http";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

// server starter
const app = server();

app.get("/", (req, res) => {
  res.setHTML("<h1>Hello, World from Lambda!</h1>");
});

// AWS Lambda handler
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  return {
    statusCode: 200,
    headers: { "Content-Type": "text/html" },
    body: "<h1>Hello, World from Lambda!</h1>",
  };
};

// local server starter for testing
if (process.env.LAMBDA_LOCAL === "true") {
  app.create().listen(3000, () => {
    console.log("Server is running on port 3000");
    console.log("------------------------------");
  });
}
