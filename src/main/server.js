const express = require('express');
const cors = require('cors');
const Router = require('./routes.js');
const Container = require('./container');

async function bootstrap() {

    const container = await Container.init();

    const port = container.config.port;
    const app = express();
    app.use(express.json());
    app.use(cors());
    app.use(Router);
    
    app.locals.container = container;

    app.listen(port, () => {
        console.log(`App listening on port ${port}`);
    });
}

const server = bootstrap();