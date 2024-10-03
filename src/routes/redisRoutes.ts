import express from "express";
import {
  initIndexRedisHandler,
  insertCustomerDataHandler,
  insertDataCustomerRedisHandler,
  insertMultiRowsHandler,
  queryCustomerDataHandler,
  searchCombineMongoHandler,
  testRedisSearchHandler,
} from "../controllers/redisController";

const RedisRouter = express.Router();


RedisRouter.post("/redis-insert", insertDataCustomerRedisHandler);
RedisRouter.post("/init-index-redis", initIndexRedisHandler);
RedisRouter.post("/insert-multi", insertMultiRowsHandler);
RedisRouter.post("/insert-customer-data", insertCustomerDataHandler);

RedisRouter.post("/query-customer", queryCustomerDataHandler);
RedisRouter.post("/test-redis-search", testRedisSearchHandler);
RedisRouter.post("/search-combine-mongo", searchCombineMongoHandler);

export default RedisRouter;
