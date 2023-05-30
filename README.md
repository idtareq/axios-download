# axiosdownload-plugin


Axios plugin to make it easy to download files with resume download support.


## Installation
npm i axiosdownload-plugin

## Usage

```js
const axios = require("axios");
const axiosDownload = require("axiosdownload-plugin");

axiosDownload(axios);
const url = "https://nodejs.org/dist/v18.16.0/node-v18.16.0-x64.msi";
axios.download(url, "./download/path", {}, { showProgress: true, resumeDownload: true });
```
