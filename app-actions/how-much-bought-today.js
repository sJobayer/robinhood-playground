const fs = require('mz/fs');
const jsonMgr = require('../utils/json-mgr');

module.exports = async (Robinhood, ticker) => {
    let files = await fs.readdir('./json/daily-transactions');

    let sortedFiles = files.sort((a, b) => {
        return new Date(a.split('.')[0]) - new Date(b.split('.')[0]);
    });

    const mostRecentDay = sortedFiles[sortedFiles.length - 1];
    const todayFile = `./json/daily-transactions/${mostRecentDay}`;
    const todayTransactions = await jsonMgr.get(todayFile) || [];
    str({ todayTransactions })
}