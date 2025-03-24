import { action } from '@stackpress/ingest';

const template = `
<!DOCTYPE html>
<html>
  <head>
    <title>SSE</title>
  </head>
  <body>
    <ul></ul>
    <script>
      const ul = document.querySelector('ul');
      const evtSource = new EventSource('/__sse__');
      evtSource.onmessage = (event) => {
        const li = document.createElement('li');
        li.textContent = event.data;
        ul.appendChild(li);
      };
    </script>
  </body>
</html>
`;

export default action(function Stream(req, res) {
  //send the response
  res.setHTML(template.trim());
});