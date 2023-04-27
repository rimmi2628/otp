const express = require('express');
const router = express.Router();
const UserControllers= require('../Controller/UserController');
router.post('/register',  UserControllers.postregister);
router.post('/login', UserControllers.userlogin );

router.get('/postreset/:token',UserControllers.getreset);

router.post('/postreset' ,UserControllers.postreset);
module.exports=router;