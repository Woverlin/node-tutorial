import Redis from "ioredis";

const connectRedis = async () => {
    const client = new Redis({
        host: "localhost",
        port: 6379,
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
