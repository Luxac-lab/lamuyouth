const express = require("express");
const bodyParser = require("body-parser");
const request = require("request");
const https = require("https");
const cors = require("cors");
const nodemailer = require("nodemailer");
const multiparty = require("multiparty");
const { SitemapStream, streamToPromise } = require('sitemap');
const { createReadStream } = require('fs');
const { createGzip } = require('zlib');

app = express();

app.use(cors({ origin: "*" }));

app.use(express.static("public"));

app.use(bodyParser.urlencoded({ extended: true }));


// xml urls

const urls = [
    { url: '/', changefreq: 'weekly', priority: 0.8 },
    { url: '/events', changefreq: 'monthly', priority: 0.6 },
    { url: '/gallery', changefreq: 'monthly', priority: 0.6 },
    { url: '/team', changefreq: 'monthly', priority: 0.6 },
    { url: '/sponsors', changefreq: 'monthly', priority: 0.6 },
    { url: '/resources', changefreq: 'monthly', priority: 0.6 },
];

// end xml urls

// node code for xml
app.get('/sitemap.xml', async (req, res) => {
    try {
        res.header('Content-Type', 'application/xml');
        res.header('Content-Encoding', 'gzip');
        const smStream = new SitemapStream({ hostname: 'https://lamuyouthalliance.org' });
        const pipeline = smStream.pipe(createGzip());

        urls.forEach((url) => {
            smStream.write(url);
        });

        smStream.end();

        pipeline.pipe(res).on('error', (e) => {
            throw e;
        });
    } catch (e) {
        res.status(500).end();
    }
});

// xml code ends

//***************************************************************Send Forms START**********************************************************\\

const transporter = nodemailer.createTransport({
    host: 'mail.lamuyouthalliance.org',
    port: 465,
    auth: {
        user: 'info@lamuyouthalliance.org',
        pass: 'Lamuyouthalliance@Kenya2030',
    },
});

// verify connection configuration
transporter.verify(function (error, success) {
    if (error) {
        console.log(error);
    } else {
        console.log("Contact form is ready");
    }
});

app.post("/send", (req, res) => {
    let form = new multiparty.Form();
    let data = {};
    form.parse(req, function (err, fields) {
        Object.keys(fields).forEach(function (property) {
            data[property] = fields[property].toString();
        });
        const mail = {
            sender: `${data.name} <${data.email}>`,
            to: 'info@lamuyouthalliance.org', // receiver email,
            subject: data.subject,
            text: `${data.name} <${data.email}> \n${data.message}`,
        };
        transporter.sendMail(mail, (err, data) => {
            if (err) {
                console.log(err);
                res.status(500).send("Something went wrong.");
            } else {
                res.sendFile(__dirname + "/successcont.html");
            }
        });
    });
});

//***************************************************************Send Forms END**********************************************************\\

app.get("/sitemap.xml", function (req, res) {
    res.sendFile(__dirname + "/sitemap.xml");
});

app.get("/", function (req, res) {
    res.sendFile(__dirname + "/index.html");
});

app.route("/contact").get(function (req, res) {
    res.sendFile(process.cwd() + "/contact.html");
});

app.get("/events", function (req, res) {
    res.sendFile(__dirname + "/events.html");
});

app.get("/gallery", function (req, res) {
    res.sendFile(__dirname + "/gallery.html");
});

app.get("/resources", function (req, res) {
    res.sendFile(__dirname + "/resource.html");
});

app.get("/sponsors", function (req, res) {
    res.sendFile(__dirname + "/sponsor.html");
});

app.get("/team", function (req, res) {
    res.sendFile(__dirname + "/team.html");
});

//***************************************************************MAILCHIMP SUBSCRIPTION START**********************************************************\\

app.post("/", function (req, res) {
    const email = req.body.emailsub;

    const data = {
        members: [
            {
                email_address: email,
                status: "subscribed"
            }
        ]
    };
    const jsonData = JSON.stringify(data);

    const url = "https://us9.api.mailchimp.com/3.0/lists/195b7a3b5e";

    const options = {
        method: "POST",
        auth: "luxac:3472ccc4ac5a46d86e381e52845e9463-us9"
    }

    const request = https.request(url, options, function (response) {

        if (response.statusCode === 200) {
            res.sendFile(__dirname + "/success.html");
        } else {
            res.sendFile(__dirname + "/failure.html");
        }

        response.on("data", function (data) {
            console.log(JSON.parse(data));
        })
    })

    request.write(jsonData);
    request.end();
});

//***************************************************************MAILCHIMP SUBSCRIPTION START**********************************************************\\

app.listen(3000, function (req, res) {
    console.log("Server is running on port 3000")
});