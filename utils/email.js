// const nodemailer = require('nodemailer');
// const pug = require('pug');
// const htmlToText = require('html-to-text');

// module.exports = class Email {
//     constructor(user, url) {
//         this.to = user.email;
//         this.url = url;
//         this.firstName = user.name.split(' ')[0];
//         this.from = `Ahmad Saeed Mirza <${process.env.EMAIL_FROM}>`;
//     }

//     newTransport() {
//         if (process.env.NODE_ENV === 'production') {
//             // sendgrind
//             return nodemailer.createTransport({
//                 service: 'SendGrid',
//                 auth: {
//                     user: process.env.SENDGRID_USERNAME,
//                     pass: process.env.SENDGRID_PASSWORD
//                 }
//             });
//         }

//         return nodemailer.createTransport({
//             host: process.env.EMAIL_HOST,
//             port: process.env.EMAIL_PORT,
//             auth: {
//                 user: process.env.EMAIL_USERNAME,
//                 pass: process.env.EMAIL_PASSWORD
//             }
//         });
//     }

//     async send(template, subject) {
//         // 1) RENDER HTML BASED ON A PUG TEMPLATE
//         const html = pug.renderFile(`${__dirname}/../views/emails/${template}.pug`, {
//             firstName: this.firstName,
//             url: this.url,
//             subject
//         });

//         // 2) DEFINE EMAIL OPTIONS
//         const mailOptions = {
//             from: this.from,
//             to: this.to,
//             subject,
//             html,
//             text: htmlToText.convert(html)
//         }

//         // 3) CREATE A TRANSPORT AND SEND EMAIL
//         await this.newTransport().sendMail(mailOptions);
//     }

//     async sendWelcome() {
//         await this.send('welcome', 'Welcome to Natours Family!');
//     }

//     async sendPasswordReset() {
//         await this.send('passwordReset', 'Your password reset token (valid for only 10 minutes)')
//     }
// }
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport(
    process.env.NODE_ENV === 'production'
        ? { // SendGrid
            service: 'SendGrid',
            auth: {
                user: process.env.SENDGRID_USERNAME,
                pass: process.env.SENDGRID_PASSWORD
            }
        }
        : { // Mailtrap
            host: "sandbox.smtp.mailtrap.io",
            port: process.env.EMAIL_PORT,
            auth: {
                user: process.env.EMAIL_USERNAME,
                pass: process.env.EMAIL_PASSWORD
            }
        }
);

module.exports = transporter;