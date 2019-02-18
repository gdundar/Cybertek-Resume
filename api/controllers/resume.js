var mongoose = require('mongoose');
var async = require('async');

const upload = require('../util/s3server');
var Resume = mongoose.model('Resume');
var User = mongoose.model('User');

const singleUpload = upload.single('file');
module.exports.uploadFile = function (req, res) {
    const role = req.query.role;
    console.log(req.query.fileType);
    console.log(req.query.role);
    console.log("ID: "+req.payload._id);
    console.log("Uploading file..");
    // Get current date in milliseconds(since midnight, 1 Jan 1970)
    var date = new Date().getTime();
    // console.log(date.toLocaleDateString("en-US"));
    console.log(date);
    if (!req.payload._id) {
        res.status(401).json({
            "message": "UnauthorizedError: private profile"
        });
    } else {
        async.waterfall([
            function getResumeURL(urlCallback) {
                singleUpload(req, res, function (err, some) {
                    if (err) {
                        console.log(err);
                        return res.status(422).send({errors: [{title: 'File Upload Error', detail: err.message}]});
                    }
                    //  return res.json({'fileUrl': req.file.location});
                    console.log(req.file.location);
                    urlCallback(null, req.file.location);
                });
            },
            function assignUrlToResume(url, availableCallback) {
                let resume = new Resume();
               // resume.submitted_date = date.toLocaleDateString("en-US");
                resume.submitted_date = date;
                if(req.query.resumeId !== 'undefined'){
                    Resume.findById(req.query.resumeId, function(err, resume){
                        if(err){
                            console.log("Error during updating Resume data"+err.toString());
                            res.status(500).json({
                                "message": "Error during the updating Resume"
                            });
                        }else{
                            if(role === 'student'){
                                resume.student_resume = url;
                            }else{
                                resume.cybertek_resume = url;
                                resume.status = 'completed';
                            }

                            resume.save(function(err,resume){
                                if(err){
                                    console.log("Error during updating Resume data"+err.toString());
                                    res.status(500).json({
                                        "message": "Error during the updating Resume"
                                    });
                                }else{
                                    console.log("updated!");
                                    res.status(202).send(resume);
                                }
                            });

                        }

                    });
                }else{
                   // resume.user = req.payload._id;
                    resume.student_resume = url;
                    resume.status = 'submitted';

                    resume.save(function (err,resume) {
                        if (err) {
                            console.log("Error during saving Resume data"+err.toString());
                            res.status(500).json({
                                "message": "Error during the saving Resume"
                            });
                        } else {
                            User.findById(req.payload._id, function (err, user) {
                                if (err) {
                                    console.log("Error during getting user data");
                                    res.status(500).json({
                                        "message": "Error during getting user data"
                                    });
                                } else {
                                    user.resume = resume._id;
                                    user.save(function(err){
                                        if(err){
                                            console.log("Error during saving user data");
                                            res.status(500).json({
                                                "message": "Error during saving user data"
                                            });
                                        }else{
                                            console.log("user data updated!"+user);
                                            res.status(202).send(resume);
                                        }
                                    });
                                }
                            });
                        }
                    });
                }
              }
        ], function (error) {
            if (error) {
                //handle readFile error or processFile error here
                console.log("Error occure");
            }
        });
    }
}

module.exports.updateResume = function (req, res) {
    if (!req.payload._id) {
        console.log("Unauthorized");
        res.status(401).json({
            "message" : "UnauthorizedError: private profile"
        });
    }else{
        const resumeId = req.body._id;
        Resume.findById(resumeId, function(err, resumeDb){
            if(err){
                console.log("Error finding resume data"+err);
                res.status(500).json({
                    "message": "Error finding resume data"
                });
            }else{
                resumeDb.student_resume = req.body.student_resume;
                resumeDb.cybertek_resume = req.body.cybertek_resume;
                resumeDb.status = req.body.status;
                resumeDb.student_comments = req.body.student_comments;
                resumeDb.admin_coments = req.body.admin_coments;
                resumeDb.submitted_date = req.body.submitted_date;
                resumeDb.save(function(err,resume){
                    if(err){
                        console.log("Error saving resume data"+err);
                        res.status(500).json({
                            "message": "Error saving resume data"
                        });
                    }else{
                        console.log('Resume Updated!');
                        console.log(resume);
                        res.status(202).send(resume);
                    }
                });
            }
        });




    }
}