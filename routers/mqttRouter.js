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

router.post("/get-single-topic-label", async (req, res) => {
  try {
    const { topic } = req.body;
    const cacheKey = `${CACHE_PREFIX}topic-label:${topic}`;
    const cachedData = await safeRedisGet(cacheKey);

    if (cachedData) {
      return res.status(200).json(JSON.parse(cachedData));
    }

    const label = await TopicsModel.find(
      { topic },
      { label: 1, _id: 0 },
    ).lean();
    const response = { success: true, data: label };

    await safeRedisSet(cacheKey, response, TTL_LONG);
    res.status(200).json(response);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.put("/topic-label-update/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { updatedLabel } = req.body;
    const topic = await TopicsModel.findById(id);
    topic.label = updatedLabel;
    await topic.save();

    await Promise.all([
      safeRedisDel(`${CACHE_PREFIX}all-topics-labels`),
      safeRedisDel(`${CACHE_PREFIX}topic-label:${topic.topic}`),
    ]);

    res.status(200).json({ success: true, data: [] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/subscribe", (req, res) => {
  const { topic } = req.body;
  if (!topic) {
    return res
      .status(400)
      .json({ success: false, message: "Topic is required" });
  }

  subscribeToTopic(topic);
  res.json({ success: true, message: `Subscribed to topic: ${topic}` });
});

router.post("/create-tagname", async (req, res) => {
  try {
    const { topic, device, label } = req.body;
    const cacheKey = `${CACHE_PREFIX}topic-exists:${topic}`;
    const cachedExists = await safeRedisGet(cacheKey);

    if (cachedExists === "true") {
      return res.status(400).json({
        success: false,
        message: "TagName already exists!",
      });
    }

    const existingTopic = await TopicsModel.findOne({ topic }).lean();
    if (existingTopic) {
      await safeRedisSet(cacheKey, "true", TTL_LONG);
      return res.status(400).json({
        success: false,
        message: "TagName already exists!",
      });
    }

    await TopicsModel.create({ topic, device, label });
    await safeRedisSet(cacheKey, "true", TTL_LONG);

    await Promise.all([
      safeRedisDel(`${CACHE_PREFIX}all-topics-labels`),
      safeRedisDel(`${CACHE_PREFIX}get-all-tagname`),
      safeRedisDel(`${CACHE_PREFIX}recent-5-tagname`),
    ]);

    res.status(201).json({ success: true, data: [] });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

router.get("/get-all-subscribedtopics", async (req, res) => {
  try {
    const cacheKey = `${CACHE_PREFIX}subscribed-topics`;
    const cachedData = await safeRedisGet(cacheKey);

    if (cachedData) {
      return res.status(200).json(JSON.parse(cachedData));
    }

    const subscribedTopicList = await SubscribedTopic.find(
      {},
      { _id: 0, topic: 1 },
    ).lean();
    const topics = subscribedTopicList.map((item) => item.topic);
    const response = { success: true, data: topics };

    await safeRedisSet(cacheKey, response, TTL_MEDIUM);
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

router.get("/get-all-tagname", async (req, res) => {
  try {
    const cacheKey = `${CACHE_PREFIX}get-all-tagname`;
    const cachedData = await safeRedisGet(cacheKey);

    if (cachedData) {
      return res.status(200).json(JSON.parse(cachedData));
    }

    const topics = await TopicsModel.find().select("topic -_id").lean();
    const topicsWithStatus = await Promise.all(
      topics.map(async (t) => {
        const countKey = `${CACHE_PREFIX}msg-count:${t.topic}`;
        let messageCount = await safeRedisGet(countKey);

        if (!messageCount) {
          messageCount = await MessagesModel.countDocuments({ topic: t.topic });
          await safeRedisSet(countKey, messageCount.toString(), TTL_LONG);
        }

        return { topic: t.topic, isEmpty: parseInt(messageCount) === 0 };
      }),
    );

    const response = { success: true, data: topicsWithStatus };
    await safeRedisSet(cacheKey, response, TTL_LONG);
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

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

router.post("/get-single-topic-label", async (req, res) => {
  try {
    const { topic } = req.body;
    const cacheKey = `${CACHE_PREFIX}topic-label:${topic}`;
    const cachedData = await safeRedisGet(cacheKey);

    if (cachedData) {
      return res.status(200).json(JSON.parse(cachedData));
    }

    const label = await TopicsModel.find(
      { topic },
      { label: 1, _id: 0 },
    ).lean();
    const response = { success: true, data: label };

    await safeRedisSet(cacheKey, response, TTL_LONG);
    res.status(200).json(response);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.put("/topic-label-update/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { updatedLabel } = req.body;
    const topic = await TopicsModel.findById(id);
    topic.label = updatedLabel;
    await topic.save();

    await Promise.all([
      safeRedisDel(`${CACHE_PREFIX}all-topics-labels`),
      safeRedisDel(`${CACHE_PREFIX}topic-label:${topic.topic}`),
    ]);

    res.status(200).json({ success: true, data: [] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/subscribe", (req, res) => {
  const { topic } = req.body;
  if (!topic) {
    return res
      .status(400)
      .json({ success: false, message: "Topic is required" });
  }

  subscribeToTopic(topic);
  res.json({ success: true, message: `Subscribed to topic: ${topic}` });
});

router.post("/create-tagname", async (req, res) => {
  try {
    const { topic, device, label } = req.body;
    const cacheKey = `${CACHE_PREFIX}topic-exists:${topic}`;
    const cachedExists = await safeRedisGet(cacheKey);

    if (cachedExists === "true") {
      return res.status(400).json({
        success: false,
        message: "TagName already exists!",
      });
    }

    const existingTopic = await TopicsModel.findOne({ topic }).lean();
    if (existingTopic) {
      await safeRedisSet(cacheKey, "true", TTL_LONG);
      return res.status(400).json({
        success: false,
        message: "TagName already exists!",
      });
    }

    await TopicsModel.create({ topic, device, label });
    await safeRedisSet(cacheKey, "true", TTL_LONG);

    await Promise.all([
      safeRedisDel(`${CACHE_PREFIX}all-topics-labels`),
      safeRedisDel(`${CACHE_PREFIX}get-all-tagname`),
      safeRedisDel(`${CACHE_PREFIX}recent-5-tagname`),
    ]);

    res.status(201).json({ success: true, data: [] });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

router.get("/get-all-subscribedtopics", async (req, res) => {
  try {
    const cacheKey = `${CACHE_PREFIX}subscribed-topics`;
    const cachedData = await safeRedisGet(cacheKey);

    if (cachedData) {
      return res.status(200).json(JSON.parse(cachedData));
    }

    const subscribedTopicList = await SubscribedTopic.find(
      {},
      { _id: 0, topic: 1 },
    ).lean();
    const topics = subscribedTopicList.map((item) => item.topic);
    const response = { success: true, data: topics };

    await safeRedisSet(cacheKey, response, TTL_MEDIUM);
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

router.get("/get-all-tagname", async (req, res) => {
  try {
    const cacheKey = `${CACHE_PREFIX}get-all-tagname`;
    const cachedData = await safeRedisGet(cacheKey);

    if (cachedData) {
      return res.status(200).json(JSON.parse(cachedData));
    }

    const topics = await TopicsModel.find().select("topic -_id").lean();
    const topicsWithStatus = await Promise.all(
      topics.map(async (t) => {
        const countKey = `${CACHE_PREFIX}msg-count:${t.topic}`;
        let messageCount = await safeRedisGet(countKey);

        if (!messageCount) {
          messageCount = await MessagesModel.countDocuments({ topic: t.topic });
          await safeRedisSet(countKey, messageCount.toString(), TTL_LONG);
        }

        return { topic: t.topic, isEmpty: parseInt(messageCount) === 0 };
      }),
    );

    const response = { success: true, data: topicsWithStatus };
    await safeRedisSet(cacheKey, response, TTL_LONG);
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

router.get("/get-recent-5-tagname", async (req, res) => {
  try {
    const cacheKey = `${CACHE_PREFIX}recent-5-tagname`;
    const cachedData = await safeRedisGet(cacheKey);

    if (cachedData) {
      return res.status(200).json(JSON.parse(cachedData));
    }

    const topicsWithMessages = await MessagesModel.distinct("topic").lean();
    const topics = await TopicsModel.find({
      topic: { $nin: topicsWithMessages },
    })
      .select("topic -_id")
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    const response = { success: true, data: topics };
    await safeRedisSet(cacheKey, response, TTL_LONG);
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

router.delete("/delete-topic/:topic", async (req, res) => {
  try {
    const { topic } = req.params;
    const topicDoc = await TopicsModel.findOne({ topic }).lean();
    if (!topicDoc) {
      return res
        .status(404)
        .json({ success: false, message: "No topic found" });
    }
    await TopicsModel.deleteOne({ topic });
    await MessagesModel.deleteMany({ topic });

    await Promise.all([
      safeRedisDel(`${CACHE_PREFIX}all-topics-labels`),
      safeRedisDel(`${CACHE_PREFIX}get-all-tagname`),
      safeRedisDel(`${CACHE_PREFIX}recent-5-tagname`),
      safeRedisDel(`${CACHE_PREFIX}topic-label:${topic}`),
      safeRedisDel(`${CACHE_PREFIX}topic-exists:${topic}`),
      safeRedisDel(`${CACHE_PREFIX}msg-count:${topic}`),
    ]);

    res.status(200).json({ success: true, message: "Topic deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

router.post("/subscribe-to-all", async (req, res) => {
  try {
    const cacheKey = `${CACHE_PREFIX}all-topics`;
    let topics = await safeRedisGet(cacheKey);

    if (!topics) {
      topics = await TopicsModel.find().select("topic -_id").lean();
      await safeRedisSet(cacheKey, topics, TTL_LONG);
    } else {
      topics = JSON.parse(topics);
    }

    if (!topics.length) {
      return res.status(404).json({
        success: false,
        message: "No topics found to subscribe to.",
      });
    }

    topics.forEach((t) => subscribeToTopic(t.topic));
    await safeRedisDel(`${CACHE_PREFIX}subscribed-topics`);

    res.status(200).json({
      success: true,
      message: "Subscribed to all topics successfully.",
      data: topics.map((t) => t.topic),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

router.post("/unsubscribe-from-all", async (req, res) => {
  try {
    const cacheKey = `${CACHE_PREFIX}all-topics`;
    let topics = await safeRedisGet(cacheKey);

    if (!topics) {
      topics = await TopicsModel.find().select("topic -_id").lean();
      await safeRedisSet(cacheKey, topics, TTL_LONG);
    } else {
      topics = JSON.parse(topics);
    }

    if (!topics.length) {
      return res.status(404).json({
        success: false,
        message: "No topics found to unsubscribe from.",
      });
    }

    const unsubscribedTopics = [];
    topics.forEach((t) => {
      if (isTopicSubscribed(t.topic)) {
        unsubscribeFromTopic(t.topic);
        unsubscribedTopics.push(t.topic);
      }
    });

    if (!unsubscribedTopics.length) {
      return res.status(400).json({
        success: false,
        message: "No topics were subscribed.",
      });
    }

    await safeRedisDel(`${CACHE_PREFIX}subscribed-topics`);

    res.status(200).json({
      success: true,
      message: "Unsubscribed from all subscribed topics successfully.",
      data: unsubscribedTopics,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

router.post("/messages", (req, res) => {
  const { topic } = req.body;
  if (!topic) {
    return res
      .status(400)
      .json({ success: false, message: "Topic is required" });
  }
  const latestMessage = getLatestLiveMessage(topic);
  if (!latestMessage) {
    return res
      .status(404)
      .json({ success: false, message: "No live message available" });
  }
  res.json({ success: true, message: latestMessage });
});
