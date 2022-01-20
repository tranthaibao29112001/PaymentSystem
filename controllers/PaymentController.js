
const { restart } = require("nodemon");
const db = require("../models/PaymentModel");

const bcrypt = require('bcrypt');
const passport = require('passport');
const { saveBufferToFile } = require("express-fileupload/lib/utilities");
const saltRounds = 10;

class PaymentController {

  async home(req, res, next) {
    if (!req.session.account) {
      res.redirect('/signin');
      return;
    }
    const account = await db.getAccountInfo(req.session.account.account_id);
    res.render('Payment/accountInfo', {
      layout: 'paymentLayout',
      title: 'Trang chủ',
      account_id: account.account_id,
      balance: account.balance,
      cssP: () => 'style',
      scriptP: () => 'script',
      footerP: () => 'footer',
    });
  }
  async createAccount(req, res) {
    const account_id = req.body.account_id;
    const result = await db.addNewAccount(account_id);
    if (result) {
      res.json({ msg: "success" });
    }
    else {
      res.json({ msg: "fail" });
    }
  }
  //[GET]/paymentHistory
  async paymentHistory(req, res) {
    if (!req.session.account) {
      res.redirect('/signin');
      return;
    }
    const account = await db.getAccountInfo(req.session.account.account_id);
    const paymentList = await db.getPaymentHistoryByAccountId(account.account_id);
    res.render('Payment/paymentHistory', {
      layout: 'paymentLayout',
      title: 'Lịch sử giao dịch',
      account_id: account.account_id,
      balance: account.balance,
      cssP: () => 'style',
      scriptP: () => 'script',
      footerP: () => 'footer',
      paymentList: paymentList
    });
  }
  async addPayment(req, res) {
    let transfer_id = req.body.transfer_id;
    let receive_id = req.body.receive_id;
    let amount = req.body.totalPayment;
    let oldReceiver = await db.getAccountInfo(receive_id);
    let oldTransfer = await db.getAccountInfo(transfer_id);
    let date = new Date();
    let day = date.getUTCDate();
    let month = date.getUTCMonth() + 1;
    let year = date.getUTCFullYear();
    let hour = date.getHours();
    let minutes = date.getMinutes();
    let second = date.getSeconds();
    const dateStr = `${year}-${month}-${day} ${hour}:${minutes}:${second}`;
    await db.addTransactionHistory(transfer_id, receive_id, dateStr, amount);
    let newReceiver = await db.increateBalance(receive_id, amount);
    let newTransfer = await db.decreateBalance(transfer_id, amount);
    let receiverDiff = newReceiver.balance - oldReceiver.balance;
    let transferDiff = oldTransfer.balance - newTransfer.balance;
    if (receiverDiff === transferDiff) {
      res.json({ msg: "success" });
    }
    else {
      res.json({ msg: "fail" });
    }
  }
  //[GET]/signin
  signin(req, res, next) {
    res.render('Payment/signin', {
      title: 'Đăng nhập',
      navP: () => 'accountNav',
      cssP: () => 'style',
      scriptP: () => 'script',
      footerP: () => 'footer',
    });
  }
  //[POST]/signin
  async doSignIn(req, res, next) {
    const user = await db.get(req.body.accountId, 'account', 'account_id');
    if (user && !user.password) {
      return res.redirect('/createNewPwd?username=' + user.account_id);
    }
    passport.authenticate('local', (err, account, info) => {
      if (err) {
        return res.render('Payment/signin', {
          title: 'Đăng nhập',
          navP: () => 'accountNav',
          cssP: () => 'style',
          scriptP: () => 'script',
          footerP: () => 'footer',
          msg: err,
          color: 'danger'
        });
      }
      if (!account) {
        return res.render('Payment/signin', {
          title: 'Đăng nhập',
          navP: () => 'accountNav',
          cssP: () => 'style',
          scriptP: () => 'script',
          footerP: () => 'footer',
          msg: info.message,
          color: 'danger'
        });
      }
      req.logIn(account, async function (err) {
        if (err) {
          return res.render('Payment/signin', {
            title: 'Đăng nhập',
            navP: () => 'accountNav',
            cssP: () => 'style',
            scriptP: () => 'script',
            footerP: () => 'footer',
            msg: err,
            color: 'danger'
          });
        }
        req.session.account = account;
        return res.redirect('/');
      });
    })(req, res, next);
  }
  async getchangePassword(req, res, next) {
    if (!req.session.account) {
      res.redirect('/signin');
      return;
    }
    const account = await db.getAccountInfo(req.session.account.account_id);
    res.render('Payment/changePassword', {
      layout: 'paymentLayout',
      title: 'Đổi mật khẩu',
      account_id: account.account_id,
      balance: account.balance,
      cssP: () => 'style',
      scriptP: () => 'script',
      footerP: () => 'footer',
    });
  }
  async postChangePassword(req, res, next) {
    if (!req.session.account) {
      res.redirect('/signin');
      return;
    }
    var account = await db.getAccountInfo(req.session.account.account_id);
    var currentPass = req.body.currentPassword;
    var newPass = req.body.newPassword;
    var retypePass = req.body.retypeNewPassword;
    const challengeResult = await bcrypt.compare(currentPass, account.password);
    if (!challengeResult) {
      res.render('Payment/changePassword', {
        layout: 'paymentLayout',
        title: 'Đổi mật khẩu',
        account_id: account.account_id,
        balance: account.balance,
        cssP: () => 'style',
        scriptP: () => 'script',
        footerP: () => 'footer',
        msg: "Wrong Password",
        color: "danger"
      });
    }
    else if (newPass !== retypePass) {
      res.render('Payment/changePassword', {
        layout: 'paymentLayout',
        title: 'Đổi mật khẩu',
        account_id: account.account_id,
        balance: account.balance,
        cssP: () => 'style',
        scriptP: () => 'script',
        footerP: () => 'footer',
        msg: "Wrong Retype Password",
        color: "danger"
      });
    }
    else {
      const newPassHashed = await bcrypt.hash(newPass, saltRounds);
      var result = await db.changePassword(account.account_id, newPassHashed);
      res.render('Payment/changePassword', {
        layout: 'paymentLayout',
        title: 'Đổi mật khẩu',
        account_id: account.account_id,
        balance: account.balance,
        cssP: () => 'style',
        scriptP: () => 'script',
        footerP: () => 'footer',
        msg: "Change Password Success",
        color: "success"
      });
    }

  }
  async getRechargeMony(req, res) {
    if (!req.session.account) {
      res.redirect('/signin');
      return;
    }
    const account = await db.getAccountInfo(req.session.account.account_id);
    res.render('Payment/rechargeMoney', {
      layout: 'paymentLayout',
      title: 'Nạp tiền',
      account_id: account.account_id,
      balance: account.balance,
      cssP: () => 'style',
      scriptP: () => 'script',
      footerP: () => 'footer',
    });
  }
  async postRechargeMony(req, res) {
    if (!req.session.account) {
      res.redirect('/signin');
      return;
    }
    const account = await db.getAccountInfo(req.session.account.account_id);
    const addMoney = req.body.addMoney;
    await db.increateBalance(account.account_id, addMoney);
    res.render('Payment/rechargeMoney', {
      layout: 'paymentLayout',
      title: 'Nạp tiền',
      account_id: account.account_id,
      balance: account.balance,
      cssP: () => 'style',
      scriptP: () => 'script',
      footerP: () => 'footer',
      msg: "Nạp tiền thành công"
    });
  }
  // [GET] balance
  async getCurrentBalance(req, res) {
    var account_id = req.query.account_id;
    const account = await db.getAccountInfo(account_id);
    var balance = account.balance;
    res.json({ balance: balance });
  }
  //[GET]/createNewPwd
  async createNewPwd(req, res) {
    if (req.user || !req.query.username) {
      return res.redirect('/');
    }
    const user = await db.get(req.query.username, 'account', 'account_id');
    if (user && user.password) {
      return res.redirect('/signin');
    }
    res.render('./Payment/createNewPwd', {
      title: 'Tạo mật khẩu mới',
      navP: () => 'accountNav',
      cssP: () => 'style',
      scriptP: () => 'script',
      footerP: () => 'footer',
      username: req.query.username,
      msg: 'Đây là lần đầu bạn đăng nhập. Vui lòng tạo mật khẩu mới.',
      color: 'warning'
    });
  }
  //[POST]/createNewPwd
  async doCreateNewPwd(req, res) {
    const username = req.body.username;
    const pwd = req.body.pwd;
    const repwd = req.body.repwd;
    if (pwd != repwd) {
      res.render('./Payment/createNewPwd', {
        title: 'Tạo mật khẩu mới',
        navP: () => 'accountNav',
        cssP: () => 'style',
        scriptP: () => 'script',
        footerP: () => 'footer',
        username: username,
        msg: 'Mật khẩu nhập lại không trùng khớp',
        color: 'danger',
      });
      return;
    }
    const pwdHashed = await bcrypt.hash(pwd, saltRounds);
    let entity = {
      password: pwdHashed,
    };
    await db.update('account', entity, 'account_id', username);
    res.redirect('/signin');
  }
  //[GET]/log-out
  logOut(req, res) {
    if (req.session.account) {
      req.session.destroy();
    }
    return res.redirect('/signin');
  }
}

module.exports = new PaymentController;