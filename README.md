# Data Sync Service (Development) for Nmemonica

Service for testing and developing the UI locally.

## Datasets

User datasets (Phrases.csv, Vocabulary.csv, Kanji.csv) are kept in data/csv directory.

User can import these datasets using the **External Data Source** section in the Nmemonica App Settings.

## Note:

Nmemonica is a PWA and uses the Service Worker API [(MDN docs)](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API) which is only enabled over HTTPS.

To run this service over HTTPS a self signed CA must be installed on the client device. (service generates keys under the data/selfSignedCA directory)

## Install Self Signed CA

### Chrome Desktop

1 **Navigate** to chrome:settings/certificates  
2 **Authorities** tab  
3 **Import** (data/selfSignedCA/root.pem)

### Chrome Mobile

1 **Navigate** to http://YOUR_SERVICE_IP:HTTP_PORT/getCA (Downloads root.pem)  
2 **Install** root.pem from browser

## Configuration

Edit [snservice.conf.json](snservice.conf.json) as needed

## Prerequisites

- A server (Device running this service)
  - [Git](https://git-scm.com/)
  - [Node](https://nodejs.org)
- A client (Device with browser viewing Nmemonica)

## Install and start

```bash
# clone repo
git clone https://github.com/bryanjimenez/snservice.git
cd snservice
# install dependencies
npm install
# build service
npm run build
# run service
node ./dist/esm/index.js
```

## api-docs
API is documented using  
- [SwaggerUI](https://swagger.io/docs/specification/basic-structure/)  
- [OpenAPI](https://github.com/OAI/OpenAPI-Specification/blob/3.0.1/versions/3.0.1.md)  

If your ip is 192.168.1.10 and https port 8443 then run the service and navigate to

https://192.168.1.10:8443/api-docs


## CSV

CSV files require the fields noted below (see headers) and are expected to be names accordingly. Files should be under the data/CSV directory.

Note: CSV data needs to be exported as UTF-8

### Phrases.csv

| Header   | Description            | Example     |
| -------- | ---------------------- | ----------- |
| Japanese | Japanese term          | こんにちわ  |
| Romaji   | Romaji pronunciation   | kon'nichiwa |
| English  | English translation    | Hello       |
| Literal  | Literal translation    | Hello       |
| Group    |                        |
| SubGroup |                        |
| Lesson   | Lesson info (metadata) |
| Tags     |                        | Greetings   |

### Vocabulary.csv

| Header        | Description             | Example        |
| ------------- | ----------------------- | -------------- |
| Japanese      |                         | のんげん\n人間 |
| English       |                         | human          |
| Group         |                         | Noun           |
| Romaji        |                         | ningen         |
| SubGroup      |                         | Person         |
| Pronunciation | pronunciation overrride |                |
| Tags          |                         |                |
| Opposites     | uid of opposite word    |                |

### Kanji.csv

| Header  | Description           | Example |
| ------- | --------------------- | ------- |
| Kanji   |                       | 六      |
| English |                       | six     |
| Onyomi  |                       |
| Kunyomi |                       |
| Group   |                       | Numbers |
| Tags    |                       | Numbers |
| Radex   | radical example kanji |
