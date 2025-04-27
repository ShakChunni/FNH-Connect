import { ServerClient } from "postmark";

const postmarkApiToken = process.env.POSTMARK_API_TOKEN;
if (!postmarkApiToken) {
  throw new Error("POSTMARK_API_TOKEN is not defined");
}
const client = new ServerClient(postmarkApiToken);

export const sendDeleteNotification = async (
  log: any,
  deletedData: any,
  deleteReason: string
) => {
  const deletedAt = new Date();
  deletedAt.setHours(deletedAt.getHours());

  const idPrefix = log.source_table.toUpperCase() === "MI" ? "TMI" : "MV";
  const organizationPrefix =
    log.source_table.toUpperCase() === "MI" ? "TMI" : "MAVN";
  const formattedId = `${idPrefix}-${log.source_id}`;

  const emailSubject = `${
    log.username.charAt(0).toUpperCase() + log.username.slice(1)
  } deleted a lead from ${organizationPrefix}`;

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
      .content {
        background-color: #ffffff;
        padding: 28px 32px;
        border-radius: 6px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        margin-bottom: 2px;
      }
      .content p {
        color: #666666; 
        text-align: center;
        font-weight: 400;
        font-size: 14px;
        margin: 0 0 15px;
        line-height: 1.5;
      }
      .content strong {
        color: #333333;  
        font-weight: bold;
      }
      .content td:last-child {
        color: #666666;
      }
      .content span {
        color: #ff6f61;
        font-weight: bold;
      }
      .content table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 15px;
      }
      .content td {
        padding: 10px;
        border-bottom: 1px solid #e0e0e0;
        font-size: 14px;
      }
      .content td:first-child {
        color: #666666;
      }
      .content td:last-child {
        color: #333333;
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
        border-radius: 20px;
      }
      .bold {
        font-weight: 600;
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
          <h2>Security Alert</h2>
        </div>
        <div class="content">
          <p>
            ${log.username.charAt(0).toUpperCase() + log.username.slice(1)} 
            <span>DELETED</span> a lead from 
            ${organizationPrefix}:
          </p>
          <table>
            <tr>
              <td>ID</td>
              <td>${formattedId}</td>
            </tr>
            <tr>
              <td>Client Name</td>
              <td>${deletedData.client_name}</td>
            </tr>
            ${
              deletedData.total_proposal_value
                ? `
            <tr>
              <td>Total Proposal Value</td>
              <td><strong>RM${deletedData.total_proposal_value}</td></strong>
            </tr>`
                : ""
            }
            ${
              deletedData.total_closed_sale
                ? `
            <tr>
              <td>Total Closed Sale</td>
              <td><strong>RM${deletedData.total_closed_sale}</strong></td>
            </tr>`
                : ""
            }
            <tr>
              <td>Lead PIC</td>
              <td>${deletedData.PIC}</td>
            </tr>
            <tr>
              <td>Deleted By</td>
              <td>${log.username}</td>
            </tr>
            <tr>
              <td>Time</td>
              <td>${deletedAt
                .toLocaleString("en-GB", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "numeric", // Changed from "2-digit" to "numeric"
                  minute: "2-digit",
                  hour12: true,
                  timeZone: "Asia/Kuala_Lumpur",
                })
                .replace(/(\d+):(\d+) (pm|am)/i, (_, h, m, meridiem) => {
                  // Convert hour to proper 12-hour format
                  let hour = parseInt(h);
                  if (hour === 0) hour = 12; // Convert midnight 00 to 12 AM
                  if (hour > 12) hour = hour - 12; // Convert afternoon hours
                  return `${hour}:${m} ${meridiem.toUpperCase()}`;
                })}</td>
            </tr>
            <tr>
              <td>Reason</td>
              <td>${
                deleteReason && deleteReason.trim() !== ""
                  ? deleteReason.charAt(0).toUpperCase() + deleteReason.slice(1)
                  : "No reason provided"
              }</td>
            </tr>

          </table>
        </div>
        <div class="button">
          <a href="https://sales.movingimage.my/admin/activity-logs" target="_blank">
            Open Activity Log
          </a>
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
      To: "hello@movingimage.my, tanvir@movingimage.my, ashfaq@wisecodetech.com",
      Subject: emailSubject,
      HtmlBody: emailBody,
      MessageStream: "outbound",
    });
    console.log("Email sent successfully");
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

