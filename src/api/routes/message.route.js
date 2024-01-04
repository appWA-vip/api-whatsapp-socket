const express = require('express');
const controller = require('../controllers/message.controller');
const keyVerify = require('../middlewares/keyCheck');
const loginVerify = require('../middlewares/loginCheck');
const presenceCheck = require('../middlewares/presenceCheck');
const multer = require('multer');

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage: storage, inMemory: true }).single('file');

router.route('/text').post(keyVerify, loginVerify, presenceCheck, controller.Text);
router.route('/image').post(keyVerify, loginVerify, upload, presenceCheck, controller.Image);
router.route('/video').post(keyVerify, loginVerify, upload, presenceCheck, controller.Video);
router.route('/audio').post(keyVerify, loginVerify, upload, presenceCheck, controller.Audio);
router.route('/doc').post(keyVerify, loginVerify, upload, presenceCheck, controller.Document);
router.route('/mediaurl').post(keyVerify, loginVerify, presenceCheck, controller.Mediaurl);
router.route('/button').post(keyVerify, loginVerify, presenceCheck, controller.Button);
router.route('/contact').post(keyVerify, loginVerify, presenceCheck, controller.Contact);
router.route('/location').post(keyVerify, loginVerify, presenceCheck, controller.Location);
router.route('/list').post(keyVerify, loginVerify, presenceCheck, controller.List);
router.route('/setstatus').put(keyVerify, loginVerify, presenceCheck, controller.SetStatus);
router.route('/mediabutton').post(keyVerify, loginVerify, presenceCheck, controller.MediaButton);
router.route('/read').post(keyVerify, loginVerify, presenceCheck, controller.Read);
router.route('/react').post(keyVerify, loginVerify, presenceCheck, controller.React);

module.exports = router;
