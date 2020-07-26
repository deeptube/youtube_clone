const express = require('express');
const router = express.Router();
//const { Video } = require("../models/Video");
const {auth} = require("../middleware/auth");
const multer = require("multer")

var ffmpeg = require('fluent-ffmpeg');

let storage = multer.diskStorage({
    destination: (req, file, cb) => {       //ddestination 어디에 저장하까 ?그거
        cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}_${file.originalname}`)
    },
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname)
        if (ext !== '.mp4') {  //png 하고싶으면 && ext!=='.png' 이런형식
            return cb(res.status(400).end('only mp4 is allowed'), false)
        }
        cb(null, true)
    }
})
const upload = multer({storage: storage}).single("file")//파일은한개만


//=================================
//             Video
//=================================


// router.post('/api/video/uplaodfiles') index에갔다가 오는거기떄문에
router.post("/uploadfiles", (req, res) => { //이거만해도됨
//req 통해파일받음
    //클라이언트에 서받은 비디오 서버 저장
    upload(req, res, err => {
        if (err) {
            return res.json({success: false, err})
        }
        return res.json({success: true, filePath: res.req.file.path, fileName: res.req.file.filename})
    })
})


/////
//썸네일관련
////

router.post("/thumbnail", (req, res) => { //이거만해도됨
//썸네일 생성 비디오 러닝타임 가져옴
    let filePath = ""
    let fileDuration = ""


//비디오 정보 가져오기

    ffmpeg.ffprobe(req.body.url, function (err, metadata) {
        console.dir(metadata);
        console.log(metadata.format.duration);
        fileDuration = metadata.format.duration;
    })


    //T썸네일생성성
    ffmpeg(req.body.url)//쿨라이언트에서온 비디오 경로
        .on('filenames', function (filenames) {
            console.log('Will generate ' + filenames.join(', '))
            console.log(filenames)
            filePath = "uploads/thumbnails/" + filenames[0];
        })

        .on('end', function () {  //썸네일생성하고 머할건지
            console.log("screenshot takenn");
            return res.json({
                success: true,
                url: filePath,
                fileDuration: fileDuration
            })
        })


        .on('error', function (err) {
            console.error(err)
            return res.json({success: false, err});

        })
        .screenshot({   //

            count: 3,
            folder: 'uploads/thumbnails',   //저장경로
            size: '320*240',
            filename: 'thumbnail-%b.png' //b 원래이름익스텐션 뺴고
        })


});


module.exports = router;