const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Bot WhatsApp online w 🔥');
});

app.listen(PORT, () => console.log(`Puerto ${PORT}`));
