# Notes About Payload

A payload is the request and response interface. AWS, GCP, Azure, 
Netlify and Vercel all use different payload interfaces and this one
was created to interface with each one, so you dont have to worry about 
which serverless provider to use in your actions. To do this we compared
against all the different payloads from these serverless providers and 
created one to rule them all.

## Why not Node IncomingMessage & ServerResponse ?

 - Once you read the body of IncomingMessage, it cannot be read again.
 - Once you set the header of ServerResponse, it starts sending down to 
   the client.
 - Once you set the body of ServerResponse, it closes the connection.

## Why not Fetch Request & Response ?

 - Once you read the body of Request, it cannot be read again.
 - Once you set the body of Response, you cannot set it again.

Because it's possible to have many actions for a route, we need to 
allow each route to communicate with each other, work with each other
to form the response.