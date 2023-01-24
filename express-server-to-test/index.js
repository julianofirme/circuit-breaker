const express = require('express');

const app = express();

let counter = 0;

app.get('/test', (_, res) => {
  counter++;

  console.log(`Incoming request №${counter}`);

  let responseCode = 200;

  if (counter % 3 === 0) {
    responseCode = 400;
  }

  if (counter % 5 === 0) {
    responseCode = 429;
  }

  return res.status(responseCode).send();
});

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server is ready on ${PORT}`);
});