# Data Sync Service (Development) for Nmemonica

Service for testing and developing the UI locally.

## Note:

Nmemonica is a PWA and uses the Service Worker API [(MDN docs)](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API) which is only enabled over HTTPS.

To run this service over HTTPS self signed CA must be used.

## Configuration

Edit snservice.config.js as needed

## Generate self signed CA

```bash
 npx ts-node ./utils/environment-signed-ca.ts
```

## Build and start

```bash
# to build the service
npm run build
# to start the service
npm run start
```

## Service endpoints

- /DATA_PATH/:data.json ex: localhost:8000/lambda/vocabulary.json
- /AUDIO_PATH/ ex: localhost:8000/g_translate_pronounce?tl=ja&q=友達
- /SHEET_PATH/ ex: localhost:8000/workbook/getData

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
