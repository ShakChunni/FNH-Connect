import { ServerClient } from "postmark";

const postmarkApiToken = process.env.POSTMARK_API_TOKEN;
if (!postmarkApiToken) {
  throw new Error("POSTMARK_API_TOKEN is not defined");
}
const client = new ServerClient(postmarkApiToken);

interface User {
  id: number;
  username: string;
  fullName?: string | null;
  email?: string | null;
}

export const sendGoalTrackingReminder = async (
  user: User,
  ccRecipients: string[] = []
) => {
  // Check if user has an email
  if (!user.email) {
    console.error(
      `[Goal Tracking Error] Cannot send email - user ${user.username} has no email address`
    );
    return false;
  }

  // Use full name if available, otherwise use username
  const employeeName = user.fullName || user.username;
  const capitalizedName =
    employeeName.charAt(0).toUpperCase() + employeeName.slice(1);

  // Format today's date as DD/MM/YYYY
  const today = new Date();
  const day = String(today.getDate()).padStart(2, "0");
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const year = today.getFullYear();
  const formattedDate = `${day}/${month}/${year}`;

  // Format date for subject line (Month Day, Year)
  const options: Intl.DateTimeFormatOptions = {
    month: "long",
    day: "numeric",
    year: "numeric",
  };
  const subjectDate = today.toLocaleDateString("en-US", options);

  const emailSubject = `⚠ Action Required: Update Your Goal Dashboard for ${subjectDate}`;

  const emailBody = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      body {
        font-family: Arial, sans-serif;
        background-color: #E3E6EB;
        margin: 0;
        padding: 0;
      }
      .container {
        max-width: 600px;
        margin: 0 auto;
        background-color: #fff;
        padding: 8px;
        border-radius: 16px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }
      .header {
        text-align: center;
        background-color: #E3E6EB;
        margin-top: 30px;
        margin-bottom: 30px;
        max-width: 600px;
        margin-left: auto;
        margin-right: auto;
      }
      .header img {
        width: 150px;
        height: auto;
        display: block; 
        margin-left: auto;
        margin-right: auto;
      }
      .alert {
        text-align: center;
        margin-bottom: 5px;
        background-color: #ffffff;
        padding: 8px;
        border-radius: 6px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
      }
      .alert img {
        width: 54px;
        height: 54px;
        margin-top: 10px;
        margin-bottom: 10px;
      }
      .alert h2 {
        color: #1e3a8a; /* blue-900 */
        font-size: 22px;
        margin: 0 0 10px 0;
      }
      .date {
        font-weight: 700;
        color: #4B5563;
        font-size: 16px;
        margin: 0 0 5px 0;
      }
      .divider {
        height: 1px;
        background-color: #E3E6EB;
        margin: 5px auto 15px auto;
        width: 90%;
      }
      .content {
        background-color: #ffffff;
        padding: 28px 32px;
        border-radius: 6px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        margin-bottom: 2px;
      }
      .content p {
        color: #666666; 
        font-weight: 400;
        font-size: 14px;
        margin: 0 0 15px;
        line-height: 1.5;
      }
      .button {
        text-align: center;
        margin: 22px 0;
      }
      .button a {
        display: inline-block;
        background-color: #1e3a8a; /* blue-900 */
        color: #ffffff;
        padding: 10px 20px;
        border-radius: 12px;
        text-decoration: none;
        font-size: 15px;
        font-weight: 500;
      }
      .button a:hover {
        background-color: #0f172a; /* darker blue */
      }
      .footer {
        text-align: center;
        font-size: 12px;
        color: #999999;
        margin-top: 20px;
        margin-bottom: 20px;
        background-color: #E3E6EB;
      }
      .grey-container {
        background-color: #E3E6EB;
        padding: 10px;
        border-radius: 16px;
      }
      .bold {
        font-weight: 600;
      }
      .it-team {
        font-weight: 700;
      }
    </style>
  </head>
  <body>
    <div class="grey-container">
      <div class="header">
        <img src="https://sales.movingimage.my/mi-logo-black.png" alt="Moving Image" />
      </div>
      <div class="container">
        <div class="alert">
          <img src="https://sales.movingimage.my/danger.png" alt="Warning" />
          <h2>Action Required: Update Your Goal Dashboard</h2>
          <div class="date">${formattedDate}</div>
          <div class="divider"></div>
        </div>
        <div class="content">
          <p>Dear ${capitalizedName},</p>
          
          <p>We noticed that you haven't logged any input in your Goal Dashboard today. To ensure accurate tracking of your progress, please update your dashboard with your <span class="bold">Daily Predefined Tasks</span> or any <span class="bold">Ad Hoc Tasks</span> you've completed.</p>
          
          <div class="button">
            <a href="https://sales.movingimage.my/goals" target="_blank">
              Update Dashboard Now
            </a>
          </div>

          <p>If you've already updated your dashboard but encountered any issues, please reach out to IT Team.</p>
          
          <p style="margin-bottom: 30px;"></p>

          <p>Best regards,<br><span class="it-team">IT Team</span></p>
        </div>
      </div>
      <div class="footer">
      © Moving Image. All rights reserved.     
      </div>
    </div>
  </body>
  </html>
  `;

  try {
    await client.sendEmail({
      From: "Sales Dashboard <sales@movingimage.my>",
      To: user.email,
      Cc: ccRecipients.join(","),
      Subject: emailSubject,
      HtmlBody: emailBody,
      MessageStream: "outbound",
    });
    console.log(
      `[Goal Tracking] Reminder email sent to ${user.username} (${user.email})`
    );
    return true;
  } catch (error) {
    console.error(
      `[Goal Tracking Error] Error sending reminder email to ${user.username}:`,
      error
    );
    return false;
  }
};
