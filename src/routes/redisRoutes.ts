import express from "express";
import {
  initIndexRedisHandler,
  insertCustomerDataHandler,
  insertDataCustomerRedisHandler,
  insertMultiRowsHandler,
  testRedisSearchHandler,
} from "../controllers/redisController";

const RedisRouter = express.Router();

RedisRouter.post("/test-redis-search", testRedisSearchHandler);
RedisRouter.post("/redis-insert", insertDataCustomerRedisHandler);
RedisRouter.post("/init-index-redis", initIndexRedisHandler);
RedisRouter.post("/insert-multi", insertMultiRowsHandler);
RedisRouter.post("/insert-customer-data", insertCustomerDataHandler);


export default RedisRouter;
