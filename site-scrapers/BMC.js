// 2/22 TODO:
// I think this is working but I haven't been able to catch an appointment yet.
// There are 5 locations here that I need to figure out how to separate out.
const https = require("https");
const sites = require("../data/sites.json");
const mychart = require("../lib/MyChartAPI.js");

module.exports = async function GetAvailableAppointments() {
    console.log("BMC starting.");
    const webData = await ScrapeWebsiteData();
    console.log("BMC done.");
    return {
        ...sites.BMC,
        ...webData,
        timestamp: new Date(),
    };
};

async function ScrapeWebsiteData() {
    // We need to go through the flow and use a request verification token
    const [
        cookie,
        verificationToken,
    ] = await mychart.GetCookieAndVerificationToken(
        "https://mychartscheduling.bmc.org/mychartscheduling/SignupAndSchedule/EmbeddedSchedule?id=10033319,10033364,10033367,10033370,10033373&dept=10098245,10098242,10098243,10098244,10098241&vt=2008&lang=en-US"
    );

    // Setup the return object.
    //mychartscheduling.bmc.org/MyChartscheduling/OpenScheduling/OpenScheduling
    https: return mychart.AddFutureWeeks(
        "mychartscheduling.bmc.org",
        "/MyChartscheduling/OpenScheduling/OpenScheduling/GetOpeningsForProvider?noCache=0.4024598146273777",
        cookie,
        verificationToken,
        10,
        PostDataCallback
    );
}

/**
 * This is the callback function
 */
function PostDataCallback(startDateFormatted) {
    return `id=10033319%2C10033364%2C10033367%2C10033370%2C10033373&vt=2008&dept=10098245%2C10098242%2C10098243%2C10098244%2C10098241&view=grouped&start=${startDateFormatted}&filters=%7B%22Providers%22%3A%7B%2210033319%22%3Atrue%2C%2210033364%22%3Atrue%2C%2210033367%22%3Atrue%2C%2210033370%22%3Atrue%2C%2210033373%22%3Atrue%7D%2C%22Departments%22%3A%7B%2210098241%22%3Atrue%2C%2210098242%22%3Atrue%2C%2210098243%22%3Atrue%2C%2210098244%22%3Atrue%2C%2210098245%22%3Atrue%7D%2C%22DaysOfWeek%22%3A%7B%220%22%3Atrue%2C%221%22%3Atrue%2C%222%22%3Atrue%2C%223%22%3Atrue%2C%224%22%3Atrue%2C%225%22%3Atrue%2C%226%22%3Atrue%7D%2C%22TimesOfDay%22%3A%22both%22%7D`;
}
