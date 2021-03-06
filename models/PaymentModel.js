const passport = require('passport');
const { user, password } = require('pg/lib/defaults');
const db = require('./dbConfig');
const pgp = require('pg-promise')({ capSQL: true });

module.exports = {
    addNewAccount: async (account_id)=>{
        await db.none(`INSERT INTO account(account_id, balance,type)
        VALUES('${account_id}', 0, 0)`);
        const res = await db.one('SELECT * FROM account WHERE account_id =$1',account_id);
        if (res.length == 0) return null;
        return res;
    },
    getAccountInfo: async (account_id) => {
        const res = await db.one('SELECT * FROM account WHERE account_id =$1',account_id);
        if (res.length == 0) return null;
        return res;
    },
    getPaymentHistoryByAccountId: async (account_id)=>{
        const res = await db.any("SELECT *, TO_CHAR(time,'dd/MM/yyyy hh:MI:ss') AS time   FROM transaction_history WHERE transfer_account =$1 OR receive_account = $1",account_id);
        if (res.length == 0) return null;
        return res;
    },
    addTransactionHistory: async (transfer_account,receive_account,time,amount) =>{
        await db.none(`INSERT INTO transaction_history(transfer_account, receive_account,time,amount)
        VALUES('${transfer_account}', '${receive_account}','${time}','${amount}')`);
    },
    changePassword: async(account_id, password) =>{
        var res = await db.none(`UPDATE account SET password = $1 WHERE account_id = $2`, [password,account_id]);
        return res;
    },
    increateBalance: async(account_id, amount) =>{
        await db.none(`UPDATE account SET balance = balance + $1 WHERE account_id = $2`, [amount,account_id]);
        const res = await db.one('SELECT * FROM account WHERE account_id =$1',account_id);
        if(res.length===0) return null;
        return res;
    },
    decreateBalance: async(account_id, amount) =>{
        await db.none(`UPDATE account SET balance = balance - $1 WHERE account_id = $2`, [amount,account_id]);
        const res = await db.one('SELECT * FROM account WHERE account_id =$1',account_id);
        if(res.length===0) return null;
        return res;
    },
    get: async (value, tblName, fieldName) => {
        const table = new pgp.helpers.TableName({ table: tblName, schema: 'public' });
        const qStr = pgp.as.format(`SELECT * FROM $1 WHERE "${fieldName}"='${value}'`, table);
        try {
            const res = await db.any(qStr);
            if (res.length > 0) {
                return res[0];
            }
            return null;
        } catch (error) {
            console.log('error paymentM/get:', error);
        }
    },
    update: async (tblName, entity, fieldName, value) => {
        const table = new pgp.helpers.TableName({table: tblName, schema: 'public'});
        const qStr = pgp.helpers.update(entity, null, table) + `WHERE "${fieldName}" = '${value}'`;
        try {
            const res = db.any(qStr);
            return res;
        } catch (error) {
            console.log('error siteM/update:', error);
        }
    }
    
}