const express = require('express');
const router = express.Router();
const {Video} = require("../models/Video");
const {auth} = require("../middleware/auth");
const multer = require("multer")

var ffmpeg = require("fluent-ffmpeg");

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
        return res.json({success: true, url: res.req.file.path, fileName: res.req.file.filename})
    })
})
///////////////////////////////////////////////////////////////////////////////

/////
//썸네일관련 오류
////
//
// router.post("/thumbmail", (req, res) => { //이거만해도됨
// //썸네일 생성 비디오 러닝타임 가져옴
//     let filePath = ""
//     let fileDuration ="";
//
//
// //비디오 정보 가져오기
//
//     ffmpeg.ffprobe(req.body.url, function (err, metadata) {
//         console.dir(metadata);
//         console.log(metadata.format.duration);
//         fileDuration = metadata.format.duration;
//     });
//
//
//     //썸네일생성성
//     ffmpeg(req.body.url)//쿨라이언트에서온 비디오 경로
//         .on('filenames', function (filenames) {  //v파일이름생성
//             console.log('Will generate ' + filenames.join(', '))
//             console.log(filenames)
//             filePath = "uploads/thumbnails/" + filenames[0];
//         })
//
//         .on('end', function () {  //썸네일생성하고 머할건지
//             console.log("screenshot takenn");
//             return res.json({
//                 success: true, url: filePath, fileDuration: fileDuration
//             });
//         })
//
//         .screenshots({   //
//             count: 3,
//             folder: 'uploads/thumbnails',   //저장경로
//             size: '320*240',
//             filename:'thumbnail-%b.png' //%b 원래이름익스텐션 뺴고
//         })
//
//         .on('error', function (err) {
//             console.error(err)
//             return res.json({success: false, err});
//
//         })
// });


router.post('/thumbnail', (req, res) => {
    let filePath = "";
    let fileDuration = ""

    //썸네일가져오기 썸네일정보를 가져올수있다.
    ffmpeg.ffprobe(req.body.url,function (err,metadata) {
        console.dir(metadata)
        console.log(metadata.format.duration)
        fileDuration=metadata.format.duration
    })

//
    //썸네일생성
    ffmpeg(req.body.url)
        .on('filenames', function (filenames) { //이게 video/thumbnail/filenames 를생성하는거
            console.log('Will generate' + filenames.join(', '))
            console.log(filenames)
            filePath = "uploads/thumbnails/" + filenames[0];
        })
        .on('end', function () {
            return res.json({success: true, url: filePath, fileDuration: fileDuration})
        })
        .on('error', function (err) {
            console.error(err)
            return res.json({success: false, err})
        })
        .screenshots({
            count: 3,
            folder: 'uploads/thumbnails',
            size: '320x240',
            filename: 'thumbnail-%b.png'
        })


})


///////////////////////////////////////////////////////////////////////////////


router.post("/uploadVideo", (req, res) => { //이거만해도됨

//비디오 정보들을 저장한다 몽고 db에 저장
// .
    const video = new Video(req.body) //클라이언트에서 보낸 모든 정보(유저)req.body에 담긴것

    //video.save()//몽고 db 메소드
    video.save((err, doc) => {
        if (err) return res.json({success: false, err})
        res.status(200).json({success: true})
    })
})


//랜딩창에 뜨게하는하는거

router.get('/getVideos', (req, res) => { //이거만해도됨
    //비디오를 db에서 가져와서 클라이언트에보냄
    Video.find() //모든비디오를가져옴 db에서
        .populate('writer')     //POPULATE을해줘야 모든 정보를가져올수있따 Video에서 Schema.Types.ObjectId,
        .exec((err, videos) => {
            if (err) return res.status(400).send(err);
            res.status(200).json({success: true, videos})
        })
})


//랟딩창에서 비디오눌렀을떄 나오게하는게

router.post('/getVideoDetail', (req, res) => { //이거만해도됨
    Video.findOne({"_id": req.body.videoId})  //클라이언트에서보낸 id로 db에서 찾겠다는의미
        .populate('writer') // 비디오 컬렉션에서 user의 모든정보를 가져오겠다는 의미
        .exec((err, videoDetail) => {  ///
            if (err) return res.status(400).send(err)
            return res.status(200).json({success: true, videoDetail})
        })

})


module.exports = router;
