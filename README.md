# autopark-scheduler

autopark-scheduler is a simple node.js app to schedule your parking slots in the park here app. So you dont have to press on the book button and hope you are not to late to get a parking slot.

## Installation/Configuration

1. **Clone the repository**

2. **Create a .env file and fill out the variables**

3. **Build the docker image**
    ```bash
    docker build -t autopark-scheduler
    ```
4. **Run the image**
    ```bash
    docker run -d --env-file .env autopark-scheduler:latest
    ```