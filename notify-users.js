const fs = require("fs");
const yaml = require("js-yaml");
const maps = require("@googlemaps/google-maps-services-js");
const nodemailer = require("nodemailer")

const distanceToLocation = (config, location) => {
	// let response = maps.distancematrix({
    // 	params: {
    //   		origin_addresses: "Newton, MA",  // TODO per person
    //   		destination_addresses: [location],
    //   		key: config.GOOGLE_MAPS_API_KEY
    // 	},
    // 	timeout: 1000 // milliseconds
  	// });
	// return response.distance.value;
	return 0;
}

const notifyUsers = async (responseJSON) => {
	let configFile = fs.readFileSync('./notify-config.yaml', 'utf8');
    let config = yaml.load(configFile);
	console.log(config);

	const twilio = require('twilio')(config.TwilioAccountSID, config.TwilioAuthToken);
	// let message = await twilio.messages.create({
	// 		body: 'This is the ship that made the Kessel Run in fourteen parsecs?',
	// 		from: config.TwilioPhoneNumber,
	// 		to: config.TestPhoneNumber
	// 	});
	// console.log(message.sid);

	let sites = [];
	for (let site of responseJSON.results) {
		if (site.hasAvailability && site.signUpLink != null) {
			// console.log(site);
			if (site.restrictions != null) {
				console.log(`Skipping ${site.name} due to restrictions: ${site.restrictions}`);
			} else {
				let nAppts = Object.values(site.availability).reduce(
					(t, {numberAvailableAppointments}) => t + numberAvailableAppointments, 0);
				if (nAppts >= config.MinAppointments) {
					sites.push({
						name: site.name,
						appointments: nAppts,
						signUpLink: site.signUpLink,
						location: `${site.street} ${site.city}, MA ${site.zip}`
					});
				}
			}
		}
	}
	if (sites.length > 0 && config.MaxDistance > 0) {
		let close_sites = [];
		let maxDistance = config.MaxDistance * 1609.34;
		for (site of sites) {
			// TODO make this parallel rather than sequential
			let distance = await distanceToLocation(config, site.location);
			if (distance <= maxDistance)
				close_sites.push(site);
		}
		sites = close_sites
	}
	if (sites.length === 0) {
		console.log(`No sites with at least ${config.MinAppointments} appointments`);
	} else {
		let message_text = `${config.MessagePrefix}Appointments available: `;
		message_text += sites.map(site => `${site.name} (${site.appointments}) ${site.signUpLink}`).join(", ");
		// for (let to_number of config.PhoneNumbers) {
		// 	await twilio.messages.create({
		// 		body: message_text,
		// 		from: config.TwilioPhoneNumber,
		// 		to: to_number
		// 	});
		// }
		let transport = nodemailer.createTransport({
			host: "localhost",
			port: 25,
		});
		message_text = sites.map(site => `<li>${site.name} (${site.appointments}) ${site.signUpLink}</li>`).join("\n");
		let html_message = `<p>${config.MessagePrefix}Appointments available:\n<ul>\n${message_text}\n</ul>\n` +
			"<p>This is an automated message.";
		for (let rec of config.EmailAddrList) {
			let message = {
				from: `Dan Wyschogrod <${config.SenderEmail}>`,
				to: rec,
				subject: "New Vaccine Appointments",
				html: html_message
			}
			let response = await transport.sendMail(message);
			console.log(response)
		}
	}
};

exports.notifyUsers = notifyUsers;

if (require.main === module) {
    (async () => {
		let responseJSON = JSON.parse(fs.readFileSync(process.env.OUT_JSON || "out.json"))
        await notifyUsers(responseJSON);
        process.exit();
    })();
}
