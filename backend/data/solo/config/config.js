const path = require('path');

const config = {
    paths: {
        personData: path.join(__dirname, '../../solo/person'),
        upToDate: path.join(__dirname, '../../solo/person/upToDate'),
        archive: path.join(__dirname, '../../solo/person/archive')
    },
    fileExtensions: {
        data: '.json'
    },
    dateFormat: 'YYYY-MM-DD',
    maxArchiveAge: 30 // Tage
};

module.exports = config; 