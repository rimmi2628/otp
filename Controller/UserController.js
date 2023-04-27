const model=require('../models')
require('dotenv').config();
const jwt=require('jsonwebtoken');
var nodemailer=require('nodemailer');
const bcrypt=require('bcryptjs');
const User=model.User;


var transpoter=nodemailer.createTransport({
    service:'gmail',
  
      auth:{
          user:process.env.User_email,
          pass:process.env.User_password
      },
      tls: {
        rejectUnauthorized: false
      }
  
  });


  var otp = Math.random();
  otp = otp * 1000000;
  otp = parseInt(otp);
  console.log(otp);




exports.postregister=async (req,res,next)=>{
   try {
    console.log('register');

    const first_name=req.body.first_name;
    const last_name=req.body.last_name;
    const email=req.body.email;
    const password=req.body.password;
    const verified=req.body.verified;

   if(!email && !password ){
    res.status(500).json({message:"enter the required fields"});
   }
    const hashpass=await bcrypt.hash(password,12);

    const user= await User.create({
        first_name:first_name,
        last_name:last_name,
        email:email,
        password:hashpass,
        verified:verified
    });
    const payload={
        id:user.id,
        email:user.email
    }
    
    const token=jwt.sign(payload,process.env.secretkey,{expiresIn:'10m'});
    const url = `http://localhost:2000/postreset/${token}`
    var mailOptions={
        from:' s12348946@gmail.com',
        to:email,
        subject:'reset link',
        html: "<h3>OTP for account verification is </h3>"  + "<h1 style='font-weight:bold;'>" + otp +"</h1>"+ url
       
    }
    transpoter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log(error);
        }
     } );

    res.status(201).json({success:'ok',message:'sent link into email',data:user,token:token});
   } catch (error) {
    console.log(error);
   }
};
exports.userlogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({where: {email:email}});
        console.log(user)
        if(!user){
            res.status(400).json({message:"Invalid email Credential"});
            return;
        }

        const payload = {
            email: user.email,
            id: user.id
        }

        const token = jwt.sign(payload, process.env.secretkey, { expiresIn: '15m' });
        console.log(token)
        const url = `http://localhost:2000/postreset/${token}`
        if (user.verified == '0') {

            var mailOptions = {
                from: ' s12348946@gmail.com',
                to: email,
                subject: 'reset link',
                html: "<h3>OTP for account verification is </h3>"  + "<h1 style='font-weight:bold;'>" + otp +"</h1>"+url
            }
             
            transpoter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.log(error);
                }
    
            })
            console.log(user);
        

            return res.status(200).json({ status: "ok", msg: "sent email to verify your account" });

        }


        const isMatch = await bcrypt.compare(password,user.password);
        console.log(isMatch);
            if(!isMatch){
                res.status(400).json({message:'Invalid Credential'});
                return;
            }
            res.status(200).json({success:"ok",msg:"login Successful",data:user,token:token});

    } catch (error) {
        console.log(e);
        res.send(400).json({error});

    }
}

exports.postreset=async (req,res,next)=>{
    try{

        const token = req.body.token;
       
        console.log(otp);
                const verifyUser = jwt.verify(token, process.env.secretkey);
        
                const { id } = verifyUser;
        
                const user = await User.findOne({ where: { id: id } });
                if (!user) {
                    res.status(200).json({ msg: "User does not exist" });
                }
           if(req.body.otp===otp){
                await User.update({
                      verified: 1
        },
            {
                where: { id: id }
            });
            
           return res.status(200).json({ msg: "Email verified Succesfully" });
    }
    res.status(200).json({ msg: "Please fill right otp" });
    }catch (error) {
        console.log(error)
        res.status(400).json({ msg: "Email not verified Succesfully" });
    }
}




exports.getreset = async (req, res, next) => {

  
    try {

    
        const token = req.params.token;
        const verifyuser = jwt.verify(token, process.env.secretkey);
        const { id } = verifyuser;
        const user = await User.findOne({ whrer: { id: id } });
        if (!user) {
            res.status(500).json({ message: "invalid user" });
            return;
        }

        res.render('createpass',{ token });


    } catch (error) {
        console.log(error);
        res.status(400).json({ message: error });
    }



}

// //  '<p>Click <a href="http://localhost:2000/verify/${token}">here</a> to reset your password</p>'