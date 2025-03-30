const path = require('path');

const config = {
    paths: {
        personData: path.join(__dirname, '../../solo/person'),
        upToDate: path.join(__dirname, '../../solo/person/upToDate')
    },
    fileExtensions: {
        data: '.json'
    },
    dateFormat: 'YYYY-MM-DD'
};

module.exports = config; 