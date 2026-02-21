const express = require("express");
const {
  getLatestLiveMessage,
  subscribeToTopic,
  isTopicSubscribed,
  unsubscribeFromTopic,
  updateThresholds,
} = require("../middlewares/mqttHandler");
const MessagesModel = require("../models/messages-model");
const AllTopicsModel = require("../models/all-mqtt-messages");
const TopicsModel = require("../models/topics-model");
const moment = require("moment-timezone");
const SubscribedTopic = require("../models/subscribed-topic-model");
const { stringify } = require("csv-stringify");
const redis = require("redis");

const redisClient = redis.createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
  socket: {
    reconnectStrategy: (retries) => Math.min(retries * 50, 1000),
  },
});

let redisConnected = false;

// Connect to Redis with status tracking
redisClient
  .connect()
  .then(() => {
    redisConnected = true;
    console.log("Connected to Redis");
  })
  .catch((err) => console.error("Redis connection failed:", err));

redisClient.on("error", (err) => {
  redisConnected = false;
  console.error("Redis Client Error:", err);
});

redisClient.on("reconnecting", () => console.log("Reconnecting to Redis..."));
redisClient.on("ready", () => {
  redisConnected = true;
  console.log("Redis Client Ready");
});

// Redis key prefix and TTLs
const CACHE_PREFIX = "mqtt:";
const TTL_SHORT = 300; // 5 minutes
const TTL_MEDIUM = 1800; // 30 minutes
const TTL_LONG = 3600; // 1 hour

const predictionModels = new Map();

const router = express.Router();

// Helper function to safely interact with Redis
const safeRedisGet = async (key) => {
  if (!redisConnected) return null;
  try {
    return await redisClient.get(key);
  } catch (err) {
    console.error(`Redis get error for key ${key}:`, err);
    return null;
  }
};

const safeRedisSet = async (key, value, ttl) => {
  if (!redisConnected) return;
  try {
    await redisClient.setEx(key, ttl, JSON.stringify(value));
  } catch (err) {
    console.error(`Redis set error for key ${key}:`, err);
  }
};

const safeRedisDel = async (key) => {
  if (!redisConnected) return;
  try {
    await redisClient.del(key);
  } catch (err) {
    console.error(`Redis del error for key ${key}:`, err);
  }
};

const fetchMessages = async (topic, fileIds = [], filter = {}) => {
  const cacheKey = `${CACHE_PREFIX}messages:${topic}:${JSON.stringify(filter)}`;
  const cachedData = await safeRedisGet(cacheKey);

  if (cachedData) {
    return JSON.parse(cachedData);
  }

  const query = { topic };
  if (filter.from) query.timestamp = { $gte: filter.from };
  if (filter.to) query.timestamp = { ...query.timestamp, $lte: filter.to };

  const messages = await MessagesModel.find(query)
    .sort({ timestamp: -1 })
    .lean();

  const result = messages.map((msg) => ({
    timestamp: msg.timestamp.toISOString(),
    message: msg.message,
  }));

  await safeRedisSet(cacheKey, result, TTL_SHORT);
  return result;
};

router.get("/all-topics-labels", async (req, res) => {
  try {
    const cacheKey = `${CACHE_PREFIX}all-topics-labels`;
    const cachedData = await safeRedisGet(cacheKey);

    if (cachedData) {
      return res.status(200).json(JSON.parse(cachedData));
    }

    const topics = await TopicsModel.find({}).lean();
    const response = { success: true, data: topics };

    await safeRedisSet(cacheKey, response, TTL_LONG);
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
