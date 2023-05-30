const axios = require("axios");
const pathlib = require("path");
const {
    isDir,
    getDispositionFileName,
    getLastPartOfUrl,
    displayProgress,
} = require("./util");

async function getRemoteFileInfo(url, headers) {
    const response = await axios.head(url, { headers });
    const totalSize = parseInt(response.headers["content-length"] || 0, 10);
    const acceptRanges = response.headers["accept-ranges"];
    const supportsResume =
        !isNaN(totalSize) && totalSize >= 0 && acceptRanges === "bytes";
    let filename = null;

    if (supportsResume && response.headers["content-disposition"]) {
        filename = getDispositionFileName(
            response.headers["content-disposition"]
        );
    }

    return { totalSize, supportsResume, filename };
}

function getEffectiveOutputPath(outputPath, url, responseFilename) {
    outputPath = pathlib.resolve(".");
    if (isDir(outputPath)) {
        const urlFilename = getLastPartOfUrl(url);
        const filename = responseFilename || urlFilename;
        outputPath = pathlib.join(outputPath, filename);
    } else if (!isDir(pathlib.dirname(outputPath))) {
        throw new Error("Specified directory does not exist");
    }
    return outputPath;
}

function getResumeHeader(currentSize, totalSize) {
    return {
        range: `bytes=${currentSize}-${totalSize - 1}`,
    };
}

function onDownloadProgress(
    userOnDownloadProgress,
    currentSize,
    showProgress,
    filename
) {
    return (progressEvent) => {
        const total = currentSize + progressEvent.total;
        const loaded = currentSize + progressEvent.loaded;

        progressEvent = {
            bytes: loaded,
            download: true,
            estimated: progressEvent.estimated,
            loaded: loaded,
            progress: loaded / total,
            rate: progressEvent.rate,
            total: total,
        };

        if (showProgress) {
            displayProgress(filename, progressEvent.progress);
        }

        if (userOnDownloadProgress) {
            userOnDownloadProgress(progressEvent);
        }
    };
}

module.exports = {
    getRemoteFileInfo,
    getEffectiveOutputPath,
    getResumeHeader,
    onDownloadProgress,
};
