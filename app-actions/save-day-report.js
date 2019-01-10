const sells = require('../analysis/reports/sells');
const holds = require('../analysis/reports/holds');
const sendEmail = require('../utils/send-email');
const getFilesSortedByDate = require('../utils/get-files-sorted-by-date');
const getIndexes = require('../utils/get-indexes');
const DayReport = require('../models/DayReport');
const lookup = require('../utils/lookup');
const getTrend = require('../utils/get-trend');
const stratManager = require('../socket-server/strat-manager');
const PmPerfs = require('../models/PmPerfs');
const getAccountBalance = require('../utils/get-account-balance');

// helpers
const roundTo = numDec => num => Math.round(num * Math.pow(10, numDec)) / Math.pow(10, numDec);
const oneDec = roundTo(1);
const twoDec = roundTo(2);


module.exports = async (Robinhood, min = 515) => {

    const todaysDate = (await getFilesSortedByDate('daily-transactions'))[0];
    console.log(`Creating report for ${todaysDate} @ ${min} minutes`);

    // get and record pm perfs
    await stratManager.init({ dateOverride: todaysDate });
    const pmReport = stratManager.calcPmPerfs();
    console.log(`loaded ${pmReport.length} prediction models`);
    const pmData = { min, perfs: pmReport };
    await PmPerfs.updateOne(
        { date: todaysDate },
        { $set: pmData },
        { upsert: true }
    );

    console.log('saved pm perfs...');
    const forPurchasePerfs = (pmReport.find(({ pmName }) => pmName === 'forPurchase') || {}) || null;
    console.log({ forPurchasePerfs });

    // get account balance
    const { accountBalance, accountBalanceTrend } = await getAccountBalance(Robinhood, true);

    // get index prices
    const indexPrices = await getIndexes();
    console.log({ indexPrices });

    // analyze sells and holds
    const sellReport = await sells(Robinhood, 1);
    const holdReport = await holds(Robinhood);

    // prep data for mongo
    const mongoData = {
        accountBalance: twoDec(accountBalance),
        actualBalanceTrend: accountBalanceTrend,
        holdReturn: {
            absolute: twoDec(holdReport.returnAbs),
            percentage: twoDec(holdReport.returnPerc) || 0
        },
        sellReturn: {
            absolute: twoDec(sellReport.returnAbs),
            percentage: twoDec(sellReport.returnPerc) || 0
        },
        pickToExecutionPerc: twoDec(holdReport.pickToExecutionPerc) || 0,
        forPurchasePM: forPurchasePerfs,
        indexPrices
    };
    
    await sendEmail(
        `robinhood-playground: day-report for ${todaysDate}`,
        [
            JSON.stringify(mongoData, null, 2),
            '-----------------------------------',
            'CURRENT HOLDS',
            '-----------------------------------',
            holdReport.formatted,
            '',
            '-----------------------------------',
            'SELL REPORT',
            '-----------------------------------',
            sellReport.formatted,
        ].join('\n')
    );

    await DayReport.updateOne(
        { date: todaysDate },
        { $set: mongoData },
        { upsert: true }
    );

};