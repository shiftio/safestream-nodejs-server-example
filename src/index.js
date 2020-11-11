var http = require("http");
var url = require("url")
var SafeStream = require("@safestream/safestream-javascript-sdk").SafeStream

//
// Step 1:
//
// Initialize SafeStream
//
// You can find you API credentials by logging into your SafeStream account 
// at https:/admin.safestream.com and going to the "Manage API Keys" section
//
const safeStream = SafeStream({
    auth: {
        //
        // Keep these keys secret and safe. We recommend using environment variables and accessing 
        // the keys via `process.env`. However, for simplicity sake in this example, we've hard coded them.
        //
        apiKey: "<PASTE YOUR API KEY HERE>",
        apiSecret: "<PASTE YOUR API SECRET HERE>"
    }
});

//
// Step 2:
//
// Get the current logged in user
//
// In order to dynamically create a watermark for the current viewer we need to 
// identify who the viewer is. You should have your own authentication implementation. 
// However, for this examples sake we've hardcoded a user. It's important that the 
// users identity is managed server side because in the browser it's unsafe to send 
// the user information directly to SafeStream since the viewer could possibly intercept 
// the browser request and modify it.
//
const getCurrentLoggedInUser = () => {
    return {
        name: "Karol Fritz",
        email: "karol@karolfritz.com"
    }
}

//
// Step 3 (Optional):
//
// Get the IP of the user
//
// This is an optional step. If you'd like to add the IP address of the viewer to the 
// watermark you should read it from the incoming requests.
//
const getClientIP = (req) => {
    return req.headers['x-forwarded-for'] || 
    req.connection.remoteAddress || 
    req.socket.remoteAddress ||
    (req.connection.socket ? req.connection.socket.remoteAddress : null);
}

//
// Step 4:
//
// Create an endpoint that returns the watermarked video stream
//
http.createServer(function(req, res) {

    // Get the information that we want to watermark the stream with
    const user = getCurrentLoggedInUser()
    const clientIP = getClientIP(req)

    // Get the SafeStream video ID and template ID from the incoming requests query parameters. 
    // You don't have to do it this way. You could hardcode the video ID and temaplte ID or 
    // choose to look them up using the SafeStream SDK functions (`getVideos()` and `getTemplates()`)
    const queryObject = url.parse(req.url,true).query;
    const videoId = queryObject.videoId
    const templateId = queryObject.templateId

    // Get the video stream from SafeStream
    safeStream.getStream(
        videoId,
        templateId,
        // These fields (UserData1 - 3) are fields in the watermark template that we'll need to 
        // populate with the viewers information
        {
            UserData1: user.name,
            UserData2: user.email,
            UserData3: clientIP
        }
    )
    .then(stream => {
        res.write(JSON.stringify(stream)); //write a response to the client
        res.end();
    });
})
.listen(8080);
