const limitBuyMultiple = require('./limit-buy-multiple');
const getMinutesFrom630 = require('../utils/get-minutes-from-630');
let { expectedPickCount, purchaseAmt, disableCashCheck } = require('../settings');
const { alpaca } = require('../alpaca');
const makeFundsAvailable = require('../alpaca/make-funds-available');
const sendEmail = require('../utils/send-email');

const purchaseStocks = async ({ strategy, multiplier = 1, min, withPrices } = {}, dontBuy) => {

    const account = await alpaca.getAccount();
    const { portfolio_value, cash, long_market_value } = account;
    // strlog({ account })
    purchaseAmt = purchaseAmt || Math.ceil(portfolio_value / expectedPickCount);
    const amountPerBuy = purchaseAmt * multiplier;
    strlog({
        purchaseAmt,
        multiplier,
        amountPerBuy,
    });
    const totalAmtToSpend = disableCashCheck ? amountPerBuy : Math.min(amountPerBuy, cash);
    strlog({
        totalAmtToSpend,
        cash,
        strategy
    });

    if (totalAmtToSpend < cash) {
        const fundsNeeded = cash - totalAmtToSpend;
        await makeFundsAvailable(fundsNeeded);
        const afterCash = (await alpaca.getAccount()).cash;
        await sendEmail('funds made available', JSON.stringify({ before: cash, fundsNeeded, after: afterCash }));
    }

    if (dontBuy) return;

    // const totalAmtToSpend = cashAvailable * ratioToSpend;

    
    // console.log('multiplier', multiplier, 'amountPerBuy', amountPerBuy, 'totalAmtToSpend', totalAmtToSpend);

    if (totalAmtToSpend < 10) {
        return console.log('not purchasing less than $10 to spend', strategy);
    }


    // console.log('actually purchasing', strategy, 'count', stocksToBuy.length);
    // console.log('ratioToSpend', ratioToSpend);
    // console.log({ stocksToBuy, totalAmtToSpend });
    await limitBuyMultiple({
        totalAmtToSpend,
        strategy,
        min,
        withPrices,
        strategy,
    });
};

module.exports = purchaseStocks;
