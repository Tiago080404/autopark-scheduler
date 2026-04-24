import aws4 from "aws4";
import dotenv from "dotenv";
import cron from "node-cron";

dotenv.config();
async function mainMeth(creds) {
  const startAndEndTimeStamp = unixTimeConvert();
  const body = JSON.stringify({
    bookingTimeslotId: process.env.BOOKING_TIME_SLOT_ID,
    endTimestamp: startAndEndTimeStamp.end,
    licensePlate: process.env.LICENSEPLATE,
    name: process.env.NAME,
    startTimestamp: startAndEndTimeStamp.start,
    user: process.env.PARK_USER_ID,
  });

  const opts = {
    host: "reservations.api.park-here.eu",
    path: "/v1/locations/1/reservations?charging=true",
    method: "POST",
    service: "execute-api",
    region: "eu-central-1",
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
      "ph-client-datetime": Date.now().toString(),
    },
    body: body,
  };

  aws4.sign(opts, {
    accessKeyId: creds.Credentials.AccessKeyId,
    secretAccessKey: creds.Credentials.SecretKey,
    sessionToken: creds.Credentials.SessionToken,
  });

  const response = await fetch(`https://${opts.host}${opts.path}`, {
    method: opts.method,
    headers: opts.headers,
    body: opts.body,
  });
  const data = await response.json();

  console.log(data);
}

async function getCognito(token) {
  const response = await fetch(
    "https://cognito-identity.eu-central-1.amazonaws.com/",
    {
      method: "POST",
      headers: {
        "content-type": "application/x-amz-json-1.1",
        "x-amz-target": "AWSCognitoIdentityService.GetCredentialsForIdentity",
      },
      body: JSON.stringify({
        IdentityId: process.env.IDENTITYID,
        Logins: {
          "cognito-idp.eu-central-1.amazonaws.com/eu-central-1_fiCD3BPci":
            token,
        },
      }),
    },
  );
  const data = await response.json();
  await mainMeth(data);
}
async function login(username, password) {
  const response = await fetch(
    "https://cognito-idp.eu-central-1.amazonaws.com/",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-amz-json-1.1",
        "X-Amz-Target": "AWSCognitoIdentityProviderService.InitiateAuth",
      },
      body: JSON.stringify({
        AuthFlow: "USER_PASSWORD_AUTH",
        ClientId: process.env.CLIENTID,
        AuthParameters: {
          USERNAME: username,
          PASSWORD: password,
        },
      }),
    },
  );
  const data = await response.json();
  console.log(data);
  await getCognito(data.AuthenticationResult.IdToken);
}

function unixTimeConvert() {
  let startEndTime = { start: null, end: null };
  const today = new Date().getDay();
  let weekend = [5, 6, 7];
  if (weekend.includes(today)) {
    const daysToAdd = 8 - today;
    const monday = new Date().getDate() + daysToAdd;
    console.log(monday);
    const bookMonday = new Date();
    bookMonday.setDate(monday);
    bookMonday.setHours(0, 0, 0, 0);
    startEndTime.start = bookMonday.getTime();
    const bookMondayEndTime = new Date();
    bookMondayEndTime.setDate(monday);
    bookMondayEndTime.setHours(23, 59, 59, 999);
    startEndTime.end = bookMondayEndTime;
  } else {
    const currentDate = new Date();
    const tomorrowDate = new Date(currentDate);
    tomorrowDate.setDate(currentDate.getDate() + 1);
    tomorrowDate.setHours(0, 0, 0, 0);
    console.log("tomooorowo", tomorrowDate.getTime());
    startEndTime.start = tomorrowDate.getTime();
    startEndTime.end = getTomorrowEndTime();
    console.log(startEndTime);
  }
  return startEndTime;
}

function getTomorrowEndTime() {
  const currentDate = new Date();
  const tomorrowDate = new Date(currentDate);
  tomorrowDate.setDate(currentDate.getDate() + 1);
  tomorrowDate.setHours(23, 59, 59, 999);
  return tomorrowDate.getTime();
}
cron.schedule("0 0 12 * * *", async () => {
  await login(process.env.USERMAIL, process.env.USERPASSWORD);
});