export const sendInactiveNotification = async (
  log: any,
  inactiveData: any,
  inactiveReason: string
) => {
  const inactiveAt = new Date();
  inactiveAt.setHours(inactiveAt.getHours());

  const idPrefix = log.source_table.toUpperCase() === "MI" ? "TMI" : "MV";
  const organizationPrefix =
    log.source_table.toUpperCase() === "MI" ? "TMI" : "MAVN";
  const formattedId = `${idPrefix}-${log.source_id}`;

  const emailSubject = `${
    log.username.charAt(0).toUpperCase() + log.username.slice(1)
  } marked a lead as inactive from ${organizationPrefix}`;

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
      .content {
        background-color: #ffffff;
        padding: 28px 32px;
        border-radius: 6px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        margin-bottom: 2px;
      }
      .content p {
        color: #666666; 
        text-align: center;
        font-weight: 400;
        font-size: 14px;
        margin: 0 0 15px;
        line-height: 1.5;
      }
      .content strong {
        color: #333333;  
        font-weight: bold;
      }
      .content td:last-child {
        color: #666666;
      }
      .content span {
        color: #ff6f61;
        font-weight: bold;
      }
      .content table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 15px;
      }
      .content td {
        padding: 10px;
        border-bottom: 1px solid #e0e0e0;
        font-size: 14px;
      }
      .content td:first-child {
        color: #666666;
      }
      .content td:last-child {
        color: #333333;
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
        border-radius: 4px;
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
        border-radius: 20px;
      }
      .bold {
        font-weight: 600;
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
          <h2>Security Alert</h2>
        </div>
        <div class="content">
          <p>
            ${log.username.charAt(0).toUpperCase() + log.username.slice(1)} 
            marked a lead from ${organizationPrefix} as <span>INACTIVE</span>:
          </p>
          <table>
            <tr>
              <td>ID</td>
              <td>${formattedId}</td>
            </tr>
            <tr>
              <td>Client Name</td>
              <td>${inactiveData.client_name}</td>
            </tr>
            ${
              inactiveData.total_proposal_value
                ? `
            <tr>
              <td>Total Proposal Value</td>
              <td><strong>RM${inactiveData.total_proposal_value}</td></strong>
            </tr>`
                : ""
            }
            ${
              inactiveData.total_closed_sale
                ? `
            <tr>
              <td>Total Closed Sale</td>
              <td><strong>RM${inactiveData.total_closed_sale}</strong></td>
            </tr>`
                : ""
            }
            <tr>
              <td>Lead PIC</td>
              <td>${inactiveData.PIC}</td>
            </tr>
            <tr>
              <td>Actioned By</td>
              <td>${log.username}</td>
            </tr>
            <tr>
              <td>Time</td>
              <td>${inactiveAt
                .toLocaleString("en-GB", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "numeric", // Changed from "2-digit" to "numeric"
                  minute: "2-digit",
                  hour12: true,
                  timeZone: "Asia/Kuala_Lumpur",
                })
                .replace(/(\d+):(\d+) (pm|am)/i, (_, h, m, meridiem) => {
                  // Convert hour to proper 12-hour format
                  let hour = parseInt(h);
                  if (hour === 0) hour = 12; // Convert midnight 00 to 12 AM
                  if (hour > 12) hour = hour - 12; // Convert afternoon hours
                  return `${hour}:${m} ${meridiem.toUpperCase()}`;
                })}</td>
            </tr>
            <tr>
              <td>Reason</td>
              <td>${
                inactiveReason && inactiveReason.trim() !== ""
                  ? inactiveReason.charAt(0).toUpperCase() +
                    inactiveReason.slice(1)
                  : "No reason provided"
              }</td>
            </tr>

          </table>
        </div>
        <div class="button">
          <a href="https://sales.movingimage.my/admin/activity-logs" target="_blank">
            Open Activity Log
          </a>
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
      To: "hello@movingimage.my,tanvir@movingimage.my,ashfaq@wisecodetech.com",
      Subject: emailSubject,
      HtmlBody: emailBody,
      MessageStream: "outbound",
    });
    console.log("Email sent successfully");
  } catch (error) {
    console.error("Error sending email:", error);
  }
};
