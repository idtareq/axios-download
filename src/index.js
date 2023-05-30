const axios = require("axios");
const fs = require("fs");
const pathlib = require("path");
const { isFile } = require("./util");
const {
    getRemoteFileInfo,
    getEffectiveOutputPath,
    getResumeHeader,
    onDownloadProgress,
} = require("./lib");

/**
 * Adds a `download` method for downloading files.
 *
 * @exports axiosDownload
 * @param {object} axios - The axios instance to enhance.
 *
 * @example
 * const axios = require('axios');
 * axiosDownload(axios);
 *
 * // Now you can use the new method:
 * axios.download(url, outputPath).then(() => console.log('Download complete'));
 *
 * @method axios.download
 * @param {string} url - The URL of the file to download.
 * @param {string} outputPath - The path where the downloaded file should be saved.
 * @param {object} [axiosConfig={}] - Configuration for the axios request.
 * @param {object} [downloadConfig={}] - Configuration for the download.
 * @param {boolean} downloadConfig.resumeDownload - Whether to resume the download if it was previously interrupted (default is true).
 * @param {boolean} downloadConfig.showProgress - Whether to display a progress indicator in the console (default is false).
 * @returns {Promise} A promise that resolves when the download is complete, or rejects if an error occurs.
 */
function axiosDownload (axios) {
    axios.download = async function (
        url,
        outputPath,
        axiosConfig = {},
        downloadConfig = {}
    ) {
        axiosConfig = {
            method: "get",
            headers: {},
            url,
            ...axiosConfig,
            responseType: "stream",
        };

        downloadConfig = {
            resumeDownload: true,
            showProgress: false,
            ...downloadConfig,
        };

        const { totalSize, supportsResume, responseFilename } =
            await getRemoteFileInfo(url, axiosConfig.headers);
        outputPath = getEffectiveOutputPath(outputPath, url, responseFilename);
        let currentSize = isFile(outputPath) ? fs.statSync(outputPath).size : 0;

        if (currentSize >= totalSize) {
            console.log("File already downloaded.");
            return;
        }

        const resumeDownload = downloadConfig.resumeDownload && currentSize > 0;

        if (resumeDownload) {
            if (!supportsResume) {
                throw new Error("Cannot resume download.");
            }

            axiosConfig.headers = {
                ...axiosConfig.headers,
                ...getResumeHeader(currentSize, totalSize),
            };
        }

        axiosConfig.onDownloadProgress = onDownloadProgress(
            axiosConfig.onDownloadProgress,
            resumeDownload ? currentSize : 0,
            downloadConfig.showProgress,
            pathlib.basename(outputPath)
        );

        const response = await axios(axiosConfig);
        const downloadStream = fs.createWriteStream(outputPath, {
            flags: resumeDownload ? "a" : "w",
        });
        response.data.pipe(downloadStream);

        return new Promise((resolve, reject) => {
            downloadStream.on("finish", resolve);
            downloadStream.on("error", reject);
        });
    };
}

module.exports = axiosDownload;
