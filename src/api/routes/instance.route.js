const express = require('express');
const controller = require('../controllers/instance.controller');
const keyVerify = require('../middlewares/keyCheck');
const loginVerify = require('../middlewares/loginCheck');
const checkInstance = require('../middlewares/instanceCheck.js');

const router = express.Router();
router.route('/init').get(checkInstance, controller.init);
router.route('/qr').get(keyVerify, controller.qr);
router.route('/qrbase64').get(keyVerify, controller.qrbase64);
router.route('/info').get(keyVerify, controller.info);
router.route('/restore').get(controller.restore);
router.route('/logout').delete(keyVerify, loginVerify, controller.logout);
router.route('/delete').delete(keyVerify, controller.delete);
router.route('/list').get(controller.list);
router.route('/stop').get(keyVerify, loginVerify, controller.stop);
router.route('/remove').get(keyVerify, controller.remove);
router.route('/start').get(controller.restore);

module.exports = router;
