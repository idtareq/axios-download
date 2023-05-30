const fs = require("fs");

function isFile(path) {
    try {
        const stats = fs.statSync(path);
        return stats.isFile();
    } catch (error) {
        if (error.code === "ENOENT") {
            return false;
        }
        throw error;
    }
}

function isDir(path) {
    try {
        const stats = fs.statSync(path);
        return stats.isDirectory();
    } catch (error) {
        if (error.code === "ENOENT") {
            return false;
        }
        throw error;
    }
}

function getDispositionFileName(disposition) {
    const utf8FilenameRegex = /filename\*=UTF-8''([\w%\-\.]+)(?:; ?|$)/i;
    const asciiFilenameRegex = /^filename=(["']?)(.*?[^\\])\1(?:; ?|$)/i;

    let fileName = null;
    if (utf8FilenameRegex.test(disposition)) {
        fileName = decodeURIComponent(utf8FilenameRegex.exec(disposition)[1]);
    } else {
        const filenameStart = disposition.toLowerCase().indexOf("filename=");
        if (filenameStart >= 0) {
            const partialDisposition = disposition.slice(filenameStart);
            const matches = asciiFilenameRegex.exec(partialDisposition);
            if (matches != null && matches[2]) {
                fileName = matches[2];
            }
        }
    }
    return fileName;
}

function getLastPartOfUrl(urlString) {
    const parsedUrl = new URL(urlString);
    const pathParts = parsedUrl.pathname.split("/");
    return pathParts[pathParts.length - 1];
}

function displayProgress(title, percentage) {
    if (percentage > 1) percentage = 1;
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    process.stdout.write(`${title} ${Math.round(percentage * 100)}%`);
}

module.exports = {
    isFile,
    isDir,
    getDispositionFileName,
    getLastPartOfUrl,
    displayProgress,
};
