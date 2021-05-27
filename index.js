require("dotenv").config();
var mqtt = require("mqtt");

const winston = require("winston");

require("winston-daily-rotate-file");

var transport = new winston.transports.DailyRotateFile({
  filename: "ha-mqtt-%DATE%.log",
  datePattern: "YYYY-MM-DD-HH",
  zippedArchive: false,
  maxSize: "5m",
  maxFiles: "1d",
});

const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  defaultMeta: { service: "user-service" },
  transports: [
    //
    // - Write all logs with level `error` and below to `error.log`
    // - Write all logs with level `info` and below to `combined.log`
    //
    //     new winston.transports.File({ filename: 'error.log', level: 'error' }),
    //    new winston.transports.File({ filename: 'combined.log' }),
    transport,
  ],
});

logger.add(
  new winston.transports.Console({
    format: winston.format.simple(),
  })
);

var url = process.env.HA_URL;

var recieveTopic = process.env.COMMAND_TOPIC;

var stateTopic = process.env.STATE_TOPIC;

var options = {
  clientId: process.env.MQTT_CLIENT_ID,
  username: process.env.MQTT_USERNAME,
  password: process.env.MQTT_PASSWORD,
};

var client = mqtt.connect(url, options);

client.on("connect", function () {
  logger.info("connected  " + client.connected);
});

client.on("disconnect", function () {
  logger.info("disconnected  " + client.connected);
});

client.subscribe(recieveTopic);

client.on("message", function (recieveTopic, message, packet) {
  if (message.toString() === "ON") {
    logger.info("message is " + message);
    logger.info("topic is " + recieveTopic);
    var spawn = require("child_process").spawn;
    spawn("vcgencmd", ["display_power", "1"]);
    client.publish(stateTopic, message);
    logger.info("turned on");
  } else {
    logger.info("message is " + message);
    logger.info("topic is " + recieveTopic);

    var spawn = require("child_process").spawn;
    spawn("vcgencmd", ["display_power", "0"]);
    client.publish(stateTopic, message);
    logger.info("turned off");
  }
});
