import Redis from "ioredis";

const connectRedis = async () => {
  const client = new Redis({
    port: 6379, // Redis port
    host: "103.100.134.219", // Redis host
  });

  client.on("connect", () => {
    console.log("Connected to Redis");
  });

  client.on("error", (err) => {
    console.log("Redis error: ", err);
  });
  return client;
};

export default connectRedis;
